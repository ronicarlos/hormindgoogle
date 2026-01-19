
import React, { useState, useEffect, useRef } from 'react';
import { Exercise, Project } from '../types';
import { fetchExercises } from '../services/exerciseService';
import { 
    IconSearch, 
    IconAlert, 
    IconPlus, 
    IconDumbbell, 
    IconClose, 
    IconSparkles,
    IconList,
    IconArrowUp
} from './Icons';

interface ExerciseLibraryProps {
    project: Project;
    onAddExercise: (exercise: Exercise) => void; // Callback adicionado
}

const ExerciseLibrary: React.FC<ExerciseLibraryProps> = ({ project, onAddExercise }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMuscle, setSelectedMuscle] = useState('Todos');
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
    const [allExercises, setAllExercises] = useState<Exercise[]>([]);
    const [displayedExercises, setDisplayedExercises] = useState<Exercise[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [showScrollTop, setShowScrollTop] = useState(false); // Estado para botão de topo
    const ITEMS_PER_PAGE = 30; // Increased for higher density

    const listRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Initial Fetch
    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            const data = await fetchExercises();
            setAllExercises(data);
            setDisplayedExercises(data.slice(0, ITEMS_PER_PAGE));
            setIsLoading(false);
        };
        load();
    }, []);

    // Escuta evento global de busca e reset
    useEffect(() => {
        const handleToggleSearch = () => {
            if (listRef.current) listRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => searchInputRef.current?.focus(), 300);
        };
        const handleResetLayout = () => {
            if (listRef.current) listRef.current.scrollTo({ top: 0, behavior: 'auto' });
        };

        window.addEventListener('toggle-app-search', handleToggleSearch);
        window.addEventListener('reset-view-layout', handleResetLayout);
        return () => {
            window.removeEventListener('toggle-app-search', handleToggleSearch);
            window.removeEventListener('reset-view-layout', handleResetLayout);
        };
    }, []);

    // Robust Category Matching Logic
    const checkCategoryMatch = (ex: Exercise, category: string) => {
        if (category === 'Todos') return true;
        
        const target = ex.targetMuscle;
        
        switch (category) {
            case 'Pernas':
                return ex.type === 'Legs' || 
                       ['Quadríceps', 'Posterior de Coxa', 'Glúteos', 'Panturrilha', 'Abdutores', 'Adutores'].some(m => target.includes(m));
            case 'Dorsal':
                return target.includes('Dorsal') || target.includes('Costas') || target.includes('Latíssimo');
            case 'Ombros':
                return target.includes('Ombros') || target.includes('Trapézio') || target.includes('Pescoço');
            case 'Bíceps':
                return target.includes('Bíceps') || target.includes('Antebraço');
            case 'Tríceps':
                return target.includes('Tríceps');
            case 'Peitoral':
                return target.includes('Peitoral');
            case 'Abdômen':
                return target.includes('Abdômen') || ex.type === 'Core';
            default:
                return target.toLowerCase().includes(category.toLowerCase());
        }
    };

    // Filter Logic
    useEffect(() => {
        const filtered = allExercises.filter(ex => {
            const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  ex.targetMuscle.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesMuscle = checkCategoryMatch(ex, selectedMuscle);
            
            return matchesSearch && matchesMuscle;
        });
        
        // Reset pagination on filter change
        setPage(1);
        setDisplayedExercises(filtered.slice(0, ITEMS_PER_PAGE));
        
        // Scroll to top
        if (listRef.current) listRef.current.scrollTop = 0;

    }, [searchTerm, selectedMuscle, allExercises]);

    // Infinite Scroll / Load More Logic
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        
        // Botão voltar ao topo (Show if scrolled more than 200px)
        setShowScrollTop(scrollTop > 200);

        // If we are near bottom (within 200px)
        if (scrollHeight - scrollTop - clientHeight < 200) {
            loadMore();
        }
    };

    const scrollToTop = () => {
        listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const loadMore = () => {
        const filteredTotal = allExercises.filter(ex => {
            const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  ex.targetMuscle.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesMuscle = checkCategoryMatch(ex, selectedMuscle);
            return matchesSearch && matchesMuscle;
        });

        if (displayedExercises.length < filteredTotal.length) {
            const nextPage = page + 1;
            const nextItems = filteredTotal.slice(0, nextPage * ITEMS_PER_PAGE);
            setDisplayedExercises(nextItems);
            setPage(nextPage);
        }
    };

    // Animation Logic for Modal
    const [frameIndex, setFrameIndex] = useState(0);
    useEffect(() => {
        if (!selectedExercise) return;
        const interval = setInterval(() => {
            setFrameIndex(prev => (prev === 0 ? 1 : 0));
        }, 800); 
        return () => clearInterval(interval);
    }, [selectedExercise]);

    const muscles = ['Todos', 'Peitoral', 'Dorsal', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps', 'Abdômen'];

    const getRecommendation = (difficulty: string) => {
        const isCutting = project.objective === 'Cutting';
        return isCutting 
            ? { sets: '4', reps: '12-15', rest: '45s', focus: 'Metabólico' }
            : { sets: '3', reps: '6-10', rest: '90s', focus: 'Tensional' };
    };

    // Handler para adicionar e fechar
    const handleAddClick = () => {
        if (selectedExercise) {
            onAddExercise(selectedExercise);
            setSelectedExercise(null);
        }
    };

    return (
        <div className="flex-1 bg-white h-full flex flex-col overflow-hidden relative w-full dark:bg-gray-950">
            
            {/* FIXED HEADER - REMOVIDO DE DENTRO DO SCROLLVIEW */}
            <div className="shrink-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm w-full dark:bg-gray-900/95 dark:border-gray-800">
                <div className="max-w-7xl mx-auto w-full">
                    {/* Top Bar: Title & Search */}
                    <div className="px-3 pt-3 pb-2 md:p-6 md:pb-4 flex flex-col md:flex-row gap-2 md:items-center justify-between">
                        <div className="flex items-center justify-between">
                                <h2 className="text-lg md:text-2xl font-black text-gray-900 tracking-tighter flex items-center gap-2 dark:text-white">
                                <IconDumbbell className="w-5 h-5" />
                                ATLAS
                            </h2>
                            {/* Mobile Counter */}
                            <span className="md:hidden text-[9px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full dark:bg-gray-800 dark:text-gray-500">
                                {allExercises.length}
                            </span>
                        </div>
                        
                        <div className="relative w-full md:max-w-xs">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input 
                                ref={searchInputRef}
                                type="text" 
                                placeholder="Buscar..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 bg-gray-100/50 border-0 md:border md:border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-black/5 transition-all font-medium placeholder-gray-400 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:ring-blue-900"
                            />
                        </div>
                    </div>
                    
                    {/* Horizontal Scroll Filters - TOUCH ACTION FIX */}
                    <div className="px-3 pb-2 md:px-6 md:pb-4 flex gap-1.5 overflow-x-auto no-scrollbar scroll-smooth touch-pan-x w-full">
                        {muscles.map(m => (
                            <button
                                key={m}
                                onClick={() => setSelectedMuscle(m)}
                                className={`flex-shrink-0 px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold whitespace-nowrap transition-all border touch-manipulation active:scale-95 ${
                                    selectedMuscle === m 
                                    ? 'bg-black text-white border-black shadow-md dark:bg-blue-600 dark:border-blue-600' 
                                    : 'bg-white text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-700'
                                }`}
                            >
                                {m.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* SCROLLABLE GRID CONTENT */}
            <div 
                className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 custom-scrollbar pb-32 md:pb-40 w-full dark:bg-gray-950 relative"
                onScroll={handleScroll}
                ref={listRef}
            >
                <div className="p-1.5 md:p-8">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black dark:border-white"></div>
                        </div>
                    ) : (
                        /* 
                           GRID ALTERADO:
                           Mobile: grid-cols-3 + gap-1.5 (Extremely dense)
                           Desktop: grid-cols-5 + gap-4
                        */
                        <div className="max-w-7xl mx-auto grid grid-cols-3 md:grid-cols-5 gap-1.5 md:gap-4 lg:gap-6 w-full">
                            {displayedExercises.map(ex => (
                                <div 
                                    key={ex.id} 
                                    onClick={() => setSelectedExercise(ex)}
                                    className="bg-white rounded-lg md:rounded-2xl border border-gray-100 overflow-hidden shadow-sm active:scale-95 touch-manipulation transition-transform cursor-pointer group flex flex-col h-full w-full dark:bg-gray-900 dark:border-gray-800"
                                >
                                    {/* IMAGE AREA - Square for consistency */}
                                    {/* Note: We keep bg-white even in dark mode for image visibility, as images usually have white background */}
                                    <div className="aspect-square bg-white relative overflow-hidden flex items-center justify-center border-b border-gray-50 dark:border-gray-800">
                                        <img 
                                            src={ex.images[0]} 
                                            alt={ex.name} 
                                            loading="lazy"
                                            className="w-[90%] h-[90%] object-contain mix-blend-multiply opacity-95 pointer-events-none"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Sem+Imagem';
                                            }}
                                        />
                                        
                                        {/* Minimalist Overlay Badge */}
                                        <div className="absolute bottom-1 right-1">
                                            <span className="text-[7px] font-black bg-black/5 text-gray-500 px-1 py-0.5 rounded uppercase backdrop-blur-sm dark:bg-black/20 dark:text-gray-600">
                                                {ex.targetMuscle}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* TEXT AREA - Ultra Compact */}
                                    <div className="p-1.5 md:p-3 flex-1 flex flex-col justify-between">
                                        <h3 className="font-bold text-gray-800 text-[10px] md:text-sm leading-tight line-clamp-2 min-h-[2.5em] dark:text-gray-200">
                                            {ex.name}
                                        </h3>
                                        
                                        {/* Difficulty Dot */}
                                        <div className="flex items-center gap-1 mt-1">
                                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                                 ex.difficulty === 'Iniciante' ? 'bg-green-500' : 
                                                 ex.difficulty === 'Intermediário' ? 'bg-blue-500' : 
                                                 'bg-purple-500'
                                            }`} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {!isLoading && displayedExercises.length === 0 && (
                        <div className="text-center py-20 text-gray-400">
                            <IconDumbbell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p className="text-sm font-medium">Nenhum exercício encontrado</p>
                        </div>
                    )}
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

            {/* FULL SCREEN MODAL / BOTTOM SHEET */}
            {selectedExercise && (
                <div className="fixed inset-0 z-[100] flex flex-col bg-white animate-in slide-in-from-bottom duration-300 md:bg-black/80 md:backdrop-blur-sm md:items-center md:justify-center md:p-6 dark:bg-black/90">
                    <div className="relative flex-1 flex flex-col bg-white md:max-w-6xl md:h-full md:max-h-[90vh] md:rounded-[2.5rem] md:flex-row overflow-hidden shadow-2xl w-full dark:bg-gray-900">
                        
                        {/* Close Button */}
                        <button 
                            onClick={() => setSelectedExercise(null)} 
                            className="absolute top-4 right-4 z-[110] bg-white text-gray-900 border border-gray-100 p-2.5 rounded-full hover:bg-gray-100 transition-all shadow-lg active:scale-90 md:top-6 md:right-6 touch-manipulation flex items-center justify-center dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700"
                        >
                            <IconClose className="w-5 h-5" />
                        </button>

                        {/* ANIMATED VISUALS SECTION */}
                        <div className="w-full md:w-[45%] h-[40vh] md:h-full shrink-0 relative bg-gray-100 flex items-center justify-center overflow-hidden dark:bg-white/5">
                            {/* The "GIF" Player - Keep white bg for image visibility */}
                            <div className="absolute inset-0 bg-white flex items-center justify-center">
                                <img 
                                    src={selectedExercise.images[frameIndex % selectedExercise.images.length]} 
                                    alt={selectedExercise.name} 
                                    className="w-full h-full object-contain mix-blend-multiply opacity-90 transition-opacity duration-100 p-8" 
                                />
                            </div>
                            
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/5 pointer-events-none" />
                            
                            <div className="absolute top-6 left-6 flex flex-col gap-2">
                                <span className="inline-flex items-center gap-1.5 bg-black/80 backdrop-blur-md border border-white/10 text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-sm">
                                    <div className={`w-2 h-2 rounded-full ${frameIndex === 0 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                                    {frameIndex === 0 ? 'Preparação' : 'Execução'}
                                </span>
                            </div>

                            <div className="absolute bottom-8 left-8 right-8 text-white">
                                <span className="text-white/70 font-mono text-xs uppercase tracking-widest mb-1 block">
                                    {selectedExercise.mechanics} • {selectedExercise.type}
                                </span>
                                <h2 className="text-2xl md:text-4xl font-black leading-[1.1] tracking-tighter uppercase italic drop-shadow-lg line-clamp-3">
                                    {selectedExercise.name}
                                </h2>
                                
                                {/* Muscle Groups */}
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded uppercase">
                                        Alvo: {selectedExercise.targetMuscle}
                                    </span>
                                    {selectedExercise.secondaryMuscles.slice(0, 3).map(m => (
                                        <span key={m} className="px-2 py-0.5 bg-white/20 text-white text-[10px] font-medium rounded uppercase backdrop-blur-sm">
                                            + {m}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* DETAILS SECTION */}
                        <div className="flex-1 overflow-y-auto bg-white custom-scrollbar pb-32 md:pb-12 dark:bg-gray-900">
                            <div className="p-6 md:p-12 space-y-10">
                                
                                {/* Stats Grid */}
                                <div className="grid grid-cols-3 gap-4 border-b border-gray-50 pb-8 dark:border-gray-800">
                                    {[
                                        { l: 'Séries', v: getRecommendation(selectedExercise.difficulty).sets },
                                        { l: 'Reps', v: getRecommendation(selectedExercise.difficulty).reps },
                                        { l: 'Descanso', v: getRecommendation(selectedExercise.difficulty).rest }
                                    ].map((s, i) => (
                                        <div key={i} className="text-center p-3 bg-gray-50 rounded-2xl border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                                            <div className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">{s.v}</div>
                                            <div className="text-[8px] md:text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">{s.l}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Technique Guide */}
                                <div>
                                    <h3 className="flex items-center gap-2 text-xs font-black text-gray-900 uppercase tracking-[0.2em] mb-6 dark:text-gray-300">
                                        <IconList className="w-4 h-4 text-indigo-600" />
                                        Protocolo de Execução
                                    </h3>
                                    <div className="space-y-4 relative before:absolute before:left-[15px] before:top-4 before:bottom-4 before:w-[2px] before:bg-gray-100 dark:before:bg-gray-800">
                                        {selectedExercise.steps.map((step, i) => (
                                            <div key={i} className="flex gap-4 relative z-10">
                                                <span className="shrink-0 w-8 h-8 rounded-lg bg-white text-gray-900 text-xs font-black flex items-center justify-center border border-gray-200 shadow-sm transition-transform hover:scale-110 dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                                                    {i + 1}
                                                </span>
                                                <p className="pt-1 text-sm text-gray-600 leading-relaxed font-medium dark:text-gray-300">{step}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Safety Warnings */}
                                {selectedExercise.commonMistakes.length > 0 && (
                                    <div className="bg-red-50/50 p-6 rounded-[1.5rem] border border-red-100 dark:bg-red-900/10 dark:border-red-900/30">
                                        <h3 className="flex items-center gap-2 text-[10px] font-black text-red-600 uppercase tracking-widest mb-4 dark:text-red-400">
                                            <IconAlert className="w-4 h-4" />
                                            Erros Comuns & Correções
                                        </h3>
                                        <ul className="space-y-3">
                                            {selectedExercise.commonMistakes.map((mistake, i) => (
                                                <li key={i} className="flex items-start gap-3 text-xs font-medium text-red-900/80 bg-white/50 p-2 rounded-lg border border-red-100/50 dark:bg-gray-800/50 dark:border-red-900/30 dark:text-red-200">
                                                    <span className="text-red-400 font-bold">•</span>
                                                    {mistake}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Coach Tip */}
                                <div className="flex gap-4 p-6 bg-gray-900 rounded-[1.5rem] text-white shadow-xl items-start dark:bg-black dark:border dark:border-gray-800">
                                    <IconSparkles className="w-5 h-5 text-amber-400 mt-1 shrink-0" />
                                    <div>
                                        <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] mb-1">Coach Intelligence</h4>
                                        <p className="text-xs font-medium leading-relaxed text-gray-300">
                                            Foco total no {selectedExercise.targetMuscle}. Mantenha a cadência controlada e evite usar inércia para completar o movimento. A técnica precede a carga.
                                        </p>
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Floating Action Mobile */}
                        <div className="md:hidden fixed bottom-6 left-6 right-6 z-[120]">
                            <button 
                                onClick={handleAddClick}
                                className="w-full py-4 bg-black text-white font-black text-sm rounded-2xl shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all border border-gray-800 touch-manipulation dark:bg-blue-600 dark:border-blue-500"
                            >
                                <IconPlus className="w-4 h-4" />
                                ADICIONAR AO TREINO
                            </button>
                        </div>
                        
                         <div className="hidden md:block absolute bottom-10 right-10 z-[120]">
                            <button 
                                onClick={handleAddClick}
                                className="px-8 py-4 bg-black text-white font-black text-sm rounded-2xl shadow-2xl flex items-center justify-center gap-3 hover:scale-105 transition-all dark:bg-blue-600"
                            >
                                <IconPlus className="w-4 h-4" />
                                ADICIONAR AO TREINO
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default ExerciseLibrary;
