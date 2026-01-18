
export interface HormoneData {
    id: string;
    name: string;
    function: string;
    genderDifferences: string;
    lowSymptoms: string[];
    highSymptoms: string[];
    lifestyleFixes: string[];
}

export const HORMONE_GUIDE_DATA: HormoneData[] = [
    {
        id: 'testosterone',
        name: 'Testosterona',
        function: 'Principal hormônio anabólico e androgênico. Regula massa muscular, densidade óssea, libido e motivação (dopamina).',
        genderDifferences: 'HOMENS: Produzida nos testículos. Níveis 10x a 15x maiores. Define características masculinas.\nMULHERES: Produzida nos ovários/adrenais. Vital para libido, energia e tônus muscular, mas em doses muito menores.',
        lowSymptoms: [
            'Baixa libido e disfunção erétil (H)',
            'Perda de massa muscular e força',
            'Acúmulo de gordura abdominal',
            'Depressão, falta de motivação e "brain fog"',
            'Fadiga crônica e letargia'
        ],
        highSymptoms: [
            'Oleosidade na pele e acne severa',
            'Agressividade ou irritabilidade (pavio curto)',
            'Queda de cabelo (se converter em DHT)',
            'Virilização em mulheres (pelos, voz grossa)',
            'Aumento do hematócrito (sangue grosso)'
        ],
        lifestyleFixes: [
            'Sono: Dormir 7-9h é inegociável (pico de produção ocorre no sono REM).',
            'Dieta: Consumir gorduras saturadas e monoinsaturadas (colesterol é a matéria-prima).',
            'Treino: Musculação pesada (compostos) estimula a produção.',
            'Nutrientes: Zinco, Magnésio e Vitamina D devem estar otimizados.'
        ]
    },
    {
        id: 'estradiol',
        name: 'Estradiol (E2)',
        function: 'Principal estrogênio. Protege o cérebro (neuroprotetor), articulações, ossos e sistema cardiovascular.',
        genderDifferences: 'HOMENS: Derivado da conversão da testosterona. Essencial para libido e ereção.\nMULHERES: Regula ciclo menstrual, hidratação da pele/mucosas e humor.',
        lowSymptoms: [
            'Dor nas articulações (ressecamento)',
            'Risco de osteoporose e fraturas',
            'Queda de libido (sim, mesmo em homens)',
            'Pele seca e envelhecida',
            'Irritabilidade e ansiedade'
        ],
        highSymptoms: [
            'Retenção hídrica severa (inchaço)',
            'Labilidade emocional (choro fácil)',
            'Ginecomastia (em homens)',
            'Acúmulo de gordura no quadril/coxas',
            'Dificuldade de ereção'
        ],
        lifestyleFixes: [
            'Controle de Peso: Gordura visceral contém aromatase, que converte Testo em E2. Emagrecer baixa o E2.',
            'Fígado: Evitar álcool ajuda o fígado a metabolizar o excesso de estrogênio.',
            'Fibras: Dieta rica em vegetais crucíferos (brócolis) ajuda a eliminar estrogênio.',
            'Cuidado com IAs: Não zere seu estradiol com medicamentos sem necessidade médica.'
        ]
    },
    {
        id: 'cortisol',
        name: 'Cortisol',
        function: 'Hormônio do estresse e do despertar. Mobiliza energia (glicose) em situações de perigo. Anti-inflamatório natural.',
        genderDifferences: 'Atua de forma similar. Mulheres podem ser mais sensíveis a distúrbios de cortisol devido à interação com progesterona.',
        lowSymptoms: [
            'Fadiga extrema (Burnout / Fadiga Adrenal)',
            'Tontura ao levantar rápido (hipotensão)',
            'Baixa resistência a inflamações e doenças',
            'Dificuldade de acordar pela manhã'
        ],
        highSymptoms: [
            'Ansiedade, taquicardia e insônia',
            'Catabolismo muscular (perda de massa)',
            'Gordura visceral (barriga dura)',
            'Rosto inchado ("Face de Lua")',
            'Queda de imunidade'
        ],
        lifestyleFixes: [
            'Gestão de Estresse: Meditação, respiração profunda e lazer.',
            'Cafeína: Evitar estimulantes após as 14h.',
            'Ritmo: Exposição à luz solar ao acordar e escuridão total à noite.',
            'Pós-Treino: Carboidratos após treino intenso ajudam a baixar o cortisol.'
        ]
    },
    {
        id: 'thyroid',
        name: 'Tireoide (T3/T4/TSH)',
        function: 'O termostato do corpo. Regula a velocidade do metabolismo, temperatura corporal e síntese proteica.',
        genderDifferences: 'Mulheres têm 5x a 8x mais chances de desenvolver problemas na tireoide (Hipotireoidismo/Hashimoto).',
        lowSymptoms: [
            'Metabolismo lento (ganho de peso fácil)',
            'Frio excessivo (pés e mãos gelados)',
            'Queda de cabelo difusa e unhas fracas',
            'Constipação intestinal',
            'Fadiga mental e depressão'
        ],
        highSymptoms: [
            'Perda de peso rápida (mesmo comendo)',
            'Calor excessivo e sudorese',
            'Taquicardia e tremores',
            'Ansiedade e insônia',
            'Olhos saltados (casos graves)'
        ],
        lifestyleFixes: [
            'Nutrientes: Iodo, Selênio e Zinco são essenciais para conversão de T4 em T3.',
            'Estresse: Cortisol alto bloqueia a tireoide.',
            'Gut Health: O intestino converte 20% do T4 em T3. Trate disbioses.',
            'Evitar dietas extremas: Déficit calórico muito agressivo "desliga" a tireoide.'
        ]
    },
    {
        id: 'insulin',
        name: 'Insulina',
        function: 'Hormônio de armazenamento. Transporta glicose e aminoácidos para dentro das células (músculo ou gordura).',
        genderDifferences: 'Similar. Síndrome dos Ovários Policísticos (SOP) em mulheres está fortemente ligada à resistência à insulina.',
        lowSymptoms: [
            'Diabetes Tipo 1 (dependência externa)',
            'Catabolismo muscular severo',
            'Cetoacidose (hálito de acetona)',
            'Sede excessiva e muita urina'
        ],
        highSymptoms: [
            'Resistência à Insulina (Pré-diabetes)',
            'Dificuldade extrema em queimar gordura',
            'Sonolência após refeições',
            'Acantose (manchas escuras no pescoço)',
            'Fome constante (carb cravings)'
        ],
        lifestyleFixes: [
            'Dieta: Reduzir carboidratos refinados e açúcar. Jejum intermitente ajuda muito.',
            'Treino: Musculação aumenta a sensibilidade à insulina (músculo é um "ralo" de glicose).',
            'Suplementos: Cromo, Berberina e Ácido Alfa Lipóico podem ajudar.',
            'Sono: Uma noite mal dormida pode causar resistência à insulina temporária.'
        ]
    },
    {
        id: 'gh',
        name: 'GH (Hormônio do Crescimento)',
        function: 'Reparo tecidual, crescimento celular e lipólise (queima de gordura). É o hormônio da "juventude".',
        genderDifferences: 'Mulheres secretam mais GH basalmente, mas em pulsos diferentes. Homens têm picos maiores durante o sono.',
        lowSymptoms: [
            'Envelhecimento precoce da pele',
            'Aumento de gordura abdominal',
            'Dificuldade de recuperação muscular',
            'Perda de densidade óssea',
            'Baixa qualidade de sono'
        ],
        highSymptoms: [
            'Gigantismo (em crianças) ou Acromegalia (adultos)',
            'Crescimento de mãos, pés e mandíbula',
            'Resistência à insulina (GH antagoniza insulina)',
            'Dor nas articulações (Síndrome do túnel do carpo)'
        ],
        lifestyleFixes: [
            'Sono Profundo: 70% do GH é liberado no sono profundo (Delta).',
            'Jejum: A insulina inibe o GH. Dormir de estômago vazio potencializa o pico noturno.',
            'Treino: Exercícios de alta intensidade (HIIT/Pesos) estimulam a produção.',
            'Sauna: Exposição ao calor intenso pode aumentar GH temporariamente.'
        ]
    }
];

export const LIFE_CYCLE_DATA = [
    {
        phase: 'Adulto Jovem (20-35 anos)',
        description: 'O auge hormonal. O corpo perdoa erros de estilo de vida, mas é a fase de construir a "poupança" metabólica.',
        men: 'Testosterona no pico. Facilidade em ganhar músculo e manter baixo BF. Foco: Maximizar construção de massa magra.',
        women: 'Ciclos menstruais regulares. Pico de fertilidade. Estradiol protege ossos e coração. Foco: Regularidade do ciclo e ferro.'
    },
    {
        phase: 'Meia Idade (35-50 anos)',
        description: 'O declínio sutil. O metabolismo desacelera e o estresse (cortisol) costuma aumentar devido à carreira/família.',
        men: 'Testosterona cai ~1% ao ano. Primeiros sinais de gordura visceral. Recuperação mais lenta. Exige treino e dieta mais limpos.',
        women: 'Perimenopausa. Progesterona cai primeiro (ansiedade, insônia). Ciclos irregulares. Metabolismo muda. Foco: Musculação para ossos.'
    },
    {
        phase: 'Envelhecimento (50+ anos)',
        description: 'A fase de manutenção. Hormônios sexuais caem drasticamente. O foco muda de "estética" para "funcionalidade e longevidade".',
        men: 'Andropausa parcial. Risco cardiovascular aumenta. Sarcopenia (perda de músculo) é o inimigo nº 1. TRT pode ser indicada medicamente.',
        women: 'Menopausa (queda brusca de E2). Risco cardíaco iguala ao dos homens. Osteoporose. Reposição hormonal (se indicada) muda qualidade de vida.'
    }
];
