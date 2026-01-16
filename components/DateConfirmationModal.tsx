
import React, { useState, useEffect } from 'react';
import { IconCalendar, IconCheck, IconAlert } from './Icons';

interface DateConfirmationModalProps {
    isOpen: boolean;
    fileName: string;
    suggestedDate: string | null; // Formato DD/MM/YYYY ou null
    onConfirm: (confirmedDate: string) => void;
    onCancel: () => void;
}

const DateConfirmationModal: React.FC<DateConfirmationModalProps> = ({ isOpen, fileName, suggestedDate, onConfirm, onCancel }) => {
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
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center">
                    <IconCalendar className="w-12 h-12 mx-auto mb-3 text-white/90" />
                    <h2 className="text-xl font-black uppercase tracking-tight">Data do Exame</h2>
                    <p className="text-blue-100 text-xs font-medium mt-1">Validação Obrigatória</p>
                </div>

                <div className="p-6 space-y-6">
                    <div className="text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Arquivo:</p>
                        <p className="text-base font-bold text-gray-900 dark:text-white line-clamp-1 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                            {fileName}
                        </p>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 flex items-start gap-3 dark:bg-yellow-900/10 dark:border-yellow-900/30">
                        <IconAlert className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5 dark:text-yellow-400" />
                        <div className="text-xs text-yellow-800 dark:text-yellow-200 leading-relaxed">
                            <strong>Atenção:</strong> A data do exame é crucial para gerar gráficos corretos.
                            {suggestedDate ? (
                                <span className="block mt-1">
                                    A IA sugeriu: <strong className="text-black dark:text-white bg-yellow-200/50 px-1 rounded">{suggestedDate}</strong>. Confirme ou altere abaixo.
                                </span>
                            ) : (
                                <span className="block mt-1">
                                    A IA <strong>não encontrou</strong> uma data no documento. Por favor, informe manualmente.
                                </span>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1 dark:text-gray-400">
                            Data Oficial do Documento
                        </label>
                        <input 
                            type="date" 
                            required
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-lg font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-center shadow-sm"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button 
                            onClick={onCancel}
                            className="flex-1 py-3.5 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors dark:text-gray-400 dark:hover:bg-gray-800"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleConfirm}
                            className="flex-1 py-3.5 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 dark:bg-blue-600 dark:hover:bg-blue-700"
                        >
                            <IconCheck className="w-5 h-5" />
                            Confirmar Data
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DateConfirmationModal;
