
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Source, ChatMessage, SourceType, MetricPoint } from '../types';
import { dataService } from '../services/dataService';
import { IconClock, IconFile, IconSparkles, IconUser, IconDumbbell, IconClose, IconCalendar, IconArrowLeft, IconDownload, IconSearch, IconAlert, IconCheck, IconPill, IconFlame, IconActivity } from './Icons';
import ReactMarkdown from 'react-markdown';

interface TimelineViewProps {
    sources: Source[];
    messages: ChatMessage[];
    projectId?: string;
    metrics?: Record<string, MetricPoint[]>;
}

interface TimelineItem {
    id: string;
    dateObj: Date;
    dateDisplay: string;
    type: 'SOURCE' | 'ANALYSIS';
    subType?: SourceType;
    category?: 'TREINO' | 'DIETA' | 'PROTOCOLO' | 'SAUDE' | 'GERAL'; // Categoria inferida
    title: string;
    content: string;
    isHighlight?: boolean;
    isSummary?: boolean; // Novo: Identifica se é um resumo consolidado
    originalObject?: any;
    topMetrics?: { category: string, value: number, unit: string, status: 'NORMAL' | 'HIGH' | 'LOW' }[];
}

// Helper para limpar markdown do preview e deixar o texto "jornalístico"
const stripMarkdown = (text: string) => {
    return text
        .replace(/[#*`_~]/g, '') // Remove caracteres especiais
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Links viram texto
        .replace(/\n\s*\n/g, ' ') // Remove quebras duplas
        .trim();
};

const HighlightText = ({ text, highlight, className = "" }: { text: string, highlight: string, className?: string }) => {
    if (!highlight.trim()) {
        return <span className={className}>{text}</span>;
    }
    const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapeRegExp(highlight)})`, 'gi'));
    return (
        <span className={className}>
            {parts.map((part, i) => 
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <span key={i} className="bg-yellow-300 text-black font-bold px-0.5 rounded-sm">{part}</span>
                ) : (
                    part
                )
            )}
        </span>
    );
};

// --- MODAL DE DETALHES ---
const TimelineEventModal = ({ item, onClose }: { item: TimelineItem | null, onClose: () => void }) => {
    if (!item) return null;
    const isSource = item.type === 'SOURCE';
    const handleDownload = () => {
        if (isSource && item.originalObject?.fileUrl) {
            window.open(item.originalObject.fileUrl, '_blank');
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:max-w-3xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden dark:bg-gray-900 dark:border dark:border-gray-800">
                <div className={`p-6 border-b shrink-0 flex justify-between items-start ${
                    item.isSummary 
                    ? 'bg-purple-50 border-purple-100 dark:bg-purple-900/20 dark:border-purple-900/30'
                    : isSource 
                        ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/30' 
                        : 'bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-900/30'
                }`}>
                    <div className="flex gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                            item.isSummary
                            ? 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300'
                            : isSource 
                                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300' 
                                : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300'
                        }`}>
                            {item.isSummary ? <IconSparkles className="w-6 h-6" /> : 
                             isSource ? <IconFile className="w-6 h-6" /> : <IconSparkles className="w-6 h-6" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                    item.isSummary
                                    ? 'bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-100'
                                    : isSource 
                                        ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100' 
                                        : 'bg-indigo-200 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100'
                                }`}>
                                    {item.isSummary ? 'Resumo Estratégico' : isSource ? 'Documento Original' : 'Análise IA'}
                                </span>
                                <span className="text-xs font-bold text-gray-500 flex items-center gap-1 dark:text-gray-400">
                                    <IconCalendar className="w-3 h-3" />
                                    {item.dateDisplay}
                                </span>
                            </div>
                            <h2 className="text-xl font-black text-gray-900 leading-tight dark:text-white">{item.title}</h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/50 hover:bg-white rounded-full transition-colors text-gray-500 hover:text-gray-900 dark:bg-black/20 dark:hover:bg-black/40 dark:text-gray-400 dark:hover:text-white">
                        <IconClose className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-white custom-scrollbar dark:bg-gray-950">
                    <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert">
                        <ReactMarkdown>{item.content}</ReactMarkdown>
                    </div>
                </div>
                <div className="p-4 border-t bg-gray-50 flex justify-between items-center shrink-0 dark:bg-gray-900 dark:border-gray-800">
                    <span className="text-xs text-gray-400 font-medium">ID: {item.id.substring(0, 8)}</span>
                    <div className="flex gap-3">
                        {isSource && item.originalObject?.fileUrl && (
                            <button onClick={handleDownload} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700">
                                <IconDownload className="w-4 h-4" /> Baixar Original
                            </button>
                        )}
                        <button onClick={onClose} className="px-6 py-2 bg-black text-white font-bold rounded-lg text-sm hover:bg-gray-800 transition-colors dark:bg-blue-600 dark:hover:bg-blue-700">Fechar</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TimelineView: React.FC<TimelineViewProps> = ({ sources, messages: initialMessages, projectId, metrics }) => {
    const [filter, setFilter] = useState<'ALL' | 'EXAMS' | 'ANALYSIS'>('ALL');
    const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleToggleSearch = () => { setIsSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 300); };
        window.addEventListener('toggle-app-search', handleToggleSearch);
        return () => window.removeEventListener('toggle-app-search', handleToggleSearch);
    }, []);

    useEffect(() => {
        if (projectId && (!initialMessages || initialMessages.length === 0)) {
            dataService.getMessages(projectId).then(msgs => setMessages(msgs));
        } else {
            setMessages(initialMessages);
        }
    }, [projectId, initialMessages]);

    const timelineData = useMemo(() => {
        const items: TimelineItem[] = [];
        
        // --- SOURCES ---
        sources.forEach(source => {
            const parts = source.date.split('/');
            let dateObj = new Date();
            if (parts.length === 3) dateObj = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));

            const sourceTopMetrics: any[] = [];
            if (metrics) {
                Object.entries(metrics).forEach(([category, points]) => {
                    const matchingPoint = points.find(p => p.date === source.date);
                    if (matchingPoint) {
                        let status: 'NORMAL' | 'HIGH' | 'LOW' = 'NORMAL';
                        if (matchingPoint.refMax !== undefined && matchingPoint.value > matchingPoint.refMax) status = 'HIGH';
                        if (matchingPoint.refMin !== undefined && matchingPoint.value < matchingPoint.refMin) status = 'LOW';
                        sourceTopMetrics.push({ category, value: matchingPoint.value, unit: matchingPoint.unit, status });
                    }
                });
            }
            sourceTopMetrics.sort((a, b) => (a.status !== 'NORMAL' ? -1 : 1));

            // Filtro Rigoroso de Conteúdo Vazio
            const rawContent = source.summary || source.content || "";
            // Se o conteúdo é muito curto e não tem métricas, ignora (lixo de upload)
            if (rawContent.length < 20 && sourceTopMetrics.length === 0) return;

            items.push({
                id: source.id,
                dateObj,
                dateDisplay: source.date,
                type: 'SOURCE',
                subType: source.type,
                title: source.title,
                content: rawContent,
                isHighlight: sourceTopMetrics.some(m => m.status !== 'NORMAL'),
                originalObject: source,
                topMetrics: sourceTopMetrics.slice(0, 6)
            });
        });

        // --- MESSAGES ---
        const seenContent = new Set<string>();
        messages.forEach(msg => {
            if (msg.role !== 'model') return;
            const text = msg.text.trim();
            const lowerText = text.toLowerCase();

            // Filtro de Ruído Agressivo (Ignora "Ok", "Olá", "Processando")
            if (text.startsWith('✅') || text.startsWith('🔄') || text.startsWith('❌') || text.includes('processado')) return;
            if (lowerText.startsWith('olá') || lowerText.startsWith('oi') || lowerText.includes('sou o fitlm') || lowerText.includes('posso ajudar')) return;
            if (lowerText.includes('erro') || lowerText.includes('desculpe')) return;
            if (seenContent.has(text)) return;
            seenContent.add(text);

            // Tamanho Mínimo (aumentado para 80 chars) para evitar chat curto
            // Exceção: Se tiver palavras chave de alerta
            const isImportant = lowerText.includes('risco') || lowerText.includes('alerta') || lowerText.includes('atenção') || lowerText.includes('importante');
            
            if (text.length < 80 && !isImportant && !msg.isBookmarked) return;

            const dateObj = new Date(msg.timestamp);
            
            // Categorização Automática baseada no conteúdo
            let title = 'Análise IA';
            let category: TimelineItem['category'] = 'GERAL';
            let isSummary = false;

            if (lowerText.includes('treino') || lowerText.includes('exercício') || lowerText.includes('série')) {
                title = 'Análise de Treino';
                category = 'TREINO';
            } else if (lowerText.includes('dieta') || lowerText.includes('caloria') || lowerText.includes('macro')) {
                title = 'Análise Nutricional';
                category = 'DIETA';
            } else if (lowerText.includes('exame') || lowerText.includes('sangue') || lowerText.includes('hemograma')) {
                title = 'Análise Clínica';
                category = 'SAUDE';
            } else if (lowerText.includes('protocolo') || lowerText.includes('ciclo') || lowerText.includes('mg')) {
                title = 'Análise de Protocolo';
                category = 'PROTOCOLO';
            }

            // Detecção de Resumos Importantes
            if (lowerText.includes('resumo') || lowerText.includes('conclusão') || lowerText.includes('relatório') || lowerText.includes('semanal')) {
                title = 'Resumo Estratégico';
                isSummary = true; // Ativa visual diferenciado (Roxo)
            }

            items.push({
                id: msg.id,
                dateObj,
                dateDisplay: dateObj.toLocaleDateString('pt-BR'),
                type: 'ANALYSIS',
                category,
                title: msg.isBookmarked ? 'Insight Favorito' : title,
                content: text,
                isHighlight: msg.isBookmarked,
                isSummary,
                originalObject: msg
            });
        });

        return items.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
    }, [sources, messages, metrics]);

    const filteredData = timelineData.filter(item => {
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            return item.title.toLowerCase().includes(term) || item.content.toLowerCase().includes(term);
        }
        if (filter === 'EXAMS') return item.type === 'SOURCE';
        if (filter === 'ANALYSIS') return item.type === 'ANALYSIS';
        return true;
    });

    const getCategoryIcon = (category?: string) => {
        switch (category) {
            case 'TREINO': return <IconDumbbell className="w-3.5 h-3.5" />;
            case 'DIETA': return <IconFlame className="w-3.5 h-3.5" />;
            case 'PROTOCOLO': return <IconPill className="w-3.5 h-3.5" />;
            case 'SAUDE': return <IconActivity className="w-3.5 h-3.5" />;
            default: return <IconSparkles className="w-3.5 h-3.5" />;
        }
        };

    let lastMonthYear = '';

    return (
        <div className="flex-1 bg-gray-50 h-full flex flex-col overflow-hidden dark:bg-gray-950 relative">
            {selectedItem && <TimelineEventModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
            
            <div className="shrink-0 bg-white border-b border-gray-200 p-4 md:p-6 flex justify-between items-center z-10 sticky top-0 dark:bg-gray-900 dark:border-gray-800 h-[72px]">
                {isSearchOpen ? (
                    <div className="flex items-center w-full gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                        <button onClick={() => { setIsSearchOpen(false); setSearchTerm(''); }} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full dark:text-gray-400 dark:hover:bg-gray-800">
                            <IconArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex-1 relative">
                            <input ref={searchInputRef} type="text" placeholder="Buscar na timeline..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-100 border-none rounded-xl py-2 pl-4 pr-10 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white" />
                            {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><IconClose className="w-4 h-4" /></button>}
                        </div>
                    </div>
                ) : (
                    <>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 dark:text-white">
                                <IconClock className="w-6 h-6 text-blue-600" /> TIMELINE
                            </h2>
                            <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-wider dark:text-gray-400 hidden md:block">Histórico Consolidado</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setIsSearchOpen(true)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full hover:text-gray-600 transition-colors dark:hover:bg-gray-800 dark:hover:text-white" title="Pesquisar"><IconSearch className="w-5 h-5" /></button>
                            <div className="flex bg-gray-100 rounded-lg p-1 gap-1 dark:bg-gray-800">
                                {['ALL', 'EXAMS', 'ANALYSIS'].map(f => (
                                    <button key={f} onClick={() => setFilter(f as any)} className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${filter === f ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>
                                        {f === 'ALL' ? 'Tudo' : f === 'EXAMS' ? 'Docs' : 'Insights'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {searchTerm && <div className="bg-yellow-50 text-yellow-800 text-xs px-4 py-2 flex justify-between items-center dark:bg-yellow-900/20 dark:text-yellow-200"><span className="font-medium">{filteredData.length} evento(s) encontrados</span><button onClick={() => { setSearchTerm(''); setIsSearchOpen(false); }} className="text-yellow-600 hover:underline font-bold dark:text-yellow-400">Limpar</button></div>}

            <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar pb-32">
                <div className="max-w-5xl mx-auto relative pl-4 md:pl-0">
                    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-800 md:left-1/2 md:-ml-[1px]" />
                    {filteredData.map((item, index) => {
                        const monthYear = item.dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                        const showMonthHeader = monthYear !== lastMonthYear;
                        if (showMonthHeader) lastMonthYear = monthYear;
                        const isLeft = index % 2 === 0;

                        return (
                            <React.Fragment key={item.id}>
                                {showMonthHeader && (
                                    <div className="relative flex justify-center items-center my-10 z-10">
                                        <span className="bg-white text-gray-900 text-[10px] font-black uppercase px-4 py-1.5 rounded-full border border-gray-200 shadow-md tracking-widest dark:bg-gray-800 dark:text-white dark:border-gray-700">{monthYear}</span>
                                    </div>
                                )}
                                <div className={`relative mb-8 md:flex md:items-start md:justify-between w-full group ${isLeft ? 'md:flex-row-reverse' : ''}`}>
                                    
                                    {/* ÍCONE CENTRAL NA LINHA DO TEMPO */}
                                    <div className={`absolute left-8 -translate-x-1/2 w-4 h-4 rounded-full border-4 border-white shadow-md z-20 md:left-1/2 md:top-6 transition-transform group-hover:scale-125 dark:border-gray-900 ${
                                        item.isSummary ? 'bg-purple-500' :
                                        item.type === 'SOURCE' ? 'bg-emerald-500' : 'bg-indigo-500'
                                    }`} />
                                    
                                    <div className="hidden md:block md:w-[45%]" />
                                    
                                    <div className={`ml-12 md:ml-0 md:w-[45%] transition-all duration-300 ${isLeft ? 'md:pr-8 hover:-translate-x-2' : 'md:pl-8 hover:translate-x-2'}`}>
                                        <div onClick={() => setSelectedItem(item)} className={`bg-white rounded-2xl p-5 border shadow-sm cursor-pointer relative overflow-hidden dark:bg-gray-900 dark:border-gray-800 ${
                                            item.isSummary ? 'border-l-4 border-l-purple-500 shadow-purple-100 dark:shadow-none' :
                                            item.isHighlight ? 'border-l-4 border-l-blue-500 shadow-md' : 'border-gray-100 hover:border-gray-300 dark:hover:border-gray-700'
                                        }`}>
                                            
                                            {/* Cabeçalho do Card */}
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className={`p-1.5 rounded-lg ${
                                                        item.isSummary ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' :
                                                        item.type === 'SOURCE' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
                                                    }`}>
                                                        {item.type === 'SOURCE' 
                                                            ? (item.subType === 'USER_INPUT' ? <IconDumbbell className="w-3.5 h-3.5" /> : <IconFile className="w-3.5 h-3.5" />)
                                                            : getCategoryIcon(item.category)
                                                        }
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.dateDisplay}</span>
                                                </div>
                                                {item.type === 'SOURCE' && item.originalObject?.fileUrl && (
                                                    <button onClick={(e) => { e.stopPropagation(); window.open(item.originalObject.fileUrl, '_blank'); }} className="p-1.5 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-blue-600 rounded-lg transition-colors dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-500 dark:hover:text-blue-400" title="Baixar Original"><IconDownload className="w-4 h-4" /></button>
                                                )}
                                            </div>

                                            <h3 className="text-base font-bold text-gray-900 mb-2 leading-tight dark:text-white flex items-center gap-2">
                                                <HighlightText text={item.title} highlight={searchTerm} />
                                                {item.isSummary && <span className="text-[8px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider dark:bg-purple-900/30 dark:text-purple-300">Resumo</span>}
                                            </h3>

                                            {/* MÉTRICAS (Mantido e Priorizado) */}
                                            {item.type === 'SOURCE' && item.topMetrics && item.topMetrics.length > 0 && (
                                                <div className="my-3 grid grid-cols-2 gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100 dark:bg-gray-800/50 dark:border-gray-700">
                                                    {item.topMetrics.map((m, i) => (
                                                        <div key={i} className="flex flex-col p-1.5 rounded-lg bg-white shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                                                            <div className="flex justify-between items-start mb-0.5">
                                                                <span className="text-[9px] text-gray-500 font-bold uppercase truncate max-w-[80px] dark:text-gray-400" title={m.category}>{m.category}</span>
                                                                {m.status !== 'NORMAL' && <div className={`w-1.5 h-1.5 rounded-full ${m.status === 'HIGH' ? 'bg-red-500' : 'bg-orange-400'}`} title={m.status === 'HIGH' ? 'Alto' : 'Baixo'} />}
                                                            </div>
                                                            <span className={`text-xs font-black ${m.status === 'HIGH' ? 'text-red-600 dark:text-red-400' : m.status === 'LOW' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>
                                                                {m.value} <span className="text-[8px] font-normal text-gray-400 uppercase">{m.unit}</span>
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Preview do Conteúdo (Limpo) */}
                                            <div className="text-xs text-gray-500 leading-relaxed line-clamp-3 dark:text-gray-400">
                                                {searchTerm ? (
                                                    <HighlightText text={stripMarkdown(item.content).substring(0, 250) + "..."} highlight={searchTerm} />
                                                ) : (
                                                    stripMarkdown(item.content).substring(0, 250) + "..."
                                                )}
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between dark:border-gray-800">
                                                <div className="flex gap-2">
                                                    {item.type === 'SOURCE' && <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded dark:bg-gray-800 dark:text-gray-500">{item.subType}</span>}
                                                    {item.type === 'ANALYSIS' && <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded dark:bg-gray-800 dark:text-gray-500">{item.category}</span>}
                                                </div>
                                                <span className="text-[10px] font-bold text-blue-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity dark:text-blue-400">
                                                    Abrir <IconArrowLeft className="w-3 h-3 rotate-180" />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })}
                    {filteredData.length === 0 && <div className="text-center py-20 opacity-50 ml-8 md:ml-0"><IconClock className="w-12 h-12 mx-auto mb-2 text-gray-300" /><p className="text-sm font-medium text-gray-400">Nenhum evento relevante.</p></div>}
                </div>
            </div>
        </div>
    );
};

export default TimelineView;
