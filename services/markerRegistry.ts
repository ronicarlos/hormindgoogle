
import { MetricPoint } from '../types';

export interface MarkerInfo {
    id: string;
    label: string;
    unit: string;
    definition: string;
    ranges?: {
        male?: [number, number]; // min, max
        female?: [number, number];
        general?: [number, number];
    };
    risks: {
        high: string[];
        low: string[];
    };
    tips: string[];
    sources: { title: string; url: string }[];
}

// Normaliza chaves (ex: 'Testosterona Total' -> 'testosterone')
export const normalizeMarkerKey = (key: string): string => {
    const k = key.toLowerCase().trim();
    if (k.includes('testo')) return 'testosterone';
    if (k.includes('estradiol') || k.includes('e2')) return 'estradiol';
    if (k.includes('peso') || k.includes('weight')) return 'weight';
    if (k.includes('gordura') || k.includes('bf') || k.includes('fat')) return 'bodyfat';
    if (k.includes('ldl')) return 'ldl';
    if (k.includes('hdl')) return 'hdl';
    if (k.includes('colesterol')) return 'cholesterol';
    if (k.includes('glicose') || k.includes('glicemia')) return 'glucose';
    if (k.includes('hematocrito')) return 'hematocrit';
    if (k.includes('hemoglobina')) return 'hemoglobin';
    if (k.includes('creatinina')) return 'creatinine';
    if (k.includes('tgo') || k.includes('ast')) return 'tgo';
    if (k.includes('tgp') || k.includes('alt')) return 'tgp';
    return 'generic';
};

export const MARKER_REGISTRY: Record<string, MarkerInfo> = {
    testosterone: {
        id: 'testosterone',
        label: 'Testosterona Total',
        unit: 'ng/dL',
        definition: 'Principal hormônio androgênico. Regula massa muscular, libido, energia e humor.',
        ranges: {
            male: [300, 900],
            female: [15, 70]
        },
        risks: {
            high: ['Aumento de hematócrito (sangue grosso)', 'Conversão em Estradiol', 'Acne e queda de cabelo'],
            low: ['Perda de massa muscular', 'Fadiga crônica', 'Baixa libido', 'Depressão']
        },
        tips: ['Sono adequado e gorduras boas na dieta ajudam a manter níveis naturais.'],
        sources: [{ title: 'Endocrine Society', url: 'https://www.endocrine.org/' }]
    },
    estradiol: {
        id: 'estradiol',
        label: 'Estradiol (E2)',
        unit: 'pg/mL',
        definition: 'Hormônio derivado da testosterona (em homens). Essencial para saúde óssea, articular e cerebral.',
        ranges: {
            male: [20, 45],
            female: [30, 400] // Varia muito com ciclo
        },
        risks: {
            high: ['Retenção hídrica', 'Ginecomastia (homens)', 'Labilidade emocional'],
            low: ['Dor articular', 'Risco de osteoporose', 'Queda de libido', 'Ressecamento']
        },
        tips: ['O equilíbrio T/E2 é mais importante que o número isolado.'],
        sources: [{ title: 'MedlinePlus', url: 'https://medlineplus.gov/lab-tests/estrogen-levels-test/' }]
    },
    weight: {
        id: 'weight',
        label: 'Peso Corporal',
        unit: 'kg',
        definition: 'Massa total do corpo. Sozinho não indica composição corporal (músculo vs gordura).',
        ranges: {}, // Sem range fixo, depende de altura
        risks: {
            high: ['Sobrecarga articular', 'Risco cardiovascular (se for gordura)'],
            low: ['Desnutrição', 'Perda de massa magra', 'Queda de imunidade']
        },
        tips: ['Avalie junto com o espelho e medidas de cintura.'],
        sources: [{ title: 'OMS', url: 'https://www.who.int/' }]
    },
    bodyfat: {
        id: 'bodyfat',
        label: 'Gordura Corporal (BF%)',
        unit: '%',
        definition: 'Porcentagem de tecido adiposo no corpo.',
        ranges: {
            male: [10, 20],
            female: [18, 28]
        },
        risks: {
            high: ['Resistência à insulina', 'Inflamação crônica', 'Baixa testosterona'],
            low: ['Queda hormonal', 'Perda de ciclo menstrual (mulheres)', 'Baixa energia']
        },
        tips: ['Homens atléticos geralmente buscam 10-15%.'],
        sources: [{ title: 'ACE Fitness', url: 'https://www.acefitness.org/' }]
    },
    ldl: {
        id: 'ldl',
        label: 'Colesterol LDL',
        unit: 'mg/dL',
        definition: 'Conhecido como "colesterol ruim". Transporta colesterol para as artérias.',
        ranges: { general: [0, 130] }, // Ideal < 100
        risks: {
            high: ['Formação de placas (aterosclerose)', 'Risco de infarto e AVC'],
            low: ['Raramente problemático, mas colesterol é base para hormônios']
        },
        tips: ['Reduzir gorduras saturadas e aumentar fibras ajuda no controle.'],
        sources: [{ title: 'American Heart Association', url: 'https://www.heart.org/' }]
    },
    hdl: {
        id: 'hdl',
        label: 'Colesterol HDL',
        unit: 'mg/dL',
        definition: '"Colesterol bom". Remove o colesterol das artérias e leva para o fígado.',
        ranges: { general: [40, 100] }, // Ideal > 40 (H), > 50 (M)
        risks: {
            high: ['Geralmente protetor (fator de longevidade)'],
            low: ['Aumenta risco cardiovascular significativamente']
        },
        tips: ['Exercício aeróbico e gorduras saudáveis (azeite, abacate) aumentam o HDL.'],
        sources: [{ title: 'Mayo Clinic', url: 'https://www.mayoclinic.org/' }]
    },
    hematocrit: {
        id: 'hematocrit',
        label: 'Hematócrito',
        unit: '%',
        definition: 'Porcentagem do volume sanguíneo ocupado pelas células vermelhas.',
        ranges: { male: [38, 52], female: [35, 47] },
        risks: {
            high: ['Sangue viscoso (grosso)', 'Risco de trombose', 'Sobrecarga cardíaca'],
            low: ['Anemia', 'Baixa oxigenação', 'Fadiga']
        },
        tips: ['Hidratação é fundamental. Uso de testosterona tende a aumentar este valor.'],
        sources: [{ title: 'Red Cross', url: 'https://www.redcrossblood.org/' }]
    },
    creatinine: {
        id: 'creatinine',
        label: 'Creatinina',
        unit: 'mg/dL',
        definition: 'Resíduo do metabolismo muscular filtrado pelos rins.',
        ranges: { male: [0.7, 1.3], female: [0.6, 1.1] },
        risks: {
            high: ['Sobrecarga renal', 'Desidratação', 'Uso excessivo de proteína/creatina (falso positivo)'],
            low: ['Perda de massa muscular severa']
        },
        tips: ['Musculação e suplementação de creatina podem elevar o valor sem significar dano renal.'],
        sources: [{ title: 'National Kidney Foundation', url: 'https://www.kidney.org/' }]
    },
    generic: {
        id: 'generic',
        label: 'Biomarcador',
        unit: '',
        definition: 'Indicador fisiológico monitorado.',
        ranges: {},
        risks: { high: ['Valor acima do esperado.'], low: ['Valor abaixo do esperado.'] },
        tips: ['Compare com valores anteriores.'],
        sources: []
    }
};

export const getMarkerInfo = (name: string): MarkerInfo => {
    const key = normalizeMarkerKey(name);
    const info = MARKER_REGISTRY[key] || MARKER_REGISTRY.generic;
    // Override label if generic to render the actual chart name
    if (key === 'generic') return { ...info, label: name };
    return info;
};
