
import React from 'react';
import { IconWizard, IconUser, IconList } from './Icons';

interface MobileHeaderProps {
    onOpenWizard: () => void;
    onOpenProfile: () => void;
    onOpenParameters: () => void; // Nova prop
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ onOpenWizard, onOpenProfile, onOpenParameters }) => {
    return (
        <div className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex items-center justify-between dark:bg-gray-900/95 dark:border-gray-800">
            {/* Logo area */}
            <div className="flex items-center gap-2">
                <h1 className="font-black text-lg tracking-tighter text-gray-900 dark:text-white">
                    FITLM
                </h1>
                <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase font-bold dark:bg-blue-900 dark:text-blue-300">
                    App
                </span>
            </div>

            {/* Actions Area */}
            <div className="flex items-center gap-2">
                {/* Botão Parâmetros (Novo) */}
                <button 
                    onClick={onOpenParameters}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors dark:text-gray-300 dark:hover:bg-gray-800"
                    title="Parâmetros & Métricas"
                >
                    <IconList className="w-5 h-5" />
                </button>

                <button 
                    onClick={onOpenWizard}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-sm active:scale-95 transition-transform"
                >
                    <IconWizard className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">Assistente</span>
                </button>

                <button 
                    onClick={onOpenProfile}
                    className="p-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:text-gray-300"
                >
                    <IconUser className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default MobileHeader;
