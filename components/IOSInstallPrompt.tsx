
import React, { useState, useEffect } from 'react';
import { IconShare, IconPlus, IconClose } from './Icons';

export const IOSInstallPrompt: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 1. Detectar se é iOS (iPhone/iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);

    // 2. Detectar se JÁ está instalado (Standalone mode)
    const isStandalone = ('standalone' in window.navigator && (window.navigator as any).standalone) || 
                         window.matchMedia('(display-mode: standalone)').matches;

    // 3. Mostrar apenas se for iOS, no navegador (não instalado) e se o usuário ainda não fechou
    const hasClosed = localStorage.getItem('fitlm-ios-prompt-closed');

    if (isIOS && !isStandalone && !hasClosed) {
      // Delay pequeno para não impactar o load inicial
      setTimeout(() => setIsVisible(true), 2000);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('fitlm-ios-prompt-closed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] p-4 animate-in slide-in-from-bottom duration-500">
      <div className="bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl shadow-2xl p-5 relative dark:bg-gray-900/95 dark:border-gray-700">
        
        <button 
            onClick={handleClose}
            className="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
            <IconClose className="w-5 h-5" />
        </button>

        <div className="flex gap-4 items-start pr-6">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shrink-0 dark:bg-blue-600">
                F
            </div>
            <div>
                <h3 className="font-bold text-gray-900 text-sm mb-1 dark:text-white">Instalar FitLM App</h3>
                <p className="text-xs text-gray-500 leading-relaxed dark:text-gray-400">
                    Instale este aplicativo na sua tela inicial para uma experiência melhor em tela cheia.
                </p>
            </div>
        </div>

        <div className="mt-4 flex flex-col gap-3">
            <div className="flex items-center gap-3 text-xs font-medium text-gray-700 dark:text-gray-300">
                <span className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded text-blue-500 dark:bg-gray-800">
                    <IconShare className="w-4 h-4" />
                </span>
                <span>1. Toque no botão <strong>Compartilhar</strong> do navegador.</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium text-gray-700 dark:text-gray-300">
                <span className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded text-gray-500 dark:bg-gray-800">
                    <IconPlus className="w-4 h-4" />
                </span>
                <span>2. Selecione <strong>Adicionar à Tela de Início</strong>.</span>
            </div>
        </div>
        
        {/* Seta apontando para baixo (geralmente onde fica o botão share no Safari) */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-r border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700"></div>
      </div>
    </div>
  );
};
