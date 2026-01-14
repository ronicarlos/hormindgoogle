
import React, { useMemo, useState } from 'react';
import { Source, ChatMessage, SourceType } from '../types';
import { IconClock, IconFile, IconSparkles, IconUser, IconDumbbell } from './Icons';
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
}

const TimelineView: React.FC<TimelineViewProps> = ({ sources, messages }) => {
    const [filter, setFilter] = useState<'ALL' | 'EXAMS' | 'ANALYSIS'>('ALL');

    // --- DATA PROCESSING LOGIC ---
    const timelineData = useMemo(() => {
        const items: TimelineItem[] = [];

        // 1. Process Sources (Exams, Inputs, Documents)
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
                isHighlight: source.type === SourceType.PDF || source.type === SourceType.IMAGE || source.type === SourceType.PRONTUARIO
            });
        });

        // 2. Process Messages (Only relevant AI Analyses)
        messages.forEach(msg => {
            // Skip short messages or User messages (unless we want user inputs, but Sources usually cover that)
            // We want BIG insights from the Model.
            if (msg.role === 'model' && msg.text.length > 100) {
                const dateObj = new Date(msg.timestamp);
                items.push({
                    id: msg.id,
                    dateObj: dateObj,
                    dateDisplay: dateObj.toLocaleDateString('pt-BR'),
                    type: 'ANALYSIS',
                    title: 'Insight da IA',
                    content: msg.text,
                    isHighlight: msg.isBookmarked
                });
            }
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
        <div className="flex-1 bg-gray-50 h-full flex flex-col overflow-hidden dark:bg-gray-950">
            {/* Header */}
            <div className="shrink-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center z-10 sticky top-0 dark:bg-gray-900 dark:border-gray-800">
                <div>
                    <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 dark:text-white">
                        <IconClock className="w-6 h-6 text-blue-600" />
                        TIMELINE
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-wider dark:text-gray-400">
                        Jornada Evolutiva & Histórico
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
                                        <div className={`bg-white rounded-xl p-4 border shadow-sm transition-transform hover:scale-[1.01] duration-200 group dark:bg-gray-900 dark:border-gray-800 ${
                                            item.isHighlight ? 'border-l-4 border-l-blue-500' : 'border-gray-100 dark:border-gray-800'
                                        }`}>
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
                                            <h3 className="text-sm font-bold text-gray-900 mb-2 leading-tight dark:text-white">
                                                {item.title}
                                            </h3>

                                            {/* Preview Content */}
                                            <div className="text-xs text-gray-500 leading-relaxed line-clamp-4 prose prose-sm max-w-none dark:text-gray-400 dark:prose-invert">
                                                <ReactMarkdown>
                                                    {item.content.length > 300 
                                                        ? item.content.substring(0, 300) + "..." 
                                                        : item.content}
                                                </ReactMarkdown>
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
