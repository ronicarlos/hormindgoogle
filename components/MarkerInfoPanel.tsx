
import React, { useMemo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MarkerInfo, getMarkerInfo } from '../services/markerRegistry';
import { analyzePoint } from '../services/analyticsService';
import { MetricPoint } from '../types';
import { IconActivity, IconAlert, IconCheck, IconClose, IconScience, IconInfo, IconRefresh } from './Icons';

interface MarkerInfoPanelProps {
    activeData: { markerId: string; value: number; date: string; history: MetricPoint[] } | null;
    onClose: () => void;
    gender: 'Masculino' | 'Feminino';
}

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

const MarkerInfoPanel: React.FC<MarkerInfoPanelProps> = ({ activeData, onClose, gender }) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Trava o scroll do fundo no mobile quando o modal abre
    useEffect(() => {
        if (isMobile && activeData) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isMobile, activeData]);

    const info = useMemo(() => {
        if (!activeData) return null;
        return getMarkerInfo(activeData.markerId);
    }, [activeData]);

    const analysis = useMemo(() => {
        if (!activeData || !info) return null;
        // Passa undefined como dynamicRef pois aqui queremos a análise padrão
        return analyzePoint(activeData.value, activeData.date, activeData.history, info, gender);
    }, [activeData, info, gender]);

    // CALCULAR STALE STATUS (Lógica isolada para o Panel)
    const staleData = useMemo(() => {
        if (!activeData?.history) return null;
        
        const history = activeData.history;
        const isManual = (p: MetricPoint) => {
            const l = (p.label || '').toLowerCase();
            return l.includes('manual') || l.includes('wizard') || l.includes('profile') || l.includes('user') || l.includes('input');
        };

        const manualPoints = history.filter(p => isManual(p));
        const examPoints = history.filter(p => !isManual(p));

        const sorter = (a: MetricPoint, b: MetricPoint) => {
            const dateA = normalizeDate(a.date);
            const dateB = normalizeDate(b.date);
            if (dateA !== dateB) return dateB - dateA;
            return (b.createdAt || 0) - (a.createdAt || 0);
        };

        manualPoints.sort(sorter);
        examPoints.sort(sorter);

        // Se o dado ativo for manual e houver exame mais recente
        if (manualPoints.length > 0 && examPoints.length > 0) {
            const latestManual = manualPoints[0];
            
            // Só verifica se estamos olhando para o dado mais recente do manual
            // Se o usuário clicou num ponto histórico antigo, não precisa avisar que é stale, pois é histórico.
            if (activeData.date === latestManual.date && activeData.value === latestManual.value) {
                const manualDate = normalizeDate(latestManual.date);
                const latestExam = examPoints[0];
                const examDate = normalizeDate(latestExam.date);

                if (examDate > manualDate) {
                    return {
                        isStale: true,
                        examDate: latestExam.date,
                        examValue: latestExam.value,
                        examUnit: latestExam.unit
                    };
                }
            }
        }
        return null;
    }, [activeData]);

    // --- RENDERERS ---

    // 1. Empty State (Desktop Only)
    if (!activeData || !info || !analysis) {
        if (isMobile) return null;
        return (
            <div className="hidden md:flex flex-col h-full bg-white border-l border-gray-200 p-6 dark:bg-gray-900 dark:border-gray-800 w-80 shrink-0">
                <div className="flex flex-col items-center justify-center h-full text-center opacity-50 space-y-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center dark:bg-gray-800">
                        <IconActivity className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Explorador de Métricas</h3>
                        <p className="text-xs text-gray-500 mt-1 max-w-[200px] mx-auto dark:text-gray-400">
                            Passe o mouse sobre os gráficos para ver a análise detalhada.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Cores baseadas no status
    let statusColor = 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
    let labelStatus = 'Normal / Ideal';
    
    if (analysis.status === 'HIGH') {
        statusColor = 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
        labelStatus = 'Atenção (Alto)';
    } else if (analysis.status === 'LOW') {
        statusColor = 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
        labelStatus = 'Atenção (Baixo)';
    } else if (analysis.status === 'BORDERLINE_HIGH') {
        statusColor = 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
        labelStatus = 'Alerta (Alto)';
    } else if (analysis.status === 'BORDERLINE_LOW') {
        statusColor = 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
        labelStatus = 'Alerta (Baixo)';
    } else if (analysis.status === 'UNKNOWN') {
        statusColor = 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
        labelStatus = 'Registro';
    }

    const IconStatus = analysis.status === 'NORMAL' ? IconCheck : IconAlert;

    // Componente de Conteúdo Reutilizável
    const Content = ({ isModal = false }) => (
        <div className="flex flex-col h-full w-full bg-transparent overflow-hidden">
            
            {/* Header (Fixo) */}
            <div className={`shrink-0 border-b border-gray-100 dark:border-gray-800 ${isModal ? 'p-6 pb-4' : 'pb-4'}`}>
                
                {/* ALERTA DE DESATUALIZAÇÃO (STALE DATA) */}
                {staleData && (
                    <div className="mb-4 bg-orange-50 text-orange-800 p-3 rounded-lg border border-orange-200 flex items-start gap-3 shadow-sm animate-in slide-in-from-top-2 dark:bg-orange-900/20 dark:text-orange-200 dark:border-orange-800">
                        <IconRefresh className="w-5 h-5 shrink-0 mt-0.5 text-orange-600 animate-pulse" />
                        <div className="text-xs">
                            <strong className="block mb-1 font-bold text-orange-900 dark:text-orange-100">Atualização Necessária</strong>
                            <p className="leading-relaxed">
                                O valor exibido ({activeData.value}) é do seu cadastro manual, mas existe um exame mais recente ({staleData.examDate}) com o valor <strong>{staleData.examValue} {staleData.examUnit}</strong>.
                            </p>
                            <p className="mt-1 font-medium opacity-80">Recomendamos atualizar seu perfil ou wizard.</p>
                        </div>
                    </div>
                )}

                {info.isGeneric && (
                    <div className="mb-4 bg-yellow-50 text-yellow-800 text-[10px] p-2 rounded-lg border border-yellow-100 flex items-start gap-2 dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-900/30">
                        <IconInfo className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <div>
                            <strong>Marcador sem configuração específica.</strong>
                            <p className="opacity-90">A análise abaixo é educativa e baseada em princípios gerais de fisiologia.</p>
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-start mb-2 pr-2">
                    <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{activeData.date}</span>
                        <h2 className="text-xl font-black text-gray-900 leading-tight dark:text-white mt-0.5 break-words">{info.label}</h2>
                        
                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wide mt-2 ${statusColor}`}>
                            <IconStatus className="w-3 h-3" />
                            <span>{labelStatus}</span>
                        </div>
                    </div>
                    
                    <div className="text-right flex flex-col items-end">
                        <span className={`block text-2xl font-black ${analysis.riskColor}`}>
                            {activeData.value} <span className="text-xs text-gray-400 font-bold uppercase">{info.unit}</span>
                        </span>
                        
                        {/* EXIBIÇÃO DA REFERÊNCIA */}
                        {analysis.activeRange && (
                            <div className="mt-1 bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded dark:bg-gray-800 dark:text-gray-400 whitespace-nowrap">
                                Ref: {analysis.activeRange.min} - {analysis.activeRange.max}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Body Scrolling Area */}
            <div 
                className={`flex-1 overflow-y-auto custom-scrollbar space-y-6 min-h-0 scroll-touch overscroll-contain touch-pan-y ${isModal ? 'p-6 pt-4' : 'py-6 pr-1'}`}
            >
                <div>
                    <h4 className="flex items-center gap-2 text-xs font-black text-gray-900 uppercase tracking-wider mb-2 dark:text-gray-300">
                        <IconScience className="w-3.5 h-3.5 text-indigo-500" />
                        O que é isso?
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed dark:text-gray-400 text-justify">
                        {info.definition}
                    </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                    <h4 className="flex items-center gap-2 text-xs font-black text-gray-900 uppercase tracking-wider mb-2 dark:text-gray-300">
                        <IconActivity className="w-3.5 h-3.5 text-blue-500" />
                        Análise Pessoal
                    </h4>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-relaxed">
                        {analysis.message}
                    </p>
                </div>

                {analysis.status !== 'NORMAL' && (
                    <div>
                        <h4 className="flex items-center gap-2 text-xs font-black text-gray-900 uppercase tracking-wider mb-2 dark:text-gray-300">
                            <IconAlert className="w-3.5 h-3.5 text-orange-500" />
                            {info.isGeneric 
                                ? 'Interpretação Geral' 
                                : (analysis.status.includes('HIGH') ? 'Riscos se elevado' : 'Riscos se baixo')
                            }
                        </h4>
                        <ul className="space-y-2">
                            {(info.isGeneric || analysis.status.includes('HIGH') ? info.risks.high : info.risks.low).map((risk, i) => (
                                <li key={`high-${i}`} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <span className="mt-1.5 w-1.5 h-1.5 bg-orange-400 rounded-full shrink-0" />
                                    {info.isGeneric ? `Alto: ${risk}` : risk}
                                </li>
                            ))}
                            {info.isGeneric && info.risks.low.map((risk, i) => (
                                <li key={`low-${i}`} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <span className="mt-1.5 w-1.5 h-1.5 bg-blue-400 rounded-full shrink-0" />
                                    Baixo: {risk}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {info.tips.length > 0 && (
                     <div>
                        <h4 className="flex items-center gap-2 text-xs font-black text-gray-900 uppercase tracking-wider mb-2 dark:text-gray-300">
                            Dica FitLM
                        </h4>
                        <ul className="space-y-2">
                            {info.tips.map((tip, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400 italic">
                                    <span className="mt-1.5 w-1.5 h-1.5 bg-gray-400 rounded-full shrink-0" />
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

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
                
                <div className="h-8"></div>
            </div>

            {/* Footer (Fixo) */}
            <div className={`shrink-0 border-t border-gray-100 text-center dark:border-gray-800 ${isModal ? 'p-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl' : 'pt-4'}`}>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                    Conteúdo Educativo • Não é Diagnóstico
                </p>
            </div>
        </div>
    );

    // 2. Mobile View (Modal via Portal)
    if (isMobile) {
        return createPortal(
            <div 
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-none touch-none" 
                onClick={onClose}
            >
                <div 
                    className="bg-white w-[92vw] max-h-[85vh] h-auto flex flex-col rounded-2xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200 dark:bg-gray-900 dark:border dark:border-gray-800"
                    onClick={(e) => e.stopPropagation()} 
                >
                    <button 
                        onClick={onClose}
                        className="absolute top-3 right-3 z-50 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700 shadow-sm"
                    >
                        <IconClose className="w-5 h-5" />
                    </button>

                    <Content isModal={true} />
                </div>
            </div>,
            document.body
        );
    }

    // 3. Desktop View (Sidebar Fixa)
    return (
        <div className="hidden md:block w-80 bg-white border-l border-gray-200 h-full overflow-hidden shrink-0 dark:bg-gray-900 dark:border-gray-800 relative z-20">
            <div className="h-full px-6 py-6 flex flex-col">
                <Content />
            </div>
        </div>
    );
};

export default MarkerInfoPanel;
