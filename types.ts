
export enum SourceType {
  PDF = 'PDF',
  IMAGE = 'IMAGE',
  TEXT = 'TEXT',
  CSV = 'CSV',
  USER_INPUT = 'USER_INPUT',
  PRONTUARIO = 'PRONTUARIO'
}

export enum AnalysisType {
  CHAT = 'CHAT',
  WEEKLY_REPORT = 'WEEKLY_REPORT',
  RISK_ASSESSMENT = 'RISK_ASSESSMENT',
  FULL_PRONTUARIO = 'FULL_PRONTUARIO'
}

export type AppView = 'chat' | 'dashboard' | 'training_library' | 'metrics' | 'protocol_library' | 'profile' | 'sources' | 'billing' | 'timeline';

export interface AppVersion {
    id: string;
    version: string;
    description: string;
    created_at: string;
}

export interface UserProfile {
  id?: string;
  name: string;
  avatarUrl?: string;
  birthDate: string; // Changed from age to birthDate (YYYY-MM-DD)
  gender: 'Masculino' | 'Feminino';
  height: string; // cm
  weight: string; // kg
  bodyFat?: string; // %
  
  // NEW: Target Fields (Metas)
  targetWeight?: string;
  targetBodyFat?: string;
  targetMeasurements?: {
    chest: string;
    arm: string;
    waist: string;
    hips: string;
    thigh: string;
    calf: string;
  };

  comorbidities: string; 
  medications: string;
  measurements: {
    chest: string;
    arm: string;
    waist: string;
    hips: string;
    thigh: string;
    calf: string;
  };
  // NEW: Calculated fields (Not necessarily saved to DB, but computed on fly)
  calculatedStats?: {
      bmi: string; // Índice de Massa Corporal
      bmr: string; // Taxa Metabólica Basal (Mifflin-St Jeor)
      whr: string; // Waist-to-Hip Ratio (Relação Cintura-Quadril)
      bmiClassification?: string;
      whrRisk?: string;
  };
  // NEW: Legal fields
  termsAcceptedAt?: string | null;
  hideStartupDisclaimer?: boolean;
  // NEW: UI Preference
  theme?: 'light' | 'dark';
  rememberEmail?: boolean; // Persisted preference for login
  // NEW: Billing
  subscriptionStatus?: 'free' | 'active' | 'past_due' | 'canceled';
}

export interface UsageLog {
    id: string;
    actionType: string;
    cost: number;
    createdAt: string;
}

export interface Source {
  id: string;
  title: string;
  type: SourceType;
  date: string; // Data do Conteúdo (Exame/Coleta)
  createdAt?: string; // Data do Upload (Sistema)
  specificType?: string; // Tipo específico (Hemograma, Bioimpedância, etc)
  content: string; 
  summary?: string;
  selected: boolean;
  filePath?: string;
  fileUrl?: string;
}

export interface MetricPoint {
  date: string;
  value: number;
  unit: string;
  label: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  citations?: string[]; 
  timestamp: number;
  isThinking?: boolean;
  isBookmarked?: boolean; // NEW: Added for bookmarking feature
}

export interface Project {
  id: string;
  name: string;
  objective: 'Cutting' | 'Bulking' | 'Performance' | 'Longevity';
  sources: Source[];
  metrics: Record<string, MetricPoint[]>; 
  currentProtocol?: ProtocolItem[]; 
  trainingNotes?: string; // NEW: Added for persistence
  dietCalories?: string; // NEW: Persisted Diet Target
  lastAnalysis?: string;
  userProfile?: UserProfile;
}

// NEW: Risk Analysis Interface Updated for Traceability
export interface RiskFlag {
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
  category: 'Health' | 'Protocol' | 'Training';
  sourceId?: string; // ID do documento original
  date?: string;     // Data do achado
}

export interface ProtocolItem {
  compound: string;
  dosage: string;
  frequency: string;
}

export interface DailyLogData {
  goal: string;
  calories: string;
  trainingNotes: string;
  protocol: ProtocolItem[];
}

export interface Exercise {
  id: string;
  name: string;
  targetMuscle: string;
  secondaryMuscles: string[];
  equipment: string;
  difficulty: 'Iniciante' | 'Intermediário' | 'Avançado';
  images: string[];
  steps: string[];
  commonMistakes: string[];
  type: 'Push' | 'Pull' | 'Legs' | 'Core' | 'Cardio';
  mechanics: 'Composto' | 'Isolado' | 'N/A';
}

export interface Compound {
    id: string;
    name: string;
    category: 'Testosterona' | '19-Nor' | 'DHT' | 'Oral' | 'Peptídeo' | 'SERM/IA' | 'Termogênico' | 'Nootrópico' | 'Mitocondrial' | 'Protocolo Exemplo' | 'Outros' | 'Metabólico' | 'Suplemento';
    type: 'Injetável' | 'Oral' | 'Subcutâneo' | 'Topico' | 'Combo' | 'Transdérmico';
    halfLife: string;
    anabolicRating: string; 
    description: string;
    commonDosages: {
        beginner: string;
        advanced: string;
        women?: string;
    };
    sideEffects: string[];
    benefits: string[];
    riskLevel: 'Baixo' | 'Médio' | 'Alto' | 'Extremo';
}
