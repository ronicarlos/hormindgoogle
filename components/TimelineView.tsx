
import React, { useMemo, useState } from 'react';
import { Source, ChatMessage, SourceType } from '../types';
import { IconClock, IconFile, IconSparkles, IconUser, IconDumbbell, IconClose, IconCalendar, IconArrowLeft, IconDownload } from './Icons';
import ReactMarkdown from 'react-markdown';

interface TimelineViewProps {
    sources: Source[];
    messages: ChatMessage[];
}

interface TimelineItem {
    id: string;
    dateObj: Date;
    dateDisplay: string;
    type: 'SOURCE' | 'ANALYSIS';
    subType?: SourceType;
    title: string;
    content: string;
    isHighlight?: boolean;
    originalObject?: any; // To allow downloading files if needed
}

// --- MODAL DE DETALHES (DEEP DIVE) ---
const TimelineEventModal = ({ item, onClose }: { item: TimelineItem | null, onClose: () => void }) => {
    if (!item) return null;

    const isSource = item.type === 'SOURCE';
    
    // Função para baixar arquivo original se disponível
    const handleDownload = () => {
        if (isSource && item.originalObject?.fileUrl) {
            window.open(item.originalObject.fileUrl, '_blank');
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:max-w-3xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden dark:bg-gray-900 dark:border dark:border-gray-800">
                
                {/* Header */}
                <div className={`p-6 border-b shrink-0 flex justify-between items-start ${
                    isSource ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30' : 'bg-indigo-50 border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-900/30'
                }`}>
                    <div className="flex gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                            isSource ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300'
                        }`}>
                            {isSource ? (item.subType === 'USER_INPUT' ? <IconDumbbell className="w-6 h-6" /> : <IconFile className="w-6 h-6" />) : <IconSparkles className="w-6 h-6" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                    isSource ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100' : 'bg-indigo-200 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100'
                                }`}>
                                    {isSource ? 'Registro / Exame' : 'Análise de IA'}
                                </span>
                                <span className="text-xs font-bold text-gray-500 flex items-center gap-1 dark:text-gray-400">
                                    <IconCalendar className="w-3 h-3" />
                                    {item.dateDisplay}
                                </span>
                            </div>
                            <h2 className="text-xl font-black text-gray-900 leading-tight dark:text-white">{item.title}</h2>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 bg-white/50 hover:bg-white rounded-full transition-colors text-gray-500 hover:text-gray-900 dark:bg-black/20 dark:hover:bg-black/40 dark:text-gray-400 dark:hover:text-white"
                    >
                        <IconClose className="w-6 h-6" />
                    </button>
                </div>

                {/* Content Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-white custom-scrollbar dark:bg-gray-950">
                    <div className="prose prose-sm md:prose-base max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900 dark:prose-invert dark:prose-p:text-gray-300 dark:prose-li:text-gray-300">
                        {/* Se for User Input, formata melhor os dados chave */}
                        {isSource && item.subType === 'USER_INPUT' && (
                            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm dark:bg-gray-900 dark:border-gray-800">
                                <p className="font-bold text-gray-500 uppercase text-xs mb-2">Dados Estruturados</p>
                                {/* A renderização do markdown abaixo cuidará do conteúdo, mas aqui damos destaque */}
                            </div>
                        )}

                        <ReactMarkdown components={{
                            // Customizar tabelas para ficarem bonitas no modal
                            table: ({node, ...props}) => <div className="overflow-x-auto my-4 rounded-lg border border-gray-200 dark:border-gray-800"><table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800" {...props} /></div>,
                            th: ({node, ...props}) => <th className="px-4 py-3 bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase tracking-wider dark:bg-gray-900 dark:text-gray-400" {...props} />,
                            td: ({node, ...props}) => <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 border-t border-gray-100 dark:text-gray-300 dark:border-gray-800" {...props} />,
                            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-indigo-500 pl-4 italic text-gray-600 bg-gray-50 py-2 pr-2 rounded-r dark:bg-gray-900 dark:text-gray-400 dark:border-indigo-400" {...props} />
                        }}>
                            {item.content}
                        </ReactMarkdown>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t bg-gray-50 flex justify-between items-center shrink-0 dark:bg-gray-900 dark:border-gray-800">
                    <span className="text-xs text-gray-400 font-medium">
                        ID: {item.id.substring(0, 8)}
                    </span>
                    <div className="flex gap-3">
                        {isSource && item.originalObject?.fileUrl && (
                            <button 
                                onClick={handleDownload}
                                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                <IconDownload className="w-4 h-4" />
                                Original
                            </button>
                        )}
                        <button 
                            onClick={onClose}
                            className="px-6 py-2 bg-black text-white font-bold rounded-lg text-sm hover:bg-gray-800 transition-colors dark:bg-blue-600 dark:hover:bg-blue-700"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TimelineView: React.FC<TimelineViewProps> = ({ sources, messages }) => {
    const [filter, setFilter] = useState<'ALL' | 'EXAMS' | 'ANALYSIS'>('ALL');
    const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);

    // --- DATA PROCESSING LOGIC ---
    const timelineData = useMemo(() => {
        const items: TimelineItem[] = [];

        // 1. Process Sources (Exams, Inputs, Documents) - Estes são sempre relevantes
        sources.forEach(source => {
            // Parse Date from DD/MM/YYYY
            const parts = source.date.split('/');
            let dateObj = new Date();
            if (parts.length === 3) {
                dateObj = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            }

            items.push({
                id: source.id,
                dateObj: dateObj,
                dateDisplay: source.date,
                type: 'SOURCE',
                subType: source.type,
                title: source.title,
                content: source.summary || source.content, // Use summary if available
                isHighlight: source.type === SourceType.PDF || source.type === SourceType.IMAGE || source.type === SourceType.PRONTUARIO,
                originalObject: source
            });
        });

        // 2. Process Messages (Filtro rigoroso para evitar duplicação e ruído)
        messages.forEach(msg => {
            // Regra 1: Mensagens do Usuário raramente são marcos de timeline (exceto inputs, que já viram Sources)
            if (msg.role !== 'model') return;

            // Regra 2: Prioridade para Favoritos
            // Se o usuário favoritou, é relevante independente de qualquer outra regra.
            const isBookmarked = msg.isBookmarked;

            // Regra 3: Filtrar Mensagens de Sistema / Transacionais
            // Mensagens que começam com emojis de status (Check, Loading, Error) geralmente são feedback de UI
            // ou confirmações de que um Source foi criado (o que geraria duplicidade visual).
            const isSystemNotification = 
                msg.text.startsWith('✅') || 
                msg.text.startsWith('🔄') || 
                msg.text.startsWith('❌') ||
                msg.text.includes('Prontuário gerado com sucesso') ||
                msg.text.includes('processado');

            if (isSystemNotification && !isBookmarked) return;

            // Regra 4: Filtro de Relevância por Tamanho
            // Chat casual ("Olá", "Tudo bem", "Entendido") não deve poluir a timeline.
            // Apenas análises substanciais (> 200 caracteres) entram.
            if (msg.text.length < 200 && !isBookmarked) return;

            const dateObj = new Date(msg.timestamp);
            items.push({
                id: msg.id,
                dateObj: dateObj,
                dateDisplay: dateObj.toLocaleDateString('pt-BR'),
                type: 'ANALYSIS',
                title: isBookmarked ? 'Insight Favorito' : 'Análise Estratégica IA',
                content: msg.text,
                isHighlight: isBookmarked,
                originalObject: msg
            });
        });

        // 3. Sort Descending (Newest First)
        return items.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
    }, [sources, messages]);

    // Filter Logic
    const filteredData = timelineData.filter(item => {
        if (filter === 'ALL') return true;
        if (filter === 'EXAMS') return item.type === 'SOURCE';
        if (filter === 'ANALYSIS') return item.type === 'ANALYSIS';
        return true;
    });

    // Helper to group by Month/Year visually
    let lastMonthYear = '';

    return (
        <div className="flex-1 bg-gray-50 h-full flex flex-col overflow-hidden dark:bg-gray-950 relative">
            
            {/* Modal Layer */}
            {selectedItem && (
                <TimelineEventModal item={selectedItem} onClose={() => setSelectedItem(null)} />
            )}

            {/* Header */}
            <div className="shrink-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center z-10 sticky top-0 dark:bg-gray-900 dark:border-gray-800">
                <div>
                    <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 dark:text-white">
                        <IconClock className="w-6 h-6 text-blue-600" />
                        TIMELINE
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-wider dark:text-gray-400">
                        Histórico Consolidado
                    </p>
                </div>
                
                {/* Simple Filter Pills */}
                <div className="flex bg-gray-100 rounded-lg p-1 gap-1 dark:bg-gray-800">
                    {['ALL', 'EXAMS', 'ANALYSIS'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${
                                filter === f 
                                ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-white' 
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                        >
                            {f === 'ALL' ? 'Tudo' : f === 'EXAMS' ? 'Exames' : 'Análises'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Timeline Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar pb-32">
                <div className="max-w-3xl mx-auto relative pl-4 md:pl-0">
                    
                    {/* The Vertical Line */}
                    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-800 md:left-1/2 md:-ml-[1px]" />

                    {filteredData.map((item, index) => {
                        const monthYear = item.dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                        const showMonthHeader = monthYear !== lastMonthYear;
                        if (showMonthHeader) lastMonthYear = monthYear;

                        const isLeft = index % 2 === 0; // Alternating layout for desktop

                        return (
                            <React.Fragment key={item.id}>
                                {/* Month Header */}
                                {showMonthHeader && (
                                    <div className="relative flex justify-center items-center my-8 z-10">
                                        <span className="bg-gray-200 text-gray-600 text-[10px] font-bold uppercase px-3 py-1 rounded-full border border-white shadow-sm dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                                            {monthYear}
                                        </span>
                                    </div>
                                )}

                                {/* Timeline Item Card */}
                                <div className={`relative mb-8 md:flex md:items-center ${isLeft ? 'md:flex-row-reverse' : ''}`}>
                                    
                                    {/* The Dot on the Line */}
                                    <div className={`absolute left-8 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white shadow-sm z-10 md:left-1/2 dark:border-gray-900 ${
                                        item.type === 'SOURCE' 
                                            ? 'bg-emerald-500' 
                                            : 'bg-indigo-500'
                                    }`} />

                                    {/* Spacer for Desktop Centering */}
                                    <div className="hidden md:block md:w-1/2" />

                                    {/* The Content Card */}
                                    <div className={`ml-12 md:ml-0 md:w-1/2 ${isLeft ? 'md:pr-8' : 'md:pl-8'}`}>
                                        <div 
                                            onClick={() => setSelectedItem(item)}
                                            className={`bg-white rounded-xl p-4 border shadow-sm transition-all hover:scale-[1.02] hover:shadow-md duration-200 group cursor-pointer dark:bg-gray-900 dark:border-gray-800 ${
                                                item.isHighlight ? 'border-l-4 border-l-blue-500' : 'border-gray-100 dark:border-gray-800'
                                            }`}
                                        >
                                            {/* Card Header */}
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`p-1.5 rounded-lg ${
                                                        item.type === 'SOURCE' 
                                                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' 
                                                            : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
                                                    }`}>
                                                        {item.type === 'SOURCE' 
                                                            ? (item.subType === 'USER_INPUT' ? <IconDumbbell className="w-3.5 h-3.5" /> : <IconFile className="w-3.5 h-3.5" />)
                                                            : <IconSparkles className="w-3.5 h-3.5" />
                                                        }
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                        {item.dateDisplay}
                                                    </span>
                                                </div>
                                                {item.type === 'SOURCE' && (
                                                    <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-medium dark:bg-gray-800 dark:text-gray-400">
                                                        {item.subType}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Title */}
                                            <h3 className="text-sm font-bold text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors dark:text-white dark:group-hover:text-blue-400">
                                                {item.title}
                                            </h3>

                                            {/* Preview Content */}
                                            <div className="text-xs text-gray-500 leading-relaxed line-clamp-3 prose prose-sm max-w-none dark:text-gray-400 dark:prose-invert">
                                                <ReactMarkdown>
                                                    {item.content.length > 200 
                                                        ? item.content.substring(0, 200) + "..." 
                                                        : item.content}
                                                </ReactMarkdown>
                                            </div>

                                            {/* Call to Action (Visual Hint) */}
                                            <div className="mt-3 pt-2 border-t border-gray-50 flex items-center justify-end dark:border-gray-800">
                                                <span className="text-[10px] font-bold text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 dark:text-blue-400">
                                                    Ver Detalhes <IconArrowLeft className="w-3 h-3 rotate-180" />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })}

                    {filteredData.length === 0 && (
                        <div className="text-center py-20 opacity-50 ml-8 md:ml-0">
                            <IconClock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm font-medium text-gray-400">Nenhum evento registrado nesta categoria.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TimelineView;
