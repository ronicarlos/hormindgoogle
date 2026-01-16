
import React, { useMemo } from 'react';
import { getMarkerInfo } from '../services/markerRegistry';
import { analyzePoint } from '../services/analyticsService';
import { MetricPoint } from '../types';
import { IconInfo, IconActivity, IconAlert, IconCheck } from './Icons';

interface RichTooltipProps {
    active?: boolean;
    payload?: any[];
    label?: string;
    gender: 'Masculino' | 'Feminino';
    history: MetricPoint[]; // Histórico completo para calcular tendência
}

const RichTooltip: React.FC<RichTooltipProps> = ({ active, payload, label, gender, history }) => {
    if (!active || !payload || !payload.length) return null;

    const dataPoint = payload[0]; // O ponto atual do gráfico
    const markerName = dataPoint.name;
    const value = Number(dataPoint.value);
    const date = label || '';

    // 1. Obter Inteligência do Registro
    const info = useMemo(() => getMarkerInfo(markerName), [markerName]);

    // 2. Executar Análise em Tempo Real
    const analysis = useMemo(() => {
        return analyzePoint(value, date, history, info, gender);
    }, [value, date, history, info, gender]);

    // Cor do Header baseada no Status
    let headerColor = 'bg-gray-50 border-gray-100 dark:bg-gray-800 dark:border-gray-700';
    if (analysis.status === 'HIGH') {
        headerColor = 'bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-800';
    } else if (analysis.status === 'LOW') {
        headerColor = 'bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800';
    } else if (analysis.status.includes('BORDERLINE')) {
        headerColor = 'bg-yellow-50 border-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-800';
    }

    return (
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-72 md:w-80 overflow-hidden text-left z-[100] animate-in fade-in zoom-in-95 duration-150 dark:bg-gray-900 dark:border-gray-700 pointer-events-none">
            
            {/* 1. Header: Valor e Status */}
            <div className={`p-3 border-b flex justify-between items-start ${headerColor}`}>
                <div>
                    <h4 className="font-black text-gray-900 text-sm uppercase tracking-wider dark:text-white">
                        {info.label}
                    </h4>
                    <span className="text-[10px] text-gray-500 font-bold dark:text-gray-400">{date}</span>
                </div>
                <div className="text-right">
                    <span className={`block text-xl font-black ${analysis.riskColor}`}>
                        {value} <span className="text-[10px] text-gray-400 font-medium uppercase">{info.unit}</span>
                    </span>
                </div>
            </div>

            {/* 2. Mini Analysis & Definition */}
            <div className="p-4 space-y-3 bg-white dark:bg-gray-900">
                
                {/* Definição Curta */}
                <p className="text-xs text-gray-500 leading-relaxed italic dark:text-gray-400">
                    "{info.definition}"
                </p>

                {/* Bloco de Análise do Usuário */}
                <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-1">
                        <IconActivity className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wide dark:text-gray-300">Análise Pessoal</span>
                    </div>
                    <p className="text-xs text-gray-800 font-medium leading-snug dark:text-gray-200">
                        {analysis.message}
                    </p>
                </div>

                {/* Riscos / Atenção (Condicional) */}
                {analysis.status !== 'NORMAL' && (
                    <div className="space-y-1">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase">
                            <IconAlert className="w-3 h-3" />
                            <span>{analysis.status.includes('HIGH') ? 'Se elevado pode indicar:' : 'Se baixo pode indicar:'}</span>
                        </div>
                        <ul className="list-disc pl-4 space-y-0.5">
                            {(analysis.status.includes('HIGH') ? info.risks.high : info.risks.low).map((risk, i) => (
                                <li key={i} className="text-[10px] text-gray-600 dark:text-gray-400">{risk}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Dica Rápida (Se Normal) */}
                {analysis.status === 'NORMAL' && info.tips.length > 0 && (
                    <div className="flex gap-2 items-start text-[10px] text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/30">
                        <IconCheck className="w-3 h-3 mt-0.5 shrink-0" />
                        <span>{info.tips[0]}</span>
                    </div>
                )}
            </div>

            {/* 3. Footer: Disclaimer */}
            <div className="p-2 bg-gray-50 border-t border-gray-100 text-center dark:bg-gray-800 dark:border-gray-700">
                <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wider">
                    Caráter Educativo • Não é Diagnóstico
                </p>
            </div>
        </div>
    );
};

export default RichTooltip;
