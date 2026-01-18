
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, ReferenceLine, LabelList } from 'recharts';
import { Project, RiskFlag, MetricPoint } from '../types';
import { IconActivity, IconCheck, IconShield, IconReportPDF, IconSearch, IconArrowLeft, IconClose, IconEye, IconArrowUp, IconInfo, IconChevronDown, IconAlert, IconUser, IconFile, IconRefresh, IconPill } from './Icons';
import { Tooltip } from './Tooltip';
import MarkerInfoPanel from './MarkerInfoPanel'; 
import { getMarkerInfo } from '../services/markerRegistry';
import { analyzePoint } from '../services/analyticsService';
import RichTooltip from './RichTooltip';

interface MetricDashboardProps {
  project: Project;
  risks: RiskFlag[];
  onGenerateProntuario: () => void;
  isMobileView?: boolean;
  isProcessing?: boolean;
  onViewSource?: (sourceId: string) => void;
}

// Helper para cor consistente
const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
};

// --- NORMALIZADOR DE DATA ROBUSTO ---
const normalizeDate = (dateStr: string): number => {
    if (!dateStr) return 0;
    try {
        if (dateStr.includes('/') && dateStr.length <= 10) {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]), 12, 0, 0).getTime();
            }
        }
        const dateObj = new Date(dateStr);
        if (!isNaN(dateObj.getTime())) {
            if (dateStr.includes('T')) return dateObj.getTime();
            return new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 12, 0, 0).getTime();
        }
    } catch (e) {
        return 0;
    }
    return 0;
};

// Componentes de Gráfico (Tick e Label) - Mantidos iguais
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

const CustomizedLabel = (props: any) => {
    const { x, y, value, index, dataLength, minIndex, maxIndex, isMobile, color } = props;
    const isSparse = dataLength < 6;
    const isMin = index === minIndex;
    const isMax = index === maxIndex;
    const isLast = index === dataLength - 1;

    if (!isSparse && !isMin && !isMax && !isLast) return null;

    return (
        <g transform={`translate(${x},${y})`}>
            <rect x="-12" y="-18" width="24" height="14" fill="white" opacity="0.6" rx="2" />
            <text x={0} y={0} dy={-8} fill={isLast ? color : "#6b7280"} fontSize={isMobile ? 9 : 10} textAnchor="middle" fontWeight={isLast || isMin || isMax ? 800 : 600}>
                {value}
            </text>
        </g>
    );
};

// Wrapper Interativo - Mantido
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
    gender: 'Masculino' | 'Feminino';
    history: MetricPoint[];
}

const InteractiveChartWrapper = ({ children, data, title, onActivate, isMobile, onClick, width, height, className, gender, history }: InteractiveChartWrapperProps) => {
    const CustomTooltip = ({ active, payload, label }: any) => {
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

        if (isMobile) return null;
        return <RichTooltip active={active} payload={payload} label={label} gender={gender} history={history} />;
    };

    return (
        <div className={`w-full h-full relative group pointer-events-none ${className || ''}`} style={{ width, height }}>
            {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child as any, {
                        width, height, onClick: onClick,
                        children: [
                            ...(React.Children.toArray((child.props as any).children)),
                            <RechartsTooltip key="trigger-tooltip" content={<CustomTooltip />} cursor={{ stroke: '#6b7280', strokeWidth: 1, strokeDasharray: '3 3' }} isAnimationActive={false} wrapperStyle={{ zIndex: 100, pointerEvents: 'auto' }} />
                        ]
                    });
                }
                return child;
            })}
        </div>
    );
};

// Componente Chart - Mantido
const BiomarkerChart = ({ title, data, color, minRef, maxRef, yDomain, type = 'line', onHover, isMobile, gender }: any) => {
    const { cleanData, minIndex, maxIndex } = useMemo(() => {
        if (!data || data.length === 0) return { cleanData: [], minIndex: -1, maxIndex: -1 };
        
        const sorted = [...data]
            .map(d => ({...d, value: Number(d.value)}))
            .sort((a,b) => normalizeDate(a.date) - normalizeDate(b.date));

        let minVal = Infinity, maxVal = -Infinity;
        let minIdx = 0, maxIdx = 0;
        sorted.forEach((d, i) => {
            if (d.value < minVal) { minVal = d.value; minIdx = i; }
            if (d.value > maxVal) { maxVal = d.value; maxIdx = i; }
        });
        return { cleanData: sorted, minIndex: minIdx, maxIndex: maxIdx };
    }, [data]);

    const triggerActivate = (point: any) => { if (point) onHover({ ...point, label: title, unit: point.unit }); };
    const handleContainerClick = (e: React.MouseEvent) => { e.stopPropagation(); const last = cleanData[cleanData.length - 1]; if (last) triggerActivate(last); };
    const handleChartClick = (state: any) => { if (state?.activePayload?.length > 0) triggerActivate(state.activePayload[0].payload); };

    if (!data || data.length === 0) return null;
    const hasRefs = minRef !== undefined && maxRef !== undefined;
    const refString = hasRefs ? `${minRef} - ${maxRef}` : 'N/A';

    return (
        <div className="mb-8 w-full">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-tight dark:text-gray-300 truncate pr-2" title={title}>{title}</h3>
                <div className="flex gap-2 shrink-0 items-center">
                    {hasRefs && (
                        <div className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                            <span className="text-[9px] text-gray-400 font-bold uppercase">Ref:</span>
                            <span className="text-[9px] text-gray-600 font-bold dark:text-gray-300">{refString}</span>
                        </div>
                    )}
                    {data[0].unit && <span className="text-[10px] text-gray-400 font-medium">{data[0].unit}</span>}
                </div>
            </div>
            <div className="h-40 w-full bg-white rounded-xl p-2 border border-gray-100 shadow-sm relative dark:bg-gray-900 dark:border-gray-800 cursor-pointer active:scale-[0.99] transition-transform select-none hover:border-blue-300 dark:hover:border-blue-700" onClick={handleContainerClick}>
                <ResponsiveContainer width="100%" height="100%">
                    <InteractiveChartWrapper data={cleanData} title={title} onActivate={triggerActivate} isMobile={isMobile} onClick={handleChartClick} gender={gender} history={data}>
                        {type === 'area' ? (
                            <AreaChart data={cleanData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                                <defs><linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={color} stopOpacity={0.3}/><stop offset="95%" stopColor={color} stopOpacity={0}/></linearGradient></defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-gray-800" />
                                <XAxis dataKey="date" tick={<CustomXAxisTick />} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                                <YAxis hide domain={yDomain || ['auto', 'auto']} />
                                <Area type="monotone" dataKey="value" stroke={color} fillOpacity={1} fill={`url(#grad-${title})`} strokeWidth={2} isAnimationActive={false}>
                                    <LabelList content={<CustomizedLabel dataLength={cleanData.length} minIndex={minIndex} maxIndex={maxIndex} isMobile={isMobile} color={color}/>} />
                                </Area>
                                {minRef !== undefined && <ReferenceLine y={minRef} stroke="#e5e7eb" strokeDasharray="3 3" />}
                                {maxRef !== undefined && <ReferenceLine y={maxRef} stroke="#e5e7eb" strokeDasharray="3 3" />}
                            </AreaChart>
                        ) : (
                            <LineChart data={cleanData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-gray-800" />
                                <XAxis dataKey="date" tick={<CustomXAxisTick />} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                                <YAxis hide domain={yDomain || ['auto', 'auto']} />
                                <Line type="monotone" dataKey="value" stroke={color} strokeWidth={3} dot={{ r: 3, fill: color, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5, strokeWidth: 0 }} isAnimationActive={false}>
                                    <LabelList content={<CustomizedLabel dataLength={cleanData.length} minIndex={minIndex} maxIndex={maxIndex} isMobile={isMobile} color={color}/>} />
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

// Componente Seção Expansível - Mantido
const CollapsibleSection = ({ title, icon: Icon, count, children, defaultExpanded = true, colorClass = "text-gray-900 dark:text-white" }: any) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    if (count === 0) return null;
    return (
        <div className="mb-6">
            <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center justify-between w-full group mb-4">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${colorClass.includes('red') ? 'bg-red-100 dark:bg-red-900/30' : colorClass.includes('yellow') || colorClass.includes('orange') ? 'bg-yellow-100 dark:bg-yellow-900/30' : colorClass.includes('emerald') ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                        <Icon className={`w-4 h-4 ${colorClass.split(' ')[0]}`} />
                    </div>
                    <h3 className={`text-xs font-black uppercase tracking-widest ${colorClass}`}>{title} ({count})</h3>
                </div>
                <div className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                    <IconChevronDown className="w-4 h-4 text-gray-400" />
                </div>
            </button>
            {isExpanded && <div className="animate-in fade-in slide-in-from-top-2 duration-300">{children}</div>}
        </div>
    );
};

// Componente de Card de Métrica (Reutilizável)
const MetricCard = ({ item, onClick }: { item: any, onClick: () => void }) => {
    // DEFINIÇÃO VISUAL (4 ZONAS)
    let styleClass = '';
    let textClass = '';
    let description = '';

    // Lógica de Cores baseada no STATUS retornado pelo AnalyticsService
    if (item.status.includes('CRITICAL')) {
        // ZONA 4: CRÍTICO (VERMELHO) - Fora da referência
        styleClass = 'bg-red-50 border-red-200 hover:bg-red-100 dark:bg-red-900/10 dark:border-red-900/40';
        textClass = 'text-red-900 dark:text-red-200';
        description = item.status === 'CRITICAL_HIGH' ? 'Crítico (Estourou Máx)' : 'Crítico (Abaixo Mín)';
    } else if (item.status === 'HIGH' || item.status === 'LOW') {
        // ZONA 3: LARANJA (ATENÇÃO) - Muito próximo (0-10% buffer)
        styleClass = 'bg-orange-50 border-orange-200 hover:bg-orange-100 dark:bg-orange-900/10 dark:border-orange-900/40';
        textClass = 'text-orange-900 dark:text-orange-200';
        description = item.status === 'HIGH' ? 'Atenção (Muito Alto)' : 'Atenção (Muito Baixo)';
    } else if (item.status.includes('BORDERLINE')) {
        // ZONA 2: AMARELO (ALERTA) - Próximo (10-20% buffer)
        styleClass = 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-900/10 dark:border-yellow-900/40';
        textClass = 'text-yellow-900 dark:text-yellow-200';
        description = item.status === 'BORDERLINE_HIGH' ? 'Alerta (Subindo)' : 'Alerta (Caindo)';
    } else if (item.status === 'NORMAL') {
        // ZONA 1: VERDE (NORMAL)
        styleClass = 'bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30';
        textClass = 'text-emerald-900 dark:text-emerald-200';
        description = 'Ideal / Estável';
    } else {
        // UNKNOWN
        styleClass = 'bg-gray-50 border-gray-200 hover:bg-gray-100 dark:bg-gray-900/20 dark:border-gray-700';
        textClass = 'text-gray-900 dark:text-gray-200';
        description = "Sem referência";
    }

    // Override se tiver Stale Warning
    if (item.staleWarning) {
        if (item.status === 'NORMAL' || item.status === 'UNKNOWN') {
            styleClass = 'bg-orange-50 border-orange-300 hover:bg-orange-100 dark:bg-orange-900/20 dark:border-orange-700';
            textClass = 'text-orange-900 dark:text-orange-200';
        } else {
            styleClass = styleClass.replace(/border-\w+-\d+/, 'border-orange-400');
        }
    }

    const rangeText = item.range ? `Ref: ${item.range.min} - ${item.range.max}` : 'Ref: N/A';

    return (
        <div onClick={onClick} className={`rounded-xl p-4 cursor-pointer transition-colors border relative ${styleClass}`}>
            {/* STALE DATA BADGE */}
            {item.staleWarning && (
                <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-[8px] font-black uppercase px-2 py-1 rounded-full shadow-sm flex items-center gap-1 z-10 border border-white dark:border-gray-900">
                    <IconRefresh className="w-3 h-3" /> Att Necessária
                </div>
            )}

            <div className="flex justify-between items-center mb-1">
                <h4 className={`font-bold text-xs uppercase tracking-wider ${textClass}`}>{item.category}</h4>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold opacity-60 flex items-center gap-1">
                        {item.sourceType === 'Cadastro' ? <IconUser className="w-3 h-3" /> : <IconFile className="w-3 h-3" />}
                        {item.date}
                    </span>
                    <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded mt-0.5 ${
                        item.sourceType === 'Cadastro' 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                        : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                        {item.sourceType === 'Cadastro' ? 'Input Manual' : 'Exame Lab'}
                    </span>
                </div>
            </div>
            <div className="flex justify-between items-end mt-2">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold opacity-80 mb-1 bg-white/40 px-1.5 py-0.5 rounded w-fit">{rangeText}</span>
                    <p className={`text-[10px] font-medium leading-snug max-w-[120px] ${textClass} opacity-90`}>
                        {item.staleWarning ? "Valor manual difere do exame mais recente." : description || item.message}
                    </p>
                </div>
                <div className="text-right">
                    <span className={`text-xl font-black block ${textClass}`}>{item.value} <span className="text-[10px] font-normal opacity-70">{item.unit}</span></span>
                    {item.secondaryData && (
                        <div className="text-[9px] opacity-70 mt-1 border-t border-black/10 pt-1 flex flex-col items-end">
                            <span className="font-bold flex items-center gap-1">
                                <IconFile className="w-2.5 h-2.5" /> Lab: {item.secondaryData.value}
                            </span>
                            <span className="text-[8px] opacity-80">{item.secondaryData.date}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- DASHBOARD PRINCIPAL ---

const MetricDashboard: React.FC<MetricDashboardProps> = ({ project, risks, onGenerateProntuario, isMobileView = false, isProcessing, onViewSource }) => {
    const [activeMarkerData, setActiveMarkerData] = useState<{ markerId: string; value: number; date: string; history: MetricPoint[] } | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showScrollTop, setShowScrollTop] = useState(false);
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

    useEffect(() => { if (isSearchOpen && searchInputRef.current) searchInputRef.current.focus(); }, [isSearchOpen]);

    const handleChartHover = (point: MetricPoint, markerId: string, history: MetricPoint[]) => {
        setActiveMarkerData({ markerId, value: Number(point.value), date: point.date, history });
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => setShowScrollTop(e.currentTarget.scrollTop > 200);
    const scrollToTop = () => containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

    const metrics = project.metrics;
    const allCategories = Object.keys(metrics);
    const gender = project.userProfile?.gender || 'Masculino';
    const filteredCategories = allCategories.filter(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()));

    // --- CÁLCULO UNIFICADO COM 3 GRUPOS CLAROS ---
    const { criticalItems, attentionItems, healthyItems } = useMemo(() => {
        const critical: any[] = [];
        const attention: any[] = [];
        const healthy: any[] = [];

        allCategories.forEach(cat => {
            const history = metrics[cat];
            if (!history || history.length === 0) return;
            
            // 1. Identifica tipos de fonte
            const isManual = (p: MetricPoint) => {
                const l = (p.label || '').toLowerCase();
                return l.includes('manual') || l.includes('wizard') || l.includes('profile') || l.includes('user') || l.includes('input');
            };

            const manualPoints = history.filter(p => isManual(p));
            const examPoints = history.filter(p => !isManual(p));

            // 2. Ordenador universal (Cronológico Decrescente)
            const sorter = (a: MetricPoint, b: MetricPoint) => {
                const dateA = normalizeDate(a.date);
                const dateB = normalizeDate(b.date);
                if (dateA !== dateB) return dateB - dateA;
                return (b.createdAt || 0) - (a.createdAt || 0);
            };

            manualPoints.sort(sorter);
            examPoints.sort(sorter);

            // 3. SELEÇÃO DE PRIORIDADE ABSOLUTA
            let primaryPoint: MetricPoint | null = null;
            let secondaryPoint: MetricPoint | null = null;
            let sourceType: 'Cadastro' | 'Exame' = 'Exame';
            let staleWarning = false;

            if (manualPoints.length > 0) {
                primaryPoint = manualPoints[0];
                sourceType = 'Cadastro';
                
                if (examPoints.length > 0) {
                    secondaryPoint = examPoints[0];
                    const manualDate = normalizeDate(primaryPoint.date);
                    const examDate = normalizeDate(secondaryPoint.date);
                    if (examDate > manualDate) staleWarning = true;
                }
            } else {
                primaryPoint = examPoints[0];
                sourceType = 'Exame';
                if (examPoints.length > 1) secondaryPoint = examPoints[1];
            }
            
            if (!primaryPoint) return;

            // ANALISAR O PONTO PRINCIPAL (COM FALLBACK DE REF)
            const info = getMarkerInfo(cat);
            // Se o ponto não tem referência, ou é nulo, tenta usar undefined para forçar o fallback do analyticsService
            const dynamicRef = (primaryPoint.refMin !== undefined && primaryPoint.refMin !== null) || (primaryPoint.refMax !== undefined && primaryPoint.refMax !== null)
                ? { min: primaryPoint.refMin, max: primaryPoint.refMax } 
                : undefined;

            const analysis = analyzePoint(Number(primaryPoint.value), primaryPoint.date, history, info, gender, dynamicRef);
            
            const itemData = {
                category: cat,
                value: primaryPoint.value,
                unit: primaryPoint.unit,
                status: analysis.status,
                message: analysis.message,
                date: primaryPoint.date,
                point: primaryPoint,
                history: history,
                range: analysis.activeRange, // Usa o range calculado pela IA (que já fez o fallback)
                sourceType: sourceType,
                secondaryData: secondaryPoint ? {
                    value: secondaryPoint.value,
                    date: secondaryPoint.date,
                    sourceType: 'Exame',
                    label: secondaryPoint.label || 'Laboratório'
                } : null,
                staleWarning
            };

            // AGORA SEPARA NOS 3 GRUPOS
            if (staleWarning) {
                // Se tem aviso de desatualização, joga em Atenção (a menos que seja crítico, aí prioriza crítico)
                if (analysis.status.includes('CRITICAL')) critical.push(itemData);
                else attention.push(itemData);
            } 
            else if (analysis.status.includes('CRITICAL')) {
                critical.push(itemData);
            } 
            else if (analysis.status === 'HIGH' || analysis.status === 'LOW' || analysis.status.includes('BORDERLINE')) {
                attention.push(itemData);
            } 
            else {
                // Normal ou Unknown
                healthy.push(itemData);
            }
        });
        
        return { criticalItems: critical, attentionItems: attention, healthyItems: healthy };
    }, [metrics, gender, allCategories]);

    // Filtros de busca
    const filteredRisks = risks.filter(r => r.category.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredCritical = criticalItems.filter(item => item.category.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredAttention = attentionItems.filter(item => item.category.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredHealthy = healthyItems.filter(item => item.category.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="flex h-full w-full overflow-hidden relative">
            <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto bg-gray-50 h-full p-0 pb-32 dark:bg-gray-950 relative">
                {/* Header Search */}
                <div className={`sticky top-0 z-30 bg-gray-50/95 backdrop-blur-md border-b border-gray-200 px-4 md:px-8 py-4 flex justify-between items-end transition-all dark:bg-gray-950/95 dark:border-gray-800 shadow-sm ${isSearchOpen ? 'min-h-[70px]' : 'min-h-[50px] md:min-h-[70px]'}`}>
                    {isSearchOpen ? (
                        <div className="flex items-center w-full gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                            <button onClick={() => { setIsSearchOpen(false); setSearchTerm(''); }} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full dark:text-gray-400 dark:hover:bg-gray-800"><IconArrowLeft className="w-5 h-5" /></button>
                            <div className="flex-1 relative">
                                <input ref={searchInputRef} type="text" placeholder="Filtrar gráficos e cards..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-4 pr-10 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
                                {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><IconClose className="w-4 h-4" /></button>}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2 dark:text-white"><IconActivity className="w-6 h-6 text-gray-400" /> MÉTRICAS</h2>
                                <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-wider dark:text-gray-400">Inteligência de Decisão & Saúde</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setIsSearchOpen(true)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full hover:text-gray-600 transition-colors dark:hover:bg-gray-800 dark:hover:text-white bg-white border border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-700"><IconSearch className="w-5 h-5" /></button>
                                {!isProcessing && (
                                    <button onClick={onGenerateProntuario} className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors shadow-lg active:scale-95 dark:bg-blue-600 dark:hover:bg-blue-700"><IconReportPDF className="w-4 h-4" /> PRONTUÁRIO PDF</button>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className="p-4 md:p-8">
                    <div className="mb-8">
                        {!searchTerm && (
                            <div className="mb-6 bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-[10px] dark:bg-gray-900 dark:border-gray-800">
                                <div className="flex flex-wrap gap-4 text-gray-500 font-medium dark:text-gray-400">
                                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></span><span>Verde (Seguro &gt;20%)</span></div>
                                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-sm"></span><span>Amarelo (Alerta 10-20%)</span></div>
                                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm"></span><span>Laranja (Atenção 0-10%)</span></div>
                                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-sm"></span><span>Vermelho (Fora)</span></div>
                                </div>
                                <div className="flex items-center gap-1.5 text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded-md border border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/30"><span className="text-sm">👆</span><span>Toque para detalhes</span></div>
                            </div>
                        )}

                        {/* 1. RISCOS E DIAGNÓSTICOS (TEXTO) */}
                        <CollapsibleSection title="Diagnósticos de Risco" count={filteredRisks.length} icon={IconShield} colorClass="text-red-700 dark:text-red-400">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {filteredRisks.map((risk, idx) => (
                                    <div key={idx} onClick={() => risk.sourceId && onViewSource && onViewSource(risk.sourceId)} className="group p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg cursor-pointer bg-red-50 border-red-200 hover:bg-red-100 dark:bg-red-900/10 dark:border-red-900/50">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-sm bg-red-600 text-white">{risk.category}</span>
                                            <span className="text-[10px] font-bold opacity-60 text-gray-600 dark:text-gray-400">{risk.date}</span>
                                        </div>
                                        <p className="text-xs font-medium text-gray-800 dark:text-gray-200 leading-relaxed">{risk.message}</p>
                                    </div>
                                ))}
                            </div>
                        </CollapsibleSection>

                        {/* 2. CRÍTICOS (VERMELHO) */}
                        <CollapsibleSection title="Ação Iminente (Críticos)" count={filteredCritical.length} icon={IconAlert} colorClass="text-red-700 dark:text-red-400">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {filteredCritical.map((item, idx) => (
                                    <MetricCard key={idx} item={item} onClick={() => handleChartHover(item.point, item.category, item.history)} />
                                ))}
                            </div>
                        </CollapsibleSection>

                        {/* 3. ATENÇÃO (LARANJA + AMARELO) */}
                        <CollapsibleSection title="Monitoramento e Alerta" count={filteredAttention.length} icon={IconEye} colorClass="text-orange-700 dark:text-orange-400">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {filteredAttention.map((item, idx) => (
                                    <MetricCard key={idx} item={item} onClick={() => handleChartHover(item.point, item.category, item.history)} />
                                ))}
                            </div>
                        </CollapsibleSection>

                        {/* 4. SAUDÁVEIS (VERDE) */}
                        <CollapsibleSection title="Marcadores Saudáveis" count={filteredHealthy.length} icon={IconCheck} defaultExpanded={false} colorClass="text-emerald-700 dark:text-emerald-400">
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {filteredHealthy.map((item, idx) => (
                                    <MetricCard key={idx} item={item} onClick={() => handleChartHover(item.point, item.category, item.history)} />
                                ))}
                            </div>
                        </CollapsibleSection>
                    </div>

                    <div className="mb-4">
                        <button onClick={() => setIsChartsExpanded(!isChartsExpanded)} className="flex items-center justify-between w-full group mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800"><IconActivity className="w-4 h-4 text-gray-700 dark:text-gray-300" /></div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">Gráficos de Evolução ({filteredCategories.length})</h3>
                            </div>
                            <div className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-transform duration-200 ${isChartsExpanded ? 'rotate-180' : ''}`}><IconChevronDown className="w-4 h-4 text-gray-400" /></div>
                        </button>
                        {isChartsExpanded && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                {filteredCategories.map(cat => {
                                    const history = metrics[cat];
                                    const lastPoint = history[history.length - 1];
                                    const info = getMarkerInfo(cat);
                                    let minRef = info.ranges?.general?.[0];
                                    let maxRef = info.ranges?.general?.[1];
                                    if (info.isGeneric && lastPoint) { if (lastPoint.refMin !== undefined) minRef = lastPoint.refMin; if (lastPoint.refMax !== undefined) maxRef = lastPoint.refMax; }
                                    const chartColor = stringToColor(cat);
                                    return <div key={cat} className="animate-in fade-in duration-500"><BiomarkerChart title={cat} data={metrics[cat]} color={chartColor} type={cat.includes('Peso') ? 'area' : 'line'} minRef={minRef} maxRef={maxRef} onHover={(point: any) => handleChartHover(point, cat, metrics[cat])} isMobile={isMobileView} gender={gender} /></div>;
                                })}
                            </div>
                        )}
                    </div>
                    {filteredCategories.length === 0 && <div className="text-center py-20 opacity-50"><IconSearch className="w-12 h-12 mx-auto mb-2 text-gray-300" /><p className="text-sm font-medium text-gray-400">{searchTerm ? `Nenhum gráfico encontrado para "${searchTerm}".` : "Nenhuma métrica registrada ainda."}</p></div>}
                    {isMobileView && !isProcessing && <div className="md:hidden fixed bottom-24 right-4 z-40"><Tooltip content="Gerar Prontuário PDF" position="left"><button onClick={onGenerateProntuario} className="bg-black text-white p-4 rounded-full shadow-2xl active:scale-90 transition-transform dark:bg-blue-600 border border-gray-800 dark:border-blue-500"><IconReportPDF className="w-6 h-6" /></button></Tooltip></div>}
                </div>
            </div>
            {showScrollTop && <button onClick={scrollToTop} className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-40 bg-black/80 backdrop-blur text-white p-3 rounded-full shadow-lg border border-gray-700 animate-in fade-in slide-in-from-bottom-4 active:scale-90 transition-all dark:bg-blue-600/80 dark:border-blue-500" title="Voltar ao topo / Buscar"><IconArrowUp className="w-5 h-5" /></button>}
            <MarkerInfoPanel activeData={activeMarkerData} onClose={() => setActiveMarkerData(null)} gender={gender} />
        </div>
    );
};

export default MetricDashboard;
