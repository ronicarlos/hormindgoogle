
import React from 'react';
import { IconSparkles, IconFile, IconCheck, IconRefresh } from './Icons';

export interface ProcessingState {
    current: number;
    total: number;
    filename: string;
    step: 'uploading' | 'ocr' | 'saving' | 'analyzing';
}

interface ProcessingOverlayProps {
    state: ProcessingState | null;
}

const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ state }) => {
    if (!state) return null;

    const percentage = Math.round((state.current / state.total) * 100);
    
    const getStepLabel = () => {
        switch(state.step) {
            case 'uploading': return 'Enviando arquivo seguro...';
            case 'ocr': return 'IA Lendo Documento (OCR)...';
            case 'saving': return 'Estruturando dados...';
            case 'analyzing': return 'Gerando insights...';
            default: return 'Processando...';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden relative">
                
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 animate-[shimmer_2s_infinite]"></div>

                <div className="p-8 flex flex-col items-center text-center">
                    
                    {/* Icon Animation Container */}
                    <div className="relative w-20 h-20 mb-6">
                        <div className="absolute inset-0 border-4 border-gray-100 dark:border-gray-800 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                        
                        <div className="absolute inset-0 flex items-center justify-center">
                            {state.step === 'ocr' ? (
                                <IconSparkles className="w-8 h-8 text-purple-600 animate-pulse" />
                            ) : (
                                <IconFile className="w-8 h-8 text-blue-600" />
                            )}
                        </div>
                    </div>

                    <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">
                        Processando Inteligência
                    </h2>
                    
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1 truncate max-w-xs">
                        Arquivo: {state.filename}
                    </p>
                    
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest mb-6">
                        {getStepLabel()}
                    </p>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 mb-2 overflow-hidden">
                        <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${(state.current / state.total) * 100}%` }}
                        ></div>
                    </div>
                    
                    <div className="flex justify-between w-full text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <span>Arquivo {state.current} de {state.total}</span>
                        <span>{percentage}%</span>
                    </div>

                </div>
                
                {/* Footer Info */}
                <div className="bg-gray-50 dark:bg-black/20 p-4 border-t border-gray-100 dark:border-gray-800 text-center">
                    <p className="text-[10px] text-gray-400 leading-relaxed">
                        A IA está extraindo biomarcadores, datas e referências. <br/>
                        Por favor, não feche esta janela.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ProcessingOverlay;
