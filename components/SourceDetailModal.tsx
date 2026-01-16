
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { IconClose, IconSparkles, IconFile, IconList, IconCheck, IconAlert } from './Icons';
import { Source } from '../types';
import { dataService } from '../services/dataService';

interface SourceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: Source | null;
  isLoading: boolean;
}

const SourceDetailModal: React.FC<SourceDetailModalProps> = ({ isOpen, onClose, source, isLoading }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Reset state when modal opens/source changes
  useEffect(() => {
    if (source) {
        setEditTitle(source.title);
        // Convert DD/MM/YYYY to YYYY-MM-DD for input
        if (source.date && source.date.includes('/')) {
            const parts = source.date.split('/');
            if (parts.length === 3) {
                setEditDate(`${parts[2]}-${parts[1]}-${parts[0]}`);
            } else {
                setEditDate('');
            }
        } else {
            setEditDate(source.date);
        }
        
        // Prioridade de conteúdo
        const mainContent = source.content && source.content.length > 50 
            ? source.content 
            : (source.summary === 'Processado automaticamente via OCR IA.' ? source.content : source.summary || source.content);
        
        setEditContent(mainContent);
        setIsEditing(false); // Reset edit mode
    }
  }, [source, isOpen]);

  if (!isOpen || !source) return null;

  const handleSave = async () => {
      setIsSaving(true);
      try {
          // Convert back to DD/MM/YYYY
          let finalDate = editDate;
          if (editDate.includes('-')) {
              const [y, m, d] = editDate.split('-');
              finalDate = `${d}/${m}/${y}`;
          }

          const error = await dataService.updateSourceDetails(source.id, {
              title: editTitle,
              date: finalDate,
              content: editContent
          });

          if (!error) {
              source.title = editTitle;
              source.date = finalDate;
              source.content = editContent; // Update local ref
              setIsEditing(false);
          } else {
              alert("Erro ao salvar alterações.");
          }
      } catch (err) {
          console.error(err);
          alert("Erro crítico ao salvar.");
      } finally {
          setIsSaving(false);
      }
  };

  const mainContent = editContent; // Use state for content rendering to reflect edits instantly

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden dark:bg-gray-900 dark:border dark:border-gray-800">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700">
            <div className="flex gap-4 w-full">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 dark:bg-blue-900/30 dark:text-blue-400">
                    <IconFile className="w-6 h-6" />
                </div>
                <div className="flex-1 mr-4">
                    {isEditing ? (
                        <div className="space-y-2">
                            <input 
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full text-lg font-bold border border-gray-300 rounded p-1 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                placeholder="Título do Documento"
                            />
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 uppercase font-bold">Data do Exame:</span>
                                <input 
                                    type="date"
                                    value={editDate}
                                    onChange={(e) => setEditDate(e.target.value)}
                                    className="text-sm border border-gray-300 rounded p-1 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                />
                            </div>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-xl font-bold text-gray-900 line-clamp-1 dark:text-white">{source.title}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-black text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200 uppercase tracking-wider dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400">
                                    {source.specificType || source.type}
                                </span>
                                <span className="text-xs text-gray-400 font-medium">{source.date}</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
            <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors dark:hover:bg-gray-700 dark:text-gray-400"
            >
                <IconClose className="w-5 h-5" />
            </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-10 overflow-y-auto custom-scrollbar bg-white dark:bg-gray-900 flex-1">
            
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="relative w-16 h-16 mb-4">
                         <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
                         <div className="relative bg-white rounded-full w-16 h-16 border-4 border-blue-100 flex items-center justify-center dark:bg-gray-800 dark:border-blue-900">
                            <IconSparkles className="w-6 h-6 text-blue-600 animate-pulse dark:text-blue-400" />
                         </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Analisando Documento...</h3>
                    <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto dark:text-gray-400">
                        A IA está extraindo biomarcadores, padrões de treino e alertas clínicos deste arquivo.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Badge indicando a fonte */}
                    <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6 dark:border-gray-800">
                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                            <IconSparkles className="w-4 h-4" />
                            <span className="text-xs font-black uppercase tracking-widest">Leitura Inteligente (OCR)</span>
                        </div>
                        {source.fileUrl && !isEditing && (
                            <a 
                                href={source.fileUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-xs font-bold text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-1 dark:hover:text-blue-400"
                            >
                                Ver Arquivo Original ↗
                            </a>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-gray-500 uppercase">Conteúdo do Documento (Transcrição)</p>
                            <textarea 
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm leading-relaxed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    ) : (
                        /* Markdown Content Principal */
                        <div className="prose prose-sm max-w-none text-gray-800 dark:prose-invert dark:text-gray-300 leading-relaxed">
                            <ReactMarkdown 
                                components={{
                                    h1: ({node, ...props}) => <h1 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 dark:text-white dark:border-gray-800" {...props} />,
                                    h2: ({node, ...props}) => <h2 className="text-lg font-bold text-gray-800 mb-3 mt-6 flex items-center gap-2 dark:text-gray-200" {...props} />,
                                    h3: ({node, ...props}) => <h3 className="text-sm font-bold text-gray-900 mb-2 mt-4 uppercase tracking-wide dark:text-gray-300" {...props} />,
                                    p: ({node, ...props}) => <p className="mb-3 text-gray-600 dark:text-gray-400" {...props} />,
                                    ul: ({node, ...props}) => <ul className="space-y-2 mb-4 list-none pl-0" {...props} />,
                                    li: ({node, ...props}) => (
                                        <li className="flex items-start gap-2 text-gray-700 bg-gray-50/50 p-2 rounded-lg border border-gray-100/50 dark:bg-gray-800/30 dark:border-gray-800 dark:text-gray-300" {...props}>
                                            <span className="mt-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />
                                            <span className="flex-1">{props.children}</span>
                                        </li>
                                    ),
                                    strong: ({node, ...props}) => <strong className="font-bold text-gray-900 dark:text-white" {...props} />,
                                    table: ({node, ...props}) => (
                                        <div className="overflow-x-auto my-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" {...props} />
                                        </div>
                                    ),
                                    thead: ({node, ...props}) => <thead className="bg-gray-50 dark:bg-gray-800" {...props} />,
                                    th: ({node, ...props}) => <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400" {...props} />,
                                    tbody: ({node, ...props}) => <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-800" {...props} />,
                                    tr: ({node, ...props}) => <tr className="hover:bg-gray-50/50 transition-colors dark:hover:bg-gray-800/50" {...props} />,
                                    td: ({node, ...props}) => <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300" {...props} />,
                                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-indigo-500 pl-4 py-2 italic text-gray-600 bg-indigo-50/30 rounded-r-lg my-4 dark:text-gray-400 dark:bg-indigo-900/10" {...props} />,
                                }}
                            >
                                {mainContent || "*Nenhum conteúdo textual identificado neste documento.*"}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 dark:bg-gray-800/50 dark:border-gray-800">
            {isEditing ? (
                <>
                    <button 
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-2.5 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all text-sm dark:text-gray-400 dark:hover:bg-gray-800"
                        disabled={isSaving}
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all active:scale-95 text-sm shadow-md flex items-center gap-2"
                    >
                        {isSaving ? 'Salvando...' : <><IconCheck className="w-4 h-4"/> Salvar Alterações</>}
                    </button>
                </>
            ) : (
                <>
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="px-6 py-2.5 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all text-sm border border-blue-200 dark:text-blue-400 dark:border-blue-900/50 dark:hover:bg-blue-900/20"
                    >
                        Editar Documento
                    </button>
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all active:scale-95 text-sm dark:bg-blue-600 dark:hover:bg-blue-700"
                    >
                        Fechar
                    </button>
                </>
            )}
        </div>

      </div>
    </div>
  );
};

export default SourceDetailModal;
