
import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, ReferenceLine, ComposedChart, Bar, Legend } from 'recharts';
import { Project, RiskFlag, MetricPoint } from '../types';
import { IconActivity, IconAlert, IconSparkles, IconHeart, IconDumbbell, IconReportPDF, IconCheck, IconShield, IconFile, IconScience } from './Icons';
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

// --- CHART WRAPPER (Handles hover logic) ---
const InteractiveChartWrapper = ({ 
    children, 
    data, 
    title,
    onActivate 
}: { 
    children: React.ReactNode, 
    data: MetricPoint[], 
    title: string,
    onActivate: (point: MetricPoint) => void 
}) => {
    // Custom Tooltip apenas para trigger (invisível ou mínimo)
    const TriggerTooltip = ({ active, payload }: any) => {
        React.useEffect(() => {
            if (active && payload && payload.length) {
                // Notifica o pai sobre o ponto ativo
                const point = payload[0].payload;
                // Injeta o título do gráfico como markerId se não tiver label específica
                onActivate({ ...point, label: point.label || title, unit: point.unit }); 
            }
        }, [active, payload]);
        
        if (!active) return null;
        
        // Renderiza apenas um indicador visual mínimo (cursor line já é feito pelo Chart)
        // Isso evita "sujeira" visual sobre o gráfico, pois o detalhe está no Painel
        return (
            <div className="bg-white/90 backdrop-blur px-2 py-1 rounded shadow-sm border border-gray-200 text-[10px] font-bold text-gray-600 dark:bg-gray-800/90 dark:border-gray-700 dark:text-gray-300">
                {payload?.[0]?.value}
            </div>
        );
    };

    return (
        <div className="w-full h-full relative group">
            {/* Clona o gráfico filho para injetar o Tooltip customizado */}
            {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child as any, {
                        // Injeta o tooltip dentro do gráfico
                        children: [
                            ...(React.Children.toArray((child.props as any).children)),
                            <RechartsTooltip 
                                key="trigger-tooltip"
                                content={<TriggerTooltip />}
                                cursor={{ stroke: '#6b7280', strokeWidth: 1, strokeDasharray: '3 3' }}
                                isAnimationActive={false} // Performance
                            />
                        ]
                    });
                }
                return child;
            })}
        </div>
    );
};

// --- COMPONENTES DE GRÁFICO (Simplificados para usar o Wrapper) ---

const BiomarkerChart = ({ 
    title, 
    data, 
    color, 
    minRef, 
    maxRef, 
    yDomain,
    type = 'line',
    onHover // Callback para o painel
}: { 
    title: string; 
    data: MetricPoint[]; 
    color: string;
    minRef?: number;
    maxRef?: number;
    yDomain?: [number | string, number | string];
    type?: 'line' | 'area';
    onHover: (point: MetricPoint) => void;
}) => {
    const cleanData = useMemo(() => {
        if (!data || data.length === 0) return [];
        return [...data]
            .map(d => ({...d, value: Number(d.value)}))
            .sort((a,b) => {
                 const da = a.date.split('/').reverse().join('-');
                 const db = b.date.split('/').reverse().join('-');
                 return new Date(da).getTime() - new Date(db).getTime();
            });
    }, [data]);

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
            <div className="h-40 w-full bg-white rounded-xl p-2 border border-gray-100 shadow-sm relative dark:bg-gray-900 dark:border-gray-800">
                <ResponsiveContainer width="100%" height="100%">
                    <InteractiveChartWrapper data={cleanData} title={title} onActivate={onHover}>
                        {type === 'area' ? (
                            <AreaChart data={cleanData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                                />
                                {minRef && <ReferenceLine y={minRef} stroke="#e5e7eb" strokeDasharray="3 3" />}
                                {maxRef && <ReferenceLine y={maxRef} stroke="#e5e7eb" strokeDasharray="3 3" />}
                            </AreaChart>
                        ) : (
                            <LineChart data={cleanData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                                />
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

const MetricDashboard: React.FC<MetricDashboardProps> = ({ project, risks, onGenerateProntuario, isMobileView, isProcessing, onViewSource }) => {
    // STATE GLOBAL DO PAINEL
    const [activeMarkerData, setActiveMarkerData] = useState<{ markerId: string; value: number; date: string; history: MetricPoint[] } | null>(null);

    // Handler unificado para ativar o painel
    const handleChartHover = (point: MetricPoint, markerId: string, history: MetricPoint[]) => {
        // Debounce simples para evitar updates excessivos se o valor for o mesmo
        if (activeMarkerData?.markerId === markerId && activeMarkerData?.value === point.value && activeMarkerData?.date === point.date) {
            return;
        }
        
        setActiveMarkerData({
            markerId: markerId, // Nome normalizado será tratado no Registry
            value: Number(point.value),
            date: point.date,
            history: history
        });
    };

    const metrics = project.metrics;
    const allCategories = Object.keys(metrics);
    const gender = project.userProfile?.gender || 'Masculino';

    return (
        <div className="flex h-full w-full overflow-hidden">
            
            {/* ÁREA PRINCIPAL (Scrollable) */}
            <div className="flex-1 overflow-y-auto bg-gray-50 h-full p-4 md:p-8 pb-32 dark:bg-gray-950">
                {/* Header */}
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2 dark:text-white">
                            <IconActivity className="w-6 h-6 text-gray-400" />
                            MÉTRICAS
                        </h2>
                        <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-wider dark:text-gray-400">
                            Inteligência de Decisão & Saúde
                        </p>
                    </div>
                    
                    {!isProcessing && (
                        <div className="flex flex-col items-end gap-1">
                            <button 
                                onClick={onGenerateProntuario}
                                className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors shadow-lg active:scale-95 dark:bg-blue-600 dark:hover:bg-blue-700"
                            >
                                <IconReportPDF className="w-4 h-4" />
                                PRONTUÁRIO PDF
                            </button>
                        </div>
                    )}
                </div>

                {/* Risk Alerts */}
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

                {/* INDIVIDUAL CHARTS GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {allCategories.map(cat => {
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
                                />
                            </div>
                        );
                    })}
                </div>

                {allCategories.length === 0 && (
                     <div className="text-center py-20 opacity-50">
                        <IconActivity className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm font-medium text-gray-400">Nenhuma métrica registrada ainda.</p>
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
