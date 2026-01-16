
import React, { useState, useEffect } from 'react';
import { IconCalendar, IconCheck, IconAlert, IconList, IconScience } from './Icons';
import { MetricPoint } from '../types';

interface DateConfirmationModalProps {
    isOpen: boolean;
    fileName: string;
    suggestedDate: string | null; // Formato DD/MM/YYYY ou null
    metrics?: { category: string, data: MetricPoint }[]; // Dados extraídos para revisão
    onConfirm: (confirmedDate: string) => void;
    onCancel: () => void;
}

const DateConfirmationModal: React.FC<DateConfirmationModalProps> = ({ isOpen, fileName, suggestedDate, metrics = [], onConfirm, onCancel }) => {
    const [selectedDate, setSelectedDate] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Tenta converter DD/MM/YYYY (do OCR) para YYYY-MM-DD (Input HTML)
            if (suggestedDate && suggestedDate.includes('/')) {
                const parts = suggestedDate.split('/');
                if (parts.length === 3) {
                    // Assume DD/MM/YYYY
                    setSelectedDate(`${parts[2]}-${parts[1]}-${parts[0]}`);
                }
            } else if (suggestedDate) {
                // Tenta ISO direto se vier
                setSelectedDate(suggestedDate);
            } else {
                setSelectedDate('');
            }
        }
    }, [isOpen, suggestedDate]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (!selectedDate) {
            alert("Por favor, selecione uma data válida para o exame.");
            return;
        }
        // Converte de volta para DD/MM/YYYY para manter padrão do sistema
        const [year, month, day] = selectedDate.split('-');
        const formattedDate = `${day}/${month}/${year}`;
        onConfirm(formattedDate);
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in zoom-in-95 duration-200">
            <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <IconScience className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold uppercase tracking-tight leading-tight">Revisão Inteligente</h2>
                            <p className="text-blue-100 text-xs font-medium">Confirme os dados extraídos pela IA</p>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                    
                    {/* File Info */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                        <span className="text-xs font-bold text-gray-500 uppercase dark:text-gray-400">Arquivo Origem</span>
                        <span className="text-xs font-bold text-gray-900 truncate max-w-[200px] dark:text-white" title={fileName}>
                            {fileName}
                        </span>
                    </div>

                    {/* Date Selector (Critical) */}
                    <div>
                        <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 dark:text-gray-400">
                            <IconCalendar className="w-4 h-4 text-blue-500" />
                            Data do Exame (Obrigatório)
                        </label>
                        <div className="relative">
                            <input 
                                type="date" 
                                required
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full p-3 bg-white border-2 border-blue-100 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white shadow-sm transition-all"
                            />
                            {!suggestedDate && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <IconAlert className="w-4 h-4 text-orange-500 animate-pulse" />
                                </div>
                            )}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1.5 ml-1">
                            {suggestedDate 
                                ? `Data detectada automaticamente: ${suggestedDate}`
                                : "Data não encontrada no documento. Por favor insira manualmente."}
                        </p>
                    </div>

                    {/* Extracted Metrics Preview */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                <IconList className="w-4 h-4 text-purple-500" />
                                Dados Reconhecidos ({metrics.length})
                            </label>
                            {metrics.length > 0 && (
                                <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold dark:bg-green-900/30 dark:text-green-400">
                                    Extração Bem-sucedida
                                </span>
                            )}
                        </div>

                        <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden dark:bg-gray-800/50 dark:border-gray-700">
                            {metrics.length > 0 ? (
                                <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-48 overflow-y-auto custom-scrollbar">
                                    {metrics.map((m, idx) => (
                                        <div key={idx} className="p-3 flex justify-between items-center hover:bg-gray-100 transition-colors dark:hover:bg-gray-800">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 capitalize">
                                                    {m.category}
                                                </span>
                                                {(m.data.refMin !== undefined || m.data.refMax !== undefined) && (
                                                    <span className="text-[9px] text-gray-400 font-medium">
                                                        Ref: {m.data.refMin ?? '0'} - {m.data.refMax ?? '∞'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <span className="block text-sm font-black text-gray-900 dark:text-white">
                                                    {m.data.value}
                                                </span>
                                                <span className="text-[9px] font-bold text-gray-400 uppercase">
                                                    {m.data.unit || '-'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-6 text-center">
                                    <p className="text-xs text-gray-400 font-medium mb-1">Nenhum dado estruturado extraído.</p>
                                    <p className="text-[9px] text-gray-300">O documento será salvo apenas como texto para leitura da IA.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-5 border-t border-gray-100 bg-gray-50 flex gap-3 shrink-0 dark:bg-gray-900 dark:border-gray-800">
                    <button 
                        onClick={onCancel}
                        className="flex-1 py-3 text-gray-600 font-bold text-xs hover:bg-gray-200 rounded-xl transition-colors dark:text-gray-400 dark:hover:bg-gray-800"
                    >
                        Descartar
                    </button>
                    <button 
                        onClick={handleConfirm}
                        className="flex-[2] py-3 bg-black text-white font-bold text-xs rounded-xl hover:bg-gray-800 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 dark:bg-blue-600 dark:hover:bg-blue-700"
                    >
                        <IconCheck className="w-4 h-4" />
                        Confirmar e Salvar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DateConfirmationModal;
