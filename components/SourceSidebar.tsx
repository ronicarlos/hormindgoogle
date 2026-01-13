
import React, { useRef } from 'react';
import { Source, SourceType, AppView } from '../types';
import { IconFile, IconPlus, IconCheck, IconDumbbell, IconLayout, IconDownload, IconScience, IconUser, IconClose, IconInfo, IconSparkles, IconActivity, IconTrash, IconWizard } from './Icons';
import { Tooltip } from './Tooltip';

interface SourceSidebarProps {
  sources: Source[];
  onToggleSource: (id: string) => void;
  onAddSource: (file: File) => void;
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  isOpen?: boolean;
  onClose?: () => void;
  onLogout?: () => void;
  onViewSummary?: (source: Source) => void; 
  onDeleteSource?: (id: string) => void;
  onOpenWizard?: () => void; // New Prop
}

const SourceSidebar: React.FC<SourceSidebarProps> = ({ 
    sources, 
    onToggleSource, 
    onAddSource,
    currentView,
    onViewChange,
    isOpen = false,
    onClose,
    onLogout,
    onViewSummary,
    onDeleteSource,
    onOpenWizard
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAddSource(file);
    }
    // Reset to allow selecting same file again
    if (e.target) e.target.value = '';
  };

  const handleDownload = (e: React.MouseEvent, source: Source) => {
    e.stopPropagation(); // Prevent toggling selection
    
    // Se existir URL do Supabase Storage (Arquivo Real)
    if (source.fileUrl) {
        window.open(source.fileUrl, '_blank');
        return;
    }

    // Fallback para conteúdo de texto (User Input ou Prontuário)
    const element = document.createElement("a");
    const file = new Blob([source.content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${source.title.replace(/ /g, '_')}.txt`;
    document.body.appendChild(element); 
    element.click();
    document.body.removeChild(element);
  };

  const handleInsightClick = (e: React.MouseEvent, source: Source) => {
      e.stopPropagation();
      if (onViewSummary) onViewSummary(source);
  }
  
  const handleDeleteClick = (e: React.MouseEvent, source: Source) => {
      e.preventDefault();
      e.stopPropagation();
      if (onDeleteSource) onDeleteSource(source.id);
  }

  const getSourceIconColor = (type: SourceType) => {
      switch(type) {
          case SourceType.PDF: return 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400';
          case SourceType.IMAGE: return 'bg-purple-50 text-purple-500 dark:bg-purple-900/30 dark:text-purple-400';
          case SourceType.USER_INPUT: return 'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-400';
          case SourceType.PRONTUARIO: return 'bg-gray-800 text-white dark:bg-gray-700';
          default: return 'bg-blue-50 text-blue-500 dark:bg-blue-900/30 dark:text-blue-400';
      }
  };

  // Base classes always applied 
  // IMPORTANT: pb-24 md:pb-6 (increased padding) to prevent bottom cutoff on desktop/tablet
  const baseClasses = "bg-gray-50 border-r border-gray-200 h-screen flex flex-col transition-transform duration-300 ease-in-out z-50 dark:bg-gray-900 dark:border-gray-800";
  
  // Mobile vs Desktop logic
  const mobileClasses = `fixed inset-0 w-80 shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'}`;
  const desktopClasses = "hidden md:flex md:translate-x-0 md:static md:w-80 md:shadow-none";

  return (
    <>
        {/* Mobile Overlay Backdrop */}
        {isOpen && (
            <div 
                className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                onClick={onClose}
            />
        )}

        <div className={`${baseClasses} ${mobileClasses} ${desktopClasses}`}>
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0 dark:border-gray-800">
                <div>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                    FitLM
                    </h1>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold dark:text-gray-500">Caderno Inteligente</p>
                </div>
                {/* Mobile Close Button */}
                <button onClick={onClose} className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-full dark:hover:bg-gray-800">
                    <IconClose className="w-5 h-5" />
                </button>
            </div>

            {/* Navigation Menu */}
            <div className="p-4 border-b border-gray-100 space-y-1 shrink-0 dark:border-gray-800">
                <p className="px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 dark:text-gray-500">Menu</p>
                <button 
                    onClick={() => { onViewChange('dashboard'); onClose?.(); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${
                        currentView === 'dashboard' ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-800 dark:text-blue-400 dark:border dark:border-gray-700' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                    }`}
                >
                    <IconLayout className="w-4 h-4" />
                    Notebook & Chat
                </button>
                <button 
                    onClick={() => { onViewChange('profile'); onClose?.(); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${
                        currentView === 'profile' ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white dark:border dark:border-gray-700' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                    }`}
                >
                    <IconUser className="w-4 h-4" />
                    Perfil Biométrico
                </button>
                <button 
                    onClick={() => { onViewChange('training_library'); onClose?.(); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${
                        currentView === 'training_library' ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-800 dark:text-indigo-400 dark:border dark:border-gray-700' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                    }`}
                >
                    <IconDumbbell className="w-4 h-4" />
                    Biblioteca de Treinos
                </button>
                <button 
                    onClick={() => { onViewChange('protocol_library'); onClose?.(); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${
                        currentView === 'protocol_library' ? 'bg-white text-purple-600 shadow-sm dark:bg-gray-800 dark:text-purple-400 dark:border dark:border-gray-700' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                    }`}
                >
                    <IconScience className="w-4 h-4" />
                    Enciclopédia de Protocolos
                </button>
                
                {/* TABLET ONLY LINK: Visible on MD (Tablet), Hidden on LG (Desktop has right sidebar), Hidden on Mobile (uses bottom nav) */}
                <button 
                    onClick={() => { onViewChange('metrics'); onClose?.(); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium items-center gap-3 transition-colors hidden md:flex lg:hidden ${
                        currentView === 'metrics' ? 'bg-white text-emerald-600 shadow-sm dark:bg-gray-800 dark:text-emerald-400 dark:border dark:border-gray-700' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                    }`}
                >
                    <IconActivity className="w-4 h-4" />
                    Painel de Métricas
                </button>
            </div>
            
            {/* WIZARD BUTTON (NEW) */}
             <div className="px-4 py-2 shrink-0">
                 <button 
                    onClick={() => { onOpenWizard?.(); onClose?.(); }}
                    className="w-full text-left px-3 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-all bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 active:scale-95 group"
                >
                    <div className="bg-white/20 p-1.5 rounded-lg group-hover:bg-white/30 transition-colors">
                         <IconWizard className="w-4 h-4" />
                    </div>
                    Completar Dados
                </button>
             </div>

            {/* SCROLLABLE LIST OF SOURCES */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
                <div className="flex justify-between items-center mb-3 px-2">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Fontes Ativas</h3>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full dark:bg-gray-700 dark:text-gray-300">{sources.length}</span>
                </div>
                
                <div className="space-y-2 pb-2">
                    {sources.map((source) => (
                    <div 
                        key={source.id}
                        onClick={() => onToggleSource(source.id)}
                        className={`group cursor-pointer p-3 rounded-lg border transition-all duration-200 relative ${
                        source.selected 
                            ? 'bg-white border-blue-400 shadow-sm dark:bg-gray-800 dark:border-blue-500' 
                            : 'bg-white border-transparent hover:border-gray-300 dark:bg-gray-900/50 dark:border-transparent dark:hover:border-gray-700'
                        }`}
                    >
                        <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-md ${getSourceIconColor(source.type)}`}>
                            <IconFile className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate dark:text-gray-200">{source.title}</p>
                            <p className="text-xs text-gray-400">{source.date} • {source.type}</p>
                        </div>
                        
                        {/* Action Icons */}
                        <div className="flex items-center gap-1">
                             <Tooltip content="Ver Resumo Premium (IA)" position="left">
                                <button 
                                    onClick={(e) => handleInsightClick(e, source)}
                                    className="p-1.5 text-indigo-400 hover:text-white hover:bg-indigo-600 rounded-md transition-colors"
                                >
                                    <IconSparkles className="w-3.5 h-3.5" />
                                </button>
                            </Tooltip>

                            <Tooltip content="Baixar" position="left">
                                <button 
                                    onClick={(e) => handleDownload(e, source)}
                                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors dark:hover:bg-gray-700 dark:hover:text-gray-200"
                                >
                                    <IconDownload className="w-3.5 h-3.5" />
                                </button>
                            </Tooltip>

                             {onDeleteSource && (
                                <Tooltip content="Excluir" position="left">
                                    <button 
                                        onClick={(e) => handleDeleteClick(e, source)}
                                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors relative z-20 dark:hover:bg-red-900/30"
                                    >
                                        <IconTrash className="w-3.5 h-3.5" />
                                    </button>
                                </Tooltip>
                            )}
                            
                            {source.selected && (
                                <div className="p-1.5">
                                    <IconCheck className="w-4 h-4 text-blue-500" />
                                </div>
                            )}
                        </div>
                        </div>
                    </div>
                    ))}
                    {sources.length === 0 && (
                        <p className="text-xs text-center text-gray-400 py-4 italic">Nenhum arquivo adicionado.</p>
                    )}
                </div>
            </div>

            {/* FIXED BOTTOM SECTION (Upload & Profile) */}
            <div className="p-4 border-t border-gray-200 bg-white shadow-[0_-5px_15px_rgba(0,0,0,0.02)] z-10 shrink-0 pb-20 md:pb-6 dark:bg-gray-900 dark:border-gray-800">
                
                {/* Visible Upload Call-to-Action */}
                <div className="mb-4">
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1 dark:text-gray-500">
                        <IconFile className="w-3 h-3" />
                        Importar Dados
                    </p>
                    <button 
                        onClick={handleFileClick}
                        className="w-full py-3 border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-lg text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all flex items-center justify-center gap-2 text-sm font-bold active:scale-95 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/40"
                    >
                        <IconPlus className="w-4 h-4" />
                        Upload de Arquivo
                    </button>
                    <p className="text-[9px] text-gray-400 mt-1.5 text-center leading-tight px-2">
                        Suporta: <strong>Exames (PDF)</strong>, <strong>Fotos do Físico/Dieta (JPG)</strong> ou <strong>Treinos (TXT)</strong>. A IA analisará o conteúdo.
                    </p>
                </div>
                
                {/* Hidden File Input */}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileChange} 
                    accept=".pdf,.jpg,.jpeg,.png,.txt,.csv"
                />

                <div 
                    onClick={() => { onViewChange('profile'); onClose?.(); }}
                    className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors mt-2 border-t border-gray-50 pt-3 dark:hover:bg-gray-800 dark:border-gray-800"
                >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs overflow-hidden dark:bg-indigo-900 dark:text-indigo-300">
                        BR
                    </div>
                    <div className="text-sm">
                        <p className="font-medium text-gray-700 dark:text-gray-200">Meu Perfil</p>
                        <p className="text-xs text-gray-400">Ver ficha do atleta</p>
                    </div>
                </div>
                
                {onLogout && (
                    <button 
                        onClick={onLogout}
                        className="w-full text-left px-2 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors uppercase tracking-wider mt-1 dark:hover:bg-red-900/20"
                    >
                        Sair da Conta
                    </button>
                )}
            </div>
        </div>
    </>
  );
};

export default SourceSidebar;
