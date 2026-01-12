import { Exercise } from '../types';

// URL do JSON oficial do Free Exercise DB
const DB_JSON_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
// Base URL para as imagens (raw content)
const BASE_IMAGE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

interface RawExercise {
  id: string;
  name: string;
  force: string | null;
  level: string;
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  images: string[];
}

// --- Dicionário de Movimentos (Núcleo do Nome) ---
const MOVEMENT_DICTIONARY: Record<string, string> = {
    'Bench Press': 'Supino',
    'Squat': 'Agachamento',
    'Deadlift': 'Levantamento Terra',
    'Leg Press': 'Leg Press',
    'Lunge': 'Afundo',
    'Curl': 'Rosca',
    'Extension': 'Extensão',
    'Press': 'Desenvolvimento',
    'Row': 'Remada',
    'Fly': 'Crucifixo',
    'Pull Up': 'Barra Fixa',
    'Chin Up': 'Barra Fixa (Supinada)',
    'Push Up': 'Flexão de Braço',
    'Dip': 'Mergulho',
    'Raise': 'Elevação',
    'Shrug': 'Encolhimento',
    'Crunch': 'Abdominal',
    'Plank': 'Prancha',
    'Sit Up': 'Abdominal Completo',
    'Calf Raise': 'Elevação de Panturrilha',
    'Clean': 'Arremesso (Clean)',
    'Snatch': 'Arranco (Snatch)',
    'Thrust': 'Elevação Pélvica',
    'Kickback': 'Coice',
    'Pulldown': 'Puxada',
    'Pushdown': 'Tríceps na Polia',
    'Good Morning': 'Bom Dia',
    'Hyper': 'Hiperextensão'
};

// --- Dicionário de Equipamentos/Variações (Sufixos) ---
const MODIFIER_DICTIONARY: Record<string, string> = {
    'Barbell': 'com Barra',
    'Dumbbell': 'com Halteres',
    'Kettlebell': 'com Kettlebell',
    'Cable': 'na Polia',
    'Machine': 'na Máquina',
    'Smith': 'no Smith',
    'Band': 'com Elástico',
    'Bodyweight': '(Peso do Corpo)',
    'Plate': 'com Anilha',
    'Incline': 'Inclinado',
    'Decline': 'Declinado',
    'Seated': 'Sentado',
    'Standing': 'Em Pé',
    'Lying': 'Deitado',
    'Bent Over': 'Curvado',
    'Front': 'Frontal',
    'Rear': 'Posterior',
    'Side': 'Lateral',
    'Single Leg': 'Unilateral',
    'One Arm': 'Unilateral',
    'Alternate': 'Alternado',
    'Wide Grip': 'Pegada Aberta',
    'Close Grip': 'Pegada Fechada',
    'Reverse Grip': 'Pegada Inversa',
    'Hammer': 'Martelo',
    'Preacher': 'no Banco Scott',
    'Concentration': 'Concentrada',
    'Skullcrusher': 'Testa',
    'Overhead': 'Acima da Cabeça'
};

// --- Inteligência de Tradução de Nomes ---
const translateName = (englishName: string): string => {
    let name = englishName;
    let coreName = name;
    let suffix = '';

    // 1. Identificar o Movimento Principal (Núcleo)
    for (const [eng, pt] of Object.entries(MOVEMENT_DICTIONARY)) {
        if (name.includes(eng)) {
            coreName = pt;
            // Remove o núcleo do nome original para processar o resto como modificador
            name = name.replace(eng, ''); 
            break;
        }
    }

    // 2. Identificar Modificadores e Equipamentos
    const modifiers: string[] = [];
    for (const [eng, pt] of Object.entries(MODIFIER_DICTIONARY)) {
        if (name.includes(eng)) {
            modifiers.push(pt);
        }
    }

    // Se não achou núcleo no dicionário, tenta tradução literal limpa
    if (coreName === englishName) {
        return englishName.replace(/_/g, ' '); 
    }

    // 3. Montar Nome em Português (Substantivo + Adjetivos + Equipamento)
    // Ex: "Barbell Incline Bench Press" -> "Supino" + "Inclinado" + "com Barra"
    const uniqueModifiers = Array.from(new Set(modifiers)); // Remove duplicatas
    return `${coreName} ${uniqueModifiers.join(' ')}`.trim();
};

const translateMuscle = (muscle: string): string => {
    const map: Record<string, string> = {
        'abdominals': 'Abdômen',
        'abductors': 'Abdutores',
        'adductors': 'Adutores',
        'biceps': 'Bíceps',
        'calves': 'Panturrilha',
        'chest': 'Peitoral',
        'forearms': 'Antebraço',
        'glutes': 'Glúteos',
        'hamstrings': 'Posterior de Coxa',
        'lats': 'Dorsal (Latíssimo)',
        'lower back': 'Lombar',
        'middle back': 'Meio das Costas',
        'neck': 'Pescoço',
        'quadriceps': 'Quadríceps',
        'shoulders': 'Ombros',
        'traps': 'Trapézio',
        'triceps': 'Tríceps'
    };
    const translated = map[muscle.toLowerCase()];
    return translated || muscle.charAt(0).toUpperCase() + muscle.slice(1);
};

// --- Gerador de Protocolos Biomecânicos Padrão ---
// Em vez de traduzir texto livre, usamos instruções padronizadas baseadas no tipo de exercício
const getStandardInstructions = (namePT: string, muscle: string): string[] => {
    const n = namePT.toLowerCase();
    const m = muscle.toLowerCase();

    if (n.includes('agachamento')) return [
        'Posicione os pés na largura dos ombros, pontas levemente para fora.',
        'Inspire fundo e trave o abdômen (Bracing).',
        'Inicie descendo o quadril para trás e para baixo, mantendo o peito estufado.',
        'Desça até quebrar a paralela (coxas abaixo do joelho) se tiver mobilidade.',
        'Empurre o chão com o calcanhar para subir, expirando no topo.'
    ];

    if (n.includes('supino')) return [
        'Deite-se no banco, mantendo os pés firmes no chão.',
        'Faça a retração escapular (junte as escápulas atrás das costas).',
        'Desça a barra controladamente até tocar a linha inferior do peitoral.',
        'Cotovelos devem estar a aprox. 45º do tronco, não abertos a 90º.',
        'Empurre a barra para cima de forma explosiva.'
    ];

    if (n.includes('terra') || n.includes('deadlift')) return [
        'Aproxime-se da barra até que ela toque sua canela.',
        'Segure a barra e baixe o quadril, mantendo a coluna neutra.',
        'Estufe o peito e tire a folga da barra (pretension).',
        'Empurre o chão com as pernas, mantendo a barra colada ao corpo.',
        'No topo, contraia os glúteos sem hiperestender a lombar.'
    ];

    if (n.includes('remada')) return [
        'Mantenha o tronco estabilizado e a coluna neutra.',
        'Inicie o movimento puxando os cotovelos para trás.',
        'Pense em "esmagar" algo entre as escápulas no final do movimento.',
        'Alongue bem os braços na fase excêntrica (ida) sem arredondar as costas.'
    ];

    if (n.includes('desenvolvimento') || n.includes('press') && m.includes('ombro')) return [
        'Mantenha o core travado para não arquear a lombar.',
        'Empurre a carga acima da cabeça até estender os cotovelos.',
        'Na descida, controle o peso até a altura do queixo ou orelha.',
        'Evite usar impulso das pernas (exceto se for Push Press).'
    ];

    if (n.includes('rosca') || m.includes('bíceps')) return [
        'Mantenha os cotovelos fixos ao lado do tronco.',
        'Flexione o cotovelo levando a carga até o ombro.',
        'Segure a contração por 1 segundo no topo.',
        'Desça controladamente resistindo à gravidade.'
    ];

    if (m.includes('tríceps')) return [
        'Trave os cotovelos na posição inicial (seja testa ou polia).',
        'Mova apenas o antebraço, estendendo o cotovelo completamente.',
        'Aperte o tríceps no final do movimento.',
        'Retorne à posição inicial sem mover o úmero (osso do braço).'
    ];

    // Fallback Genérico
    return [
        'Assuma a posição inicial com postura estável.',
        'Execute o movimento de forma controlada (2s subida, 2s descida).',
        'Mantenha a tensão no músculo alvo durante toda a repetição.',
        'Expire ao fazer força, inspire ao retornar.'
    ];
};

// --- Gerador de Erros Comuns Específicos ---
const getSpecificMistakes = (namePT: string, muscle: string): string[] => {
    const n = namePT.toLowerCase();
    
    if (n.includes('agachamento')) return [
        'Valgo Dinâmico: Joelhos entrarem para dentro na subida.',
        'Butt Wink: Arredondar a lombar no final da descida.',
        'Good Morning: Subir o quadril antes do peito.',
        'Tirar o calcanhar do chão.'
    ];

    if (n.includes('supino')) return [
        'Tirar a lombar do banco excessivamente.',
        'Cotovelos muito abertos (90º) sobrecarregando o ombro.',
        'Não fazer a retração das escápulas.',
        'Bater a barra no peito para usar impulso.'
    ];

    if (n.includes('terra')) return [
        'Cifose (arredondar as costas) tipo "gato".',
        'Barra longe da canela (aumenta torque na lombar).',
        'Hiperextensão desnecessária da coluna no topo.',
        'Agachar demais (transformando em Squat) em vez de usar o quadril (Hinge).'
    ];

    if (n.includes('elevação lateral')) return [
        'Usar balanço do tronco (roubar).',
        'Subir as mãos acima da linha dos ombros.',
        'Manter os braços totalmente esticados (mantenha leve flexão).',
        'Encolher o trapézio durante o movimento.'
    ];

    if (muscle.toLowerCase().includes('abdômen')) return [
        'Puxar o pescoço com as mãos.',
        'Usar flexores de quadril em vez do abdômen.',
        'Não soltar o ar na contração.'
    ];

    return [
        'Execução muito rápida (sem tempo sob tensão).',
        'Amplitude de movimento incompleta.',
        'Uso excessivo de impulso (momentum).',
        'Respiração incorreta.'
    ];
};

export const fetchExercises = async (): Promise<Exercise[]> => {
  try {
    const response = await fetch(DB_JSON_URL);
    if (!response.ok) throw new Error('Falha ao carregar banco de exercícios');
    
    const data: RawExercise[] = await response.json();

    const processedExercises: Exercise[] = data
        .filter(ex => ex.images && ex.images.length >= 2)
        .map(ex => {
            const namePT = translateName(ex.name);
            const targetMuscle = translateMuscle(ex.primaryMuscles[0] || 'Geral');
            
            // Generate content locally instead of trusting API text
            const steps = getStandardInstructions(namePT, ex.primaryMuscles[0] || '');
            const mistakes = getSpecificMistakes(namePT, ex.primaryMuscles[0] || '');

            let difficulty: 'Iniciante' | 'Intermediário' | 'Avançado' = 'Iniciante';
            if (ex.level === 'expert') difficulty = 'Avançado';
            if (ex.level === 'intermediate') difficulty = 'Intermediário';

            let type: 'Push' | 'Pull' | 'Legs' | 'Core' | 'Cardio' = 'Push';
            const pm = ex.primaryMuscles[0] || '';
            if (['quadriceps', 'hamstrings', 'calves', 'glutes', 'abductors', 'adductors'].includes(pm)) type = 'Legs';
            else if (['abdominals', 'lower back'].includes(pm)) type = 'Core';
            else if (ex.force === 'pull') type = 'Pull';
            else if (ex.category === 'cardio') type = 'Cardio';

            let mechanics: 'Composto' | 'Isolado' | 'N/A' = 'N/A';
            if (ex.mechanic === 'compound') mechanics = 'Composto';
            if (ex.mechanic === 'isolation') mechanics = 'Isolado';

            const fullImages = ex.images.map(img => `${BASE_IMAGE_URL}${img}`);

            return {
                id: ex.id,
                name: namePT,
                targetMuscle,
                secondaryMuscles: ex.secondaryMuscles.map(translateMuscle),
                equipment: translateMuscle(ex.equipment || 'Livre'), // Reuse translate logic specifically for simple equipment terms if needed, or leave generic
                difficulty,
                type,
                mechanics,
                images: fullImages,
                steps,
                commonMistakes: mistakes
            };
        });

    return processedExercises;

  } catch (error) {
    console.error("Erro ao buscar exercícios:", error);
    return [];
  }
};