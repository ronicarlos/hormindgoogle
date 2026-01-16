
import { MetricPoint } from '../types';
import { MarkerInfo } from './markerRegistry';

export interface AnalysisResult {
    status: 'LOW' | 'BORDERLINE_LOW' | 'NORMAL' | 'BORDERLINE_HIGH' | 'HIGH' | 'UNKNOWN';
    trend: 'UP' | 'DOWN' | 'STABLE' | 'UNKNOWN';
    trendPercent: number;
    delta: number;
    message: string;
    riskColor: string;
}

const parseDate = (dateStr: string): number => {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
    }
    return new Date(dateStr).getTime();
};

export const analyzePoint = (
    value: number, 
    date: string, 
    history: MetricPoint[], 
    marker: MarkerInfo, 
    gender: 'Masculino' | 'Feminino'
): AnalysisResult => {
    
    // 1. Determinar Faixa de Referência
    let range: [number, number] | undefined = marker.ranges?.general;
    if (gender === 'Masculino' && marker.ranges?.male) range = marker.ranges.male;
    else if (gender === 'Feminino' && marker.ranges?.female) range = marker.ranges.female;

    // 2. Status (High/Low/Normal/Borderline)
    let status: AnalysisResult['status'] = 'UNKNOWN';
    let riskColor = 'text-gray-500 dark:text-gray-400';

    if (range) {
        const [min, max] = range;
        // Margem de segurança de 15% para alertas preventivos
        // Evita divisão por zero se o range for 0
        const span = max - min;
        // Se o span for muito pequeno, usa porcentagem do valor absoluto, senão usa porcentagem do range
        const buffer = span > 0 ? span * 0.15 : max * 0.10; 

        if (value < min) {
            status = 'LOW';
            riskColor = 'text-blue-600 dark:text-blue-400';
        } else if (value <= min + buffer) {
            status = 'BORDERLINE_LOW';
            riskColor = 'text-yellow-600 dark:text-yellow-400'; // Preventivo Amarelo
        } else if (value > max) {
            status = 'HIGH';
            riskColor = 'text-red-600 dark:text-red-400'; // Crítico Vermelho (Atualizado de Orange para Red para diferenciar)
        } else if (value >= max - buffer) {
            status = 'BORDERLINE_HIGH';
            riskColor = 'text-yellow-600 dark:text-yellow-400'; // Preventivo Amarelo
        } else {
            status = 'NORMAL';
            riskColor = 'text-emerald-600 dark:text-emerald-400';
        }
    }

    // 3. Tendência (Comparando com ponto anterior mais próximo)
    let trend: AnalysisResult['trend'] = 'UNKNOWN';
    let trendPercent = 0;
    let delta = 0;

    // Ordenar histórico cronologicamente
    const sortedHistory = [...history].sort((a, b) => parseDate(a.date) - parseDate(b.date));
    const currentIndex = sortedHistory.findIndex(h => h.date === date && Number(h.value) === value);

    if (currentIndex > 0) {
        const prevPoint = sortedHistory[currentIndex - 1];
        const prevVal = Number(prevPoint.value);
        
        if (prevVal !== 0) {
            delta = value - prevVal;
            trendPercent = (delta / prevVal) * 100;
            
            if (trendPercent > 5) trend = 'UP';
            else if (trendPercent < -5) trend = 'DOWN';
            else trend = 'STABLE';
        }
    }

    // 4. Montar Mensagem Narrativa
    let message = '';
    
    // Parte A: Status
    if (status === 'NORMAL') message += `✅ Valor saudável e estável.`;
    else if (status === 'HIGH') message += `🚨 CRÍTICO: Acima da referência (${range?.[1]} ${marker.unit}).`;
    else if (status === 'LOW') message += `📉 CRÍTICO: Abaixo da referência (${range?.[0]} ${marker.unit}).`;
    else if (status === 'BORDERLINE_HIGH') message += `⚠️ ATENÇÃO: Próximo ao limite superior (${range?.[1]} ${marker.unit}).`;
    else if (status === 'BORDERLINE_LOW') message += `⚠️ ATENÇÃO: Próximo ao limite inferior (${range?.[0]} ${marker.unit}).`;
    else message += `Valor registrado: ${value}`;

    // Parte B: Tendência
    if (trend !== 'UNKNOWN') {
        const arrow = trend === 'UP' ? '⬆️' : trend === 'DOWN' ? '⬇️' : '➡️';
        const absPercent = Math.abs(trendPercent).toFixed(1);
        message += ` ${arrow} Variação de ${trendPercent > 0 ? '+' : ''}${absPercent}% em relação ao anterior.`;
    }

    return {
        status,
        trend,
        trendPercent,
        delta,
        message,
        riskColor
    };
};
