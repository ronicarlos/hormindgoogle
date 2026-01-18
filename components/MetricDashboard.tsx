
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, ReferenceLine, LabelList } from 'recharts';
import { Project, RiskFlag, MetricPoint } from '../types';
import { IconActivity, IconCheck, IconShield, IconReportPDF, IconSearch, IconArrowLeft, IconClose, IconEye, IconArrowUp, IconInfo, IconChevronDown } from './Icons';
import { Tooltip } from './Tooltip';
import MarkerInfoPanel from './MarkerInfoPanel'; 
import { getMarkerInfo } from '../services/markerRegistry';
import { analyzePoint } from '../services/analyticsService';

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
    
    const isSparse = dataLength < 6;
    const isMin = index === minIndex;
    const isMax = index === maxIndex;
    const isLast = index === dataLength - 1;

    if (!isSparse && !isMin && !isMax && !isLast) {
        return null;
    }

    return (
        <g transform={`translate(${x},${y})`}>
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

interface InteractiveChartWrapperProps {
    children?: React.ReactNode;
    data: MetricPoint[];
    title: string;
    onActivate: (point: MetricPoint) => void;
    isMobile: boolean;
    onClick: (state: any) => void;
    width?: number | string;
    height?: number | string;
    className?: string;
}

const InteractiveChartWrapper = ({ 
    children, 
    data, 
    title,
    onActivate,
    isMobile,
    onClick,
    width,
    height,
    className
}: InteractiveChartWrapperProps) => {
    const TriggerTooltip = ({ active, payload }: any) => {
        const lastPointRef = useRef<string | null>(null);

        useEffect(() => {
            if (active && payload && payload.length) {
                const point = payload[0].payload;
                const uniqueKey = `${point.date}-${point.value}`;

                if (!isMobile && lastPointRef.current !== uniqueKey) {
                    lastPointRef.current = uniqueKey;
                    onActivate({ ...point, label: point.label || title, unit: point.unit }); 
                }
            } else if (!active) {
                lastPointRef.current = null;
            }
        }, [active, payload]);
        
        if (!active || !payload || !payload.length) return null;
        
        const point = payload[0].payload;

        if (isMobile) {
            return (
                <div 
                    className="bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-2xl border border-gray-200 flex flex-col items-center gap-1 z-50 dark:bg-gray-800/95 dark:border-gray-700 pointer-events-auto cursor-pointer active:scale-95 transition-transform select-none touch-manipulation"
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onActivate({ ...point, label: point.label || title, unit: point.unit });
                    }}
                >
                    <div className="text-center pointer-events-none">
                        <span className="block font-black text-sm text-gray-900 dark:text-white">
                            {point.value} <span className="text-[10px] font-normal text-gray-500 uppercase">{point.unit}</span>
                        </span>
                        <span className="text-[9px] text-gray-400 font-medium">{point.date}</span>
                    </div>
                    <div className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md mt-1 dark:bg-blue-900/30 dark:text-blue-300 pointer-events-none">
                        <span className="text-[8px] font-bold uppercase tracking-wide block">Toque para detalhes</span>
                    </div>
                </div>
            );
        }
        
        return (
            <div className="bg-white/90 backdrop-blur px-2 py-1 rounded shadow-sm border border-gray-200 text-[10px] font-bold text-gray-600 dark:bg-gray-800/90 dark:border-gray-700 dark:text-gray-300">
                {point.value}
            </div>
        );
    };

    return (
        <div className={`w-full h-full relative group pointer-events-none ${className || ''}`} style={{ width, height }}>
            {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child as any, {
                        width,
                        height,
                        onClick: onClick,
                        children: [
                            ...(React.Children.toArray((child.props as any).children)),
                            <RechartsTooltip 
                                key="trigger-tooltip"
                                content={<TriggerTooltip />}
                                cursor={{ stroke: '#6b7280', strokeWidth: 1, strokeDasharray: '3 3' }}
                                isAnimationActive={false}
                                wrapperStyle={{ zIndex: 100, pointerEvents: 'auto' }} 
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
    
    const { cleanData, minIndex, maxIndex } = useMemo<{ cleanData: MetricPoint[], minIndex: number, maxIndex: number }>(() => {
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

    const triggerActivate = (point: any) => {
        if (point) {
            onHover({ ...point, label: title, unit: point.unit });
        }
    };

    const handleContainerClick = (e: React.MouseEvent) => {
        e.stopPropagation(); 
        const lastPoint = cleanData[cleanData.length - 1];
        if (lastPoint) {
            triggerActivate(lastPoint);
        }
    };

    const handleChartClick = (state: any) => {
        if (state && state.activePayload && state.activePayload.length > 0) {
            const point = state.activePayload[0].payload;
            triggerActivate(point);
        }
    };

    if (!data || data.length === 0) return null;
    const hasRefs = minRef !== undefined && maxRef !== undefined;

    return (
        <div className="mb-8 w-full">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-tight dark:text-gray-300 truncate pr-2" title={title}>
                    {title}
                </h3>
                <div className="flex gap-2 shrink-0">
                    {data[0].unit && <span className="text-[10px] text-gray-400 font-medium">{data[0].unit}</span>}
                    {hasRefs && <span className="text-[10px] text-gray-400 font-medium bg-gray-100 px-1.5 rounded dark:bg-gray-800">Ref: {minRef}-{maxRef}</span>}
                </div>
            </div>
            
            <div 
                className="h-40 w-full bg-white rounded-xl p-2 border border-gray-100 shadow-sm relative dark:bg-gray-900 dark:border-gray-800 cursor-pointer active:scale-[0.99] transition-transform select-none hover:border-blue-300 dark:hover:border-blue-700"
                onClick={handleContainerClick}
                title="Toque uma vez para ver detalhes"
            >
                <ResponsiveContainer width="100%" height="100%">
                    <InteractiveChartWrapper 
                        data={cleanData} 
                        title={title} 
                        onActivate={triggerActivate} 
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
                                {minRef !== undefined && <ReferenceLine y={minRef} stroke="#e5e7eb" strokeDasharray="3 3" />}
                                {maxRef !== undefined && <ReferenceLine y={maxRef} stroke="#e5e7eb" strokeDasharray="3 3" />}
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
                                {minRef !== undefined && <ReferenceLine y={minRef} stroke="#e5e7eb" strokeDasharray="3 3" />}
                                {maxRef !== undefined && <ReferenceLine y={maxRef} stroke="#e5e7eb" strokeDasharray="3 3" />}
                            </LineChart>
                        )}
                    </InteractiveChartWrapper>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// --- COMPONENTE DE SEÇÃO EXPANSÍVEL ---
const CollapsibleSection = ({ 
    title, 
    icon: Icon, 
    count, 
    children, 
    defaultExpanded = true, 
    colorClass = "text-gray-900 dark:text-white"
}: any) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    if (count === 0) return null;

    return (
        <div className="mb-6">
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-between w-full group mb-4"
            >
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${colorClass.includes('red') ? 'bg-red-100 dark:bg-red-900/30' : colorClass.includes('yellow') || colorClass.includes('orange') ? 'bg-yellow-100 dark:bg-yellow-900/30' : colorClass.includes('emerald') ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                        <Icon className={`w-4 h-4 ${colorClass.split(' ')[0]}`} />
                    </div>
                    <h3 className={`text-xs font-black uppercase tracking-widest ${colorClass}`}>
                        {title} ({count})
                    </h3>
                </div>
                <div className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                    <IconChevronDown className="w-4 h-4 text-gray-400" />
                </div>
            </button>
            
            {isExpanded && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    {children}
                </div>
            )}
        </div>
    );
};

// --- DASHBOARD PRINCIPAL ---

const MetricDashboard: React.FC<MetricDashboardProps> = ({ project, risks, onGenerateProntuario, isMobileView = false, isProcessing, onViewSource }) => {
    const [activeMarkerData, setActiveMarkerData] = useState<{ markerId: string; value: number; date: string; history: MetricPoint[] } | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showScrollTop, setShowScrollTop] = useState(false);
    
    // Estados de Colapso das Seções Principais (Gráficos)
    const [isChartsExpanded, setIsChartsExpanded] = useState(true);

    const searchInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleToggleSearch = () => {
            setIsSearchOpen(prev => {
                const newState = !prev;
                if (newState && containerRef.current) containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                return newState;
            });
        };
        window.addEventListener('toggle-app-search', handleToggleSearch);
        return () => window.removeEventListener('toggle-app-search', handleToggleSearch);
    }, []);

    useEffect(() => {
        if (isSearchOpen && searchInputRef.current) searchInputRef.current.focus();
    }, [isSearchOpen]);

    const handleChartHover = (point: MetricPoint, markerId: string, history: MetricPoint[]) => {
        setActiveMarkerData({
            markerId: markerId, 
            value: Number(point.value),
            date: point.date,
            history: history
        });
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setShowScrollTop(e.currentTarget.scrollTop > 200);
    };

    const scrollToTop = () => {
        containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const metrics = project.metrics;
    const allCategories = Object.keys(metrics);
    const gender = project.userProfile?.gender || 'Masculino';

    const filteredCategories = allCategories.filter(cat => 
        cat.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- CÁLCULO UNIFICADO DE CATEGORIAS (PREVENTIVO vs SAUDÁVEL) ---
    const { preventiveItems, healthyItems } = useMemo(() => {
        const preventive: any[] = [];
        const healthy: any[] = [];

        allCategories.forEach(cat => {
            const history = metrics[cat];
            if (!history || history.length === 0) return;
            
            const lastPoint = [...history].sort((a,b) => {
                 const da = a.date.split('/').reverse().join('-');
                 const db = b.date.split('/').reverse().join('-');
                 return new Date(da).getTime() - new Date(db).getTime();
            }).pop();

            if (lastPoint) {
                const info = getMarkerInfo(cat);
                const dynamicRef = (lastPoint.refMin !== undefined || lastPoint.refMax !== undefined) 
                    ? { min: lastPoint.refMin, max: lastPoint.refMax } 
                    : undefined;

                const analysis = analyzePoint(Number(lastPoint.value), lastPoint.date, history, info, gender, dynamicRef);
                
                const itemData = {
                    category: cat,
                    value: lastPoint.value,
                    unit: lastPoint.unit,
                    status: analysis.status,
                    message: analysis.message,
                    date: lastPoint.date,
                    point: lastPoint,
                    history: history,
                    range: analysis.activeRange // Range usado na análise
                };

                if (analysis.status === 'NORMAL') {
                    healthy.push(itemData);
                } else {
                    // Qualquer coisa fora do normal (HIGH/LOW/BORDERLINE) vai para preventivo
                    // O "Diagnóstico" (Vermelho) vem de props.risks
                    preventive.push(itemData);
                }
            }
        });
        return { preventiveItems: preventive, healthyItems: healthy };
    }, [metrics, gender, allCategories]);

    return (
        <div className="flex h-full w-full overflow-hidden relative">
            <div 
                ref={containerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto bg-gray-50 h-full p-0 pb-32 dark:bg-gray-950 relative"
            >
                {/* Header */}
                <div className={`sticky top-0 z-30 bg-gray-50/95 backdrop-blur-md border-b border-gray-200 px-4 md:px-8 py-4 flex justify-between items-end transition-all dark:bg-gray-950/95 dark:border-gray-800 shadow-sm ${isSearchOpen ? 'min-h-[70px]' : 'min-h-[50px] md:min-h-[70px]'}`}>
                    {isSearchOpen ? (
                        <div className="flex items-center w-full gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                            <button onClick={() => { setIsSearchOpen(false); setSearchTerm(''); }} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full dark:text-gray-400 dark:hover:bg-gray-800">
                                <IconArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="flex-1 relative">
                                <input 
                                    ref={searchInputRef}
                                    type="text" 
                                    placeholder="Filtrar gráficos..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-4 pr-10 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                />
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                        <IconClose className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
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
                                <button onClick={() => setIsSearchOpen(true)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full hover:text-gray-600 transition-colors dark:hover:bg-gray-800 dark:hover:text-white bg-white border border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-700" title="Filtrar Gráficos"><IconSearch className="w-5 h-5" /></button>
                                {!isProcessing && (
                                    <button onClick={onGenerateProntuario} className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors shadow-lg active:scale-95 dark:bg-blue-600 dark:hover:bg-blue-700">
                                        <IconReportPDF className="w-4 h-4" /> PRONTUÁRIO PDF
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className="p-4 md:p-8">
                    {!searchTerm && (
                        <div className="mb-8">
                            {/* LEGENDA VISUAL */}
                            <div className="mb-6 bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-[10px] dark:bg-gray-900 dark:border-gray-800">
                                <div className="flex flex-wrap gap-4 text-gray-500 font-medium dark:text-gray-400">
                                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></span><span>Normal (Verde)</span></div>
                                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-sm"></span><span>Atenção Moderada</span></div>
                                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm"></span><span>Atenção Alta (Preventivo)</span></div>
                                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-sm"></span><span>Diagnóstico (Crítico)</span></div>
                                </div>
                                <div className="flex items-center gap-1.5 text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded-md border border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/30">
                                    <span className="text-sm">👆</span><span>Toque em qualquer gráfico para ver detalhes</span>
                                </div>
                            </div>

                            {/* 1. RISCOS CRÍTICOS (DIAGNÓSTICOS) - VERMELHO */}
                            <CollapsibleSection title="Diagnósticos de Risco" count={risks.length} icon={IconShield} colorClass="text-red-700 dark:text-red-400">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {risks.map((risk, idx) => (
                                        <div 
                                            key={idx}
                                            onClick={() => risk.sourceId && onViewSource && onViewSource(risk.sourceId)}
                                            className="group p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg cursor-pointer bg-red-50 border-red-200 hover:bg-red-100 dark:bg-red-900/10 dark:border-red-900/50"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-sm bg-red-600 text-white">
                                                    {risk.category}
                                                </span>
                                                <span className="text-[10px] font-bold opacity-60 text-gray-600 dark:text-gray-400">{risk.date}</span>
                                            </div>
                                            <p className="text-xs font-medium text-gray-800 dark:text-gray-200 leading-relaxed">{risk.message}</p>
                                        </div>
                                    ))}
                                    {risks.length === 0 && <p className="text-xs text-gray-400 italic px-2">Nenhum diagnóstico crítico registrado.</p>}
                                </div>
                            </CollapsibleSection>

                            {/* 2. MONITORAMENTO PREVENTIVO (AMARELO/LARANJA) */}
                            <CollapsibleSection title="Monitoramento Preventivo" count={preventiveItems.length} icon={IconEye} colorClass="text-yellow-700 dark:text-yellow-400">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {preventiveItems.map((alert: any, idx: number) => {
                                        const isCriticalValue = alert.status === 'HIGH' || alert.status === 'LOW';
                                        const styleClass = isCriticalValue
                                            ? 'bg-orange-50 border-orange-200 hover:bg-orange-100 dark:bg-orange-900/10 dark:border-orange-900/40'
                                            : 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-900/10 dark:border-yellow-900/40';
                                        
                                        const textClass = isCriticalValue ? 'text-orange-900 dark:text-orange-200' : 'text-yellow-900 dark:text-yellow-200';
                                        const rangeText = alert.range ? `Ref: ${alert.range.min} - ${alert.range.max}` : 'Ref: N/A';

                                        return (
                                            <div 
                                                key={idx}
                                                onClick={() => handleChartHover(alert.point, alert.category, alert.history)}
                                                className={`rounded-xl p-4 cursor-pointer transition-colors border ${styleClass}`}
                                            >
                                                <div className="flex justify-between items-center mb-1">
                                                    <h4 className={`font-bold text-xs uppercase tracking-wider ${textClass}`}>{alert.category}</h4>
                                                    <span className="text-[10px] font-bold opacity-60">{alert.date}</span>
                                                </div>
                                                <div className="flex justify-between items-end">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-bold opacity-70 mb-1">{rangeText}</span>
                                                        <p className={`text-[10px] font-medium leading-snug max-w-[150px] ${textClass} opacity-90`}>
                                                            {alert.status.includes('HIGH') ? 'Acima do esperado' : 'Abaixo do esperado'}
                                                        </p>
                                                    </div>
                                                    <span className={`text-sm font-black ${textClass}`}>
                                                        {alert.value} <span className="text-[9px] font-normal opacity-70">{alert.unit}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CollapsibleSection>

                            {/* 3. MARCADORES SAUDÁVEIS (VERDE) - DEFAULT COLLAPSED */}
                            <CollapsibleSection title="Marcadores Saudáveis" count={healthyItems.length} icon={IconCheck} defaultExpanded={false} colorClass="text-emerald-700 dark:text-emerald-400">
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {healthyItems.map((item: any, idx: number) => {
                                        const rangeText = item.range ? `Ref: ${item.range.min} - ${item.range.max}` : 'Ref: N/A';
                                        return (
                                            <div 
                                                key={idx}
                                                onClick={() => handleChartHover(item.point, item.category, item.history)}
                                                className="bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 rounded-xl p-4 cursor-pointer transition-colors dark:bg-emerald-900/10 dark:border-emerald-900/30"
                                            >
                                                <div className="flex justify-between items-center mb-1">
                                                    <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-900 dark:text-emerald-200">{item.category}</h4>
                                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{item.date}</span>
                                                </div>
                                                <div className="flex justify-between items-end mt-2">
                                                    <span className="text-[9px] font-medium text-emerald-600/80 dark:text-emerald-400/80">{rangeText}</span>
                                                    <span className="text-sm font-black text-emerald-800 dark:text-emerald-100">
                                                        {item.value} <span className="text-[9px] font-normal opacity-70">{item.unit}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CollapsibleSection>
                        </div>
                    )}

                    {/* SEÇÃO 4: GRÁFICOS */}
                    <div className="mb-4">
                        <button 
                            onClick={() => setIsChartsExpanded(!isChartsExpanded)}
                            className="flex items-center justify-between w-full group mb-4"
                        >
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800">
                                    <IconActivity className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                                </div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">
                                    Gráficos de Evolução ({filteredCategories.length})
                                </h3>
                            </div>
                            <div className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-transform duration-200 ${isChartsExpanded ? 'rotate-180' : ''}`}>
                                <IconChevronDown className="w-4 h-4 text-gray-400" />
                            </div>
                        </button>

                        {isChartsExpanded && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                {filteredCategories.map(cat => {
                                    const cleanCat = cat.toLowerCase();
                                    let chartColor = stringToColor(cat); 
                                    if (cat.includes('Testo')) chartColor = '#2563eb';
                                    else if (cat.includes('Estradiol')) chartColor = '#ec4899';
                                    else if (cat.includes('Peso')) chartColor = '#4b5563';
                                    else if (cleanCat.includes('hemo') || cleanCat.includes('eritro')) chartColor = '#ef4444';

                                    const history = metrics[cat];
                                    const lastPoint = history[history.length - 1];
                                    const info = getMarkerInfo(cat);
                                    
                                    let minRef = info.ranges?.general?.[0];
                                    let maxRef = info.ranges?.general?.[1];
                                    
                                    if (info.isGeneric && lastPoint) {
                                        if (lastPoint.refMin !== undefined) minRef = lastPoint.refMin;
                                        if (lastPoint.refMax !== undefined) maxRef = lastPoint.refMax;
                                    }

                                    return (
                                        <div key={cat} className="animate-in fade-in duration-500">
                                            <BiomarkerChart 
                                                title={cat} 
                                                data={metrics[cat]} 
                                                color={chartColor}
                                                type={cat.includes('Peso') ? 'area' : 'line'}
                                                minRef={minRef}
                                                maxRef={maxRef}
                                                onHover={(point) => handleChartHover(point, cat, metrics[cat])}
                                                isMobile={isMobileView}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
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
                                <button onClick={onGenerateProntuario} className="bg-black text-white p-4 rounded-full shadow-2xl active:scale-90 transition-transform dark:bg-blue-600 border border-gray-800 dark:border-blue-500">
                                    <IconReportPDF className="w-6 h-6" />
                                </button>
                            </Tooltip>
                        </div>
                    )}
                </div>
            </div>

            {showScrollTop && (
                <button onClick={scrollToTop} className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-40 bg-black/80 backdrop-blur text-white p-3 rounded-full shadow-lg border border-gray-700 animate-in fade-in slide-in-from-bottom-4 active:scale-90 transition-all dark:bg-blue-600/80 dark:border-blue-500" title="Voltar ao topo / Buscar">
                    <IconArrowUp className="w-5 h-5" />
                </button>
            )}

            <MarkerInfoPanel activeData={activeMarkerData} onClose={() => setActiveMarkerData(null)} gender={gender} />
        </div>
    );
};

export default MetricDashboard;
