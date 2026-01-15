
import React from 'react';
import { IconSparkles, IconAlert, IconClose } from './Icons';

interface AnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    contextDescription: string;
}

const AnalysisModal: React.FC<AnalysisModalProps> = ({ isOpen, onClose, onConfirm, contextDescription }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative">
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                    >
                        <IconClose className="w-5 h-5" />
                    </button>
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
                        <IconSparkles className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-xl font-bold">Solicitar Análise IA</h2>
                    <p className="text-blue-100 text-xs mt-1">FitLM Intelligence Engine</p>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        <p className="font-bold text-gray-900 dark:text-white mb-2">Contexto da Atualização:</p>
                        <p className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700 italic">
                            "{contextDescription}"
                        </p>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-100 rounded-xl text-xs text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-900/30">
                        <IconAlert className="w-5 h-5 shrink-0 mt-0.5" />
                        <p>
                            <strong>Atenção aos Custos:</strong> Esta ação processará todo o seu histórico e novos dados. Isso consome tokens da sua cota ou gera custos no plano Pay-as-you-go.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 font-bold text-sm hover:bg-gray-200 rounded-lg transition-colors dark:text-gray-400 dark:hover:bg-gray-800"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={onConfirm}
                        className="px-6 py-2 bg-black text-white font-bold text-sm rounded-lg hover:bg-gray-800 transition-all shadow-lg active:scale-95 flex items-center gap-2 dark:bg-blue-600 dark:hover:bg-blue-700"
                    >
                        <IconSparkles className="w-4 h-4" />
                        Confirmar e Analisar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AnalysisModal;
