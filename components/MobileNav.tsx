
import React from 'react';
import { AppView } from '../types';
import { IconActivity, IconMessage, IconFolder, IconDumbbell, IconScience, IconClock } from './Icons';

interface MobileNavProps {
    currentView: AppView;
    onChangeView: (view: AppView) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ currentView, onChangeView }) => {
    
    // Lista completa de navegação solicitada
    const navItems = [
        { id: 'dashboard', icon: IconActivity, label: 'Métricas' },
        { id: 'chat', icon: IconMessage, label: 'Chat IA' },
        { id: 'sources', icon: IconFolder, label: 'Exames' },
        { id: 'training_library', icon: IconDumbbell, label: 'Treinos' },
        { id: 'protocol_library', icon: IconScience, label: 'Pharma' },
        { id: 'timeline', icon: IconClock, label: 'Timeline' },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50 dark:bg-gray-900 dark:border-gray-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="grid grid-cols-6 h-[60px]">
                {navItems.map((item) => {
                    const isActive = currentView === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onChangeView(item.id as AppView)}
                            className={`flex flex-col items-center justify-center gap-1 transition-all active:bg-gray-50 dark:active:bg-gray-800 ${
                                isActive 
                                ? 'text-blue-600 dark:text-white' 
                                : 'text-gray-400 dark:text-gray-500'
                            }`}
                        >
                            <div className={`relative p-1 rounded-xl transition-all ${isActive ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}>
                                <item.icon className={`w-5 h-5 ${isActive ? 'fill-blue-600/20' : ''}`} />
                            </div>
                            <span className="text-[9px] font-bold tracking-tight truncate w-full text-center px-0.5">
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default MobileNav;
