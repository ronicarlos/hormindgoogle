
import React, { useState } from 'react';
import { IconSparkles, IconAlert, IconClose, IconActivity } from './Icons';

interface AnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    contextDescription: string;
}

const AnalysisModal: React.FC<AnalysisModalProps> = ({ isOpen, onClose, onConfirm, contextDescription }) => {
    const [isProcessing, setIsProcessing] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = () => {
        setIsProcessing(true);
        onConfirm(); // Parent (App.tsx) will execute navigation and async logic
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transform transition-all scale-100">
                
                {/* Header */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <IconSparkles className="w-24 h-24" />
                    </div>
                    
                    <button 
                        onClick={onClose}
                        disabled={isProcessing}
                        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10 disabled:opacity-50"
                    >
                        <IconClose className="w-5 h-5" />
                    </button>
                    
                    <div className="flex items-center gap-3 mb-2 relative z-10">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-lg">
                            <IconSparkles className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-lg font-bold tracking-tight">Nova Análise Detectada</h2>
                    </div>
                    <p className="text-indigo-100 text-xs font-medium relative z-10 pl-1">O sistema identificou mudanças relevantes.</p>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    
                    {/* Context Box */}
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 dark:text-gray-400">O que mudou:</p>
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 italic leading-relaxed shadow-sm">
                            "{contextDescription}"
                        </div>
                    </div>

                    {/* Cost Warning */}
                    <div className="flex gap-3 p-4 bg-orange-50 border border-orange-100 rounded-2xl dark:bg-orange-900/10 dark:border-orange-900/30">
                        <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg h-fit shrink-0">
                            <IconActivity className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-orange-800 dark:text-orange-200 mb-1">Estimativa de Custo</h4>
                            <p className="text-xs text-orange-700/80 dark:text-orange-300/70 leading-relaxed">
                                Esta ação processará seu <strong>histórico completo</strong> (Chat + Exames + Perfil) para garantir precisão. Isso consumirá tokens do seu plano ou saldo.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 pt-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/20 flex flex-col gap-3">
                    <button 
                        onClick={handleConfirm}
                        disabled={isProcessing}
                        className="w-full py-3.5 bg-black text-white font-bold text-sm rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-black/10 active:scale-[0.98] flex items-center justify-center gap-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:shadow-blue-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Iniciando...
                            </>
                        ) : (
                            <>
                                <IconSparkles className="w-4 h-4" />
                                Confirmar e Gerar Análise (Ir para Chat)
                            </>
                        )}
                    </button>
                    <button 
                        onClick={onClose}
                        disabled={isProcessing}
                        className="w-full py-3 text-gray-500 font-bold text-xs hover:text-gray-800 transition-colors dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
                    >
                        Não, Apenas Salvar Dados
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AnalysisModal;
