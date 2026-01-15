import React, { useState, useRef } from 'react';
import { Project, Source, SourceType } from '../types';
import { IconFile, IconTrash, IconEye, IconDownload, IconSearch, IconFolder, IconPlus } from './Icons';
import { dataService } from '../services/dataService';

interface SourceListViewProps {
    project: Project;
    onViewSource: (source: Source) => void;
    onUpdateProject: (p: Project) => void;
    onUpload: (files: File[]) => void; // Alterado de onUploadClick para receber arquivos direto
}

const SourceListView: React.FC<SourceListViewProps> = ({ project, onViewSource, onUpdateProject, onUpload }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'ALL' | 'PDF' | 'IMAGE'>('ALL');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const filteredSources = project.sources.filter(s => {
        const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (s.specificType && s.specificType.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesType = filterType === 'ALL' 
            ? true 
            : filterType === 'PDF' 
                ? s.type === SourceType.PDF 
                : s.type === SourceType.IMAGE;

        return matchesSearch && matchesType && s.type !== SourceType.USER_INPUT; // Hide daily logs from file list
    });

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Tem certeza que deseja excluir este arquivo? Os dados extraídos nos gráficos permanecerão, mas o arquivo original será removido.')) {
            await dataService.deleteSource(id);
            const updatedSources = project.sources.filter(s => s.id !== id);
            onUpdateProject({ ...project, sources: updatedSources });
        }
    };

    const handleOpenOriginal = (e: React.MouseEvent, url?: string) => {
        e.stopPropagation();
        if (url) window.open(url, '_blank');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onUpload(Array.from(e.target.files));
            if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
        }
    };

    return (
        <div className="flex-1 bg-gray-50 h-full flex flex-col overflow-hidden dark:bg-gray-950">
            {/* Header */}
            <div className="shrink-0 bg-white border-b border-gray-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 dark:bg-gray-900 dark:border-gray-800">
                <div>
                    <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 dark:text-white">
                        <IconFolder className="w-6 h-6 text-blue-600" />
                        MEUS EXAMES
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1 dark:text-gray-400">
                        Gerenciador de Arquivos & Documentos
                    </p>
                </div>

                <div className="flex gap-2">
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
                        className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors shadow-sm dark:bg-blue-600 dark:hover:bg-blue-700"
                    >
                        <IconPlus className="w-4 h-4" />
                        Novo Upload
                    </button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="p-4 border-b border-gray-200 bg-white/50 backdrop-blur-sm flex flex-col md:flex-row gap-3 dark:bg-gray-900/50 dark:border-gray-800">
                <div className="relative flex-1">
                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Buscar por nome ou tipo..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    />
                </div>
                <div className="flex gap-2">
                    {['ALL', 'PDF', 'IMAGE'].map(t => (
                        <button
                            key={t}
                            onClick={() => setFilterType(t as any)}
                            className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors border ${
                                filterType === t 
                                ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300' 
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
                            }`}
                        >
                            {t === 'ALL' ? 'Todos' : t === 'PDF' ? 'PDFs' : 'Imagens'}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32">
                {filteredSources.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center opacity-50 border-2 border-dashed border-gray-300 rounded-2xl dark:border-gray-700">
                        <IconFolder className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">Nenhum arquivo encontrado.</p>
                        <p className="text-xs text-gray-400">Faça upload de exames para vê-los aqui.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredSources.map(source => (
                            <div 
                                key={source.id}
                                onClick={() => onViewSource(source)}
                                className="group bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden dark:bg-gray-900 dark:border-gray-800"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                        source.type === SourceType.PDF 
                                        ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' 
                                        : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                    }`}>
                                        <IconFile className="w-5 h-5" />
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {source.fileUrl && (
                                            <button 
                                                onClick={(e) => handleOpenOriginal(e, source.fileUrl)}
                                                className="p-1.5 hover:bg-gray-100 rounded text-gray-500 dark:hover:bg-gray-800"
                                                title="Baixar Original"
                                            >
                                                <IconDownload className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button 
                                            onClick={(e) => handleDelete(e, source.id)}
                                            className="p-1.5 hover:bg-red-50 rounded text-red-500 dark:hover:bg-red-900/30"
                                            title="Excluir"
                                        >
                                            <IconTrash className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1 dark:text-white">
                                    {source.title}
                                </h3>
                                
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-0.5 rounded dark:bg-gray-800 dark:text-gray-400">
                                        {source.specificType || source.type}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                        {source.date}
                                    </span>
                                </div>

                                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed dark:text-gray-400">
                                    {source.summary ? source.summary.substring(0, 100) : source.content.substring(0, 100)}...
                                </p>

                                <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-blue-600 text-xs font-bold dark:border-gray-800 dark:text-blue-400">
                                    <span className="flex items-center gap-1 group-hover:underline">
                                        <IconEye className="w-3 h-3" /> Ver Análise IA
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SourceListView;