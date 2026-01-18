
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
    gender: 'Masculino' | 'Feminino',
    dynamicRef?: { min?: number, max?: number } // Nova prop para referências dinâmicas
): AnalysisResult => {
    
    // 1. Determinar Faixa de Referência
    let range: [number, number] | undefined = marker.ranges?.general;
    if (gender === 'Masculino' && marker.ranges?.male) range = marker.ranges.male;
    else if (gender === 'Feminino' && marker.ranges?.female) range = marker.ranges.female;

    // Se o marcador for genérico e tivermos referências dinâmicas, usá-las
    if (marker.isGeneric && dynamicRef && (dynamicRef.min !== undefined || dynamicRef.max !== undefined)) {
        // Fallback: Se faltar um lado, assume infinito (lógica simplificada para alertas)
        const min = dynamicRef.min !== undefined ? dynamicRef.min : -Infinity;
        const max = dynamicRef.max !== undefined ? dynamicRef.max : Infinity;
        range = [min, max];
    }

    // 2. Status (High/Low/Normal/Borderline)
    let status: AnalysisResult['status'] = 'UNKNOWN';
    let riskColor = 'text-gray-500 dark:text-gray-400';

    if (range) {
        const [min, max] = range;
        
        // Ajuste para Infinito (ex: apenas "Inferior a 10")
        const effectiveMin = min === -Infinity ? -999999 : min;
        const effectiveMax = max === Infinity ? 999999 : max;

        // Margem de segurança de 15% para alertas preventivos
        // Evita divisão por zero se o range for 0
        const span = effectiveMax - effectiveMin;
        const buffer = span > 0 && span < 999999 ? span * 0.15 : effectiveMax * 0.10; 

        if (value < effectiveMin) {
            status = 'LOW';
            riskColor = 'text-orange-600 dark:text-orange-400'; // Alterado para laranja (Atenção Baixa)
        } else if (value <= effectiveMin + buffer && min !== -Infinity) {
            status = 'BORDERLINE_LOW';
            riskColor = 'text-yellow-600 dark:text-yellow-400'; // Preventivo Amarelo
        } else if (value > effectiveMax) {
            status = 'HIGH';
            riskColor = 'text-orange-600 dark:text-orange-400'; // Alterado para laranja (Atenção Alta) - Não Vermelho
        } else if (value >= effectiveMax - buffer && max !== Infinity) {
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
    const refText = range ? `(${range[0] !== -Infinity ? range[0] : '<'} - ${range[1] !== Infinity ? range[1] : '>'} ${marker.unit})` : '';
    
    // Parte A: Status
    if (status === 'NORMAL') message += `✅ Valor saudável e estável.`;
    else if (status === 'HIGH') message += `⚠️ ATENÇÃO: Acima da referência ${refText}.`;
    else if (status === 'LOW') message += `⚠️ ATENÇÃO: Abaixo da referência ${refText}.`;
    else if (status === 'BORDERLINE_HIGH') message += `⚠️ ALERTA: Próximo ao limite superior ${refText}.`;
    else if (status === 'BORDERLINE_LOW') message += `⚠️ ALERTA: Próximo ao limite inferior ${refText}.`;
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
