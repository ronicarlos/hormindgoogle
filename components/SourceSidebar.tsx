import React, { useRef } from 'react';
import { AppView } from '../types';
import { IconActivity, IconUser, IconClock, IconDumbbell, IconScience, IconMessage, IconFile, IconFolder, IconWizard, IconPlus } from './Icons';

interface SourceSidebarProps {
    currentView: AppView;
    onChangeView: (view: AppView) => void;
    onLogout?: () => void;
    onOpenWizard?: () => void;
    onUpload?: (files: File[]) => void; // Nova prop para upload direto
    className?: string;
}

const SourceSidebar: React.FC<SourceSidebarProps> = ({ currentView, onChangeView, onLogout, onOpenWizard, onUpload, className }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const navItems: { id: AppView; label: string; icon: any }[] = [
        { id: 'chat', label: 'Chat IA', icon: IconMessage },
        { id: 'dashboard', label: 'Métricas', icon: IconActivity }, 
        { id: 'sources', label: 'Meus Exames', icon: IconFolder },
        { id: 'timeline', label: 'Timeline', icon: IconClock }, 
        { id: 'training_library', label: 'Treinos', icon: IconDumbbell },
        { id: 'protocol_library', label: 'Pharma', icon: IconScience },
        { id: 'profile', label: 'Perfil', icon: IconUser },
    ];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0 && onUpload) {
            onUpload(Array.from(e.target.files));
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className={`bg-white border-r border-gray-200 flex flex-col h-full ${className} dark:bg-gray-900 dark:border-gray-800`}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <h1 className="font-black text-xl tracking-tighter text-gray-900 dark:text-white flex items-center gap-2">
                    FITLM <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase font-bold dark:bg-blue-900 dark:text-blue-300">Beta</span>
                </h1>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4">
                {/* Botão Wizard */}
                {onOpenWizard && (
                    <div className="px-2 mb-2">
                        <button 
                            onClick={onOpenWizard}
                            className="w-full flex items-center gap-3 px-3 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all active:scale-95 group"
                        >
                            <div className="bg-white/20 p-1 rounded-lg">
                                <IconWizard className="w-4 h-4 text-white" />
                            </div>
                            <div className="text-left">
                                <span className="block text-xs font-bold leading-tight">Assistente de Dados</span>
                                <span className="block text-[9px] opacity-80 group-hover:opacity-100">Completar Perfil</span>
                            </div>
                        </button>
                    </div>
                )}

                {/* Botão Upload Rápido Sidebar */}
                {onUpload && (
                    <div className="px-2 mb-4">
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            onChange={handleFileChange} 
                            multiple 
                            accept=".pdf,.jpg,.jpeg,.png" 
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors border border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            <IconPlus className="w-3.5 h-3.5" />
                            Upload Rápido
                        </button>
                    </div>
                )}

                <div className="px-4 pb-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 dark:text-gray-500">Navegação</p>
                </div>

                <nav className="space-y-1 px-2">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onChangeView(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                                currentView === item.id
                                    ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                            }`}
                        >
                            <item.icon className={`w-5 h-5 shrink-0 ${currentView === item.id ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                            {item.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                {onLogout && (
                    <button 
                        onClick={onLogout}
                        className="w-full text-left px-2 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors uppercase tracking-wider mt-1 dark:hover:bg-red-900/20"
                    >
                        Sair da Conta
                    </button>
                )}
            </div>
        </div>
    );
};

export default SourceSidebar;