
import React, { useState } from 'react';
import { HORMONE_GUIDE_DATA, LIFE_CYCLE_DATA, CORRECTION_LEVELS } from '../services/hormoneData';
import { IconClose, IconScience, IconUser, IconActivity, IconAlert, IconCheck, IconSun, IconMoon, IconFlame, IconPill, IconShield } from './Icons';

interface HormoneGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const HormoneGuideModal: React.FC<HormoneGuideModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'hormones' | 'lifecycle' | 'corrections'>('overview');
    const [selectedHormoneId, setSelectedHormoneId] = useState<string>(HORMONE_GUIDE_DATA[0].id);

    if (!isOpen) return null;

    const selectedHormone = HORMONE_GUIDE_DATA.find(h => h.id === selectedHormoneId) || HORMONE_GUIDE_DATA[0];

    // Agrupamento para o menu lateral
    const groupedHormones = {
        'Sexual & Reprodutivo': HORMONE_GUIDE_DATA.filter(h => h.category === 'Sexual'),
        'Tireoide & Metabolismo': HORMONE_GUIDE_DATA.filter(h => h.category === 'Tireoide' || h.category === 'Metabolismo'),
        'Estresse & Adrenais': HORMONE_GUIDE_DATA.filter(h => h.category === 'Estresse')
    };

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full max-w-5xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 dark:border-gray-800">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-6 text-white shrink-0 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <IconScience className="w-40 h-40 text-white" />
                    </div>
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                                    <IconScience className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl md:text-2xl font-black tracking-tight">Enciclopédia Hormonal</h2>
                            </div>
                            <p className="text-blue-200 text-xs md:text-sm max-w-lg font-medium">
                                Guia educativo completo sobre fisiologia, sintomas e equilíbrio hormonal.
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                            <IconClose className="w-6 h-6 text-white" />
                        </button>
                    </div>

                    {/* Tabs Scrollable */}
                    <div className="flex gap-6 mt-8 relative z-10 overflow-x-auto no-scrollbar pb-1">
                        {[
                            { id: 'overview', label: 'Visão Geral' },
                            { id: 'hormones', label: 'Biblioteca (A-Z)' },
                            { id: 'corrections', label: 'Protocolo de Correção' },
                            { id: 'lifecycle', label: 'Ciclos da Vida' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`pb-2 px-1 text-sm font-bold border-b-4 transition-all whitespace-nowrap ${
                                    activeTab === tab.id 
                                    ? 'border-white text-white' 
                                    : 'border-transparent text-blue-300 hover:text-white'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-950 flex flex-col md:flex-row">
                    
                    {/* ABA: VISÃO GERAL */}
                    {activeTab === 'overview' && (
                        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                            <div className="max-w-4xl mx-auto space-y-8">
                                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <IconActivity className="w-5 h-5 text-blue-600" />
                                        O Sistema Endócrino: Mapa Rápido
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4 text-sm">
                                        Seus hormônios não funcionam isolados. Eles formam uma orquestra. Se um desafina (ex: Cortisol alto), os outros tentam compensar e acabam desafinando também (ex: Tireoide baixa, Testo cai).
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                                        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                            <strong className="block text-blue-700 dark:text-blue-300 mb-1">Comando Central</strong>
                                            <span className="text-xs text-blue-600 dark:text-blue-200">Hipófise & Hipotálamo. O cérebro que dá as ordens (LH, FSH, TSH).</span>
                                        </div>
                                        <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/30">
                                            <strong className="block text-orange-700 dark:text-orange-300 mb-1">Metabolismo & Energia</strong>
                                            <span className="text-xs text-orange-600 dark:text-orange-200">Tireoide, Pâncreas (Insulina) e Adrenais (Cortisol).</span>
                                        </div>
                                        <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-900/30">
                                            <strong className="block text-purple-700 dark:text-purple-300 mb-1">Reprodução & Vitalidade</strong>
                                            <span className="text-xs text-purple-600 dark:text-purple-200">Gônadas (Testículo/Ovário). Testosterona, Estradiol, Progesterona.</span>
                                        </div>
                                    </div>
                                </div>

                                <h4 className="text-sm font-black text-gray-500 uppercase tracking-widest mt-8 mb-4">Índice Rápido</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {HORMONE_GUIDE_DATA.map(h => (
                                        <button 
                                            key={h.id} 
                                            onClick={() => { setSelectedHormoneId(h.id); setActiveTab('hormones'); }}
                                            className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-md hover:border-blue-300 transition-all text-left group"
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold text-gray-800 dark:text-white group-hover:text-blue-600 transition-colors">{h.name}</span>
                                                <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded uppercase font-bold">{h.category}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">{h.function}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ABA: HORMÔNIO POR HORMÔNIO (Master Detail) */}
                    {activeTab === 'hormones' && (
                        <>
                            {/* Sidebar Menu */}
                            <div className="w-full md:w-72 bg-white dark:bg-gray-900 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 flex md:flex-col overflow-x-auto md:overflow-y-auto shrink-0 custom-scrollbar">
                                {Object.entries(groupedHormones).map(([groupName, hormones]) => (
                                    <div key={groupName} className="min-w-[200px] md:min-w-0">
                                        <div className="sticky top-0 bg-gray-50 dark:bg-gray-800 px-4 py-2 text-[10px] font-black uppercase text-gray-500 tracking-wider border-y md:border-t-0 md:border-b border-gray-100 dark:border-gray-700">
                                            {groupName}
                                        </div>
                                        {hormones.map(h => (
                                            <button
                                                key={h.id}
                                                onClick={() => setSelectedHormoneId(h.id)}
                                                className={`w-full p-4 text-left text-sm transition-colors border-l-4 hover:bg-gray-50 dark:hover:bg-gray-800 flex flex-col ${
                                                    selectedHormoneId === h.id
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-600'
                                                    : 'bg-white dark:bg-gray-900 border-transparent text-gray-600 dark:text-gray-400'
                                                }`}
                                            >
                                                <span className={`font-bold ${selectedHormoneId === h.id ? 'text-blue-700 dark:text-blue-300' : ''}`}>{h.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                ))}
                            </div>

                            {/* Detail View */}
                            <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-gray-50 dark:bg-gray-950">
                                <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300" key={selectedHormone.id}>
                                    
                                    {/* Definition */}
                                    <div>
                                        <div className="flex items-center gap-3 mb-3">
                                            <h3 className="text-3xl font-black text-gray-900 dark:text-white">{selectedHormone.name}</h3>
                                            <span className="px-3 py-1 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-bold uppercase tracking-wider">
                                                {selectedHormone.category}
                                            </span>
                                        </div>
                                        <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                                            {selectedHormone.function}
                                        </p>
                                    </div>

                                    {/* Gender Diff */}
                                    <div className="bg-indigo-50 dark:bg-indigo-900/10 p-5 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                                        <h4 className="text-xs font-black text-indigo-800 dark:text-indigo-300 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <IconUser className="w-4 h-4" /> Homem vs Mulher
                                        </h4>
                                        <p className="text-sm text-indigo-900 dark:text-indigo-200 whitespace-pre-line leading-relaxed font-medium">
                                            {selectedHormone.genderDifferences}
                                        </p>
                                    </div>

                                    {/* High vs Low Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* LOW */}
                                        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black uppercase text-xs border-b border-gray-100 dark:border-gray-800 pb-3 mb-3">
                                                <IconActivity className="w-4 h-4 rotate-180" /> Se estiver Baixo (Deficiência)
                                            </div>
                                            <ul className="space-y-3">
                                                {selectedHormone.lowSymptoms.map((s, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                                        {s}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* HIGH */}
                                        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-black uppercase text-xs border-b border-gray-100 dark:border-gray-800 pb-3 mb-3">
                                                <IconActivity className="w-4 h-4" /> Se estiver Alto (Excesso)
                                            </div>
                                            <ul className="space-y-3">
                                                {selectedHormone.highSymptoms.map((s, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                                                        {s}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Fixes */}
                                    <div className="bg-green-50 dark:bg-green-900/10 p-6 rounded-2xl border border-green-100 dark:border-green-900/30">
                                        <h4 className="text-xs font-black text-green-800 dark:text-green-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <IconCheck className="w-4 h-4" /> Dicas de Otimização Natural
                                        </h4>
                                        <div className="space-y-3">
                                            {selectedHormone.lifestyleFixes.map((fix, i) => (
                                                <div key={i} className="flex gap-3">
                                                    <span className="text-green-600 font-bold">•</span>
                                                    <p className="text-sm text-green-900 dark:text-green-200 leading-relaxed">
                                                        {fix}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </>
                    )}

                    {/* ABA: PROTOCOLO DE CORREÇÃO (NOVO) */}
                    {activeTab === 'corrections' && (
                        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                            <div className="max-w-4xl mx-auto space-y-10">
                                <div className="text-center max-w-2xl mx-auto mb-8">
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Como "consertar" meus hormônios?</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                                        Não existe pílula mágica. A correção hormonal segue uma hierarquia de segurança.
                                        Nunca pule etapas: tentar a Nível 3 sem fazer a Nível 1 é receita para falha e efeitos colaterais.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    {CORRECTION_LEVELS.map((level, idx) => (
                                        <div key={idx} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                                            <div className={`p-4 border-b ${
                                                level.level === 1 ? 'bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-900/30' :
                                                level.level === 2 ? 'bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/30' :
                                                'bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-900/30'
                                            }`}>
                                                <h4 className={`text-lg font-black ${
                                                    level.level === 1 ? 'text-green-800 dark:text-green-300' :
                                                    level.level === 2 ? 'text-blue-800 dark:text-blue-300' :
                                                    'text-red-800 dark:text-red-300'
                                                }`}>
                                                    {level.title}
                                                </h4>
                                                <p className="text-sm opacity-80 mt-1 dark:text-gray-300">{level.description}</p>
                                            </div>
                                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {level.actions.map((action, i) => (
                                                    <div key={i} className="flex gap-4">
                                                        <div className="text-2xl shrink-0 bg-gray-50 dark:bg-gray-800 w-12 h-12 flex items-center justify-center rounded-xl">
                                                            {action.icon}
                                                        </div>
                                                        <div>
                                                            <strong className="block text-gray-900 dark:text-white text-sm mb-1">{action.title}</strong>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                                                {action.text}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ABA: CICLOS DA VIDA */}
                    {activeTab === 'lifecycle' && (
                        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                            <div className="max-w-3xl mx-auto">
                                <div className="mb-10 text-center">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">A Jornada Hormonal</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">O que esperar (e como se proteger) em cada década.</p>
                                </div>

                                <div className="space-y-12 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-[2px] before:bg-gray-200 dark:before:bg-gray-800">
                                    {LIFE_CYCLE_DATA.map((phase, idx) => (
                                        <div key={idx} className="relative pl-12">
                                            {/* Timeline Dot */}
                                            <div className="absolute left-0 top-0 w-10 h-10 bg-white dark:bg-gray-900 border-4 border-blue-100 dark:border-blue-900 rounded-full flex items-center justify-center z-10 shadow-sm">
                                                {idx === 0 ? <IconSun className="w-5 h-5 text-yellow-500" /> : idx === 1 ? <IconActivity className="w-5 h-5 text-blue-500" /> : <IconMoon className="w-5 h-5 text-purple-500" />}
                                            </div>

                                            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                                <h4 className="text-lg font-black text-gray-900 dark:text-white mb-2">{phase.phase}</h4>
                                                <p className="text-gray-600 dark:text-gray-300 text-sm italic mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                                                    "{phase.description}"
                                                </p>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                                        <span className="text-xs font-black text-blue-700 dark:text-blue-300 uppercase block mb-2 flex items-center gap-2">
                                                            <IconUser className="w-3 h-3" /> Homens
                                                        </span>
                                                        <p className="text-xs text-blue-900 dark:text-blue-100 leading-relaxed font-medium">{phase.men}</p>
                                                    </div>
                                                    <div className="bg-pink-50 dark:bg-pink-900/10 p-4 rounded-xl border border-pink-100 dark:border-pink-900/30">
                                                        <span className="text-xs font-black text-pink-700 dark:text-pink-300 uppercase block mb-2 flex items-center gap-2">
                                                            <IconUser className="w-3 h-3" /> Mulheres
                                                        </span>
                                                        <p className="text-xs text-pink-900 dark:text-pink-100 leading-relaxed font-medium">{phase.women}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer Disclaimer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 dark:bg-gray-900 dark:border-gray-800 text-center shrink-0">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                        <IconAlert className="w-3 h-3" />
                        Conteúdo Educativo • Não substitui avaliação médica • Baseado em diretrizes da Endocrine Society
                    </p>
                </div>
            </div>
        </div>
    );
};

export default HormoneGuideModal;
