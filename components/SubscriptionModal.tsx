
import React, { useState, useEffect } from 'react';
import { IconCheck, IconClose, IconSparkles, IconActivity, IconList } from './Icons';
import { dataService } from '../services/dataService';
import { supabase } from '../lib/supabase';
import { UsageLog } from '../types';

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentBill: number;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, currentBill }) => {
    const [history, setHistory] = useState<UsageLog[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const loadHistory = async () => {
                setIsLoading(true);
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    const logs = await dataService.getUsageHistory(session.user.id);
                    setHistory(logs);
                }
                setIsLoading(false);
            };
            loadHistory();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubscribe = () => {
        // Aqui iria a integração real com o Stripe Checkout
        // window.location.href = 'https://buy.stripe.com/SEU_LINK_AQUI';
        alert("Em breve: Integração Stripe Checkout. O plano custará R$ 29,90 fixos + Consumo.");
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] dark:bg-gray-900 dark:border dark:border-gray-800">
                
                {/* Header Gradient */}
                <div className="bg-gradient-to-br from-gray-900 to-black p-8 text-white relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <IconSparkles className="w-32 h-32 text-white" />
                    </div>
                    
                    <button onClick={onClose} className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
                        <IconClose className="w-5 h-5 text-white" />
                    </button>

                    <h2 className="text-2xl font-black mb-1">Fatura Inteligente</h2>
                    <p className="text-gray-400 text-sm mb-6">Pay-as-you-go (Pague o que usar)</p>

                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-4xl font-black text-emerald-400">R$ {(29.90 + currentBill).toFixed(2)}</span>
                        <span className="text-sm font-bold text-gray-400 mb-1.5">/mês (estimado)</span>
                    </div>
                    
                    <div className="flex gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        <span className="bg-white/10 px-2 py-1 rounded">Base: R$ 29,90</span>
                        <span className="text-gray-400 py-1">+</span>
                        <span className="bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded border border-emerald-500/30">Uso: R$ {currentBill.toFixed(2)}</span>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-black/20">
                    
                    <div className="mb-6">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <IconCheck className="w-4 h-4 text-blue-500" />
                            O que está incluso na Base?
                        </h3>
                        <ul className="space-y-3">
                            <li className="text-sm text-gray-600 flex gap-3 items-center dark:text-gray-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                Armazenamento ilimitado de exames
                            </li>
                            <li className="text-sm text-gray-600 flex gap-3 items-center dark:text-gray-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                Gráficos de evolução (Biomarcadores)
                            </li>
                            <li className="text-sm text-gray-600 flex gap-3 items-center dark:text-gray-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                Acesso à biblioteca de treinos e farmaco
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <IconActivity className="w-4 h-4 text-emerald-500" />
                            Histórico de Consumo (IA)
                        </h3>
                        
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden dark:bg-gray-800 dark:border-gray-700">
                            {isLoading ? (
                                <div className="p-4 text-center text-xs text-gray-400">Carregando...</div>
                            ) : history.length === 0 ? (
                                <div className="p-4 text-center text-xs text-gray-400">Nenhum uso registrado este mês.</div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {history.map((log) => (
                                        <div key={log.id} className="p-3 flex justify-between items-center text-xs">
                                            <div>
                                                <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider mr-2 ${
                                                    log.actionType === 'OCR' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                                                    log.actionType === 'PRONTUARIO' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                                                    'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                                }`}>
                                                    {log.actionType}
                                                </span>
                                                <span className="text-gray-500 dark:text-gray-400">{new Date(log.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <span className="font-mono font-bold text-gray-900 dark:text-white">
                                                R$ {log.cost.toFixed(4)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Footer Action */}
                <div className="p-6 bg-white border-t border-gray-100 dark:bg-gray-900 dark:border-gray-800">
                    <button 
                        onClick={handleSubscribe}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        Adicionar Cartão de Crédito
                    </button>
                    <p className="text-[10px] text-center text-gray-400 mt-3">
                        Processado seguramente pelo Stripe. Cancele a qualquer momento.
                    </p>
                </div>

            </div>
        </div>
    );
};

export default SubscriptionModal;
