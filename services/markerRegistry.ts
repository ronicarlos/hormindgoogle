
import { MetricPoint, LearnedMarker } from '../types';

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
    isGeneric?: boolean; // Flag para identificar marcadores dinâmicos
    isLearned?: boolean; // Flag nova: Marcador pesquisado pela IA
}

// Normaliza chaves para garantir match
export const normalizeMarkerKey = (key: string): string => {
    const k = key.toLowerCase().trim();
    
    // Hormonal (Eixo & Sexual)
    if (k === 'fsh' || k.includes('foliculo') || k.includes('folículo')) return 'fsh';
    if (k === 'lh' || k.includes('luteinizante')) return 'lh';
    if (k.includes('testo')) return 'testosterone';
    if (k.includes('estradiol') || k.includes('e2')) return 'estradiol';
    if (k.includes('prolactina')) return 'prolactin';
    if (k.includes('shbg') || k.includes('globulina')) return 'shbg';
    if (k.includes('progesterona')) return 'progesterone';
    
    // Tireoide
    if (k === 'tsh' || k.includes('tireoestimulante')) return 'tsh';
    if (k.includes('t4') || k.includes('tiroxina')) return 't4';
    if (k.includes('t3') || k.includes('triiodotironina')) return 't3';

    // Bioimpedância & Antropometria
    if (k.includes('esquelética') || k.includes('esqueletica') || k.includes('massa muscular')) return 'musclemass';
    if (k.includes('visceral')) return 'visceralfat';
    if (k.includes('agua') || k.includes('água') || k.includes('hidratacao')) return 'bodywater';
    if (k.includes('basal') || k.includes('tmb')) return 'bmr_metric';
    if (k.includes('peso') || k.includes('weight')) return 'weight';
    if (k.includes('gordura') || k.includes('bf') || k.includes('fat')) return 'bodyfat';
    if (k.includes('imc') || k.includes('bmi')) return 'bmi_metric';
    
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
    if (k.includes('neutrofilos') || k.includes('neutrófilos')) return 'neutrophils';
    if (k.includes('linfocitos') || k.includes('linfócitos')) return 'lymphocytes';

    // Função Orgânica & Vitaminas
    if (k.includes('creatinina')) return 'creatinine';
    if (k.includes('ureia')) return 'urea';
    if (k.includes('tgo') || k.includes('ast')) return 'tgo';
    if (k.includes('tgp') || k.includes('alt')) return 'tgp';
    if (k.includes('gama gt') || k.includes('ggt')) return 'ggt';
    if (k.includes('pcr') || k.includes('proteina c')) return 'crp';
    if (k.includes('ferritina')) return 'ferritin';
    if (k.includes('vitamina d') || k.includes('25-hidroxi')) return 'vitd';
    if (k.includes('vitamina b12') || k.includes('cobalamina')) return 'vitb12';
    if (k.includes('cpk') || k.includes('ck')) return 'cpk';

    return 'generic';
};

export const MARKER_REGISTRY: Record<string, MarkerInfo> = {
    // === EIXO HPTA (LH, FSH, SHBG) ===
    fsh: {
        id: 'fsh',
        label: 'FSH (Hormônio Folículo Estimulante)',
        unit: 'mUI/mL',
        definition: 'Hormônio produzido pela hipófise. Em homens, estimula a produção de espermatozoides (espermatogênese). Em mulheres, estimula o crescimento dos folículos ovarianos.',
        ranges: { male: [1.5, 12.4], female: [3.5, 12.5] }, // Fase folicular ref mulher
        risks: {
            high: ['Falência testicular (homens)', 'Menopausa ou falência ovariana (mulheres)', 'Síndrome de Klinefelter'],
            low: ['Uso de esteroides anabolizantes (supressão do eixo)', 'Hipogonadismo hipogonadotrófico', 'Problemas na hipófise']
        },
        tips: ['Se você usa testosterona exógena, é normal que este valor esteja próximo de zero (eixo inibido).'],
        sources: [{ title: 'MedlinePlus', url: 'https://medlineplus.gov/lab-tests/follicle-stimulating-hormone-fsh-levels-test/' }]
    },
    lh: {
        id: 'lh',
        label: 'LH (Hormônio Luteinizante)',
        unit: 'mUI/mL',
        definition: 'O "sinalizador" da testosterona. A hipófise envia LH para os testículos (células de Leydig) ordenando a produção de testosterona.',
        ranges: { male: [1.7, 8.6], female: [2.4, 12.6] },
        risks: {
            high: ['Testículos não estão respondendo (falência primária)', 'Insensibilidade androgênica'],
            low: ['Uso de hormônios exógenos (ciclo/TRT)', 'Problemas na hipófise (tumor)', 'Estresse severo']
        },
        tips: ['LH baixo com Testosterona alta indica uso de esteroides. LH alto com Testosterona baixa indica problema no testículo.'],
        sources: [{ title: 'Endocrine Society', url: 'https://www.endocrine.org/' }]
    },
    shbg: {
        id: 'shbg',
        label: 'SHBG (Globulina Ligadora)',
        unit: 'nmol/L',
        definition: 'Proteína que "transporta" hormônios sexuais no sangue. Testosterona ligada ao SHBG está inativa. Apenas a livre funciona.',
        ranges: { male: [10, 57], female: [18, 144] },
        risks: {
            high: ['Menos testosterona livre disponível', 'Hipertireoidismo', 'Doença hepática', 'Dietas muito restritivas'],
            low: ['Resistência à insulina', 'Obesidade', 'Hipotireoidismo', 'Uso de andrógenos (especialmente Stanozolol/Proviron)']
        },
        tips: ['Se o SHBG está baixo, você tem mais testo livre, mas cuidado com a resistência à insulina.'],
        sources: [{ title: 'Roche Diagnostics', url: 'https://diagnostics.roche.com/' }]
    },

    // === TIREOIDE ===
    tsh: {
        id: 'tsh',
        label: 'TSH (Hormônio Tireoestimulante)',
        unit: 'mUI/L',
        definition: 'Hormônio da hipófise que controla a tireoide. É o "termostato" do metabolismo.',
        ranges: { general: [0.4, 4.5] },
        risks: {
            high: ['Hipotireoidismo (metabolismo lento)', 'Ganho de peso', 'Fadiga', 'Frio excessivo'],
            low: ['Hipertireoidismo (metabolismo acelerado)', 'Perda de peso', 'Ansiedade', 'Taquicardia']
        },
        tips: ['TSH acima de 2.5 já pode dificultar a perda de peso em algumas pessoas.'],
        sources: [{ title: 'Thyroid.org', url: 'https://www.thyroid.org/' }]
    },
    t4: {
        id: 't4',
        label: 'T4 Livre (Tiroxina)',
        unit: 'ng/dL',
        definition: 'Principal hormônio produzido pela tireoide. É convertido em T3 (a forma ativa) nos tecidos.',
        ranges: { general: [0.7, 1.8] },
        risks: {
            high: ['Hipertireoidismo', 'Excesso de medicação tireoidiana'],
            low: ['Hipotireoidismo', 'Falta de iodo', 'Dano tireoidiano']
        },
        tips: ['Analise sempre junto com o TSH e T3.'],
        sources: [{ title: 'MedlinePlus', url: 'https://medlineplus.gov/' }]
    },

    // === BIOIMPEDÂNCIA & COMPOSIÇÃO CORPORAL ===
    musclemass: {
        id: 'musclemass',
        label: 'Massa Muscular Esquelética',
        unit: 'kg',
        definition: 'Peso total dos músculos que você pode controlar (braços, pernas, peito, costas). É o tecido metabolicamente ativo que queima calorias e gera força.',
        ranges: { male: [30, 50], female: [20, 35] }, // Valores aproximados absolutos variam muito com altura
        risks: {
            high: ['Geralmente positivo (metabolismo alto)', 'Se excessivo (fisiculturismo), sobrecarga cardíaca leve'],
            low: ['Sarcopenia (fraqueza)', 'Metabolismo lento', 'Risco de quedas', 'Resistência à insulina']
        },
        tips: ['Aumentar isso é a melhor forma de garantir longevidade e queima de gordura passiva.'],
        sources: [{ title: 'InBody Academy', url: 'https://inbodyusa.com/blog/' }]
    },
    visceralfat: {
        id: 'visceralfat',
        label: 'Gordura Visceral (Nível)',
        unit: 'lvl',
        definition: 'Gordura armazenada profundamente no abdômen, envolvendo os órgãos. É a gordura mais perigosa para a saúde cardíaca.',
        ranges: { general: [1, 9] }, // Escala InBody comum (1-9 saudável)
        risks: {
            high: ['Risco altíssimo de diabetes', 'Doença cardíaca', 'Inflamação crônica', 'Esteatose hepática'],
            low: ['Geralmente saudável', 'Se zero, possível desnutrição (raro)']
        },
        tips: ['Deve ser mantida abaixo do nível 10. Exercício aeróbico é o mais eficaz para reduzi-la.'],
        sources: [{ title: 'Harvard Health', url: 'https://www.health.harvard.edu/' }]
    },
    bodywater: {
        id: 'bodywater',
        label: 'Água Corporal Total',
        unit: 'L',
        definition: 'Quantidade total de fluido no corpo. Músculos seguram mais água que gordura.',
        ranges: { male: [40, 70], female: [30, 50] }, // Em Litros, muito variável
        risks: {
            high: ['Retenção hídrica (inchaço)', 'Problemas renais ou cardíacos', 'Uso de creatina/esteroides (intracelular é bom)'],
            low: ['Desidratação', 'Perda de performance', 'Cãibras']
        },
        tips: ['Beber mais água ajuda a eliminar a retenção (paradoxo da diurese).'],
        sources: [{ title: 'Mayo Clinic', url: 'https://www.mayoclinic.org/' }]
    },
    bmi_metric: {
        id: 'bmi_metric',
        label: 'IMC (Índice de Massa Corporal)',
        unit: 'kg/m²',
        definition: 'Cálculo simples de peso pela altura. ATENÇÃO: Falha em atletas pois não diferencia músculo de gordura.',
        ranges: { general: [18.5, 24.9] },
        risks: {
            high: ['Obesidade (população geral)', 'Sobrecarga articular (mesmo se for músculo)'],
            low: ['Desnutrição', 'Fragilidade']
        },
        tips: ['Se você treina pesado, ignore o IMC e foque no Percentual de Gordura.'],
        sources: [{ title: 'CDC', url: 'https://www.cdc.gov/' }]
    },

    // === INFLAMAÇÃO & MINERAIS ===
    crp: {
        id: 'crp',
        label: 'PCR (Proteína C-Reativa)',
        unit: 'mg/dL',
        definition: 'Marcador de inflamação aguda ou crônica no corpo. Produzida pelo fígado em resposta a inflamação.',
        ranges: { general: [0, 0.5] }, // Ultrassensível < 0.3 ideal
        risks: {
            high: ['Infecção ativa (bacteriana)', 'Risco cardiovascular (inflamação nas artérias)', 'Overreaching (treino excessivo)'],
            low: ['Excelente estado de saúde', 'Baixa inflamação sistêmica']
        },
        tips: ['PCR cronicamente alta sem infecção pode indicar risco cardíaco futuro.'],
        sources: [{ title: 'American Heart Association', url: 'https://www.heart.org/' }]
    },
    ferritin: {
        id: 'ferritin',
        label: 'Ferritina',
        unit: 'ng/mL',
        definition: 'Proteína que armazena ferro nas células. É o "tanque de combustível" de ferro do corpo.',
        ranges: { male: [30, 400], female: [15, 150] },
        risks: {
            high: ['Inflamação aguda (reagente de fase aguda)', 'Hemocromatose (excesso de ferro)', 'Síndrome metabólica'],
            low: ['Anemia ferropriva', 'Queda de cabelo', 'Fadiga extrema', 'Síndrome das pernas inquietas']
        },
        tips: ['Ferritina muito alta nem sempre é excesso de ferro, pode ser inflamação/fígado.'],
        sources: [{ title: 'Iron Disorders Institute', url: 'https://irondisorders.org/' }]
    },
    vitd: {
        id: 'vitd',
        label: 'Vitamina D (25-OH)',
        unit: 'ng/mL',
        definition: 'Pré-hormônio esteroide. Crucial para absorção de cálcio, função imune e produção de testosterona.',
        ranges: { general: [30, 100] }, // Ideal > 40
        risks: {
            high: ['Toxicidade (raro, >150)', 'Excesso de cálcio no sangue'],
            low: ['Osteoporose', 'Depressão', 'Baixa imunidade', 'Baixa testosterona']
        },
        tips: ['A maioria das pessoas modernas tem deficiência. Suplementação e sol são essenciais.'],
        sources: [{ title: 'Vitamin D Council', url: 'https://www.vitamindcouncil.org/' }]
    },
    cpk: {
        id: 'cpk',
        label: 'CPK (Creatinofosfoquinase)',
        unit: 'U/L',
        definition: 'Enzima encontrada no músculo esquelético, coração e cérebro. Vaza para o sangue quando há dano muscular.',
        ranges: { male: [40, 300], female: [25, 200] },
        risks: {
            high: ['Dano muscular intenso pós-treino', 'Rabdomiólise (perigoso para os rins)', 'Uso de estatinas'],
            low: ['Perda de massa muscular', 'Sedentarismo extremo']
        },
        tips: ['Atletas sempre terão CPK mais alto que sedentários. Beba muita água se estiver alto.'],
        sources: [{ title: 'Muscular Dystrophy Assn', url: 'https://www.mda.org/' }]
    },

    // === FUNÇÃO ORGÂNICA (FÍGADO/RINS) ===
    ggt: {
        id: 'ggt',
        label: 'Gama GT',
        unit: 'U/L',
        definition: 'Enzima do fígado muito sensível a toxinas, álcool e estase biliar (bile parada).',
        ranges: { male: [10, 71], female: [6, 42] },
        risks: {
            high: ['Abuso de álcool', 'Dano hepático tóxico (orais)', 'Obstrução biliar'],
            low: ['Sem relevância clínica']
        },
        tips: ['Melhor marcador para ver se o "fígado sentiu" o ciclo ou o álcool.'],
        sources: [{ title: 'Liver Foundation', url: 'https://liverfoundation.org/' }]
    },
    urea: {
        id: 'urea',
        label: 'Ureia',
        unit: 'mg/dL',
        definition: 'Produto final do metabolismo de proteínas. Excretada pelos rins.',
        ranges: { general: [10, 50] },
        risks: {
            high: ['Dieta muito rica em proteína (comum em atletas)', 'Desidratação', 'Problema renal (se creatinina também subir)'],
            low: ['Desnutrição proteica', 'Falência hepática grave', 'Gravidez']
        },
        tips: ['Se a Creatinina está normal, Ureia alta geralmente é só excesso de proteína na dieta ou pouca água.'],
        sources: [{ title: 'National Kidney Foundation', url: 'https://www.kidney.org/' }]
    },
    insulin: {
        id: 'insulin',
        label: 'Insulina (Jejum)',
        unit: 'µUI/mL',
        definition: 'Hormônio que controla a entrada de glicose nas células. Nível em jejum indica sensibilidade.',
        ranges: { general: [2, 25] }, // Ideal funcional < 10
        risks: {
            high: ['Resistência à insulina', 'Síndrome metabólica', 'Dificuldade extrema em perder gordura'],
            low: ['Diabetes Tipo 1', 'Dano pancreático']
        },
        tips: ['Insulina baixa em jejum (< 6) é o "Santo Graal" para queima de gordura e longevidade.'],
        sources: [{ title: 'Diabetes.org', url: 'https://diabetes.org/' }]
    },

    // === HORMONAL JÁ EXISTENTE (Mantido para garantir integridade) ===
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

    // === HEMOGRAMA E OUTROS (Mantidos/Refinados) ===
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
        definition: 'Porcentagem do volume sanguíneo ocupado pelas células vermelhas. A "grossura" do sangue.',
        ranges: { male: [38, 52], female: [35, 47] },
        risks: {
            high: ['Risco cardiovascular aumentado', 'Sobrecarga cardíaca', 'Hipertensão'],
            low: ['Sinal clássico de anemia', 'Fraqueza']
        },
        tips: ['Uso de testosterona exógena frequentemente eleva este marcador. Doe sangue se necessário (com indicação médica).'],
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
        definition: 'Células de defesa do sistema imunológico (Glóbulos brancos).',
        ranges: { general: [4000, 11000] },
        risks: {
            high: ['Infecção ativa (bacteriana)', 'Inflamação', 'Estresse agudo', 'Uso de corticoides'],
            low: ['Baixa imunidade', 'Infecções virais', 'Deficiência de B12']
        },
        tips: ['Treino muito intenso pode elevar leucócitos temporariamente (leucocitose de estresse).'],
        sources: [{ title: 'MedlinePlus', url: 'https://medlineplus.gov/' }]
    },
    glucose: {
        id: 'glucose',
        label: 'Glicose em Jejum',
        unit: 'mg/dL',
        definition: 'Nível de açúcar no sangue. Indicador primário de diabetes.',
        ranges: { general: [70, 99] },
        risks: {
            high: ['Resistência à insulina', 'Pré-diabetes', 'Diabetes tipo 2'],
            low: ['Hipoglicemia', 'Tontura', 'Confusão mental', 'Fome excessiva']
        },
        tips: ['O jejum real de 8h-12h é crucial para precisão.'],
        sources: [{ title: 'ADA', url: 'https://diabetes.org/' }]
    },
    ldl: {
        id: 'ldl',
        label: 'Colesterol LDL',
        unit: 'mg/dL',
        definition: 'Conhecido como "colesterol ruim". Transporta colesterol para as artérias.',
        ranges: { general: [0, 130] },
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
        ranges: { general: [40, 100] },
        risks: {
            high: ['Geralmente protetor (fator de longevidade)'],
            low: ['Aumenta risco cardiovascular significativamente']
        },
        tips: ['Exercício aeróbico e gorduras saudáveis (azeite, abacate) aumentam o HDL.'],
        sources: [{ title: 'Mayo Clinic', url: 'https://www.mayoclinic.org/' }]
    },
    triglycerides: {
        id: 'triglycerides',
        label: 'Triglicerídeos',
        unit: 'mg/dL',
        definition: 'Forma de gordura mais comum no corpo. Energia armazenada.',
        ranges: { general: [0, 150] },
        risks: {
            high: ['Risco de pancreatite', 'Doença cardíaca', 'Excesso de carboidratos/álcool'],
            low: ['Desnutrição', 'Má absorção']
        },
        tips: ['Cortar açúcar e álcool é a forma mais rápida de baixar triglicerídeos.'],
        sources: [{ title: 'AHA', url: 'https://www.heart.org/' }]
    },
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
        tips: ['Atletas com muita massa muscular naturalmente têm creatinina mais alta sem ser doença renal. Beba água.'],
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
        tips: ['Treino pesado de musculação pode elevar TGO/TGP temporariamente (dano muscular, não hepático).'],
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
    weight: {
        id: 'weight',
        label: 'Peso Corporal',
        unit: 'kg',
        definition: 'Massa total do corpo. Sozinho não indica composição corporal (músculo vs gordura).',
        ranges: {},
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
        definition: 'Porcentagem de tecido adiposo no corpo. O melhor indicador de estética e saúde.',
        ranges: { male: [10, 20], female: [18, 28] },
        risks: {
            high: ['Resistência à insulina', 'Inflamação crônica', 'Baixa testosterona (aromatização)'],
            low: ['Queda hormonal', 'Perda de ciclo menstrual (mulheres)', 'Baixa energia', 'Queda de libido']
        },
        tips: ['Homens atléticos geralmente buscam 10-15%. Abaixo de 8% é difícil manter naturalmente.'],
        sources: [{ title: 'ACE Fitness', url: 'https://www.acefitness.org/' }]
    },

    // FALLBACK
    generic: {
        id: 'generic',
        label: 'Marcador',
        unit: '',
        definition: 'Marcador biológico extraído dos seus exames. Compare a evolução no gráfico.',
        ranges: {},
        risks: { high: ['Consulte valores de referência do laboratório.'], low: ['Consulte valores de referência do laboratório.'] },
        tips: ['Compare com seus exames anteriores para ver a tendência.'],
        sources: []
    }
};

// Nova assinatura: Aceita learnedData (opcional)
export const getMarkerInfo = (name: string, learnedData?: LearnedMarker[]): MarkerInfo => {
    const key = normalizeMarkerKey(name);
    
    // 1. Tenta encontrar no Registro Hardcoded
    if (MARKER_REGISTRY[key] && key !== 'generic') {
        return MARKER_REGISTRY[key];
    }

    // 2. Tenta encontrar no Banco de Conhecimento Aprendido (Se fornecido)
    if (learnedData && learnedData.length > 0) {
        const learned = learnedData.find(l => l.marker_key === key);
        if (learned) {
            return {
                id: learned.marker_key,
                label: learned.label,
                unit: learned.unit,
                definition: learned.definition,
                ranges: {
                    male: [learned.ref_min_male, learned.ref_max_male],
                    female: [learned.ref_min_female, learned.ref_max_female],
                    general: [learned.ref_min_male, learned.ref_max_male] // Fallback
                },
                risks: {
                    high: ['Consulte valores de referência do laboratório.'], // TODO: Poderíamos expandir isso
                    low: ['Consulte valores de referência do laboratório.']
                },
                tips: ['Referência aprendida via Google Search Medical Grounding.'],
                sources: learned.source_url ? [{ title: 'Fonte Médica (IA)', url: learned.source_url }] : [],
                isLearned: true // Marca que veio do banco de conhecimento
            };
        }
    }

    // 3. Fallback Genérico
    return {
        id: key,
        label: name,
        unit: '',
        definition: `Este marcador foi identificado nos seus documentos, mas não possui uma ficha técnica dedicada na base de conhecimento do FitLM. De modo geral, biomarcadores quantificam processos biológicos, estado de saúde ou resposta a terapias.`,
        ranges: {}, 
        risks: {
            high: [
                'Pode indicar sobrecarga do órgão responsável ou hiperatividade do sistema.',
                'Em alguns casos, reflete inflamação aguda ou resposta a suplementação.',
                'Verifique sempre o valor de referência do laboratório no documento original.'
            ],
            low: [
                'Pode indicar deficiência nutricional ou baixa produção endógena.',
                'Em alguns contextos, valores baixos são desejáveis (ex: inflamação).',
                'Consulte o exame original para confirmar a faixa ideal.'
            ]
        },
        tips: [
            'Compare a evolução ao longo do tempo. Mudanças bruscas são mais relevantes que valores isolados.',
            'Use o Chat IA para perguntar especificamente sobre este marcador.'
        ],
        sources: [],
        isGeneric: true
    };
};
