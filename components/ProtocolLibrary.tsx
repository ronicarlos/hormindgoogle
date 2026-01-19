
import React, { useState, useEffect, useRef } from 'react';
import { Compound } from '../types';
import { fetchCompounds } from '../services/protocolService';
import { IconSearch, IconPill, IconScience, IconClose, IconAlert, IconActivity, IconArrowUp } from './Icons';
import HormoneGuideModal from './HormoneGuideModal';

const ProtocolLibrary: React.FC = () => {
    const [compounds, setCompounds] = useState<Compound[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [selectedCompound, setSelectedCompound] = useState<Compound | null>(null);
    const [showHormoneGuide, setShowHormoneGuide] = useState(false);
    
    // Referência para o container de scroll
    const scrollRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchCompounds().then(setCompounds);
    }, []);

    const categories = ['Todos', 'Protocolo Exemplo', 'Suplemento', 'Testosterona', '19-Nor', 'DHT', 'Oral', 'Peptídeo', 'Mitocondrial', 'Nootrópico', 'Termogênico', 'SERM/IA'];

    const filteredCompounds = compounds.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              c.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'Todos' || c.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const getRiskColor = (risk: string) => {
        switch(risk) {
            case 'Baixo': return 'text-emerald-700 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30';
            case 'Médio': return 'text-yellow-700 bg-yellow-50 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30';
            case 'Alto': return 'text-orange-700 bg-orange-50 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/30';
            case 'Extremo': return 'text-red-700 bg-red-50 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30';
            default: return 'text-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    const getCategoryColorClass = (cat: string) => {
        switch(cat) {
            case 'Protocolo Exemplo': return 'bg-gray-900 dark:bg-gray-700';
            case 'Suplemento': return 'bg-cyan-600';
            case 'Testosterona': return 'bg-blue-600';
            case '19-Nor': return 'bg-red-600';
            case 'DHT': return 'bg-purple-600';
            case 'Peptídeo': return 'bg-emerald-600';
            case 'Mitocondrial': return 'bg-teal-600';
            case 'Nootrópico': return 'bg-indigo-600';
            case 'Oral': return 'bg-orange-600';
            default: return 'bg-gray-400';
        }
    };
    
    const getCategoryBadgeStyle = (cat: string) => {
        switch(cat) {
             case 'Protocolo Exemplo': return 'text-white bg-gray-900 dark:bg-gray-700';
            case 'Suplemento': return 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/30 dark:text-cyan-400';
            case 'Testosterona': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400';
            case '19-Nor': return 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400';
            case 'DHT': return 'text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400';
            case 'Peptídeo': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'Mitocondrial': return 'text-teal-600 bg-teal-50 dark:bg-teal-900/30 dark:text-teal-400';
            case 'Nootrópico': return 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400';
            case 'Oral': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400';
            default: return 'text-gray-600 bg-gray-50';
        }
    }

    return (
        // LAYOUT "CAIXA DE VIDRO"
        // absolute inset-0 força o componente a preencher exatamente o espaço do pai (App.tsx)
        // flex flex-col garante a estrutura vertical rígida
        <div className="absolute inset-0 flex flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden">
             
            <HormoneGuideModal isOpen={showHormoneGuide} onClose={() => setShowHormoneGuide(false)} />

            {/* HEADER RÍGIDO (flex-none) */}
            {/* Nunca vai rolar, nunca vai sumir, pois não é sticky, é um bloco fixo no topo da flexbox */}
            <div className="flex-none bg-white z-30 border-b border-gray-200 dark:bg-gray-900 dark:border-gray-800 shadow-sm">
                <div className="max-w-7xl mx-auto w-full">
                    {/* Top Bar */}
                    <div className="px-4 py-3 flex flex-col md:flex-row gap-3 md:items-center justify-between">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg md:text-2xl font-black text-gray-900 tracking-tighter flex items-center gap-2 dark:text-white">
                                <IconScience className="w-5 h-5 text-purple-600" />
                                PHARMA
                            </h2>
                            <span className="md:hidden text-[9px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full dark:bg-gray-800 dark:text-gray-500">
                                {compounds.length}
                            </span>
                        </div>
                        
                        <div className="flex gap-2 w-full md:w-auto">
                            <button 
                                onClick={() => setShowHormoneGuide(true)}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap active:scale-95"
                            >
                                📘 Guia Mestre
                            </button>
                            <div className="relative flex-1 md:w-64">
                                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                <input 
                                    ref={searchInputRef}
                                    type="text" 
                                    placeholder="Buscar..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 bg-gray-100/50 border-0 md:border md:border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500/20 transition-all font-medium placeholder-gray-400 text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:ring-purple-900"
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Horizontal Carousel (Filters) */}
                    <div className="px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar touch-pan-x w-full">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-bold whitespace-nowrap transition-all border touch-manipulation active:scale-95 ${
                                    selectedCategory === cat 
                                    ? 'bg-purple-900 text-white border-purple-900 shadow-md dark:bg-purple-600 dark:border-purple-600' 
                                    : 'bg-white text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-700'
                                }`}
                            >
                                {cat.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* CORPO COM SCROLL (flex-1) */}
            {/* Ocupa todo o espaço restante. O scroll acontece AQUI DENTRO. */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 bg-gray-50/50 custom-scrollbar dark:bg-gray-950 relative"
            >
                <div className="p-2 md:p-8 pb-32"> {/* Padding bottom extra para mobile nav */}
                    <div className="max-w-7xl mx-auto grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4 w-full">
                        {filteredCompounds.map(c => (
                            <div 
                                key={c.id} 
                                onClick={() => setSelectedCompound(c)}
                                className={`bg-white rounded-xl border shadow-sm active:scale-95 transition-all cursor-pointer group flex flex-col overflow-hidden relative h-full min-h-[120px] touch-manipulation ${
                                    c.category === 'Protocolo Exemplo' ? 'border-gray-900 dark:border-gray-600' : 'border-gray-200 dark:border-gray-800'
                                } dark:bg-gray-900`}
                            >
                                <div className={`h-1.5 w-full ${getCategoryColorClass(c.category)}`} />

                                <div className="p-3 flex flex-col h-full justify-between">
                                    <div>
                                        <div className="mb-1.5">
                                            <span className="text-[9px] font-bold uppercase text-gray-400 tracking-wider truncate block dark:text-gray-500">
                                                {c.category === 'Protocolo Exemplo' ? 'Protocolo' : c.category}
                                            </span>
                                        </div>
                                        
                                        <h3 className="font-bold text-gray-900 text-xs md:text-sm leading-tight group-hover:text-purple-700 transition-colors line-clamp-3 dark:text-white dark:group-hover:text-purple-400">
                                            {c.name}
                                        </h3>
                                    </div>

                                    <div className="hidden md:block text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed dark:text-gray-400">
                                        {c.description}
                                    </div>

                                    <div className="mt-3 pt-2 border-t border-gray-50 flex items-center justify-between dark:border-gray-800">
                                        <span className={`text-[8px] md:text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase ${getRiskColor(c.riskLevel)}`}>
                                            {c.riskLevel}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* MODAL (Portal) */}
            {selectedCompound && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4 dark:bg-black/80">
                    <div className="bg-white w-full md:max-w-2xl md:rounded-3xl rounded-t-3xl h-[85vh] md:h-auto md:max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300 dark:bg-gray-900 dark:border dark:border-gray-800">
                        
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50 md:rounded-t-3xl dark:border-gray-800 dark:bg-gray-800/50 shrink-0">
                            <div>
                                <div className="flex gap-2 mb-2">
                                     <span className={`text-[10px] px-2 py-1 rounded font-black uppercase tracking-wider ${getCategoryBadgeStyle(selectedCompound.category)}`}>
                                        {selectedCompound.category}
                                    </span>
                                    <span className="text-[10px] px-2 py-1 rounded font-black uppercase tracking-wider bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                        {selectedCompound.type}
                                    </span>
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">{selectedCompound.name}</h2>
                            </div>
                            <button onClick={() => setSelectedCompound(null)} className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors border border-gray-200 active:scale-90 touch-manipulation dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
                                <IconClose className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            
                            <div className={`p-4 rounded-xl border flex gap-3 ${
                                selectedCompound.riskLevel === 'Extremo' ? 'bg-red-50 border-red-100 text-red-900 dark:bg-red-900/10 dark:border-red-900/30 dark:text-red-200' : 
                                selectedCompound.riskLevel === 'Alto' ? 'bg-orange-50 border-orange-100 text-orange-900 dark:bg-orange-900/10 dark:border-orange-900/30 dark:text-orange-200' :
                                'bg-blue-50 border-blue-100 text-blue-900 dark:bg-blue-900/10 dark:border-blue-900/30 dark:text-blue-200'
                            }`}>
                                <IconAlert className="w-5 h-5 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-sm uppercase mb-1">Perfil de Risco: {selectedCompound.riskLevel}</h4>
                                    <p className="text-xs leading-relaxed opacity-90">{selectedCompound.description}</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2 dark:text-white">
                                    <IconPill className="w-4 h-4 text-purple-600" />
                                    {selectedCompound.category === 'Protocolo Exemplo' ? 'Estrutura' : 'Dosagens'}
                                </h3>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 dark:bg-gray-800 dark:border-gray-700 flex justify-between items-center">
                                        <span className="text-xs font-bold text-gray-500 uppercase">Iniciante</span>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white text-right">{selectedCompound.commonDosages.beginner}</span>
                                    </div>
                                    <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 dark:bg-gray-800 dark:border-gray-700 flex justify-between items-center">
                                        <span className="text-xs font-bold text-gray-500 uppercase">Avançado</span>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white text-right">{selectedCompound.commonDosages.advanced}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <h3 className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-3 flex items-center gap-2 dark:text-emerald-400">
                                        <IconActivity className="w-4 h-4" /> Benefícios
                                    </h3>
                                    <ul className="space-y-2">
                                        {selectedCompound.benefits.map((b, i) => (
                                            <li key={i} className="text-sm font-medium text-gray-700 flex items-start gap-2 dark:text-gray-300">
                                                <span className="text-emerald-500 font-bold">•</span> {b}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-xs font-black text-red-700 uppercase tracking-widest mb-3 flex items-center gap-2 dark:text-red-400">
                                        <IconAlert className="w-4 h-4" /> Colaterais
                                    </h3>
                                    <ul className="space-y-2">
                                        {selectedCompound.sideEffects.map((s, i) => (
                                            <li key={i} className="text-sm font-medium text-gray-700 flex items-start gap-2 dark:text-gray-300">
                                                <span className="text-red-500 font-bold">•</span> {s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-gray-50 text-center md:rounded-b-3xl dark:bg-gray-800 dark:border-gray-700 shrink-0">
                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                                Uso estritamente educacional. Não prescrevemos medicamentos.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProtocolLibrary;
