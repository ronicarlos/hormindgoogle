import React, { useState, useEffect, useRef } from 'react';
import SourceSidebar from './components/SourceSidebar';
import MetricDashboard from './components/MetricDashboard';
import InputModal from './components/InputModal';
import { Source, SourceType, Project, ChatMessage, RiskFlag, DailyLogData, MetricPoint } from './types';
import { generateAIResponse, generateWeeklyReport, generateProntuario } from './services/geminiService';
import { IconSend, IconSparkles, IconMessage, IconAlert, IconPlus } from './components/Icons';
import ReactMarkdown from 'react-markdown';

// --- MOCK DATA INICIAL ---
const MOCK_SOURCES: Source[] = [
  {
    id: '1',
    title: 'Exames de Sangue - Jan 2024.pdf',
    type: SourceType.PDF,
    date: '15/01/2024',
    selected: true,
    content: `
      TESTOSTERONA, TOTAL: 450 ng/dL (Ref: 264-916)
      ESTRADIOL: 22 pg/mL (Ref: 7.6-42.6)
      HDL COLESTEROL: 35 mg/dL (Baixo)
      LDL COLESTEROL: 110 mg/dL (Alto)
      AST: 45 U/L (Alto)
      ALT: 50 U/L (Alto)
    `
  },
];

const INITIAL_PROJECT: Project = {
  id: 'p1',
  name: 'Bulking Inverno 2024',
  objective: 'Bulking',
  sources: MOCK_SOURCES,
  metrics: {
    'Testosterone': [
      { date: '08/2023', value: 550, unit: 'ng/dL', label: 'Basal' },
      { date: '11/2023', value: 480, unit: 'ng/dL', label: 'Meio do Ciclo' },
      { date: '01/2024', value: 450, unit: 'ng/dL', label: 'Atual' },
    ],
    'BodyWeight': [
        { date: '08/2023', value: 80, unit: 'kg', label: 'Início' },
        { date: '10/2023', value: 83, unit: 'kg', label: 'Check' },
        { date: '02/2024', value: 88.5, unit: 'kg', label: 'Atual' },
    ],
    'Strength': [
        { date: 'Sem 1', value: 100, unit: 'kg', label: 'Supino 1RM' },
        { date: 'Sem 2', value: 102, unit: 'kg', label: 'Supino 1RM' },
        { date: 'Sem 3', value: 105, unit: 'kg', label: 'Supino 1RM' },
    ],
    'Calories': [
        { date: 'Seg', value: 2400, unit: 'kcal', label: 'Avg' },
        { date: 'Ter', value: 2500, unit: 'kcal', label: 'Avg' },
        { date: 'Qua', value: 2350, unit: 'kcal', label: 'Avg' },
        { date: 'Qui', value: 2600, unit: 'kcal', label: 'Avg' },
    ]
  }
};

const MOCK_RISKS: RiskFlag[] = [
    { category: 'Health', level: 'HIGH', message: 'AST/ALT elevados + Protocolo. Monitore o fígado.' },
    { category: 'Protocol', level: 'MEDIUM', message: 'HDL baixo requer atenção na dieta e cardio.' }
];

const DISCLAIMER_TEXT = "FitLM é uma ferramenta educacional e analítica. Não substitui consulta médica. O uso de substâncias ergogênicas possui riscos graves à saúde.";

const App: React.FC = () => {
  // State for Project Data (Dynamic)
  const [project, setProject] = useState<Project>(INITIAL_PROJECT);
  const [sources, setSources] = useState<Source[]>(MOCK_SOURCES);
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'model', text: 'Olá. Sou sua IA de inteligência atlética. Adicione seus dados de treino, dieta e protocolo no botão "+" para que eu possa fazer uma análise completa.', timestamp: Date.now() }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleToggleSource = (id: string) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, selected: !s.selected } : s));
  };

  const handleSaveInputData = async (data: DailyLogData) => {
    // 1. Create a readable string representation of the data for the AI
    const todayStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    
    const contentString = `
    [REGISTRO DIÁRIO - ${todayStr}]
    Objetivo: ${data.goal}
    Calorias: ${data.calories} kcal
    Notas de Treino: ${data.trainingNotes}
    Protocolo Atual:
    ${data.protocol.map(p => `- ${p.compound}: ${p.dosage} (${p.frequency})`).join('\n')}
    `;

    // 2. Add as a new Source for RAG
    const newSource: Source = {
        id: Date.now().toString(),
        title: `Input Diário - ${todayStr}`,
        date: todayStr,
        type: SourceType.USER_INPUT,
        content: contentString,
        selected: true
    };

    const updatedSources = [...sources, newSource];
    setSources(updatedSources);

    // 3. Update Visual Graphs (Project State)
    // We add the new calorie point to the chart
    const newCaloriePoint: MetricPoint = {
        date: 'Hoje',
        value: parseInt(data.calories) || 0,
        unit: 'kcal',
        label: 'Input'
    };

    setProject(prev => {
        const updatedMetrics = { ...prev.metrics };
        // Append calories
        if (updatedMetrics['Calories']) {
            updatedMetrics['Calories'] = [...updatedMetrics['Calories'], newCaloriePoint];
        }
        
        // Simulate a strength metric update if mentioned in notes (Simple parsing simulation)
        // In a real app, we would parse this specifically or have a field for it
        if (data.trainingNotes.toLowerCase().includes('pr') || data.trainingNotes.includes('100')) {
             const lastStrength = updatedMetrics['Strength'][updatedMetrics['Strength'].length - 1].value;
             updatedMetrics['Strength'] = [...updatedMetrics['Strength'], {
                 date: 'Hoje',
                 value: lastStrength + 2, // Optimistic simulation
                 unit: 'kg',
                 label: 'Est.'
             }];
        }

        return {
            ...prev,
            metrics: updatedMetrics,
            currentProtocol: data.protocol // Store current protocol for context
        };
    });

    // 4. Trigger holistic analysis automatically
    setIsProcessing(true);
    setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'user',
        text: `Atualizei meus dados (Dieta: ${data.calories}kcal, Protocolo: ${data.protocol.length} itens). Faça uma análise cruzada com meus exames.`,
        timestamp: Date.now()
    }]);

    const response = await generateAIResponse(
        "O usuário atualizou os dados. Faça uma análise de risco e consistência cruzando o novo protocolo informado com os exames de sangue existentes.",
        updatedSources,
        messages
    );

    setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response,
        timestamp: Date.now()
    }]);
    setIsProcessing(false);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsProcessing(true);

    const activeSources = sources.filter(s => s.selected);
    const responseText = await generateAIResponse(userMsg.text, activeSources, messages);

    const modelMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, modelMsg]);
    setIsProcessing(false);
  };

  const handleGenerateProntuario = async () => {
    if(isProcessing) return;
    setIsProcessing(true);
    
    // Add a system message indicating generation started
    setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'user',
        text: "Gerar Prontuário Completo do Atleta",
        timestamp: Date.now()
    }]);

    const activeSources = sources.filter(s => s.selected);
    const report = await generateProntuario(activeSources);
    
    const modelMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: report,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, modelMsg]);
    setIsProcessing(false);
  }

  // Disclaimer Modal
  if (!disclaimerAccepted) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
          <div className="flex justify-center mb-4">
             <div className="bg-red-100 p-3 rounded-full">
                <IconAlert className="w-8 h-8 text-red-600" />
             </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Aviso de Segurança</h2>
          <p className="text-gray-600 text-center mb-6 text-sm leading-relaxed">
            {DISCLAIMER_TEXT}
          </p>
          <button 
            onClick={() => setDisclaimerAccepted(true)}
            className="w-full py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-all"
          >
            Entendo e Concordo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      {/* LEFT: Sources */}
      <SourceSidebar 
        sources={sources} 
        onToggleSource={handleToggleSource}
        onAddSource={() => alert("Upload de arquivo abriria aqui.")} 
      />

      {/* MIDDLE: Chat Interface */}
      <div className="flex-1 flex flex-col h-screen relative bg-white">
        {/* Header */}
        <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-white z-10">
            <h2 className="font-medium text-gray-700">{project.name}</h2>
            <div className="flex gap-2">
                 <button 
                    onClick={() => setIsModalOpen(true)}
                    className="text-xs font-medium text-white bg-black px-3 py-1.5 rounded-full hover:bg-gray-800 transition-colors flex items-center gap-1 shadow-sm"
                 >
                    <IconPlus className="w-3 h-3" />
                    Add Dados Diários
                 </button>
            </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-2xl w-full ${msg.role === 'user' ? 'ml-auto' : ''}`}>
                {msg.role === 'model' && (
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center">
                            <IconSparkles className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">FitLM AI</span>
                    </div>
                )}
                
                <div className={`
                  ${msg.role === 'user' 
                    ? 'bg-gray-100 text-gray-800 rounded-2xl rounded-tr-sm px-5 py-3 text-right inline-block float-right' 
                    : 'bg-transparent text-gray-800 text-base leading-7'}
                `}>
                  {msg.role === 'user' ? (
                      msg.text
                  ) : (
                    <div className="prose prose-blue prose-sm max-w-none">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex justify-start w-full animate-pulse">
                <div className="max-w-2xl w-full">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200" />
                        <div className="h-3 w-16 bg-gray-200 rounded" />
                    </div>
                    <div className="space-y-2">
                        <div className="h-4 bg-gray-100 rounded w-3/4" />
                        <div className="h-4 bg-gray-100 rounded w-1/2" />
                    </div>
                </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="max-w-3xl mx-auto relative">
             <div className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400">
                <IconMessage className="w-5 h-5" />
             </div>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Pergunte ou comente sobre sua evolução..."
              className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all shadow-sm text-gray-700 placeholder-gray-400"
            />
            <button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isProcessing}
              className="absolute top-1/2 -translate-y-1/2 right-3 p-2 bg-black text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-black transition-all"
            >
              <IconSend className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT: Metrics & Insights */}
      <MetricDashboard 
        project={project} 
        risks={MOCK_RISKS} 
        onGenerateProntuario={handleGenerateProntuario}
      />

      {/* INPUT MODAL */}
      <InputModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveInputData}
      />
    </div>
  );
};

export default App;