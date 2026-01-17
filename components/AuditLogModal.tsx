
import React, { useState, useEffect } from 'react';
import { AuditLog } from '../types';
import { dataService } from '../services/dataService';
import { supabase } from '../lib/supabase';
import { IconClose, IconHistory, IconList } from './Icons';

interface AuditLogModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose }) => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            const fetchLogs = async () => {
                setIsLoading(true);
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    const data = await dataService.getAuditLogs(session.user.id);
                    setLogs(data);
                }
                setIsLoading(false);
            };
            fetchLogs();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const toggleExpand = (id: string) => {
        setExpandedLogId(expandedLogId === id ? null : id);
    };

    const getActionColor = (type: string) => {
        switch (type) {
            case 'CREATE': return 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400';
            case 'UPDATE': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400';
            case 'DELETE': return 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[85vh]">
                
                {/* Header */}
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
                            <IconHistory className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Auditoria de Dados</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Rastreabilidade completa de alterações</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 dark:hover:bg-gray-700">
                        <IconClose className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-0 bg-white dark:bg-gray-950">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                            <p className="text-xs text-gray-400 mt-2">Carregando registros...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center p-8">
                            <IconList className="w-12 h-12 text-gray-200 mb-2 dark:text-gray-700" />
                            <p className="text-sm text-gray-500 font-medium">Nenhum registro de auditoria encontrado.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {logs.map((log) => (
                                <div key={log.id} className="group hover:bg-gray-50 transition-colors dark:hover:bg-gray-900">
                                    <div 
                                        className="p-4 cursor-pointer flex items-start gap-4"
                                        onClick={() => toggleExpand(log.id)}
                                    >
                                        <div className={`mt-1 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider min-w-[60px] text-center ${getActionColor(log.action_type)}`}>
                                            {log.action_type}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                                    {log.entity} <span className="text-gray-400 font-normal">via</span> {log.source}
                                                </h4>
                                                <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                                    {new Date(log.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 truncate dark:text-gray-400">
                                                ID: {log.id}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {expandedLogId === log.id && (
                                        <div className="px-4 pb-4 pl-[84px]">
                                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs font-mono overflow-x-auto dark:bg-black/30 dark:border-gray-800">
                                                <pre className="text-gray-700 dark:text-gray-300">
                                                    {JSON.stringify(log.details, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 text-center dark:bg-gray-900 dark:border-gray-800">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                        Apenas você tem acesso a estes registros
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuditLogModal;
