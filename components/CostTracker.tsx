
import React, { useEffect, useState } from 'react';
import { IconActivity, IconSparkles, IconAlert } from './Icons';
import { dataService } from '../services/dataService';
import { supabase } from '../lib/supabase';

interface CostTrackerProps {
    refreshTrigger: number;
    onOpenSubscription: () => void;
    variant?: 'floating' | 'inline';
}

const CostTracker: React.FC<CostTrackerProps> = ({ refreshTrigger, onOpenSubscription, variant = 'floating' }) => {
    const [currentBill, setCurrentBill] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBill = async () => {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const bill = await dataService.getCurrentMonthBill(session.user.id);
                setCurrentBill(bill);
            }
            setLoading(false);
        };
        fetchBill();
    }, [refreshTrigger]); // Atualiza quando o pai mandar

    if (variant === 'inline') {
        return (
            <div
                onClick={onOpenSubscription}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between cursor-pointer hover:border-green-300 transition-colors group dark:bg-gray-900 dark:border-gray-800"
            >
                <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl w-12 h-12 flex items-center justify-center text-white shadow-lg shadow-green-500/30">
                        <span className="font-serif font-black text-lg">R$</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-sm md:text-base dark:text-white group-hover:text-green-600 transition-colors">Fatura Atual (IA)</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Clique para ver detalhes do consumo</p>
                    </div>
                </div>
                <div className="text-right">
                     {loading ? (
                        <div className="h-6 w-20 bg-gray-200 rounded animate-pulse dark:bg-gray-800" />
                    ) : (
                        <div className="flex flex-col items-end">
                            <span className="text-xl font-black text-gray-900 dark:text-white">
                                R$ {currentBill.toFixed(2)}
                            </span>
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-bold dark:bg-gray-800 dark:text-gray-400">
                                + R$ 29,90 Base
                            </span>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div 
            onClick={onOpenSubscription}
            className="group fixed bottom-20 left-4 z-40 bg-white/90 backdrop-blur-md border border-gray-200 shadow-xl rounded-2xl p-3 flex items-center gap-3 cursor-pointer hover:scale-105 transition-all active:scale-95 md:bottom-6 md:left-6 dark:bg-gray-900/90 dark:border-gray-800"
        >
            <div className="bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl w-10 h-10 flex items-center justify-center text-white shadow-lg shadow-green-500/30">
                <span className="font-serif font-black text-xs">R$</span>
            </div>
            
            <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5 dark:text-gray-500">
                    Fatura Atual (IA)
                </p>
                <div className="flex items-center gap-1.5">
                    {loading ? (
                        <div className="h-4 w-12 bg-gray-200 rounded animate-pulse dark:bg-gray-800" />
                    ) : (
                        <span className="text-sm font-black text-gray-900 dark:text-white">
                            R$ {currentBill.toFixed(2)}
                        </span>
                    )}
                    <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-bold dark:bg-gray-800 dark:text-gray-400">
                        +Plano
                    </span>
                </div>
            </div>

            {/* Hover Tooltip (Desktop) */}
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 w-48 bg-gray-900 text-white text-xs p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden md:block z-50 shadow-2xl">
                <p className="font-bold mb-1 text-emerald-400">Transparência Total</p>
                <p className="opacity-80 leading-relaxed">Você paga a assinatura base + o custo exato de processamento da IA (Pay-as-you-go). Clique para detalhes.</p>
                <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-gray-900 rotate-45" />
            </div>
        </div>
    );
};

export default CostTracker;
