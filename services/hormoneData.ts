
export interface HormoneData {
    id: string;
    category: 'Sexual' | 'Tireoide' | 'Estresse' | 'Metabolismo';
    name: string;
    function: string;
    genderDifferences: string;
    lowSymptoms: string[];
    highSymptoms: string[];
    lifestyleFixes: string[];
}

export const HORMONE_GUIDE_DATA: HormoneData[] = [
    // === SEXUAIS & REPRODUÇÃO ===
    {
        id: 'testosterone',
        category: 'Sexual',
        name: 'Testosterona',
        function: 'O "motor" anabólico e androgênico. Regula massa muscular, densidade óssea, libido, produção de hemácias (sangue) e motivação dopaminérgica.',
        genderDifferences: 'HOMENS: Produzida nos testículos. Níveis 10x-15x maiores. Define características masculinas.\nMULHERES: Produzida nos ovários/adrenais. Vital para libido, energia e tônus muscular, mas em doses menores.',
        lowSymptoms: [
            'Baixa libido e disfunção erétil (H)',
            'Perda de força e massa muscular',
            'Acúmulo de gordura abdominal',
            'Depressão, falta de motivação, "brain fog"',
            'Fadiga crônica e letargia'
        ],
        highSymptoms: [
            'Oleosidade na pele e acne severa',
            'Irritabilidade e agressividade (pavio curto)',
            'Queda de cabelo (se converter em DHT)',
            'Virilização em mulheres (voz, pelos)',
            'Hematócrito alto (sangue grosso)'
        ],
        lifestyleFixes: [
            'Sono: 7-9h é inegociável (pico no sono REM).',
            'Nutrição: Gorduras saturadas/monoinsaturadas e Zinco.',
            'Treino: Musculação pesada (compostos).',
            'Controle de gordura: Obesidade converte Testo em Estradiol.'
        ]
    },
    {
        id: 'estradiol',
        category: 'Sexual',
        name: 'Estradiol (E2)',
        function: 'Principal estrogênio. Neuroprotetor (cérebro), cardioprotetor (vasos), lubrificação articular e saúde óssea.',
        genderDifferences: 'HOMENS: Vem da conversão da Testosterona. Essencial para libido e ereção.\nMULHERES: Regula ciclo, hidratação da pele/mucosas e humor. Cai na menopausa.',
        lowSymptoms: [
            'Dor articular (ressecamento)',
            'Risco de osteoporose',
            'Queda de libido (ambos os sexos)',
            'Pele seca/envelhecida',
            'Ondas de calor (mulheres)'
        ],
        highSymptoms: [
            'Retenção hídrica severa (inchaço)',
            'Labilidade emocional (choro fácil)',
            'Ginecomastia (homens)',
            'Dificuldade de ereção',
            'Acúmulo de gordura no quadril'
        ],
        lifestyleFixes: [
            'Peso: Reduzir gordura visceral (onde ocorre a aromatização).',
            'Fígado: Evitar álcool ajuda a metabolizar excesso de E2.',
            'Fibras: Vegetais crucíferos ajudam na eliminação.',
            'Cuidado: Não zere o estradiol com remédios sem indicação.'
        ]
    },
    {
        id: 'progesterone',
        category: 'Sexual',
        name: 'Progesterona',
        function: 'Hormônio "calmante" e regulador do ciclo. Equilibra os efeitos do estrogênio e prepara o útero.',
        genderDifferences: 'HOMENS: Baixa relevância clínica direta (exceto uso de medicamentos).\nMULHERES: Fundamental no pós-ovulação e gravidez. Efeito ansiolítico (sono).',
        lowSymptoms: [
            'TPM severa e irritabilidade',
            'Ciclos irregulares ou curtos',
            'Insônia e ansiedade',
            'Dominância estrogênica (inchaço)'
        ],
        highSymptoms: [
            'Sonolência excessiva',
            'Alteração de libido',
            'Comum na gravidez ou suplementação'
        ],
        lifestyleFixes: [
            'Gerenciamento de estresse (o corpo "rouba" matéria-prima da progesterona para fazer cortisol).',
            'Nutrientes: Vitamina B6 e Magnésio.',
            'Ovulação saudável é necessária para produção natural.'
        ]
    },
    {
        id: 'shbg',
        category: 'Sexual',
        name: 'SHBG (Globulina)',
        function: 'O "táxi" dos hormônios. Transporta Testosterona e Estradiol no sangue. Quando ligados ao SHBG, eles ficam inativos.',
        genderDifferences: 'Semelhante na função. Mulheres tendem a ter SHBG mais alto naturalmente (proteção contra excesso androgênico).',
        lowSymptoms: [
            'Sintomas de excesso de andrógenos (acne, pelos)',
            'Resistência à insulina (forte correlação)',
            'Risco de diabetes tipo 2',
            'Fígado gorduroso'
        ],
        highSymptoms: [
            'Sintomas de testosterona baixa (mesmo com total normal)',
            'Perda de libido',
            'Dificuldade em ganhar massa',
            'Comum em dietas muito restritivas (Low Carb extremo)'
        ],
        lifestyleFixes: [
            'Para baixar: Corrigir resistência à insulina, aumentar carboidratos complexos.',
            'Para subir: Reduzir inflamação, tratar fígado, evitar excesso de açúcar.'
        ]
    },
    {
        id: 'prolactin',
        category: 'Sexual',
        name: 'Prolactina',
        function: 'Ligado à lactação, mas é o hormônio da "saciedade sexual". Inibe dopamina e GnRH (desliga o eixo sexual).',
        genderDifferences: 'HOMENS: Inimigo da ereção e libido. Aumenta no período refratário.\nMULHERES: Produção de leite. Alta inibe ovulação (amenorreia).',
        lowSymptoms: [
            'Raro ser problema clínico isolado',
            'Pode indicar necrose hipofisária (raríssimo)'
        ],
        highSymptoms: [
            'Perda total de libido',
            'Disfunção erétil / Anorgasmia',
            'Galactorreia (leite nas mamas)',
            'Infertilidade (bloqueia LH/FSH)',
            'Ginecomastia'
        ],
        lifestyleFixes: [
            'Dopamina: Aumentar dopamina baixa prolactina.',
            'Sono: Falta de sono eleva prolactina.',
            'Stress: Cortisol alto puxa prolactina.',
            'Medicações: Antidepressivos são causa comum de aumento.'
        ]
    },

    // === COMANDO CENTRAL (HIPÓFISE) ===
    {
        id: 'lh_fsh',
        category: 'Sexual',
        name: 'LH e FSH',
        function: 'Os chefes. LH manda produzir hormônios (Testo/Prog). FSH manda produzir células (Esperma/Óvulos).',
        genderDifferences: 'HOMENS: Constantes. LH -> Testículo (Leydig). FSH -> Sertoli.\nMULHERES: Cíclicos. Variam drasticamente conforme fase do mês e menopausa.',
        lowSymptoms: [
            'Eixo desligado (Hipotrofia testicular)',
            'Infertilidade',
            'Causa comum: Uso de esteroides ou stress extremo'
        ],
        highSymptoms: [
            'Falência testicular/ovariana (O cérebro grita, mas a gônada não ouve)',
            'Menopausa ou Andropausa primária',
            'Tumor hipofisário (raro)'
        ],
        lifestyleFixes: [
            'Não usar hormônios exógenos sem TPC.',
            'Nutrição adequada (déficit calórico extremo desliga o GnRH).',
            'Descanso adequado.'
        ]
    },

    // === TIREOIDE & METABOLISMO ===
    {
        id: 'tsh_thyroid',
        category: 'Tireoide',
        name: 'Tireoide (TSH, T3, T4)',
        function: 'O termostato do corpo. TSH (cérebro) manda na Tireoide. T4 é estoque, T3 é o hormônio ativo que queima energia.',
        genderDifferences: 'Mulheres têm 5x-8x mais chance de problemas autoimunes (Hashimoto) e hipotireoidismo.',
        lowSymptoms: [
            'Metabolismo lento e ganho de peso',
            'Frio excessivo, pele seca, queda de cabelo',
            'Constipação intestinal',
            'Depressão e fadiga mental'
        ],
        highSymptoms: [
            'Perda de peso rápida (catabolismo)',
            'Calor, sudorese, taquicardia',
            'Ansiedade, tremores, insônia',
            'Olhos saltados (Graves)'
        ],
        lifestyleFixes: [
            'Nutrientes: Iodo, Selênio e Zinco (conversão T4->T3).',
            'Gut Health: 20% da conversão ocorre no intestino.',
            'Stress: Cortisol alto bloqueia a tireoide.',
            'Não fazer dietas de fome (crash diet desliga T3).'
        ]
    },
    {
        id: 'insulin',
        category: 'Metabolismo',
        name: 'Insulina',
        function: 'Hormônio de armazenamento. Abre a porta das células para glicose e aminoácidos. É altamente anabólico (para músculo e gordura).',
        genderDifferences: 'Similar. Na mulher, resistência à insulina causa SOP (Síndrome dos Ovários Policísticos).',
        lowSymptoms: [
            'Diabetes Tipo 1 (falência)',
            'Catabolismo muscular severo',
            'Sede excessiva, muita urina',
            'Glicose alta no sangue'
        ],
        highSymptoms: [
            'Resistência à Insulina (Pré-diabetes)',
            'Gordura visceral (barriga dura)',
            'Acantose (manchas escuras pescoço)',
            'Fome constante e sono pós-refeição'
        ],
        lifestyleFixes: [
            'Treino: Músculo é o maior consumidor de glicose.',
            'Dieta: Reduzir açúcar/farinha. Fibras e proteínas.',
            'Jejum Intermitente: Melhora a sensibilidade.',
            'Sono: 1 noite ruim já causa resistência temporária.'
        ]
    },
    {
        id: 'gh_igf1',
        category: 'Metabolismo',
        name: 'GH e IGF-1',
        function: 'GH (Crescimento) queima gordura e repara tecidos. IGF-1 (Fígado) executa o crescimento celular e muscular.',
        genderDifferences: 'Mulheres secretam mais GH basalmente. Homens têm picos maiores no sono profundo.',
        lowSymptoms: [
            'Envelhecimento precoce (pele fina)',
            'Aumento de gordura abdominal',
            'Perda de massa magra e óssea',
            'Recuperação lenta de lesões'
        ],
        highSymptoms: [
            'Acromegalia (crescimento ossos face/mãos)',
            'Resistência à insulina (GH antagoniza insulina)',
            'Dor articular e retenção',
            'Risco aumentado de tumores'
        ],
        lifestyleFixes: [
            'Sono Profundo (Delta): 70% do GH sai aqui.',
            'Jejum: Insulina baixa libera GH.',
            'Treino Intenso (Láctico): Estimula secreção.',
            'Evitar comer logo antes de dormir.'
        ]
    },

    // === ESTRESSE & ADRENAIS ===
    {
        id: 'cortisol',
        category: 'Estresse',
        name: 'Cortisol',
        function: 'Hormônio da vida e do estresse. Anti-inflamatório natural. Nos acorda de manhã e mobiliza energia em perigo.',
        genderDifferences: 'Similar. Mulheres podem ser mais sensíveis a desregulação devido à interação com progesterona.',
        lowSymptoms: [
            'Fadiga extrema (Burnout)',
            'Tontura ao levantar (hipotensão)',
            'Baixa imunidade e inflamação crônica',
            'Dificuldade de acordar'
        ],
        highSymptoms: [
            'Ansiedade, taquicardia, insônia ("tired but wired")',
            'Perda de massa muscular (catabolismo)',
            'Gordura visceral',
            'Rosto inchado (Face de Lua)'
        ],
        lifestyleFixes: [
            'Ritmo: Luz solar ao acordar, escuro à noite.',
            'Cafeína: Cortar após 14h.',
            'Mental: Meditação reduz cortisol basal.',
            'Pós-treino: Carboidrato baixa o cortisol induzido pelo treino.'
        ]
    },
    {
        id: 'dhea',
        category: 'Estresse',
        name: 'DHEA-S',
        function: 'Pró-hormônio adrenal. Precursor de Testo/E2. Marcador de "juventude adrenal" e contraponto do cortisol.',
        genderDifferences: 'Importante fonte de andrógenos para mulheres (libido/energia). Homens dependem mais do testículo.',
        lowSymptoms: [
            'Baixa energia e libido',
            'Envelhecimento acelerado',
            'Baixa imunidade',
            'Sinal de fadiga adrenal'
        ],
        highSymptoms: [
            'Pele oleosa e acne',
            'Hirsutismo (pelos) em mulheres',
            'Pode indicar SOP ou estresse agudo'
        ],
        lifestyleFixes: [
            'Gerenciar estresse (cortisol "rouba" a via do DHEA).',
            'Sono de qualidade.',
            'Treino de força.'
        ]
    }
];

export const CORRECTION_LEVELS = [
    {
        level: 1,
        title: 'Nível 1: A Base (Estilo de Vida)',
        description: '90% dos desequilíbrios leves se resolvem aqui. Sem isso, nenhum remédio funciona direito.',
        actions: [
            { icon: '💤', title: 'Sono Sagrado', text: 'Dormir 7-9h. O pico de testosterona e GH ocorre no sono profundo. Pouco sono = Cortisol alto e Testo baixa.' },
            { icon: '🏋️', title: 'Estímulo Físico', text: 'Musculação sinaliza ao corpo que ele PRECISA de músculo e osso (aumentando hormônios anabólicos). Cardio melhora a sensibilidade à insulina.' },
            { icon: '🥗', title: 'Combustível Real', text: 'Comer proteínas suficientes e gorduras boas (colesterol é a mãe dos hormônios). Evitar déficits calóricos agressivos por muito tempo.' },
            { icon: '🧠', title: 'Gestão de Stress', text: 'O estresse crônico "rouba" a matéria-prima dos hormônios sexuais para fazer Cortisol (Pregnenolone Steal).' }
        ]
    },
    {
        level: 2,
        title: 'Nível 2: Investigação (Causas Ocultas)',
        description: 'Se a base está feita e os sintomas persistem, procure os sabotadores.',
        actions: [
            { icon: '💊', title: 'Revisão de Fármacos', text: 'Antidepressivos, finasterida, anticoncepcionais e estatinas podem alterar libido e eixos hormonais.' },
            { icon: '🥕', title: 'Deficiências', text: 'Falta de Zinco, Magnésio, Vitamina D3 ou Ferro pode simular hipogonadismo ou hipotireoidismo.' },
            { icon: '⚖️', title: 'Composição Corporal', text: 'Gordura em excesso é um órgão endócrino que inflama o corpo e converte Testo em Estradiol. Emagrecer muitas vezes "cura" o hormônio.' }
        ]
    },
    {
        level: 3,
        title: 'Nível 3: Intervenção Clínica',
        description: 'Zona médica. Quando a fisiologia falha e precisa de reparo externo.',
        actions: [
            { icon: '👨‍⚕️', title: 'Reposição (TRT/TH)', text: 'Indicada quando há sintomas severos E exames comprovando falência da glândula, irreversível por meios naturais.' },
            { icon: '🧪', title: 'Modulação', text: 'Uso de SERMs, HCG ou inibidores de enzima para "religar" ou ajustar eixos (com acompanhamento).' },
            { icon: '⚠️', title: 'Alerta de Segurança', text: 'Automedicação com hormônios pode desligar sua produção natural permanentemente e causar infertilidade.' }
        ]
    }
];

export const LIFE_CYCLE_DATA = [
    {
        phase: 'Adulto Jovem (20-35 anos)',
        description: 'O auge da fertilidade e resiliência metabólica.',
        men: 'Pico de Testosterona. Facilidade em ganhar músculo. Eixo resiliente a noites mal dormidas (mas cobra juros depois). Foco: Construir a "poupança" muscular.',
        women: 'Ciclos regulares e pico de fertilidade. Estradiol alto protege ossos e coração. Foco: Regularidade menstrual é o sinal vital #1.'
    },
    {
        phase: 'Meia Idade (35-50 anos)',
        description: 'O declínio sutil e o aumento das responsabilidades (estresse).',
        men: 'Testosterona cai ~1% ao ano. Primeiros sinais de gordura visceral e queda de recuperação. Exige dieta limpa e sono regrado para manter performance.',
        women: 'Perimenopausa. Progesterona cai primeiro (ansiedade, sono ruim, TPM). Ciclos encurtam. Metabolismo desacelera. Foco: Musculação é obrigatória.'
    },
    {
        phase: 'Maturidade (50+ anos)',
        description: 'A fase de manutenção funcional e proteção.',
        men: 'Andropausa parcial. Risco cardiovascular sobe. Sarcopenia (perda de músculo) é o inimigo. TRT pode ser necessária se houver sintomas de hipogonadismo.',
        women: 'Menopausa (queda brusca de E2). Risco cardíaco iguala ao homem. Osteoporose acelera. Reposição hormonal (janela de oportunidade) muda qualidade de vida.'
    }
];
