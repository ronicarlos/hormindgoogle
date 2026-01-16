
import React, { useMemo } from 'react';
import { MarkerInfo, getMarkerInfo } from '../services/markerRegistry';
import { analyzePoint } from '../services/analyticsService';
import { MetricPoint } from '../types';
import { IconActivity, IconAlert, IconCheck, IconInfo, IconClose, IconScience, IconArrowLeft } from './Icons';

interface MarkerInfoPanelProps {
    activeData: { markerId: string; value: number; date: string; history: MetricPoint[] } | null;
    onClose: () => void;
    gender: 'Masculino' | 'Feminino';
}

const MarkerInfoPanel: React.FC<MarkerInfoPanelProps> = ({ activeData, onClose, gender }) => {
    // Se não houver dados ativos, não renderiza nada (ou renderiza placeholder no desktop)
    // Mas para manter o layout, vamos renderizar o container sempre no Desktop
    
    const info = useMemo(() => {
        if (!activeData) return null;
        return getMarkerInfo(activeData.markerId);
    }, [activeData]);

    const analysis = useMemo(() => {
        if (!activeData || !info) return null;
        return analyzePoint(activeData.value, activeData.date, activeData.history, info, gender);
    }, [activeData, info, gender]);

    if (!activeData || !info || !analysis) {
        // EMPTY STATE (Desktop Only - Sidebar visível mas vazia)
        return (
            <div className="hidden md:flex flex-col h-full bg-white border-l border-gray-200 p-6 dark:bg-gray-900 dark:border-gray-800 w-80 shrink-0">
                <div className="flex flex-col items-center justify-center h-full text-center opacity-50 space-y-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center dark:bg-gray-800">
                        <IconActivity className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Explorador de Métricas</h3>
                        <p className="text-xs text-gray-500 mt-1 max-w-[200px] mx-auto dark:text-gray-400">
                            Passe o mouse ou toque em qualquer ponto do gráfico para ver a análise clínica detalhada aqui.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Cores baseadas no status
    const statusColor = 
        analysis.status === 'HIGH' ? 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800' :
        analysis.status === 'LOW' ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' :
        'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';

    const IconStatus = analysis.status === 'NORMAL' ? IconCheck : IconAlert;

    // CONTENT RENDERER
    const Content = () => (
        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
            
            {/* Header */}
            <div className="pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{activeData.date}</span>
                        <h2 className="text-xl font-black text-gray-900 leading-tight dark:text-white mt-0.5">{info.label}</h2>
                    </div>
                    <div className="text-right">
                        <span className={`block text-2xl font-black ${analysis.riskColor}`}>
                            {activeData.value}
                        </span>
                        <span className="text-xs font-bold text-gray-400 uppercase">{info.unit}</span>
                    </div>
                </div>
                
                {/* Status Badge */}
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-bold uppercase tracking-wide ${statusColor}`}>
                    <IconStatus className="w-3.5 h-3.5" />
                    <span>
                        {analysis.status === 'HIGH' ? 'Elevado' : analysis.status === 'LOW' ? 'Baixo' : 'Normal / Ideal'}
                    </span>
                </div>
            </div>

            {/* Body */}
            <div className="py-6 space-y-6 flex-1">
                
                {/* Definição */}
                <div>
                    <h4 className="flex items-center gap-2 text-xs font-black text-gray-900 uppercase tracking-wider mb-2 dark:text-gray-300">
                        <IconScience className="w-3.5 h-3.5 text-indigo-500" />
                        O que é isso?
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed dark:text-gray-400">
                        {info.definition}
                    </p>
                </div>

                {/* Análise Inteligente */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                    <h4 className="flex items-center gap-2 text-xs font-black text-gray-900 uppercase tracking-wider mb-2 dark:text-gray-300">
                        <IconActivity className="w-3.5 h-3.5 text-blue-500" />
                        Análise Pessoal
                    </h4>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-relaxed">
                        {analysis.message}
                    </p>
                </div>

                {/* Riscos (Se houver) */}
                {analysis.status !== 'NORMAL' && (
                    <div>
                        <h4 className="flex items-center gap-2 text-xs font-black text-gray-900 uppercase tracking-wider mb-2 dark:text-gray-300">
                            <IconAlert className="w-3.5 h-3.5 text-orange-500" />
                            {analysis.status === 'HIGH' ? 'Riscos se elevado' : 'Riscos se baixo'}
                        </h4>
                        <ul className="space-y-2">
                            {(analysis.status === 'HIGH' ? info.risks.high : info.risks.low).map((risk, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <span className="mt-1.5 w-1.5 h-1.5 bg-orange-400 rounded-full shrink-0" />
                                    {risk}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Fontes */}
                {info.sources.length > 0 && (
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Fonte Confiável</p>
                        {info.sources.map((s, i) => (
                            <a 
                                key={i} 
                                href={s.url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline dark:text-blue-400"
                            >
                                {s.title} ↗
                            </a>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-gray-100 text-center dark:border-gray-800 shrink-0">
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                    Conteúdo Educativo • Não é Diagnóstico
                </p>
            </div>
        </div>
    );

    return (
        <>
            {/* DESKTOP SIDEBAR (Static) */}
            <div className="hidden md:block w-80 bg-white border-l border-gray-200 h-full overflow-hidden shrink-0 dark:bg-gray-900 dark:border-gray-800 relative z-20">
                <div className="h-full p-6">
                    <Content />
                </div>
            </div>

            {/* MOBILE BOTTOM SHEET (Fixed Overlay) */}
            <div className="md:hidden fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-none">
                {/* Backdrop (clickable to close) */}
                <div 
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto animate-in fade-in duration-300" 
                    onClick={onClose}
                />
                
                {/* Card */}
                <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl pointer-events-auto animate-in slide-in-from-bottom duration-300 max-h-[85vh] flex flex-col overflow-hidden dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                    {/* Handle Bar for mobile feel */}
                    <div className="w-full flex justify-center pt-3 pb-1" onClick={onClose}>
                        <div className="w-12 h-1.5 bg-gray-300 rounded-full dark:bg-gray-700" />
                    </div>
                    
                    <div className="p-6 overflow-y-auto">
                        <Content />
                        <button 
                            onClick={onClose}
                            className="mt-6 w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl dark:bg-gray-800 dark:text-white"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default MarkerInfoPanel;
