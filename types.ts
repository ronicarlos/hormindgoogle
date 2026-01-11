export enum SourceType {
  PDF = 'PDF',
  IMAGE = 'IMAGE',
  TEXT = 'TEXT',
  CSV = 'CSV',
  USER_INPUT = 'USER_INPUT'
}

export enum AnalysisType {
  CHAT = 'CHAT',
  WEEKLY_REPORT = 'WEEKLY_REPORT',
  RISK_ASSESSMENT = 'RISK_ASSESSMENT',
  FULL_PRONTUARIO = 'FULL_PRONTUARIO'
}

export interface Source {
  id: string;
  title: string;
  type: SourceType;
  date: string;
  content: string; 
  selected: boolean;
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
}

export interface Project {
  id: string;
  name: string;
  objective: 'Cutting' | 'Bulking' | 'Performance' | 'Longevity';
  sources: Source[];
  // Standardized keys: 'Testosterone', 'BodyWeight', 'Strength', 'Calories'
  metrics: Record<string, MetricPoint[]>; 
  currentProtocol?: ProtocolItem[]; // To track current state
  lastAnalysis?: string;
}

export interface RiskFlag {
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
  category: 'Health' | 'Protocol' | 'Training';
}

// Novos Tipos para Input Estruturado
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