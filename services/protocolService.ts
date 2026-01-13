
import { Compound } from '../types';

export const COMPOUNDS_DB: Compound[] = [
    // ========================================================================
    // SUPLEMENTOS (BASICS)
    // ========================================================================
    {
        id: 'sup-creatina',
        name: 'Creatina Monohidratada',
        category: 'Suplemento',
        type: 'Oral',
        halfLife: '3 horas (Saturação muscular leva dias)',
        anabolicRating: 'Ergogênico',
        description: 'O suplemento mais estudado do mundo. Aumenta os estoques de fosfocreatina (CP), permitindo rápida ressíntese de ATP. Essencial para força e explosão.',
        commonDosages: { beginner: '3-5g todos os dias', advanced: '5g todos os dias (Saturação opcional)' },
        sideEffects: ['Retenção hídrica INTRA-muscular (Benéfico)', 'Desconforto gástrico (se dose alta)'],
        benefits: ['Aumento de força', 'Volume muscular', 'Neuroproteção'],
        riskLevel: 'Baixo'
    },
    {
        id: 'sup-whey',
        name: 'Whey Protein (Concentrado/Isolado)',
        category: 'Suplemento',
        type: 'Oral',
        halfLife: 'Rápida absorção',
        anabolicRating: 'Nutricional',
        description: 'Proteína do soro do leite. Alto valor biológico e rápida absorção. Prático para bater a meta de proteínas do dia.',
        commonDosages: { beginner: '30g (1 scoop) pós-treino ou lanche', advanced: 'Conforme macro diário' },
        sideEffects: ['Gases/Estufamento (se intolerante a lactose)'],
        benefits: ['Síntese proteica', 'Praticidade', 'Recuperação'],
        riskLevel: 'Baixo'
    },
    {
        id: 'sup-beta',
        name: 'Beta-Alanina',
        category: 'Suplemento',
        type: 'Oral',
        halfLife: 'Saturação (Carnosina)',
        anabolicRating: 'Resistência',
        description: 'Aumenta os níveis de carnosina no músculo, agindo como tamponante de ácido lático (reduz a queimação). Ideal para séries longas ou HIIT.',
        commonDosages: { beginner: '3g a 5g por dia (dividido)', advanced: '6g por dia' },
        sideEffects: ['Parestesia (Formigamento na pele) - Inofensivo'],
        benefits: ['Resistência muscular', 'Adia a fadiga'],
        riskLevel: 'Baixo'
    },
    {
        id: 'sup-omega3',
        name: 'Ômega 3 (Fish Oil)',
        category: 'Suplemento',
        type: 'Oral',
        halfLife: 'N/A',
        anabolicRating: 'Saúde',
        description: 'Ácidos graxos essenciais (EPA/DHA). Potente anti-inflamatório sistêmico, melhora perfil lipídico e sensibilidade à insulina.',
        commonDosages: { beginner: '1g a 2g (EPA+DHA somados)', advanced: '3g a 4g (se colesterol alterado)' },
        sideEffects: ['Hálito de peixe', 'Afinamento do sangue (em doses extremas)'],
        benefits: ['Saúde cardíaca', 'Cérebro', 'Anti-inflamatório'],
        riskLevel: 'Baixo'
    },
    {
        id: 'sup-gluta',
        name: 'Glutamina',
        category: 'Suplemento',
        type: 'Oral',
        halfLife: 'Curta',
        anabolicRating: 'Imunidade',
        description: 'Aminoácido mais abundante no corpo. Pouco efeito em hipertrofia direta, mas crucial para saúde intestinal (enterócitos) e imunidade.',
        commonDosages: { beginner: '5g pós-treino ou antes dormir', advanced: '10g a 20g (divisões)' },
        sideEffects: ['Nenhum significativo'],
        benefits: ['Saúde intestinal', 'Imunidade'],
        riskLevel: 'Baixo'
    },
    {
        id: 'sup-cafeina',
        name: 'Cafeína Anidra',
        category: 'Suplemento',
        type: 'Oral',
        halfLife: '5-6 horas',
        anabolicRating: 'Estimulante',
        description: 'Estimulante do SNC. Reduz percepção de esforço e aumenta termogênese. O "pré-treino" base.',
        commonDosages: { beginner: '100mg - 200mg', advanced: '300mg - 420mg (Cuidado)' },
        sideEffects: ['Ansiedade', 'Insônia', 'Taquicardia', 'Dependência'],
        benefits: ['Foco', 'Energia', 'Performance'],
        riskLevel: 'Médio'
    },
    {
        id: 'sup-multi',
        name: 'Multivitamínico',
        category: 'Suplemento',
        type: 'Oral',
        halfLife: 'N/A',
        anabolicRating: 'Saúde',
        description: 'Seguro nutricional para garantir micronutrientes que faltam na dieta. Dê preferência a marcas com minerais quelados.',
        commonDosages: { beginner: '1 dose junto com refeição gorda', advanced: 'Conforme carências' },
        sideEffects: ['Urina neon (Excesso de Vit B)', 'Náusea (se estômago vazio)'],
        benefits: ['Metabolismo eficiente', 'Saúde geral'],
        riskLevel: 'Baixo'
    },
    {
        id: 'sup-pre',
        name: 'Pré-Treino (Blend)',
        category: 'Suplemento',
        type: 'Oral',
        halfLife: '2-4 horas',
        anabolicRating: 'Performance',
        description: 'Mix de estimulantes (Cafeína) e vasodilatadores (Arginina, Citrulina, Beta-Alanina). Foco em pump e energia.',
        commonDosages: { beginner: 'Meia dose (testar tolerância)', advanced: '1 dose cheia' },
        sideEffects: ['Taquicardia', 'Formigamento', 'Insônia', 'Crash pós-treino'],
        benefits: ['Vontade de treinar', 'Vasodilatação (Pump)'],
        riskLevel: 'Médio'
    },

    // ========================================================================
    // EXEMPLOS DE PROTOCOLOS (COMBOS)
    // ========================================================================
    {
        id: 'proto-tpc',
        name: 'Protocolo: TPC Padrão (SERMS)',
        category: 'Protocolo Exemplo',
        type: 'Oral',
        halfLife: 'N/A',
        anabolicRating: 'Recuperação',
        description: 'Terapia Pós-Ciclo clássica para restaurar o eixo HPTA após uso de esteroides supressores. Iniciar após 3-4x a meia-vida da droga mais longa usada.',
        commonDosages: { 
            beginner: 'Tamox 40mg (2 sem) + 20mg (2 sem)', 
            advanced: 'HCG (intra-ciclo) + Clomid 50mg + Tamox 40mg',
            women: 'Geralmente desmame gradual, não usa SERMs igual homens'
        },
        sideEffects: ['Alterações de humor', 'Visão turva (Clomid)', 'Fogachos'],
        benefits: ['Restauração da testosterona natural', 'Manutenção dos ganhos'],
        riskLevel: 'Baixo'
    },
    {
        id: 'proto-cut-basic',
        name: 'Protocolo: Cutting Básico (Secar)',
        category: 'Protocolo Exemplo',
        type: 'Combo',
        halfLife: 'Variável',
        anabolicRating: 'Preservação',
        description: 'Foco em acelerar metabolismo e preservar massa magra em déficit calórico.',
        commonDosages: { 
            beginner: 'Testosterona (300mg/sem) + Oxandrolona (40mg/dia)', 
            advanced: 'Testo (300mg) + Trembo A (50mg dsdn) + Masteron (300mg/sem)',
            women: 'Oxandrolona (10mg/dia) + Cardarine ou Clembuterol'
        },
        sideEffects: ['Aumento da FC', 'Insônia', 'Cãibras'],
        benefits: ['Queima de gordura', 'Dureza muscular', 'Vascularização'],
        riskLevel: 'Médio'
    },
    {
        id: 'proto-bulk-basic',
        name: 'Protocolo: Bulking (Ganho de Massa)',
        category: 'Protocolo Exemplo',
        type: 'Injetável',
        halfLife: 'Longa',
        anabolicRating: 'Alta',
        description: 'Ciclo focado em ganho bruto de peso e força. Requer superávit calórico.',
        commonDosages: { 
            beginner: 'Durateston (500mg/sem) + Deca (400mg/sem)', 
            advanced: 'Cipionato (600mg) + Deca (600mg) + Hemogenin (50mg pré-treino)',
        },
        sideEffects: ['Retenção hídrica', 'Ginecomastia', 'Acne', 'PA Alta'],
        benefits: ['Ganhos rápidos de peso', 'Força articular (Deca)', 'Volume'],
        riskLevel: 'Médio'
    },
     {
        id: 'proto-super-loss',
        name: 'Protocolo: Super Déficit (Peptídeos GLP-1)',
        category: 'Protocolo Exemplo',
        type: 'Subcutâneo',
        halfLife: 'Semanal',
        anabolicRating: 'N/A',
        description: 'Uso de análogos de GLP-1/GIP para supressão agressiva de apetite.',
        commonDosages: { 
            beginner: 'Semaglutida (0.25mg a 1mg/sem)', 
            advanced: 'Tirzepatida (5mg a 10mg/sem) + AOD9604',
        },
        sideEffects: ['Náusea', 'Gastrite', 'Platô gástrico'],
        benefits: ['Perda de peso massiva', 'Controle glicêmico'],
        riskLevel: 'Baixo'
    },

    // ========================================================================
    // PROTEÇÃO & TPC (SERMs / IAs)
    // ========================================================================
    {
        id: 'tamox',
        name: 'Tamoxifeno',
        category: 'SERM/IA',
        type: 'Oral',
        halfLife: '5-7 dias',
        anabolicRating: 'N/A',
        description: 'SERM (Modulador Seletivo de Estrogênio). Bloqueia o estrogênio na glândula mamária (evita ginecomastia) e estimula a produção de LH/FSH na TPC.',
        commonDosages: { beginner: '20mg/dia (Prevenção)', advanced: '40mg/dia (TPC ou Ginec Ativa)' },
        sideEffects: ['Redução de IGF-1', 'Alterações visuais (raro)', 'Risco de trombo'],
        benefits: ['Previne Ginecomastia', 'Recupera eixo hormonal'],
        riskLevel: 'Baixo'
    },
    {
        id: 'clomid',
        name: 'Clomifeno (Indux)',
        category: 'SERM/IA',
        type: 'Oral',
        halfLife: '5-6 dias',
        anabolicRating: 'N/A',
        description: 'Mais potente que o Tamoxifeno para estimular LH/FSH, mas com mais colaterais emocionais. Usado em TPC pesada.',
        commonDosages: { beginner: '50mg/dia', advanced: '100mg/dia (apenas início TPC)' },
        sideEffects: ['Visão turva/rastros de luz (pode ser permanente)', 'Depressão/Choro'],
        benefits: ['Recuperação agressiva do eixo'],
        riskLevel: 'Médio'
    },
    {
        id: 'anastro',
        name: 'Anastrozol',
        category: 'SERM/IA',
        type: 'Oral',
        halfLife: '40-50 horas',
        anabolicRating: 'N/A',
        description: 'Inibidor de Aromatase (IA) não-suicida. Reduz a conversão de Testosterona em Estradiol. Uso intra-ciclo.',
        commonDosages: { beginner: '0.5mg DS3N ou s/n', advanced: '0.5mg a 1mg DSDN (conforme exame)' },
        sideEffects: ['Dor articular (se zerar E2)', 'Queda de libido', 'Piora do perfil lipídico'],
        benefits: ['Controle de retenção', 'Evita ginecomastia'],
        riskLevel: 'Médio'
    },
    {
        id: 'letrozol',
        name: 'Letrozol',
        category: 'SERM/IA',
        type: 'Oral',
        halfLife: '2-4 dias',
        anabolicRating: 'N/A',
        description: 'O IA mais potente. Zera o estrogênio rapidamente. Usado para reverter ginecomastia já instalada ou pré-contest.',
        commonDosages: { beginner: 'Não usar', advanced: '0.6mg a 2.5mg (casos extremos)' },
        sideEffects: ['Queda brutal de libido', 'Ressecamento articular', 'Depressão'],
        benefits: ['Elimina estrogênio quase total'],
        riskLevel: 'Alto'
    },
    {
        id: 'exemestano',
        name: 'Exemestano (Aromasin)',
        category: 'SERM/IA',
        type: 'Oral',
        halfLife: '24 horas',
        anabolicRating: 'N/A',
        description: 'IA Suicida (Inativa a enzima permanentemente). Menor rebote de estrogênio que o Anastrozol.',
        commonDosages: { beginner: '12.5mg DSDN', advanced: '25mg dia' },
        sideEffects: ['Menor impacto no colesterol que outros IAs'],
        benefits: ['Controle estável de E2'],
        riskLevel: 'Médio'
    },
    {
        id: 'cabergolina',
        name: 'Cabergolina (Dostinex)',
        category: 'SERM/IA',
        type: 'Oral',
        halfLife: '60-100 horas',
        anabolicRating: 'N/A',
        description: 'Agonista dopaminérgico. Usado para baixar PROLACTINA (causada por Deca/Trembo).',
        commonDosages: { beginner: '0.25mg (meio comp) por semana', advanced: '0.5mg por semana' },
        sideEffects: ['Náusea', 'Tontura', 'Alteração valvar cardíaca (uso crônico alto)'],
        benefits: ['Reduz prolactina', 'Melhora libido e orgasmo', 'Reduz período refratário'],
        riskLevel: 'Médio'
    },

    // ========================================================================
    // TERMOGÊNICOS & METABÓLICOS
    // ========================================================================
    {
        id: 'clembuterol',
        name: 'Clembuterol (Pulmonil)',
        category: 'Termogênico',
        type: 'Oral', // Ou Gel Lavizoo
        halfLife: '36 horas',
        anabolicRating: 'Anti-catabólico',
        description: 'Agonista Beta-2 adrenérgico. Potente queimador de gordura e levemente anabólico/anti-catabólico. Satural receptores rápido.',
        commonDosages: { beginner: '20mcg a 40mcg/dia', advanced: '80mcg a 120mcg/dia (Ciclo 15on/15off)' },
        sideEffects: ['Tremedeira (mãos)', 'Taquicardia', 'Cãibras (Taurina ajuda)', 'Ansiedade'],
        benefits: ['Aumenta TMB', 'Preserva massa magra'],
        riskLevel: 'Alto'
    },
    {
        id: 't3',
        name: 'T3 (Triiodotironina)',
        category: 'Termogênico',
        type: 'Oral',
        halfLife: '2.5 dias',
        anabolicRating: 'Catabólico',
        description: 'Hormônio tireoidiano ativo. Acelera TODO o metabolismo (queima gordura e músculo). Perigoso sem esteroides juntos.',
        commonDosages: { beginner: '25mcg/dia', advanced: '50mcg - 75mcg/dia' },
        sideEffects: ['Perda de massa muscular', 'Calor excessivo', 'Arritmia', 'Fome'],
        benefits: ['Metabolismo extremamente rápido'],
        riskLevel: 'Alto'
    },
    {
        id: 't4',
        name: 'T4 (Levotiroxina)',
        category: 'Termogênico',
        type: 'Oral',
        halfLife: '5-7 dias',
        anabolicRating: 'N/A',
        description: 'Pró-hormônio tireoidiano. Converte-se em T3 no fígado. Mais seguro e estável que T3 direto. Usado com GH.',
        commonDosages: { beginner: '50mcg - 100mcg/dia', advanced: '150mcg - 200mcg/dia' },
        sideEffects: ['Menos colaterais agudos que T3'],
        benefits: ['Sinergia com GH', 'Manutenção metabólica'],
        riskLevel: 'Médio'
    },
    {
        id: 'efedrina',
        name: 'Efedrina (+ Cafeína)',
        category: 'Termogênico',
        type: 'Oral',
        halfLife: '3-6 horas',
        anabolicRating: 'N/A',
        description: 'O clássico "EC Stack". Estimulante do SNC potente e supressor de apetite.',
        commonDosages: { beginner: '15mg Efedrina + 200mg Cafeína (pré-treino)', advanced: '2x ao dia' },
        sideEffects: ['Aumento de PA', 'Ansiedade', 'Insônia', 'Risco cardíaco'],
        benefits: ['Energia', 'Foco', 'Perda de gordura'],
        riskLevel: 'Alto'
    },
    {
        id: 'yohimbina',
        name: 'Yohimbina',
        category: 'Termogênico',
        type: 'Oral',
        halfLife: 'Curta',
        anabolicRating: 'N/A',
        description: 'Antagonista Alpha-2. Funciona melhor em jejum e para gordura teimosa (flancos/inferior abdômen).',
        commonDosages: { beginner: '5mg - 10mg (Jejum)', advanced: '0.2mg/kg' },
        sideEffects: ['Ansiedade', 'Taquicardia', 'Sudorese fria'],
        benefits: ['Mobilização de gordura teimosa'],
        riskLevel: 'Médio'
    },

    // ========================================================================
    // TESTOSTERONAS & BLENDS
    // ========================================================================
    {
        id: 'dura',
        name: 'Durateston (Sustanon)',
        category: 'Testosterona',
        type: 'Injetável',
        halfLife: 'Variável (Blend de 4 ésteres)',
        anabolicRating: '100:100',
        description: 'Blend de 4 testosteronas (Propionato, Fenilpropionato, Isocaproato, Decanoato). Ação imediata e prolongada. Muito falsificada.',
        commonDosages: { beginner: '250-500mg/sem', advanced: '500-750mg/sem' },
        sideEffects: ['Picos de estradiol (aromatiza fácil)', 'Dor pós-aplicação'],
        benefits: ['Libido alta', 'Força', 'Estabilidade (se aplicar dsdn)'],
        riskLevel: 'Baixo'
    },
    {
        id: 'cipio',
        name: 'Testosterona Cipionato (Deposteron)',
        category: 'Testosterona',
        type: 'Injetável',
        halfLife: '7-8 dias',
        anabolicRating: '100:100',
        description: 'Éster longo, muito comum em farmácias brasileiras. Retém um pouco mais de líquido que o Enantato.',
        commonDosages: { beginner: '200-400mg/sem', advanced: '400-800mg/sem' },
        sideEffects: ['Retenção hídrica', 'Aromatização'],
        benefits: ['Ganhos sólidos', 'Aplicações menos frequentes'],
        riskLevel: 'Baixo'
    },
    {
        id: 'nebido',
        name: 'Testosterona Undecilato (Nebido)',
        category: 'Testosterona',
        type: 'Injetável',
        halfLife: '30-90 dias',
        anabolicRating: '100:100',
        description: 'Éster ultra-longo. Uso exclusivo para TRT médica, não serve para ciclos estéticos devido à demora para empilhar.',
        commonDosages: { beginner: '1000mg a cada 10-12 semanas', advanced: 'Não usado para performance' },
        sideEffects: ['Estabilidade difícil de ajustar'],
        benefits: ['Comodidade (poucas injeções)'],
        riskLevel: 'Baixo'
    },
    {
        id: 'test-e',
        name: 'Testosterona Enantato',
        category: 'Testosterona',
        type: 'Injetável',
        halfLife: '5 dias',
        anabolicRating: '100:100',
        description: 'Padrão ouro para ciclos. Estável e previsível.',
        commonDosages: { beginner: '250-500mg/sem', advanced: '500-1000mg/sem' },
        sideEffects: ['Aromatização', 'Acne'],
        benefits: ['Base de qualquer ciclo'],
        riskLevel: 'Baixo'
    },
     {
        id: 'test-p',
        name: 'Testosterona Propionato',
        category: 'Testosterona',
        type: 'Injetável',
        halfLife: '0.8 dias',
        anabolicRating: '100:100',
        description: 'Éster curto. Menos retenção, ideal para cutting ou finalização.',
        commonDosages: { beginner: '300-400mg/sem', advanced: '100mg TSD' },
        sideEffects: ['Dor na aplicação', 'Muitas agulhadas'],
        benefits: ['Ganhos secos', 'Sai rápido do corpo'],
        riskLevel: 'Baixo'
    },

    // ========================================================================
    // PEPTÍDEOS GLP-1/GIP (PERDA DE PESO)
    // ========================================================================
    {
        id: 'reta',
        name: 'Retatrutide (Triple Agonist)',
        category: 'Peptídeo',
        type: 'Subcutâneo',
        halfLife: '6-7 dias',
        anabolicRating: 'Metabólico',
        description: 'O "Rei" atual. Agonista triplo (GLP-1, GIP, Glucagon). Queima gordura visceral violentamente e aumenta gasto energético.',
        commonDosages: { beginner: '2mg/sem', advanced: '4mg - 12mg/sem' },
        sideEffects: ['Taquicardia (Glucagon)', 'Náusea leve'],
        benefits: ['Perda de peso >25%', 'Melhora hepática'],
        riskLevel: 'Médio'
    },
    {
        id: 'tirze',
        name: 'Tirzepatide (Mounjaro)',
        category: 'Peptídeo',
        type: 'Subcutâneo',
        halfLife: '5-7 dias',
        anabolicRating: 'Metabólico',
        description: 'Agonista duplo (GLP-1 + GIP). Mais potente que Ozempic com menos colaterais gástricos.',
        commonDosages: { beginner: '2.5mg/sem', advanced: '10mg - 15mg/sem' },
        sideEffects: ['Náusea', 'Constipação'],
        benefits: ['Perda de peso potente', 'Controle glicêmico'],
        riskLevel: 'Baixo'
    },
    {
        id: 'cagrisema',
        name: 'CagriSema (Cagrilintide + Semaglutide)',
        category: 'Peptídeo',
        type: 'Subcutâneo',
        halfLife: '7 dias',
        anabolicRating: 'Metabólico',
        description: 'Combo de Semaglutida com análogo de Amilina. Sinergia potente para quebra de platô.',
        commonDosages: { beginner: '0.25mg/0.25mg sem', advanced: '2.5mg/2.5mg sem' },
        sideEffects: ['Náusea forte no início'],
        benefits: ['Supressão de apetite extrema'],
        riskLevel: 'Médio'
    },
    {
        id: 'cagri',
        name: 'Cagrilintide',
        category: 'Peptídeo',
        type: 'Subcutâneo',
        halfLife: 'Longa',
        anabolicRating: 'Metabólico',
        description: 'Análogo de Amilina de longa duração. Age na saciedade por via diferente do GLP-1.',
        commonDosages: { beginner: '0.3mg/sem', advanced: '2.4mg/sem' },
        sideEffects: ['Náusea'],
        benefits: ['Stack com GLP-1'],
        riskLevel: 'Baixo'
    },
    {
        id: 'mazdu',
        name: 'Mazdutide',
        category: 'Peptídeo',
        type: 'Subcutâneo',
        halfLife: 'Semanal',
        anabolicRating: 'Metabólico',
        description: 'Agonista duplo GLP-1/Glucagon. Foca em queima de gordura via aumento metabólico (Glucagon).',
        commonDosages: { beginner: '3mg/sem', advanced: '10mg/sem' },
        sideEffects: ['Aceleração cardíaca'],
        benefits: ['Perda de gordura'],
        riskLevel: 'Médio'
    },
    {
        id: 'adipotide',
        name: 'Adipotide (FTTP)',
        category: 'Peptídeo',
        type: 'Subcutâneo',
        halfLife: 'Curta',
        anabolicRating: 'N/A',
        description: 'Peptidomimético experimental que mata as células de gordura por apoptose (corta suprimento de sangue).',
        commonDosages: { beginner: 'Não recomendado', advanced: 'Uso clínico restrito' },
        sideEffects: ['Danos RENAIS (Grave)', 'Desidratação'],
        benefits: ['Morte da célula de gordura'],
        riskLevel: 'Extremo'
    },
    {
        id: 'aod',
        name: 'AOD-9604',
        category: 'Peptídeo',
        type: 'Subcutâneo',
        halfLife: 'Curta',
        anabolicRating: 'N/A',
        description: 'Fragmento do GH (C-terminus). Foca na lipólise sem afetar insulina ou IGF-1.',
        commonDosages: { beginner: '300mcg/dia', advanced: '500-1000mcg/dia' },
        sideEffects: ['Nenhum significativo'],
        benefits: ['Perda de gordura lenta e constante'],
        riskLevel: 'Baixo'
    },
    {
        id: '5amino',
        name: '5-Amino-1MQ',
        category: 'Metabólico',
        type: 'Oral',
        halfLife: 'Curta',
        anabolicRating: 'N/A',
        description: 'Inibidor da enzima NNMT. Aumenta NAD+ e acelera metabolismo sem estimular o SNC.',
        commonDosages: { beginner: '50mg/dia', advanced: '100-150mg/dia' },
        sideEffects: ['Raros'],
        benefits: ['Recomposição corporal', 'Aumento de energia'],
        riskLevel: 'Baixo'
    },
    {
        id: 'tesa',
        name: 'Tesamorelin',
        category: 'Peptídeo',
        type: 'Subcutâneo',
        halfLife: 'Curta',
        anabolicRating: 'GH',
        description: 'O secretagogo de GH mais potente (GHRH). Aprovado para gordura visceral em HIV. Ótimo para estética.',
        commonDosages: { beginner: '1mg/dia', advanced: '2mg/dia (antes dormir)' },
        sideEffects: ['Retenção hídrica leve', 'Dor articular'],
        benefits: ['Queima de gordura visceral', 'Definição abdominal'],
        riskLevel: 'Baixo'
    },

    // ========================================================================
    // PEPTÍDEOS DE CRESCIMENTO & RECUPERAÇÃO (GH Secretagogues + Repair)
    // ========================================================================
    {
        id: 'bpc-tb',
        name: 'Combo: BPC-157 + TB-500',
        category: 'Peptídeo',
        type: 'Subcutâneo',
        halfLife: 'Variável',
        anabolicRating: 'Recuperação',
        description: 'O "Wolverine Stack". A combinação suprema para curar lesões, tendões, inflamação e cirurgias.',
        commonDosages: { beginner: '5mg/5mg Blend (Dose: 500mcg dia)', advanced: 'Dose dobrada em lesão aguda' },
        sideEffects: ['Nenhum notável'],
        benefits: ['Cura acelerada', 'Anti-inflamatório sistêmico'],
        riskLevel: 'Baixo'
    },
    {
        id: 'cjc-ipam',
        name: 'Combo: CJC-1295 (No DAC) + Ipamorelin',
        category: 'Peptídeo',
        type: 'Subcutâneo',
        halfLife: 'Curta',
        anabolicRating: 'GH',
        description: 'Padrão ouro para aumento natural de GH sem colaterais de prolactina/fome.',
        commonDosages: { beginner: '100mcg/100mcg (Blend) pré-sono', advanced: '2-3x ao dia' },
        sideEffects: ['Rubor (Flush)', 'Sono profundo'],
        benefits: ['Pele', 'Sono', 'Anti-aging', 'Queima de gordura'],
        riskLevel: 'Baixo'
    },
    {
        id: 'mk677',
        name: 'Ibutamoren (MK-677)',
        category: 'Oral',
        type: 'Oral',
        halfLife: '24 horas',
        anabolicRating: 'GH',
        description: 'Secretagogo de GH oral. Aumenta muito o IGF-1 e a FOME.',
        commonDosages: { beginner: '10-15mg/dia', advanced: '25-30mg/dia' },
        sideEffects: ['Fome incontrolável', 'Retenção hídrica', 'Resistência à insulina'],
        benefits: ['Ganho de massa (água/glicogênio)', 'Sono'],
        riskLevel: 'Médio'
    },
    {
        id: 'ghrp6',
        name: 'GHRP-6',
        category: 'Peptídeo',
        type: 'Subcutâneo',
        halfLife: 'Curta',
        anabolicRating: 'GH',
        description: 'Secretagogo de GH de primeira geração. Causa fome extrema.',
        commonDosages: { beginner: '100mcg 3x dia', advanced: 'Variável' },
        sideEffects: ['Fome extrema', 'Aumento de Prolactina/Cortisol'],
        benefits: ['Apetite para Bulking'],
        riskLevel: 'Médio'
    },
    {
        id: 'igf1-lr3',
        name: 'IGF-1 LR3',
        category: 'Peptídeo',
        type: 'Injetável',
        halfLife: '20-30 horas',
        anabolicRating: 'Extrema',
        description: 'Fator de crescimento semelhante à insulina de longa duração. Hiperplasia muscular real.',
        commonDosages: { beginner: '20-40mcg pós-treino', advanced: '50-80mcg' },
        sideEffects: ['Hipoglicemia (Risco de vida)', 'Crescimento de intestinos'],
        benefits: ['Novas fibras musculares', 'Pump eterno'],
        riskLevel: 'Alto'
    },
    {
        id: 'mgf',
        name: 'MGF / PEG-MGF',
        category: 'Peptídeo',
        type: 'Injetável',
        halfLife: 'Curta (MGF) / Longa (PEG)',
        anabolicRating: 'Local',
        description: 'Fator de crescimento mecânico. Usado para crescimento local no músculo treinado.',
        commonDosages: { beginner: '200mcg bilateral no músculo alvo', advanced: '400mcg' },
        sideEffects: ['Dor local'],
        benefits: ['Melhora de pontos fracos'],
        riskLevel: 'Médio'
    },

    // ========================================================================
    // MITOCONDRIAS & LONGEVIDADE
    // ========================================================================
    {
        id: 'mots-c',
        name: 'MOTS-c',
        category: 'Mitocondrial',
        type: 'Subcutâneo',
        halfLife: 'Curta',
        anabolicRating: 'Performance',
        description: 'Peptídeo derivado da mitocôndria. Melhora a sensibilidade à insulina e performance física ("Exercise in a bottle").',
        commonDosages: { beginner: '5mg - 10mg / semana', advanced: 'Protocolos de carga' },
        sideEffects: ['Dor/Irritação no local da injeção (Comum)'],
        benefits: ['Resistência física', 'Metabolismo de glicose'],
        riskLevel: 'Baixo'
    },
    {
        id: 'ss31',
        name: 'SS-31 (Elamipretide)',
        category: 'Mitocondrial',
        type: 'Subcutâneo',
        halfLife: 'Curta',
        anabolicRating: 'Saúde',
        description: 'Reparador mitocondrial. Restaura a função energética das células envelhecidas.',
        commonDosages: { beginner: '40mcg/kg dia', advanced: 'Variável' },
        sideEffects: ['Nenhum significativo'],
        benefits: ['Energia celular', 'Anti-aging real'],
        riskLevel: 'Baixo'
    },
    {
        id: 'epithalon',
        name: 'Epithalon',
        category: 'Peptídeo',
        type: 'Subcutâneo',
        halfLife: 'Curta',
        anabolicRating: 'Longevidade',
        description: 'Ativador da Telomerase. Considerado o peptídeo da "imortalidade" ou extensão da vida.',
        commonDosages: { beginner: '5mg-10mg dia por 10-20 dias (Ciclo)', advanced: '2x ao ano' },
        sideEffects: ['Nenhum'],
        benefits: ['Alongamento de telômeros', 'Sono', 'Rejuvenescimento'],
        riskLevel: 'Baixo'
    },

    // ========================================================================
    // NOOTRÓPICOS & COGNITIVOS (Peptídeos)
    // ========================================================================
    {
        id: 'semax',
        name: 'Semax',
        category: 'Nootrópico',
        type: 'Subcutâneo', // Ou nasal
        halfLife: 'Curta',
        anabolicRating: 'Mental',
        description: 'Peptídeo russo para AVC, usado para foco intenso, memória e clareza mental.',
        commonDosages: { beginner: '200-500mcg dia', advanced: '1mg dia' },
        sideEffects: ['Ansiedade leve se exagerar'],
        benefits: ['Foco laser', 'Memória', 'Neuroproteção'],
        riskLevel: 'Baixo'
    },
    {
        id: 'selank',
        name: 'Selank',
        category: 'Nootrópico',
        type: 'Subcutâneo',
        halfLife: 'Curta',
        anabolicRating: 'Mental',
        description: 'Primo do Semax, mas focado em ANSÍOLISE (Anti-ansiedade) sem sedação.',
        commonDosages: { beginner: '200-300mcg dia', advanced: 'Variável' },
        sideEffects: ['Nenhum'],
        benefits: ['Calma', 'Clareza', 'Combate estresse'],
        riskLevel: 'Baixo'
    },
    {
        id: 'dihexa',
        name: 'Dihexa',
        category: 'Nootrópico',
        type: 'Transdérmico', // Geralmente creme ou oral
        halfLife: 'Variável',
        anabolicRating: 'Mental',
        description: 'O nootrópico mais potente conhecido para sinaptogênese (criar novas conexões neurais). 7 ordens de magnitude mais forte que BDNF.',
        commonDosages: { beginner: '10-20mg dia (transdérmico)', advanced: 'Cuidado' },
        sideEffects: ['Pode acelerar crescimento de tumores existentes (teórico)'],
        benefits: ['Aprendizado', 'Reparo cerebral'],
        riskLevel: 'Alto'
    },

    // ========================================================================
    // SEXUAL & PELE
    // ========================================================================
    {
        id: 'mt2',
        name: 'Melanotan II',
        category: 'Peptídeo',
        type: 'Subcutâneo',
        halfLife: 'Curta',
        anabolicRating: 'Cosmético',
        description: 'Estimula melanina (bronzeado) e libido potente.',
        commonDosages: { beginner: '100mcg-250mcg dia (Fase carga)', advanced: 'Manutenção semanal' },
        sideEffects: ['Náusea (comum)', 'Ereções espontâneas', 'Manchas na pele (sardas)'],
        benefits: ['Bronzeado sem sol', 'Libido extrema'],
        riskLevel: 'Médio'
    },
    {
        id: 'pt141',
        name: 'PT-141 (Vyleesi)',
        category: 'Peptídeo',
        type: 'Subcutâneo',
        halfLife: 'Curta',
        anabolicRating: 'Sexual',
        description: 'Derivado do Melanotan, focado exclusivamente em libido e ereção (age no cérebro, não no fluxo sanguíneo como Viagra).',
        commonDosages: { beginner: '1mg - 2mg (4h antes do ato)', advanced: 'Variável' },
        sideEffects: ['Náusea (muito comum)', 'Rubor'],
        benefits: ['Libido masculina e feminina'],
        riskLevel: 'Baixo'
    },
    {
        id: 'ghk-cu',
        name: 'GHK-Cu (Cobre)',
        category: 'Peptídeo',
        type: 'Subcutâneo',
        halfLife: 'Curta',
        anabolicRating: 'Cosmético',
        description: 'Peptídeo de cobre. O "Botox natural". Aumenta colágeno, cura pele e ajuda crescimento capilar.',
        commonDosages: { beginner: '1mg-2mg dia', advanced: 'Protocolos intensivos' },
        sideEffects: ['Dor no local (Cobre arde)', 'Acúmulo de cobre (tomar Zinco)'],
        benefits: ['Pele jovem', 'Cabelo', 'Cicatriz'],
        riskLevel: 'Baixo'
    },

    // ========================================================================
    // ESTEROIDES 19-NOR & DHT & OUTROS
    // ========================================================================
    {
        id: 'deca',
        name: 'Nandrolona Decanoato (Deca)',
        category: '19-Nor',
        type: 'Injetável',
        halfLife: '6-7 dias (Efetiva 14)',
        anabolicRating: '125:37',
        description: 'Clássico para Bulking. Altamente anabólica, baixa androgenicidade. Lubrifica articulações.',
        commonDosages: { beginner: '200-400mg/sem', advanced: '400-600mg/sem' },
        sideEffects: ['Deca Dick (Disfunção)', 'Aumento de Prolactina', 'Retenção', 'Supressão severa'],
        benefits: ['Articulações', 'Massa bruta'],
        riskLevel: 'Médio'
    },
    {
        id: 'npp',
        name: 'Fenilpropionato de Nandrolona (NPP)',
        category: '19-Nor',
        type: 'Injetável',
        halfLife: '2-3 dias',
        anabolicRating: '125:37',
        description: 'Versão rápida da Deca. Menos retenção hídrica, sai do corpo mais rápido.',
        commonDosages: { beginner: '300-400mg/sem (dsdn)', advanced: '400-600mg/sem' },
        sideEffects: ['Prolactina'],
        benefits: ['Volume com menos água'],
        riskLevel: 'Médio'
    },
    {
        id: 'trem-e',
        name: 'Trembolona Enantato',
        category: '19-Nor',
        type: 'Injetável',
        halfLife: '5-7 dias',
        anabolicRating: '500:500',
        description: 'Trembolona de ação lenta. Menos picadas, mas se der colateral demora a sair.',
        commonDosages: { beginner: 'Não recomendado', advanced: '200-400mg/sem' },
        sideEffects: ['Psicológicos graves', 'Insônia', 'Cardio ruim'],
        benefits: ['O hormônio mais forte que existe'],
        riskLevel: 'Extremo'
    },
    {
        id: 'bold',
        name: 'Boldenona (Undecilenato)',
        category: 'Testosterona', // Estruturalmente similar
        type: 'Injetável',
        halfLife: '14 dias',
        anabolicRating: '100:50',
        description: 'Veterinário (Equifort). Aumenta muito o apetite e a vascularização. Aumenta Hematócrito (Sangue grosso).',
        commonDosages: { beginner: '300-500mg/sem', advanced: '600-900mg/sem' },
        sideEffects: ['Sangue grosso (Trombose)', 'Ansiedade (GABA)', 'Acne'],
        benefits: ['Vascularização', 'Apetite', 'Endurance'],
        riskLevel: 'Médio'
    },
    {
        id: 'proviron',
        name: 'Proviron (Mesterolona)',
        category: 'DHT',
        type: 'Oral',
        halfLife: '12 horas',
        anabolicRating: '100-150:30-40',
        description: 'Androgênico puro. Não constrói músculo, mas melhora a qualidade, libido e potencializa outros esteroides (reduz SHBG).',
        commonDosages: { beginner: '25-50mg/dia', advanced: '50-100mg/dia' },
        sideEffects: ['Queda de cabelo', 'Próstata'],
        benefits: ['Libido', 'Dureza', 'Anti-estrogênico leve'],
        riskLevel: 'Baixo'
    },
    {
        id: 'halo',
        name: 'Halotestin',
        category: 'Oral',
        type: 'Oral',
        halfLife: '9 horas',
        anabolicRating: '1900:850',
        description: 'Força bruta e agressividade pura. Usado por Powerlifters pré-competição. Extremamente tóxico.',
        commonDosages: { beginner: 'Não usar', advanced: '10-20mg (apenas dias finais)' },
        sideEffects: ['Hepatotoxicidade Extrema', 'Agressividade'],
        benefits: ['Força instantânea', 'Sem ganho de peso'],
        riskLevel: 'Extremo'
    },
    {
        id: 'turinabol',
        name: 'Turinabol',
        category: 'Oral',
        type: 'Oral',
        halfLife: '16 horas',
        anabolicRating: '>100:0',
        description: 'Dianabol sem retenção. Ganhos atléticos e limpos. Famoso pelo doping da Alemanha Oriental.',
        commonDosages: { beginner: '30-50mg/dia', advanced: '50-80mg/dia' },
        sideEffects: ['Fígado', 'Cãibras (Pumps)'],
        benefits: ['Performance atlética', 'Massa magra'],
        riskLevel: 'Médio'
    },

    // ========================================================================
    // SAÚDE FEMININA & HORMÔNIOS GERAIS
    // ========================================================================
    {
        id: 'estradiol',
        name: 'Estradiol (17-beta)',
        category: 'Outros',
        type: 'Topico', // Ou Oral
        halfLife: 'Variável',
        anabolicRating: 'N/A',
        description: 'Hormônio feminino principal. Neuroprotetor e cardioprotetor. Essencial monitorar em homens, usado em TRT feminina.',
        commonDosages: { beginner: 'Gel base (Mulheres)', advanced: 'Conforme exames' },
        sideEffects: ['Retenção', 'Emocional', 'Risco trombo (se oral)'],
        benefits: ['Saúde óssea', 'Pele', 'Humor', 'Lubrificação'],
        riskLevel: 'Baixo'
    },
    {
        id: 'progest',
        name: 'Progesterona (Micronizada)',
        category: 'Outros',
        type: 'Oral',
        halfLife: 'Curta',
        anabolicRating: 'N/A',
        description: 'Hormônio calmante. Melhora o sono e antagoniza excesso de estrogênio.',
        commonDosages: { beginner: '100mg antes de dormir', advanced: 'Variável' },
        sideEffects: ['Sonolência'],
        benefits: ['Sono profundo', 'Calma'],
        riskLevel: 'Baixo'
    }
];

export const fetchCompounds = async (): Promise<Compound[]> => {
    // Simulating async for future API integration
    return new Promise((resolve) => {
        setTimeout(() => resolve(COMPOUNDS_DB), 300);
    });
};
