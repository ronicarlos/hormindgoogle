
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

// Normaliza chaves para garantir match
export const normalizeMarkerKey = (key: string): string => {
    const k = key.toLowerCase().trim();
    
    // Hormonal
    if (k.includes('testo')) return 'testosterone';
    if (k.includes('estradiol') || k.includes('e2')) return 'estradiol';
    if (k.includes('prolactina')) return 'prolactin';
    if (k.includes('shbg')) return 'shbg';
    
    // Antropometria
    if (k.includes('peso') || k.includes('weight')) return 'weight';
    if (k.includes('gordura') || k.includes('bf') || k.includes('fat')) return 'bodyfat';
    
    // Lipídico & Metabólico
    if (k.includes('ldl')) return 'ldl';
    if (k.includes('hdl')) return 'hdl';
    if (k.includes('colesterol')) return 'cholesterol';
    if (k.includes('triglic')) return 'triglycerides';
    if (k.includes('glicose') || k.includes('glicemia')) return 'glucose';
    if (k.includes('hb1ac') || k.includes('glicada')) return 'hb1ac';
    if (k.includes('insulina')) return 'insulin';

    // Série Vermelha (Hemograma)
    if (k.includes('hematocrito') || k.includes('hematócrito')) return 'hematocrit';
    if (k.includes('hemoglobina')) return 'hemoglobin';
    if (k.includes('eritrocitos') || k.includes('hemacias') || k.includes('vermelhos')) return 'erythrocytes';
    if (k.includes('vcm')) return 'vcm';
    if (k.includes('hcm')) return 'hcm';
    
    // Série Branca & Plaquetas
    if (k.includes('leucocitos') || k.includes('leucócitos')) return 'leukocytes';
    if (k.includes('plaquetas')) return 'platelets';

    // Função Orgânica
    if (k.includes('creatinina')) return 'creatinine';
    if (k.includes('ureia')) return 'urea';
    if (k.includes('tgo') || k.includes('ast')) return 'tgo';
    if (k.includes('tgp') || k.includes('alt')) return 'tgp';
    if (k.includes('gama gt') || k.includes('ggt')) return 'ggt';
    if (k.includes('pcr') || k.includes('proteina c')) return 'crp';
    if (k.includes('ferritina')) return 'ferritin';
    if (k.includes('vitamina d')) return 'vitd';

    return 'generic';
};

export const MARKER_REGISTRY: Record<string, MarkerInfo> = {
    // === HORMONAL ===
    testosterone: {
        id: 'testosterone',
        label: 'Testosterona Total',
        unit: 'ng/dL',
        definition: 'Principal hormônio androgênico. Regula massa muscular, libido, energia e humor.',
        ranges: { male: [300, 900], female: [15, 70] },
        risks: {
            high: ['Aumento de hematócrito (sangue grosso)', 'Conversão em Estradiol', 'Acne e oleosidade'],
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
        ranges: { male: [20, 45], female: [30, 400] },
        risks: {
            high: ['Retenção hídrica', 'Ginecomastia (homens)', 'Labilidade emocional'],
            low: ['Dor articular', 'Risco de osteoporose', 'Queda de libido', 'Ressecamento']
        },
        tips: ['O equilíbrio T/E2 é mais importante que o número isolado.'],
        sources: [{ title: 'MedlinePlus', url: 'https://medlineplus.gov/lab-tests/estrogen-levels-test/' }]
    },
    prolactin: {
        id: 'prolactin',
        label: 'Prolactina',
        unit: 'ng/mL',
        definition: 'Hormônio ligado à lactação, mas em homens afeta libido e período refratário.',
        ranges: { male: [2, 18], female: [2, 29] },
        risks: {
            high: ['Disfunção erétil', 'Ginecomastia', 'Perda de libido'],
            low: ['Geralmente assintomático em homens']
        },
        tips: ['Estresse e falta de sono podem elevar a prolactina.'],
        sources: [{ title: 'Mayo Clinic', url: 'https://www.mayoclinic.org/' }]
    },

    // === HEMOGRAMA (SÉRIE VERMELHA) ===
    hemoglobin: {
        id: 'hemoglobin',
        label: 'Hemoglobina',
        unit: 'g/dL',
        definition: 'Proteína nas hemácias que transporta oxigênio para os tecidos.',
        ranges: { male: [13.5, 17.5], female: [12.0, 15.5] },
        risks: {
            high: ['Sangue viscoso (policitemia)', 'Risco de trombose', 'Dores de cabeça'],
            low: ['Anemia', 'Fadiga', 'Palidez', 'Falta de ar']
        },
        tips: ['Beba muita água se estiver alta. Consuma ferro se estiver baixa.'],
        sources: [{ title: 'Red Cross', url: 'https://www.redcrossblood.org/' }]
    },
    hematocrit: {
        id: 'hematocrit',
        label: 'Hematócrito',
        unit: '%',
        definition: 'Porcentagem do volume sanguíneo ocupado pelas células vermelhas.',
        ranges: { male: [38, 52], female: [35, 47] },
        risks: {
            high: ['Risco cardiovascular aumentado', 'Sobrecarga cardíaca', 'Hipertensão'],
            low: ['Sinal clássico de anemia', 'Fraqueza']
        },
        tips: ['Uso de testosterona exógena frequentemente eleva este marcador.'],
        sources: [{ title: 'NHLBI', url: 'https://www.nhlbi.nih.gov/' }]
    },
    erythrocytes: {
        id: 'erythrocytes',
        label: 'Eritrócitos (Hemácias)',
        unit: 'milhões/mm³',
        definition: 'Contagem total de células vermelhas no sangue.',
        ranges: { male: [4.5, 5.9], female: [4.0, 5.2] },
        risks: {
            high: ['Desidratação', 'Policitemia', 'Hipóxia crônica'],
            low: ['Anemia', 'Perda de sangue', 'Deficiência nutricional']
        },
        tips: ['Valores variam com a altitude.'],
        sources: [{ title: 'MedlinePlus', url: 'https://medlineplus.gov/' }]
    },
    
    // === IMUNIDADE & PLAQUETAS ===
    platelets: {
        id: 'platelets',
        label: 'Plaquetas',
        unit: 'mil/mm³',
        definition: 'Fragmentos celulares responsáveis pela coagulação do sangue.',
        ranges: { general: [150, 450] },
        risks: {
            high: ['Risco de coágulos espontâneos (trombose)'],
            low: ['Risco de hemorragia', 'Manchas roxas na pele', 'Dengue/Viroses']
        },
        tips: ['Quedas bruscas exigem atenção médica imediata.'],
        sources: [{ title: 'Cleveland Clinic', url: 'https://my.clevelandclinic.org/' }]
    },
    leukocytes: {
        id: 'leukocytes',
        label: 'Leucócitos Totais',
        unit: '/mm³',
        definition: 'Células de defesa do sistema imunológico.',
        ranges: { general: [4000, 11000] },
        risks: {
            high: ['Infecção ativa (bacteriana)', 'Inflamação', 'Estresse agudo'],
            low: ['Baixa imunidade', 'Infecções virais', 'Deficiência de B12']
        },
        tips: ['Treino muito intenso pode elevar leucócitos temporariamente.'],
        sources: [{ title: 'MedlinePlus', url: 'https://medlineplus.gov/' }]
    },

    // === METABÓLICO & LIPÍDICO ===
    glucose: {
        id: 'glucose',
        label: 'Glicose em Jejum',
        unit: 'mg/dL',
        definition: 'Nível de açúcar no sangue. Indicador primário de diabetes.',
        ranges: { general: [70, 99] },
        risks: {
            high: ['Resistência à insulina', 'Pré-diabetes', 'Diabetes tipo 2'],
            low: ['Hipoglicemia', 'Tontura', 'Confusão mental']
        },
        tips: ['O jejum real de 8h-12h é crucial para precisão.'],
        sources: [{ title: 'ADA', url: 'https://diabetes.org/' }]
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

    // === FUNÇÃO ORGÂNICA ===
    creatinine: {
        id: 'creatinine',
        label: 'Creatinina',
        unit: 'mg/dL',
        definition: 'Resíduo do metabolismo muscular filtrado pelos rins. Usado para estimar função renal.',
        ranges: { male: [0.7, 1.3], female: [0.6, 1.1] },
        risks: {
            high: ['Sobrecarga renal', 'Desidratação', 'Uso excessivo de proteína/creatina (falso positivo)'],
            low: ['Perda de massa muscular severa (Sarcopenia)']
        },
        tips: ['Atletas com muita massa muscular naturalmente têm creatinina mais alta sem ser doença renal.'],
        sources: [{ title: 'National Kidney Foundation', url: 'https://www.kidney.org/' }]
    },
    tgo: {
        id: 'tgo',
        label: 'TGO (AST)',
        unit: 'U/L',
        definition: 'Enzima presente no fígado e músculos. Indica lesão celular.',
        ranges: { general: [0, 40] },
        risks: {
            high: ['Inflamação hepática', 'Lesão muscular pós-treino intenso', 'Uso de orais'],
            low: ['Geralmente sem significado clínico']
        },
        tips: ['Treino pesado de musculação pode elevar TGO/TGP temporariamente.'],
        sources: [{ title: 'Mayo Clinic', url: 'https://www.mayoclinic.org/' }]
    },
    tgp: {
        id: 'tgp',
        label: 'TGP (ALT)',
        unit: 'U/L',
        definition: 'Enzima mais específica do fígado que o TGO.',
        ranges: { general: [0, 41] },
        risks: {
            high: ['Hepatite', 'Gordura no fígado (Esteatose)', 'Toxicidade medicamentosa'],
            low: ['Sem relevância clínica']
        },
        tips: ['Melhor marcador para monitorar saúde do fígado em ciclos.'],
        sources: [{ title: 'MedlinePlus', url: 'https://medlineplus.gov/' }]
    },

    // === ANTROPOMETRIA ===
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
        ranges: { male: [10, 20], female: [18, 28] },
        risks: {
            high: ['Resistência à insulina', 'Inflamação crônica', 'Baixa testosterona'],
            low: ['Queda hormonal', 'Perda de ciclo menstrual (mulheres)', 'Baixa energia']
        },
        tips: ['Homens atléticos geralmente buscam 10-15%.'],
        sources: [{ title: 'ACE Fitness', url: 'https://www.acefitness.org/' }]
    },

    // FALLBACK
    generic: {
        id: 'generic',
        label: 'Marcador',
        unit: '',
        definition: 'Marcador biológico extraído dos seus exames.',
        ranges: {},
        risks: { high: ['Consulte valores de referência do laboratório.'], low: ['Consulte valores de referência do laboratório.'] },
        tips: ['Compare com seus exames anteriores para ver a tendência.'],
        sources: []
    }
};

export const getMarkerInfo = (name: string): MarkerInfo => {
    const key = normalizeMarkerKey(name);
    const info = MARKER_REGISTRY[key] || MARKER_REGISTRY.generic;
    // Override label se for genérico para mostrar o nome real do exame
    if (key === 'generic') return { ...info, label: name };
    return info;
};
