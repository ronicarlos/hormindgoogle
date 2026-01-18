import { MetricPoint } from '../types';
import { MarkerInfo } from './markerRegistry';

export interface AnalysisResult {
    status: 'LOW' | 'BORDERLINE_LOW' | 'NORMAL' | 'BORDERLINE_HIGH' | 'HIGH' | 'CRITICAL_HIGH' | 'CRITICAL_LOW' | 'UNKNOWN';
    trend: 'UP' | 'DOWN' | 'STABLE' | 'UNKNOWN';
    trendPercent: number;
    delta: number;
    message: string;
    riskColor: string;
    activeRange: { min: number, max: number } | null;
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
    dynamicRef?: { min?: number, max?: number }
): AnalysisResult => {
    
    // 1. Determinar Faixa de Referência (LÓGICA DE FALLBACK ROBUSTA)
    // Prioridade: 
    // 1. Referência dinâmica do ponto (OCR) SE for válida
    // 2. Referência da base de conhecimento (Registry) baseada em gênero
    // 3. Referência geral da base de conhecimento
    
    let minRef: number | undefined = undefined;
    let maxRef: number | undefined = undefined;

    // Tenta usar referência dinâmica se existir e não for nula
    if (dynamicRef && dynamicRef.min !== undefined && dynamicRef.min !== null) minRef = dynamicRef.min;
    if (dynamicRef && dynamicRef.max !== undefined && dynamicRef.max !== null) maxRef = dynamicRef.max;

    // Se falhar a dinâmica, busca no Registry (Inteligência da IA)
    if (minRef === undefined || maxRef === undefined) {
        let registryRange: [number, number] | undefined = marker.ranges?.general;
        if (gender === 'Masculino' && marker.ranges?.male) registryRange = marker.ranges.male;
        else if (gender === 'Feminino' && marker.ranges?.female) registryRange = marker.ranges.female;

        if (registryRange) {
            if (minRef === undefined) minRef = registryRange[0];
            if (maxRef === undefined) maxRef = registryRange[1];
        }
    }

    // Se ainda não temos referências, é impossível calcular zonas
    if (minRef === undefined && maxRef === undefined) {
        return {
            status: 'UNKNOWN',
            trend: 'UNKNOWN',
            trendPercent: 0,
            delta: 0,
            message: 'Sem referência para análise.',
            riskColor: 'text-gray-400',
            activeRange: null
        };
    }

    // Normaliza infinitos para cálculo
    const effectiveMin = minRef !== undefined ? minRef : -999999;
    const effectiveMax = maxRef !== undefined ? maxRef : 999999;
    
    const activeRange = { min: effectiveMin, max: effectiveMax };

    // 2. Status (Lógica de 4 Zonas Percentuais)
    let status: AnalysisResult['status'] = 'UNKNOWN';
    let riskColor = 'text-gray-500 dark:text-gray-400';

    const span = effectiveMax - effectiveMin;
    
    // Se o span for muito grande (infinito) ou zero, não dá pra calcular porcentagem, usa lógica simples
    if (span > 100000 || span <= 0) {
        if (value < effectiveMin) { status = 'CRITICAL_LOW'; riskColor = 'text-red-600 dark:text-red-400'; }
        else if (value > effectiveMax) { status = 'CRITICAL_HIGH'; riskColor = 'text-red-600 dark:text-red-400'; }
        else { status = 'NORMAL'; riskColor = 'text-emerald-600 dark:text-emerald-400'; }
    } else {
        // CÁLCULO PERCENTUAL PRECISO
        // Zona Laranja (Atenção): 0% a 10% de distância do limite
        const orangeBuffer = span * 0.10; // 10%
        // Zona Amarela (Alerta): 10% a 20% de distância do limite
        const yellowBuffer = span * 0.20; // 20%

        // 1. VERMELHO (CRÍTICO) - Saiu do limite
        if (value < effectiveMin) {
            status = 'CRITICAL_LOW';
            riskColor = 'text-red-600 dark:text-red-400';
        } 
        else if (value > effectiveMax) {
            status = 'CRITICAL_HIGH';
            riskColor = 'text-red-600 dark:text-red-400';
        } 
        // 2. LARANJA (ATENÇÃO) - Dentro, mas a < 10% do limite (Zona de Perigo Iminente)
        else if (value <= effectiveMin + orangeBuffer) {
            status = 'LOW'; 
            riskColor = 'text-orange-600 dark:text-orange-400';
        }
        else if (value >= effectiveMax - orangeBuffer) {
            status = 'HIGH'; 
            riskColor = 'text-orange-600 dark:text-orange-400';
        }
        // 3. AMARELO (ALERTA) - Dentro, entre 10% e 20% do limite (Zona de Cuidado)
        else if (value <= effectiveMin + yellowBuffer) {
            status = 'BORDERLINE_LOW'; 
            riskColor = 'text-yellow-600 dark:text-yellow-400';
        }
        else if (value >= effectiveMax - yellowBuffer) {
            status = 'BORDERLINE_HIGH'; 
            riskColor = 'text-yellow-600 dark:text-yellow-400';
        }
        // 4. VERDE (NORMAL) - Longe dos limites (> 20%)
        else {
            status = 'NORMAL';
            riskColor = 'text-emerald-600 dark:text-emerald-400';
        }
    }

    // 3. Tendência
    let trend: AnalysisResult['trend'] = 'UNKNOWN';
    let trendPercent = 0;
    let delta = 0;

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
    const refText = `(Ref: ${effectiveMin} - ${effectiveMax})`;
    
    if (status === 'NORMAL') {
        message += `✅ Ideal. Longe dos limites.`;
    } else if (status === 'CRITICAL_HIGH' || status === 'CRITICAL_LOW') {
        message += `🔴 CRÍTICO: Ultrapassou a referência ${refText}.`;
    } else if (status === 'HIGH' || status === 'LOW') {
        message += `🟠 ATENÇÃO: Muito próximo do limite (<10%).`;
    } else if (status === 'BORDERLINE_HIGH' || status === 'BORDERLINE_LOW') {
        message += `🟡 ALERTA: Aproximando do limite (10-20%).`;
    } else {
        // Caso residual (se status for UNKNOWN ou outro não previsto, mas UNKNOWN é tratado no início)
        message += `Registrado: ${value}`;
    }

    if (trend !== 'UNKNOWN') {
        const arrow = trend === 'UP' ? '⬆️' : trend === 'DOWN' ? '⬇️' : '➡️';
        const absPercent = Math.abs(trendPercent).toFixed(1);
        message += ` ${arrow} ${trendPercent > 0 ? '+' : ''}${absPercent}% vs anterior.`;
    }

    return {
        status,
        trend,
        trendPercent,
        delta,
        message,
        riskColor,
        activeRange
    };
};
