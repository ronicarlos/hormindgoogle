
import React, { useState, useEffect, useRef } from 'react';
import { Compound } from '../types';
import { fetchCompounds } from '../services/protocolService';
import { IconSearch, IconPill, IconScience, IconClose, IconAlert, IconActivity, IconArrowUp } from './Icons';
import HormoneGuideModal from './HormoneGuideModal'; // Import do novo componente

const ProtocolLibrary: React.FC = () => {
    const [compounds, setCompounds] = useState<Compound[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [selectedCompound, setSelectedCompound] = useState<Compound | null>(null);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [showHormoneGuide, setShowHormoneGuide] = useState(false); // Estado do modal
    
    const listRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchCompounds().then(setCompounds);
    }, []);

    // Escuta evento global de busca
    useEffect(() => {
        const handleToggleSearch = () => {
            if (listRef.current) listRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => searchInputRef.current?.focus(), 300);
        };
        window.addEventListener('toggle-app-search', handleToggleSearch);
        return () => window.removeEventListener('toggle-app-search', handleToggleSearch);
    }, []);

    const categories = ['Todos', 'Protocolo Exemplo', 'Suplemento', 'Testosterona', '19-Nor', 'DHT', 'Oral', 'Peptídeo', 'Mitocondrial', 'Nootrópico', 'Termogênico', 'SERM/IA'];

    const filteredCompounds = compounds.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              c.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'Todos' || c.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setShowScrollTop(e.currentTarget.scrollTop > 200);
    };

    const scrollToTop = () => {
        listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

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
        <div className="flex-1 bg-white h-full flex flex-col overflow-hidden relative w-full dark:bg-gray-950">
             
            <HormoneGuideModal isOpen={showHormoneGuide} onClose={() => setShowHormoneGuide(false)} />

            {/* GRID CONTENT CONTAINER (SCROLLABLE) */}
            <div 
                className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50/50 custom-scrollbar pb-32 md:pb-40 w-full dark:bg-gray-950 relative"
                onScroll={handleScroll}
                ref={listRef}
            >
                {/* HEADER - STICKY INSIDE SCROLL CONTAINER */}
                <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm w-full dark:bg-gray-900/95 dark:border-gray-800">
                    <div className="max-w-7xl mx-auto w-full">
                        <div className="px-3 pt-3 pb-2 md:p-6 md:pb-4 flex flex-col md:flex-row gap-2 md:items-center justify-between">
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
                        
                        {/* Horizontal Filters - Touch Optimized */}
                        <div className="px-3 pb-2 md:px-6 md:pb-4 flex gap-1.5 overflow-x-auto no-scrollbar scroll-smooth touch-pan-x w-full">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`flex-shrink-0 px-2.5 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold whitespace-nowrap transition-all border touch-manipulation active:scale-95 ${
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

                {/* PRODUCT CARDS */}
                <div className="p-1.5 md:p-8">
                    {/* GRID: 3 columns on mobile, gap 1.5. No horizontal overflow. */}
                    <div className="max-w-7xl mx-auto grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1.5 md:gap-4 w-full">
                        {filteredCompounds.map(c => (
                            <div 
                                key={c.id} 
                                onClick={() => setSelectedCompound(c)}
                                className={`bg-white rounded-lg md:rounded-2xl p-0 border shadow-sm active:scale-95 transition-all cursor-pointer group flex flex-col overflow-hidden relative h-full min-h-[100px] md:min-h-[160px] touch-manipulation ${
                                    c.category === 'Protocolo Exemplo' ? 'border-gray-900 dark:border-gray-600' : 'border-gray-200 dark:border-gray-800'
                                } dark:bg-gray-900`}
                            >
                                {/* Color Bar Top (Mobile) or Side (Desktop) - Let's use Top for verticality on tiny cards */}
                                <div className={`h-1 w-full ${getCategoryColorClass(c.category)}`} />

                                <div className="p-2 flex flex-col h-full justify-between">
                                    <div>
                                        {/* Category */}
                                        <div className="mb-1">
                                            <span className="text-[7px] md:text-[9px] font-bold uppercase text-gray-400 tracking-wider truncate block dark:text-gray-500">
                                                {c.category === 'Protocolo Exemplo' ? 'Protocolo' : c.category}
                                            </span>
                                        </div>
                                        
                                        {/* Name */}
                                        <h3 className="font-bold text-gray-900 text-[10px] md:text-sm leading-tight group-hover:text-purple-700 transition-colors line-clamp-3 dark:text-white dark:group-hover:text-purple-400">
                                            {c.name}
                                        </h3>
                                    </div>

                                    {/* Description HIDDEN on Mobile */}
                                    <div className="hidden md:block text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed dark:text-gray-400">
                                        {c.description}
                                    </div>

                                    {/* Risk Badge Bottom */}
                                    <div className="mt-2 pt-1 border-t border-gray-50 flex items-center justify-between dark:border-gray-800">
                                        <span className={`text-[7px] md:text-[9px] px-1 py-0.5 rounded border font-bold uppercase ${getRiskColor(c.riskLevel)}`}>
                                            {c.riskLevel}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* SCROLL TO TOP BUTTON */}
            {showScrollTop && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-40 bg-black/80 backdrop-blur text-white p-3 rounded-full shadow-lg border border-gray-700 animate-in fade-in slide-in-from-bottom-4 active:scale-90 transition-all dark:bg-blue-600/80 dark:border-blue-500"
                    title="Voltar ao topo / Buscar"
                >
                    <IconArrowUp className="w-5 h-5" />
                </button>
            )}

            {/* MODAL */}
            {selectedCompound && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4 dark:bg-black/80">
                    <div className="bg-white w-full md:max-w-2xl md:rounded-3xl rounded-t-3xl h-[85vh] md:h-auto md:max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300 dark:bg-gray-900 dark:border dark:border-gray-800">
                        
                        {/* Modal Header */}
                        <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-start bg-gray-50/50 md:rounded-t-3xl dark:border-gray-800 dark:bg-gray-800/50">
                            <div>
                                <div className="flex gap-2 mb-2">
                                     <span className={`text-[10px] px-2 py-1 rounded font-black uppercase tracking-wider ${getCategoryBadgeStyle(selectedCompound.category)}`}>
                                        {selectedCompound.category}
                                    </span>
                                    <span className="text-[10px] px-2 py-1 rounded font-black uppercase tracking-wider bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                        {selectedCompound.type}
                                    </span>
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">{selectedCompound.name}</h2>
                            </div>
                            <button onClick={() => setSelectedCompound(null)} className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors border border-gray-200 active:scale-90 touch-manipulation dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
                                <IconClose className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
                            
                            {/* Warning Box */}
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

                            {/* Dosages */}
                            <div>
                                <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2 dark:text-white">
                                    <IconPill className="w-4 h-4 text-purple-600" />
                                    {selectedCompound.category === 'Protocolo Exemplo' ? 'Estrutura do Ciclo' : 'Dosagens Comuns'}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Iniciante / Básico</p>
                                        <p className="font-bold text-gray-800 dark:text-gray-200">{selectedCompound.commonDosages.beginner}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Avançado / Blast</p>
                                        <p className="font-bold text-gray-800 dark:text-gray-200">{selectedCompound.commonDosages.advanced}</p>
                                    </div>
                                    {selectedCompound.commonDosages.women && (
                                         <div className="p-4 rounded-xl bg-pink-50 border border-pink-100 md:col-span-2 dark:bg-pink-900/10 dark:border-pink-900/30">
                                            <p className="text-[10px] font-bold text-pink-400 uppercase mb-1">Mulheres</p>
                                            <p className="font-bold text-pink-800 dark:text-pink-300">{selectedCompound.commonDosages.women}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                {/* Benefits */}
                                <div>
                                    <h3 className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-4 flex items-center gap-2 dark:text-emerald-400">
                                        <IconActivity className="w-4 h-4" />
                                        Benefícios Esperados
                                    </h3>
                                    <ul className="space-y-2">
                                        {selectedCompound.benefits.map((b, i) => (
                                            <li key={i} className="text-sm font-medium text-gray-700 flex items-start gap-2 dark:text-gray-300">
                                                <span className="text-emerald-500 font-bold">•</span>
                                                {b}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Side Effects */}
                                <div>
                                    <h3 className="text-xs font-black text-red-700 uppercase tracking-widest mb-4 flex items-center gap-2 dark:text-red-400">
                                        <IconAlert className="w-4 h-4" />
                                        Colaterais Possíveis
                                    </h3>
                                    <ul className="space-y-2">
                                        {selectedCompound.sideEffects.map((s, i) => (
                                            <li key={i} className="text-sm font-medium text-gray-700 flex items-start gap-2 dark:text-gray-300">
                                                <span className="text-red-500 font-bold">•</span>
                                                {s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                        </div>

                        {/* Footer Disclaimer */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50 text-center md:rounded-b-3xl dark:bg-gray-800 dark:border-gray-700">
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
