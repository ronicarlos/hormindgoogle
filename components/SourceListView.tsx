
import React, { useState, useRef } from 'react';
import { Project, Source, SourceType } from '../types';
import { IconFile, IconTrash, IconEye, IconDownload, IconSearch, IconFolder, IconPlus, IconAlert } from './Icons';
import { dataService } from '../services/dataService';

interface SourceListViewProps {
    project: Project;
    onViewSource: (source: Source) => void;
    onUpdateProject: (p: Project) => void;
    onUpload: (files: File[]) => void;
    onUploadClick?: () => void; // Compatibilidade de tipo
}

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm }: { isOpen: boolean; onClose: () => void; onConfirm: () => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl dark:bg-gray-900 dark:border dark:border-gray-800 border border-gray-100">
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 dark:bg-red-900/30 dark:text-red-400">
                        <IconTrash className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 dark:text-white">Excluir Arquivo?</h3>
                    <p className="text-sm text-gray-500 mb-6 leading-relaxed dark:text-gray-400">
                        Esta ação é irreversível. O documento e seus dados serão removidos permanentemente do projeto.
                    </p>
                    <div className="flex gap-3 w-full">
                        <button 
                            onClick={onClose}
                            className="flex-1 px-4 py-3 text-gray-700 font-bold text-sm bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={onConfirm}
                            className="flex-1 px-4 py-3 bg-red-600 text-white font-bold text-sm rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30"
                        >
                            Sim, Excluir
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SourceListView: React.FC<SourceListViewProps> = ({ project, onViewSource, onUpdateProject, onUpload }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'ALL' | 'PDF' | 'IMAGE'>('ALL');
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [itemToDelete, setItemToDelete] = useState<{ id: string, filePath?: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const filteredSources = project.sources.filter(s => {
        const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (s.specificType && s.specificType.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesType = filterType === 'ALL' 
            ? true 
            : filterType === 'PDF' 
                ? s.type === SourceType.PDF 
                : s.type === SourceType.IMAGE;

        return matchesSearch && matchesType && s.type !== SourceType.USER_INPUT;
    });

    const handleRequestDelete = (e: React.MouseEvent, id: string, filePath?: string) => {
        e.stopPropagation();
        e.preventDefault();
        setItemToDelete({ id, filePath });
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        const { id, filePath } = itemToDelete;
        
        // Fecha modal e inicia loading
        setItemToDelete(null);
        setIsDeleting(id);
        
        try {
            const error = await dataService.deleteSource(id, filePath);
            
            if (error) {
                console.error("Erro Delete:", error);
                // Fallback visual para erro (já que alert pode ser bloqueado também)
                console.log(`ERRO AO EXCLUIR: ${error.message || 'Permissão negada'}. Verifique SQL.`);
            } else {
                const updatedSources = project.sources.filter(s => s.id !== id);
                onUpdateProject({ ...project, sources: updatedSources });
            }
        } catch (err: any) {
            console.error("Erro inesperado delete:", err);
        } finally {
            setIsDeleting(null);
        }
    };

    const handleOpenOriginal = (e: React.MouseEvent, url?: string) => {
        e.stopPropagation();
        if (url) window.open(url, '_blank');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onUpload(Array.from(e.target.files));
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="flex-1 bg-gray-50 h-full flex flex-col overflow-hidden dark:bg-gray-950 relative">
            
            <DeleteConfirmationModal 
                isOpen={!!itemToDelete} 
                onClose={() => setItemToDelete(null)} 
                onConfirm={handleConfirmDelete} 
            />

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
                                className={`group bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden dark:bg-gray-900 dark:border-gray-800 ${isDeleting === source.id ? 'opacity-50 pointer-events-none' : ''}`}
                            >
                                <div className="flex items-start justify-between mb-3 relative">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                        source.type === SourceType.PDF 
                                        ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' 
                                        : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                    }`}>
                                        <IconFile className="w-5 h-5" />
                                    </div>
                                    
                                    {/* AÇÕES: Visível SEMPRE no mobile (opacity-100), Hover no Desktop (md:opacity-0) */}
                                    <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity relative z-20 bg-white/90 backdrop-blur-sm rounded-lg p-1 border border-gray-100 shadow-sm dark:bg-gray-900/90 dark:border-gray-700">
                                        {source.fileUrl && (
                                            <button 
                                                onClick={(e) => handleOpenOriginal(e, source.fileUrl)}
                                                className="p-2 hover:bg-gray-100 rounded text-gray-500 dark:hover:bg-gray-800"
                                                title="Baixar Original"
                                            >
                                                <IconDownload className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button 
                                            onClick={(e) => handleRequestDelete(e, source.id, source.filePath)}
                                            className="p-2 hover:bg-red-100 rounded text-red-500 dark:hover:bg-red-900/30"
                                            title="Excluir Permanentemente"
                                            disabled={isDeleting === source.id}
                                        >
                                            {isDeleting === source.id ? (
                                                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <IconTrash className="w-4 h-4" />
                                            )}
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
