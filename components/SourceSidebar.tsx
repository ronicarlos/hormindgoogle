
import React, { useRef, useState } from 'react';
import { Source, SourceType, AppView } from '../types';
import { IconFile, IconPlus, IconCheck, IconDumbbell, IconLayout, IconDownload, IconScience, IconUser, IconClose, IconInfo, IconSparkles, IconActivity, IconTrash, IconWizard, IconClock, IconArrowLeft, IconFolder } from './Icons';
import { Tooltip } from './Tooltip';

interface SourceSidebarProps {
  sources: Source[];
  onToggleSource: (id: string) => void;
  onAddSource: (files: File[]) => void; // Updated to accept array
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  isOpen?: boolean;
  onClose?: () => void;
  onLogout?: () => void;
  onViewSummary?: (source: Source) => void; 
  onDeleteSource?: (id: string) => void;
  onOpenWizard?: () => void;
  isMobileFullView?: boolean; // NEW PROP: Controls full screen mode
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
    onOpenWizard,
    isMobileFullView = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Estado para controlar se o menu de navegação está expandido ou recolhido
  // Default true, mas o usuário pode fechar para ver mais arquivos
  const [isMenuOpen, setIsMenuOpen] = useState(true);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Convert FileList to Array
      const files = Array.from(e.target.files);
      onAddSource(files);
    }
    // Reset to allow selecting same files again
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

  // Lógica de Classes CSS
  // Se for visualização mobile full (isMobileFullView):
  // - Removemos posicionamento fixo e largura fixa
  // - Usamos w-full h-full para ocupar o container principal
  
  let containerClasses = "";
  
  if (isMobileFullView) {
      containerClasses = "bg-gray-50 flex flex-col h-full w-full dark:bg-gray-900";
  } else {
      // Comportamento original (Sidebar Lateral)
      // MUDANÇA: md:w-80 -> md:w-96 (Aumentado de 320px para 384px) para mais espaço horizontal
      const baseClasses = "bg-gray-50 border-r border-gray-200 h-screen flex flex-col transition-transform duration-300 ease-in-out z-[100] dark:bg-gray-900 dark:border-gray-800";
      const mobileClasses = `fixed inset-y-0 left-0 w-80 shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'}`;
      const desktopClasses = "md:flex md:translate-x-0 md:static md:w-96 md:shadow-none";
      containerClasses = `${baseClasses} ${mobileClasses} ${desktopClasses}`;
  }

  return (
    <>
        {/* Mobile Overlay Backdrop (Only for Sidebar Mode) */}
        {isOpen && !isMobileFullView && (
            <div 
                className="fixed inset-0 bg-black/50 z-[90] md:hidden backdrop-blur-sm"
                onClick={onClose}
            />
        )}

        <div className={containerClasses}>
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0 dark:border-gray-800">
                <div>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                    FitLM
                    </h1>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold dark:text-gray-500">
                        {isMobileFullView ? 'Gerenciador de Arquivos' : 'Caderno Inteligente'}
                    </p>
                </div>
                {/* Mobile Close Button (Only in Sidebar Mode) */}
                {!isMobileFullView && (
                    <button onClick={onClose} className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-full dark:hover:bg-gray-800">
                        <IconClose className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Navigation Menu - HIDDEN IN MOBILE FULL VIEW to give space to files */}
            {!isMobileFullView && (
                <div className="border-b border-gray-100 shrink-0 dark:border-gray-800 transition-all duration-300">
                    {/* Collapsible Header */}
                    <div 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center justify-between px-6 py-3 cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors group"
                    >
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300">
                            Menu de Navegação
                        </p>
                        <div className={`text-gray-400 transition-transform duration-300 ${isMenuOpen ? '-rotate-90' : 'rotate-90'}`}>
                             {/* Usando ArrowLeft como seta simples, rotacionada */}
                             <IconArrowLeft className="w-3 h-3" />
                        </div>
                    </div>

                    {/* Collapsible Content */}
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="px-4 pb-4 space-y-1">
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
                                onClick={() => { onViewChange('timeline'); onClose?.(); }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${
                                    currentView === 'timeline' ? 'bg-white text-purple-600 shadow-sm dark:bg-gray-800 dark:text-purple-400 dark:border dark:border-gray-700' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                                }`}
                            >
                                <IconClock className="w-4 h-4" />
                                Timeline da Jornada
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
                            
                            {/* METRICS LINK - ENABLED FOR DESKTOP AND TABLET */}
                            <button 
                                onClick={() => { onViewChange('metrics'); onClose?.(); }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${
                                    currentView === 'metrics' ? 'bg-white text-emerald-600 shadow-sm dark:bg-gray-800 dark:text-emerald-400 dark:border dark:border-gray-700' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                                }`}
                            >
                                <IconActivity className="w-4 h-4" />
                                Métricas
                            </button>

                            {/* NEW: EXAMES E ANEXOS LINK (DESKTOP) */}
                            <Tooltip content="Centralize seus PDFs, imagens e registros. Visualize, baixe ou exclua arquivos." position="right">
                                <button 
                                    onClick={() => { onViewChange('sources'); onClose?.(); }}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${
                                        currentView === 'sources' ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-800 dark:text-blue-400 dark:border dark:border-gray-700' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                                    }`}
                                >
                                    <IconFolder className="w-4 h-4" />
                                    Exames e Anexos
                                </button>
                            </Tooltip>
                        </div>
                    </div>
                </div>
            )}
            
            {/* WIZARD BUTTON - Visível apenas quando o menu está aberto para economizar espaço se fechado, ou mantido fixo? 
                Vamos manter fixo mas fora do bloco collapsible para acesso rápido. 
            */}
             {!isMobileFullView && isMenuOpen && (
                 <div className="px-4 py-2 shrink-0 animate-in fade-in duration-200">
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
             )}

            {/* SCROLLABLE LIST OF SOURCES */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0 pb-24 md:pb-4 custom-scrollbar">
                <div className="flex justify-between items-center mb-3 px-2 sticky top-0 bg-gray-50 dark:bg-gray-900 z-10 py-2">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Fontes Ativas</h3>
                    <div className="flex gap-2">
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full dark:bg-gray-700 dark:text-gray-300">{sources.length}</span>
                        {/* Dica visual se o menu estiver aberto e ocupando espaço */}
                        {isMenuOpen && !isMobileFullView && sources.length > 3 && (
                            <Tooltip content="Recolha o Menu acima para ver mais arquivos" position="left">
                                <IconInfo className="w-3.5 h-3.5 text-blue-400 cursor-help" />
                            </Tooltip>
                        )}
                    </div>
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
                            <p className="text-sm font-medium text-gray-800 truncate dark:text-gray-200" title={source.title}>{source.title}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                {source.date} 
                                <span className="w-1 h-1 rounded-full bg-gray-300"></span> 
                                {source.type}
                            </p>
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

            {/* FIXED BOTTOM SECTION (Upload & Profile) - Ajuste para não ficar atrás do menu inferior no mobile */}
            <div className={`p-4 border-t border-gray-200 bg-white shadow-[0_-5px_15px_rgba(0,0,0,0.02)] z-10 shrink-0 pb-6 dark:bg-gray-900 dark:border-gray-800 ${isMobileFullView ? 'mb-20 md:mb-0' : ''}`}>
                
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
                        Upload de Arquivos
                    </button>
                    <p className="text-[9px] text-gray-400 mt-1.5 text-center leading-tight px-2">
                        Suporta Múltiplos: <strong>Exames (PDF)</strong>, <strong>Fotos do Físico/Dieta (JPG)</strong> ou <strong>Treinos (TXT)</strong>. A IA analisará o conteúdo.
                    </p>
                </div>
                
                {/* Hidden File Input with Multiple */}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileChange} 
                    accept=".pdf,.jpg,.jpeg,.png,.txt,.csv"
                    multiple 
                />

                {!isMobileFullView && (
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
                )}
                
                {onLogout && !isMobileFullView && (
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
