
import React, { useState } from 'react';
import { HORMONE_GUIDE_DATA, LIFE_CYCLE_DATA } from '../services/hormoneData';
import { IconClose, IconScience, IconUser, IconActivity, IconAlert, IconCheck, IconSun, IconMoon } from './Icons';

interface HormoneGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const HormoneGuideModal: React.FC<HormoneGuideModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'hormones' | 'lifecycle'>('overview');
    const [selectedHormoneId, setSelectedHormoneId] = useState<string>(HORMONE_GUIDE_DATA[0].id);

    if (!isOpen) return null;

    const selectedHormone = HORMONE_GUIDE_DATA.find(h => h.id === selectedHormoneId) || HORMONE_GUIDE_DATA[0];

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full max-w-4xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 dark:border-gray-800">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-6 text-white shrink-0 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <IconScience className="w-32 h-32 text-white" />
                    </div>
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                                    <IconScience className="w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-black tracking-tight">Guia Mestre: Endocrinologia</h2>
                            </div>
                            <p className="text-blue-200 text-sm max-w-lg">
                                Uma enciclopédia educativa sobre como seus hormônios funcionam, interagem e afetam sua vida.
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                            <IconClose className="w-6 h-6 text-white" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-4 mt-8 relative z-10">
                        {[
                            { id: 'overview', label: 'Visão Geral' },
                            { id: 'hormones', label: 'Hormônio por Hormônio' },
                            { id: 'lifecycle', label: 'Ciclos da Vida' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`pb-2 px-1 text-sm font-bold border-b-2 transition-all ${
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
                            <div className="max-w-3xl mx-auto space-y-8">
                                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <IconActivity className="w-5 h-5 text-blue-600" />
                                        O Sistema Endócrino
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                                        Hormônios são mensageiros químicos. Eles viajam pelo sangue e dão ordens às células: "Cresça", "Queime energia", "Durma", "Reproduza".
                                        O equilíbrio (homeostase) é a chave. Nem "quanto mais, melhor", nem "quanto menos, melhor".
                                    </p>
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                        Neste guia, explicamos as funções de forma educativa para que você entenda seus exames e sensações.
                                        Lembre-se: <strong>Isto não é um diagnóstico médico.</strong>
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {HORMONE_GUIDE_DATA.map(h => (
                                        <div key={h.id} className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
                                            <h4 className="font-black text-gray-800 dark:text-white mb-2">{h.name}</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{h.function}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ABA: HORMÔNIO POR HORMÔNIO (Master Detail) */}
                    {activeTab === 'hormones' && (
                        <>
                            {/* Sidebar Menu (Desktop) / Top Menu (Mobile) */}
                            <div className="w-full md:w-64 bg-white dark:bg-gray-900 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 flex md:flex-col overflow-x-auto md:overflow-y-auto shrink-0">
                                {HORMONE_GUIDE_DATA.map(h => (
                                    <button
                                        key={h.id}
                                        onClick={() => setSelectedHormoneId(h.id)}
                                        className={`p-4 text-left font-bold text-sm whitespace-nowrap transition-colors border-l-4 ${
                                            selectedHormoneId === h.id
                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-600'
                                            : 'text-gray-600 dark:text-gray-400 border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                                        }`}
                                    >
                                        {h.name}
                                    </button>
                                ))}
                            </div>

                            {/* Detail View */}
                            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                                <div className="max-w-3xl mx-auto space-y-8">
                                    
                                    {/* Definition */}
                                    <div>
                                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{selectedHormone.name}</h3>
                                        <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                                            {selectedHormone.function}
                                        </p>
                                    </div>

                                    {/* Gender Diff */}
                                    <div className="bg-indigo-50 dark:bg-indigo-900/10 p-5 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                                        <h4 className="text-sm font-black text-indigo-800 dark:text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                                            <IconUser className="w-4 h-4" /> Diferenças Biológicas
                                        </h4>
                                        <p className="text-sm text-indigo-900 dark:text-indigo-200 whitespace-pre-line leading-relaxed">
                                            {selectedHormone.genderDifferences}
                                        </p>
                                    </div>

                                    {/* High vs Low Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* LOW */}
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black uppercase text-sm border-b border-blue-200 pb-2">
                                                <IconActivity className="w-4 h-4 rotate-180" /> Níveis Baixos (Deficiência)
                                            </div>
                                            <ul className="space-y-2">
                                                {selectedHormone.lowSymptoms.map((s, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-2 rounded shadow-sm border border-gray-100 dark:border-gray-700">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                                        {s}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* HIGH */}
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-black uppercase text-sm border-b border-orange-200 pb-2">
                                                <IconActivity className="w-4 h-4" /> Níveis Altos (Excesso)
                                            </div>
                                            <ul className="space-y-2">
                                                {selectedHormone.highSymptoms.map((s, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-2 rounded shadow-sm border border-gray-100 dark:border-gray-700">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                                                        {s}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Fixes */}
                                    <div className="bg-green-50 dark:bg-green-900/10 p-6 rounded-2xl border border-green-100 dark:border-green-900/30">
                                        <h4 className="text-sm font-black text-green-800 dark:text-green-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <IconCheck className="w-4 h-4" /> Manejo & Otimização Natural
                                        </h4>
                                        <div className="space-y-3">
                                            {selectedHormone.lifestyleFixes.map((fix, i) => (
                                                <p key={i} className="text-sm text-green-900 dark:text-green-200 leading-relaxed pl-3 border-l-2 border-green-300 dark:border-green-700">
                                                    {fix}
                                                </p>
                                            ))}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </>
                    )}

                    {/* ABA: CICLOS DA VIDA */}
                    {activeTab === 'lifecycle' && (
                        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                            <div className="max-w-3xl mx-auto">
                                <div className="mb-8 text-center">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">A Jornada Hormonal</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">Como nosso sistema endócrino evolui com o tempo.</p>
                                </div>

                                <div className="space-y-8 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-[2px] before:bg-gray-200 dark:before:bg-gray-800">
                                    {LIFE_CYCLE_DATA.map((phase, idx) => (
                                        <div key={idx} className="relative pl-12">
                                            {/* Timeline Dot */}
                                            <div className="absolute left-0 top-0 w-10 h-10 bg-white dark:bg-gray-900 border-4 border-blue-100 dark:border-blue-900 rounded-full flex items-center justify-center z-10 shadow-sm">
                                                {idx === 0 ? <IconSun className="w-5 h-5 text-yellow-500" /> : idx === 1 ? <IconActivity className="w-5 h-5 text-blue-500" /> : <IconMoon className="w-5 h-5 text-purple-500" />}
                                            </div>

                                            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                                <h4 className="text-lg font-black text-gray-900 dark:text-white mb-2">{phase.phase}</h4>
                                                <p className="text-gray-600 dark:text-gray-300 text-sm italic mb-4 border-b border-gray-100 dark:border-gray-800 pb-3">
                                                    "{phase.description}"
                                                </p>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg">
                                                        <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase block mb-1">Homens</span>
                                                        <p className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">{phase.men}</p>
                                                    </div>
                                                    <div className="bg-pink-50 dark:bg-pink-900/10 p-3 rounded-lg">
                                                        <span className="text-xs font-bold text-pink-700 dark:text-pink-300 uppercase block mb-1">Mulheres</span>
                                                        <p className="text-xs text-pink-900 dark:text-pink-200 leading-relaxed">{phase.women}</p>
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
                        Conteúdo Educativo • Não substitui avaliação médica
                    </p>
                </div>
            </div>
        </div>
    );
};

export default HormoneGuideModal;
