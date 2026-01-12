
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { IconClose, IconSparkles, IconFile } from './Icons';
import { Source } from '../types';

interface SourceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: Source | null;
  isLoading: boolean;
}

const SourceDetailModal: React.FC<SourceDetailModalProps> = ({ isOpen, onClose, source, isLoading }) => {
  if (!isOpen || !source) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
            <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <IconFile className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900 line-clamp-1">{source.title}</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-medium text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                            {source.type}
                        </span>
                        <span className="text-xs text-gray-400">{source.date}</span>
                    </div>
                </div>
            </div>
            <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
            >
                <IconClose className="w-5 h-5" />
            </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
            
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="relative w-16 h-16 mb-4">
                         <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
                         <div className="relative bg-white rounded-full w-16 h-16 border-4 border-blue-100 flex items-center justify-center">
                            <IconSparkles className="w-6 h-6 text-blue-600 animate-pulse" />
                         </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Analisando Documento...</h3>
                    <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
                        A IA está extraindo biomarcadores, padrões de treino e alertas clínicos deste arquivo.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* AI Insight Badge */}
                    <div className="flex items-center gap-2 text-indigo-600 mb-4">
                        <IconSparkles className="w-5 h-5" />
                        <span className="text-xs font-black uppercase tracking-widest">FitLM Premium Analysis</span>
                    </div>

                    {/* Markdown Content */}
                    <div className="text-gray-800">
                        <ReactMarkdown 
                            components={{
                                h1: ({node, ...props}) => <h1 className="text-xl font-bold text-gray-900 mb-3" {...props} />,
                                h2: ({node, ...props}) => <h2 className="text-lg font-bold text-gray-900 mb-2 mt-4" {...props} />,
                                h3: ({node, ...props}) => <h3 className="text-base font-bold text-gray-900 mb-2 mt-3" {...props} />,
                                p: ({node, ...props}) => <p className="text-sm text-gray-700 leading-relaxed mb-3" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 text-gray-700" {...props} />,
                                ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 text-gray-700" {...props} />,
                                li: ({node, ...props}) => <li className="mb-1" {...props} />,
                                strong: ({node, ...props}) => <strong className="font-bold text-gray-900" {...props} />,
                                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-indigo-200 pl-4 italic text-gray-600 my-4" {...props} />,
                            }}
                        >
                            {source.summary || "Nenhum resumo disponível."}
                        </ReactMarkdown>
                    </div>
                    
                    {/* Raw Content Preview (Collapsed or Small) */}
                    <div className="mt-8 pt-8 border-t border-gray-100">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Trecho do Conteúdo Original</p>
                        <div className="bg-gray-50 p-4 rounded-lg text-xs font-mono text-gray-500 max-h-32 overflow-y-auto">
                            {source.content.substring(0, 500)}...
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
            <button 
                onClick={onClose}
                className="px-5 py-2.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-black transition-all active:scale-95 text-sm"
            >
                Fechar Análise
            </button>
        </div>

      </div>
    </div>
  );
};

export default SourceDetailModal;
