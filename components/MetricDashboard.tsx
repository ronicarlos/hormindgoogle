
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, ReferenceLine, ComposedChart, Bar, Legend, LabelList } from 'recharts';
import { Project, RiskFlag, MetricPoint } from '../types';
import { IconActivity, IconAlert, IconSparkles, IconHeart, IconDumbbell, IconReportPDF, IconCheck, IconShield, IconFile, IconScience, IconSearch, IconArrowLeft, IconClose } from './Icons';
import { Tooltip } from './Tooltip';
import MarkerInfoPanel from './MarkerInfoPanel'; // NOVO COMPONENTE

interface MetricDashboardProps {
  project: Project;
  risks: RiskFlag[];
  onGenerateProntuario: () => void;
  isMobileView?: boolean;
  isProcessing?: boolean;
  onViewSource?: (sourceId: string) => void;
}

// Helper para gerar cor consistente baseada no nome da string (Hash to Color)
const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
};

// Custom Axis Tick para não cortar datas
const CustomXAxisTick = (props: any) => {
    const { x, y, payload } = props;
    return (
        <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={12} textAnchor="middle" fill="#9ca3af" fontSize={9}>
                {payload.value}
            </text>
        </g>
    );
};

// Componente Customizado para Labels Limpos
const CustomizedLabel = (props: any) => {
    const { x, y, value, index, dataLength, minIndex, maxIndex, isMobile, color } = props;
    
    // REGRA DE LIMPEZA:
    // Se houver poucos dados (< 6), mostra tudo.
    // Se houver muitos, mostra apenas: Mínimo, Máximo e Último.
    const isSparse = dataLength < 6;
    const isMin = index === minIndex;
    const isMax = index === maxIndex;
    const isLast = index === dataLength - 1;

    // Se não for um dos pontos chave e não for esparso, esconde
    if (!isSparse && !isMin && !isMax && !isLast) {
        return null;
    }

    return (
        <g transform={`translate(${x},${y})`}>
            {/* Fundo semi-transparente para leitura sobre linhas */}
            <rect x="-12" y="-18" width="24" height="14" fill="white" opacity="0.6" rx="2" />
            <text 
                x={0} 
                y={0} 
                dy={-8} 
                fill={isLast ? color : "#6b7280"} 
                fontSize={isMobile ? 9 : 10} 
                textAnchor="middle" 
                fontWeight={isLast || isMin || isMax ? 800 : 600}
            >
                {value}
            </text>
        </g>
    );
};

// --- CHART WRAPPER (Handles hover logic) ---
const InteractiveChartWrapper = ({ 
    children, 
    data, 
    title,
    onActivate,
    isMobile,
    onClick // Adicionado para receber o handler de clique do chart
}: { 
    children: React.ReactNode, 
    data: MetricPoint[], 
    title: string,
    onActivate: (point: MetricPoint) => void,
    isMobile: boolean,
    onClick: (state: any) => void
}) => {
    // Custom Tooltip Otimizado (Passivo no Mobile)
    const TriggerTooltip = ({ active, payload }: any) => {
        // Ref para evitar updates repetidos do mesmo ponto (Performance Critical)
        const lastPointRef = useRef<string | null>(null);

        useEffect(() => {
            if (active && payload && payload.length) {
                const point = payload[0].payload;
                const uniqueKey = `${point.date}-${point.value}`;

                // DESKTOP: Atualiza sidebar automaticamente no hover
                // MOBILE: NÃO FAZ NADA AUTOMÁTICO (Espera clique)
                if (!isMobile && lastPointRef.current !== uniqueKey) {
                    lastPointRef.current = uniqueKey;
                    // Injeta o título do gráfico como markerId se não tiver label específica
                    onActivate({ ...point, label: point.label || title, unit: point.unit }); 
                }
            } else if (!active) {
                lastPointRef.current = null;
            }
        }, [active, payload]);
        
        if (!active || !payload || !payload.length) return null;
        
        const point = payload[0].payload;

        // MOBILE UX: Tooltip Interativo (Clicável)
        if (isMobile) {
            return (
                <div 
                    className="bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-2xl border border-gray-200 flex flex-col items-center gap-1 z-50 dark:bg-gray-800/95 dark:border-gray-700 pointer-events-auto cursor-pointer active:scale-95 transition-transform select-none touch-manipulation"
                    onClick={(e) => {
                        e.stopPropagation(); // Impede bubbling para o container
                        e.preventDefault();
                        // ABRE O MODAL IMEDIATAMENTE NO CLIQUE SIMPLES NO TOOLTIP
                        onActivate({ ...point, label: point.label || title, unit: point.unit });
                    }}
                >
                    <div className="text-center pointer-events-none">
                        <span className="block font-black text-sm text-gray-900 dark:text-white">
                            {point.value} <span className="text-[10px] font-normal text-gray-500 uppercase">{point.unit}</span>
                        </span>
                        <span className="text-[9px] text-gray-400 font-medium">{point.date}</span>
                    </div>
                    {/* Instrução visual de clique */}
                    <div className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md mt-1 dark:bg-blue-900/30 dark:text-blue-300 pointer-events-none">
                        <span className="text-[8px] font-bold uppercase tracking-wide block">Toque para detalhes</span>
                    </div>
                </div>
            );
        }
        
        // DESKTOP UX: Minimalista (Valor segue o cursor)
        return (
            <div className="bg-white/90 backdrop-blur px-2 py-1 rounded shadow-sm border border-gray-200 text-[10px] font-bold text-gray-600 dark:bg-gray-800/90 dark:border-gray-700 dark:text-gray-300">
                {point.value}
            </div>
        );
    };

    return (
        <div className="w-full h-full relative group">
            {/* Clona o gráfico filho para injetar o Tooltip customizado */}
            {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child as any, {
                        // Passa o handler de clique para o Chart
                        onClick: onClick,
                        // Injeta o tooltip dentro do gráfico
                        children: [
                            ...(React.Children.toArray((child.props as any).children)),
                            <RechartsTooltip 
                                key="trigger-tooltip"
                                content={<TriggerTooltip />}
                                cursor={{ stroke: '#6b7280', strokeWidth: 1, strokeDasharray: '3 3' }}
                                isAnimationActive={false} // Performance critical
                                // Permite interação com o tooltip no mobile
                                wrapperStyle={isMobile ? { zIndex: 100, pointerEvents: 'auto' } : undefined} 
                            />
                        ]
                    });
                }
                return child;
            })}
        </div>
    );
};

// --- COMPONENTES DE GRÁFICO ---

const BiomarkerChart = ({ 
    title, 
    data, 
    color, 
    minRef, 
    maxRef, 
    yDomain,
    type = 'line',
    onHover,
    isMobile
}: { 
    title: string; 
    data: MetricPoint[]; 
    color: string;
    minRef?: number;
    maxRef?: number;
    yDomain?: [number | string, number | string];
    type?: 'line' | 'area';
    onHover: (point: MetricPoint) => void;
    isMobile: boolean;
}) => {
    const lastTap = useRef<number>(0);

    // Preparação dos dados e cálculo de índices Min/Max
    const { cleanData, minIndex, maxIndex } = useMemo(() => {
        if (!data || data.length === 0) return { cleanData: [], minIndex: -1, maxIndex: -1 };
        
        const sorted = [...data]
            .map(d => ({...d, value: Number(d.value)}))
            .sort((a,b) => {
                 const da = a.date.split('/').reverse().join('-');
                 const db = b.date.split('/').reverse().join('-');
                 return new Date(da).getTime() - new Date(db).getTime();
            });

        let minVal = Infinity, maxVal = -Infinity;
        let minIdx = 0, maxIdx = 0;

        sorted.forEach((d, i) => {
            if (d.value < minVal) { minVal = d.value; minIdx = i; }
            if (d.value > maxVal) { maxVal = d.value; maxIdx = i; }
        });

        return { cleanData: sorted, minIndex: minIdx, maxIndex: maxIdx };
    }, [data]);

    // 1. Handler para Clique Específico no Ponto (Recharts)
    const handleChartClick = (state: any) => {
        // Desktop: Hover já resolve. Mobile: Tooltip resolve.
        // Isso aqui é fallback para cliques diretos no ponto/linha.
        if (!isMobile) return; 
        
        if (state && state.activePayload && state.activePayload.length > 0) {
            const now = Date.now();
            const DOUBLE_TAP_DELAY = 500; 

            if (now - lastTap.current < DOUBLE_TAP_DELAY) {
                const point = state.activePayload[0].payload;
                onActivatePanel({ ...point, label: point.label || title, unit: point.unit });
                lastTap.current = 0; 
            } else {
                lastTap.current = now;
            }
        }
    };

    // 2. Handler para Clique no Container (Duplo Clique em qualquer lugar)
    const handleContainerClick = (e: React.MouseEvent | React.TouchEvent) => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 500;

        if (now - lastTap.current < DOUBLE_TAP_DELAY) {
            // Se detectou duplo clique no container:
            // Pega o último ponto disponível (Mais recente)
            const lastPoint = cleanData[cleanData.length - 1];
            if (lastPoint) {
                onActivatePanel({ ...lastPoint, label: title, unit: lastPoint.unit });
            }
            lastTap.current = 0;
        } else {
            lastTap.current = now;
        }
    };

    const onActivatePanel = (point: MetricPoint) => {
        onHover(point);
    };

    if (!data || data.length === 0) return null;

    return (
        <div className="mb-8 w-full">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-tight dark:text-gray-300 truncate pr-2" title={title}>
                    {title}
                </h3>
                <div className="flex gap-2 shrink-0">
                    {data[0].unit && <span className="text-[10px] text-gray-400 font-medium">{data[0].unit}</span>}
                    {minRef && maxRef && <span className="text-[10px] text-gray-400 font-medium bg-gray-100 px-1.5 rounded dark:bg-gray-800">Ref: {minRef}-{maxRef}</span>}
                </div>
            </div>
            {/* Adicionado listener onClick no container principal do gráfico */}
            <div 
                className="h-40 w-full bg-white rounded-xl p-2 border border-gray-100 shadow-sm relative dark:bg-gray-900 dark:border-gray-800"
                onClick={handleContainerClick} 
            >
                <ResponsiveContainer width="100%" height="100%">
                    <InteractiveChartWrapper 
                        data={cleanData} 
                        title={title} 
                        onActivate={onActivatePanel} 
                        isMobile={isMobile}
                        onClick={handleChartClick}
                    >
                        {type === 'area' ? (
                            <AreaChart data={cleanData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor={color} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-gray-800" />
                                <XAxis dataKey="date" tick={<CustomXAxisTick />} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                                <YAxis hide domain={yDomain || ['auto', 'auto']} />
                                <Area 
                                    type="monotone" 
                                    dataKey="value" 
                                    stroke={color} 
                                    fillOpacity={1} 
                                    fill={`url(#grad-${title})`} 
                                    strokeWidth={2}
                                    isAnimationActive={false}
                                >
                                    <LabelList 
                                        content={
                                            <CustomizedLabel 
                                                dataLength={cleanData.length} 
                                                minIndex={minIndex} 
                                                maxIndex={maxIndex} 
                                                isMobile={isMobile}
                                                color={color}
                                            />
                                        } 
                                    />
                                </Area>
                                {minRef && <ReferenceLine y={minRef} stroke="#e5e7eb" strokeDasharray="3 3" />}
                                {maxRef && <ReferenceLine y={maxRef} stroke="#e5e7eb" strokeDasharray="3 3" />}
                            </AreaChart>
                        ) : (
                            <LineChart data={cleanData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-gray-800" />
                                <XAxis dataKey="date" tick={<CustomXAxisTick />} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                                <YAxis hide domain={yDomain || ['auto', 'auto']} />
                                <Line 
                                    type="monotone" 
                                    dataKey="value" 
                                    stroke={color} 
                                    strokeWidth={3} 
                                    dot={{ r: 3, fill: color, strokeWidth: 2, stroke: '#fff' }} 
                                    activeDot={{ r: 5, strokeWidth: 0 }}
                                    isAnimationActive={false}
                                >
                                    <LabelList 
                                        content={
                                            <CustomizedLabel 
                                                dataLength={cleanData.length} 
                                                minIndex={minIndex} 
                                                maxIndex={maxIndex} 
                                                isMobile={isMobile}
                                                color={color}
                                            />
                                        } 
                                    />
                                </Line>
                                {minRef && <ReferenceLine y={minRef} stroke="#e5e7eb" strokeDasharray="3 3" />}
                                {maxRef && <ReferenceLine y={maxRef} stroke="#e5e7eb" strokeDasharray="3 3" />}
                            </LineChart>
                        )}
                    </InteractiveChartWrapper>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// --- DASHBOARD PRINCIPAL ---

const MetricDashboard: React.FC<MetricDashboardProps> = ({ project, risks, onGenerateProntuario, isMobileView = false, isProcessing, onViewSource }) => {
    // STATE GLOBAL DO PAINEL
    const [activeMarkerData, setActiveMarkerData] = useState<{ markerId: string; value: number; date: string; history: MetricPoint[] } | null>(null);
    
    // STATE DA BUSCA
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Auto-focus na busca
    useEffect(() => {
        if (isSearchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearchOpen]);

    // Handler unificado para ativar o painel
    const handleChartHover = (point: MetricPoint, markerId: string, history: MetricPoint[]) => {
        // Debounce simples para evitar updates excessivos se o valor for o mesmo
        if (activeMarkerData?.markerId === markerId && activeMarkerData?.value === point.value && activeMarkerData?.date === point.date) {
            return;
        }
        
        setActiveMarkerData({
            markerId: markerId, 
            value: Number(point.value),
            date: point.date,
            history: history
        });
    };

    const metrics = project.metrics;
    const allCategories = Object.keys(metrics);
    
    // Lógica de Filtro
    const filteredCategories = allCategories.filter(cat => 
        cat.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const gender = project.userProfile?.gender || 'Masculino';

    return (
        <div className="flex h-full w-full overflow-hidden">
            
            {/* ÁREA PRINCIPAL (Scrollable) */}
            <div className="flex-1 overflow-y-auto bg-gray-50 h-full p-4 md:p-8 pb-32 dark:bg-gray-950">
                {/* Header Dinâmico (Título ou Busca) */}
                <div className="flex justify-between items-end mb-8 min-h-[50px]">
                    {isSearchOpen ? (
                        // MODO BUSCA
                        <div className="flex items-center w-full gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                            <button 
                                onClick={() => { setIsSearchOpen(false); setSearchTerm(''); }}
                                className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full dark:text-gray-400 dark:hover:bg-gray-800"
                            >
                                <IconArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="flex-1 relative">
                                <input 
                                    ref={searchInputRef}
                                    type="text" 
                                    placeholder="Filtrar gráficos..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-gray-100 border-none rounded-xl py-2 pl-4 pr-10 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                />
                                {searchTerm && (
                                    <button 
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                    >
                                        <IconClose className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        // MODO PADRÃO
                        <>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2 dark:text-white">
                                    <IconActivity className="w-6 h-6 text-gray-400" />
                                    MÉTRICAS
                                </h2>
                                <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-wider dark:text-gray-400">
                                    Inteligência de Decisão & Saúde
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setIsSearchOpen(true)}
                                    className="p-2 text-gray-400 hover:bg-gray-100 rounded-full hover:text-gray-600 transition-colors dark:hover:bg-gray-800 dark:hover:text-white"
                                    title="Filtrar Gráficos"
                                >
                                    <IconSearch className="w-5 h-5" />
                                </button>

                                {!isProcessing && (
                                    <button 
                                        onClick={onGenerateProntuario}
                                        className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors shadow-lg active:scale-95 dark:bg-blue-600 dark:hover:bg-blue-700"
                                    >
                                        <IconReportPDF className="w-4 h-4" />
                                        PRONTUÁRIO PDF
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Risk Alerts (Sempre visível se houver) */}
                {!searchTerm && (
                    <div className="mb-10">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="bg-red-100 p-1.5 rounded-lg dark:bg-red-900/30">
                                <IconShield className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest dark:text-white">
                                Diagnóstico de Riscos ({risks.length})
                            </h3>
                        </div>
                        
                        {risks && risks.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {risks.map((risk, idx) => (
                                    <div 
                                        key={idx}
                                        onClick={() => risk.sourceId && onViewSource && onViewSource(risk.sourceId)}
                                        className={`group p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg cursor-pointer ${
                                            risk.level === 'HIGH' 
                                            ? 'bg-red-50 border-red-200 hover:bg-red-100 dark:bg-red-900/10 dark:border-red-900/50' 
                                            : 'bg-orange-50 border-orange-200 hover:bg-orange-100 dark:bg-orange-900/10 dark:border-orange-900/50'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-sm ${
                                                risk.level === 'HIGH' ? 'bg-red-600 text-white' : 'bg-orange-500 text-white'
                                            }`}>
                                                {risk.category}
                                            </span>
                                            <span className="text-[10px] font-bold opacity-60 text-gray-600 dark:text-gray-400">{risk.date}</span>
                                        </div>
                                        <p className="text-xs font-medium text-gray-800 dark:text-gray-200 leading-relaxed">{risk.message}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 flex items-center gap-4 dark:bg-emerald-900/10 dark:border-emerald-900/30">
                                <div className="bg-emerald-100 text-emerald-600 p-3 rounded-full dark:bg-emerald-900 dark:text-emerald-300">
                                    <IconCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-emerald-900 text-sm dark:text-emerald-200">Status Saudável</h4>
                                    <p className="text-xs text-emerald-700 mt-1 leading-relaxed dark:text-emerald-400/80">
                                        Nenhum marcador crítico foi detectado nos seus dados recentes.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* INDIVIDUAL CHARTS GRID (FILTERED) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredCategories.map(cat => {
                        const cleanCat = cat.toLowerCase();
                        // Definição de cor
                        let chartColor = stringToColor(cat); 
                        if (cat.includes('Testo')) chartColor = '#2563eb';
                        else if (cat.includes('Estradiol')) chartColor = '#ec4899';
                        else if (cat.includes('Peso')) chartColor = '#4b5563';
                        else if (cleanCat.includes('hemo') || cleanCat.includes('eritro')) chartColor = '#ef4444'; // Sangue = Vermelho

                        return (
                            <div key={cat} className="animate-in fade-in duration-500">
                                <BiomarkerChart 
                                    title={cat} 
                                    data={metrics[cat]} 
                                    color={chartColor}
                                    type={cat.includes('Peso') ? 'area' : 'line'}
                                    onHover={(point) => handleChartHover(point, cat, metrics[cat])}
                                    isMobile={isMobileView}
                                />
                            </div>
                        );
                    })}
                </div>

                {filteredCategories.length === 0 && (
                     <div className="text-center py-20 opacity-50">
                        <IconSearch className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm font-medium text-gray-400">
                            {searchTerm ? `Nenhum gráfico encontrado para "${searchTerm}".` : "Nenhuma métrica registrada ainda."}
                        </p>
                    </div>
                )}

                {isMobileView && !isProcessing && (
                    <div className="md:hidden fixed bottom-24 right-4 z-40">
                        <Tooltip content="Gerar Prontuário PDF" position="left">
                            <button 
                                onClick={onGenerateProntuario}
                                className="bg-black text-white p-4 rounded-full shadow-2xl active:scale-90 transition-transform dark:bg-blue-600 border border-gray-800 dark:border-blue-500"
                            >
                                <IconReportPDF className="w-6 h-6" />
                            </button>
                        </Tooltip>
                    </div>
                )}
            </div>

            {/* PAINEL LATERAL (Desktop) / BOTTOM SHEET (Mobile via Componente) */}
            <MarkerInfoPanel 
                activeData={activeMarkerData} 
                onClose={() => setActiveMarkerData(null)}
                gender={gender}
            />

        </div>
    );
};

export default MetricDashboard;
