import React from 'react';
import { Source, SourceType } from '../types';
import { IconFile, IconPlus, IconCheck } from './Icons';

interface SourceSidebarProps {
  sources: Source[];
  onToggleSource: (id: string) => void;
  onAddSource: () => void;
}

const SourceSidebar: React.FC<SourceSidebarProps> = ({ sources, onToggleSource, onAddSource }) => {
  return (
    <div className="w-80 bg-gray-50 border-r border-gray-200 h-screen flex flex-col hidden md:flex">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
          FitLM
        </h1>
        <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">Caderno Inteligente</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <div className="flex justify-between items-center mb-3 px-2">
            <h3 className="text-sm font-semibold text-gray-500">Fontes</h3>
            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{sources.length}</span>
          </div>
          
          <div className="space-y-2">
            {sources.map((source) => (
              <div 
                key={source.id}
                onClick={() => onToggleSource(source.id)}
                className={`group cursor-pointer p-3 rounded-lg border transition-all duration-200 relative ${
                  source.selected 
                    ? 'bg-white border-blue-400 shadow-sm' 
                    : 'bg-white border-transparent hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-md ${
                    source.type === SourceType.PDF ? 'bg-red-50 text-red-500' :
                    source.type === SourceType.IMAGE ? 'bg-purple-50 text-purple-500' :
                    source.type === SourceType.USER_INPUT ? 'bg-emerald-50 text-emerald-500' :
                    'bg-blue-50 text-blue-500'
                  }`}>
                    <IconFile className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{source.title}</p>
                    <p className="text-xs text-gray-400">{source.date} • {source.type}</p>
                  </div>
                  {source.selected && (
                    <IconCheck className="w-4 h-4 text-blue-500 absolute top-3 right-3" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={onAddSource}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
        >
          <IconPlus className="w-4 h-4" />
          Adicionar Fonte
        </button>
      </div>

      <div className="p-4 border-t border-gray-200 bg-white">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                BR
            </div>
            <div className="text-sm">
                <p className="font-medium text-gray-700">Usuário Pro</p>
                <p className="text-xs text-gray-400">Plano Premium</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default SourceSidebar;