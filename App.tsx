
import React, { useState, useEffect, useRef } from 'react';
import SourceSidebar from './components/SourceSidebar';
import MetricDashboard from './components/MetricDashboard';
import InputModal from './components/InputModal';
import ProntuarioModal from './components/ProntuarioModal';
import SourceDetailModal from './components/SourceDetailModal'; 
import WizardModal from './components/WizardModal'; // NEW IMPORT
import ExerciseLibrary from './components/ExerciseLibrary';
import ProtocolLibrary from './components/ProtocolLibrary';
import ProfileView from './components/ProfileView';
import AuthScreen from './components/AuthScreen';
import { Source, SourceType, Project, ChatMessage, RiskFlag, DailyLogData, MetricPoint, AppView, UserProfile, Exercise } from './types';
import { generateAIResponse, generateProntuario, generateDocumentSummary, processDocument } from './services/geminiService';
import { dataService } from './services/dataService';
import { supabase } from './lib/supabase';
import { IconSend, IconSparkles, IconMessage, IconAlert, IconPlus, IconLayout, IconDumbbell, IconActivity, IconScience, IconUser, IconFile, IconFolder, IconDownload, IconCheck, IconTrash, IconSearch, IconArrowLeft, IconBookmark, IconBookmarkFilled, IconClose } from './components/Icons';
import ReactMarkdown from 'react-markdown';
import { Tooltip } from './components/Tooltip';

const MOCK_RISKS: RiskFlag[] = [
    { category: 'Health', level: 'HIGH', message: 'AST/ALT elevados + Protocolo. Monitore o fígado.' },
    { category: 'Protocol', level: 'MEDIUM', message: 'HDL baixo requer atenção na dieta e cardio.' }
];

const DISCLAIMER_TEXT = "FitLM é uma ferramenta educacional e analítica. Não substitui consulta médica. O uso de substâncias ergogênicas possui riscos graves à saúde.";

// --- HIGHLIGHT COMPONENT HELPER ---
const HighlightText = ({ text, highlight }: { text: string, highlight: string }) => {
    if (!highlight || !text) return <>{text}</>;
    
    // Escape regex special characters to prevent errors
    const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedHighlight})`, 'gi'));
    
    return (
        <>
            {parts.map((part, i) => 
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <span key={i} className="bg-yellow-200 text-gray-900 font-bold px-0.5 rounded shadow-sm">{part}</span>
                ) : (
                    part
                )
            )}
        </>
    );
};

const App: React.FC = () => {
  // Auth State
  const [session, setSession] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // App State
  const [project, setProject] = useState<Project | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Search & Bookmark State
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatMessage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

  // Prontuario State
  const [prontuarioContent, setProntuarioContent] = useState('');
  const [isProntuarioOpen, setIsProntuarioOpen] = useState(false);

  // Source Detail State (Deep Dive)
  const [viewingSource, setViewingSource] = useState<Source | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Wizard State
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Delete Confirmation State
  const [sourceToDelete, setSourceToDelete] = useState<Source | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);

  // 1. Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthChecking(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthChecking(false);
      if (!session) {
          setProject(null);
          setSources([]);
          setMessages([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Data Fetching
  useEffect(() => {
    const loadUserData = async () => {
        if (!session?.user?.id) return;

        try {
            const loadedProject = await dataService.getOrCreateProject(session.user.id);
            if (loadedProject) {
                setProject(loadedProject);
                setSources(loadedProject.sources);
                
                const history = await dataService.getMessages(loadedProject.id);
                
                if (history.length > 0) {
                    setMessages(history);
                } else {
                    let welcomeText = '';
                    if(loadedProject.sources.length === 0) {
                         welcomeText = 'Olá. Sou sua IA de inteligência atlética. Seu banco de dados está vazio. Adicione exames ou dados de treino para começar.';
                    } else {
                         welcomeText = `Bem-vindo de volta. Carreguei ${loadedProject.sources.length} fontes e métricas do seu projeto "${loadedProject.name}".`;
                    }
                    const initialMsg: ChatMessage = { id: Date.now().toString(), role: 'model', text: welcomeText, timestamp: Date.now() };
                    await dataService.addMessage(loadedProject.id, initialMsg);
                    setMessages([initialMsg]);
                }

                // Check for Missing Data (Auto-Open Wizard)
                if (loadedProject.userProfile) {
                    const p = loadedProject.userProfile;
                    const isMissingCritical = !p.name || !p.height || !p.weight || !p.measurements.waist;
                    if (isMissingCritical) {
                        setIsWizardOpen(true);
                    }
                }
            }
        } catch (error) {
            console.error("Error loading user data:", error);
            setMessages([{ id: 'err', role: 'model', text: 'Erro ao carregar dados do projeto.', timestamp: Date.now() }]);
        }
    };

    if (session) {
        loadUserData();
    }
  }, [session]);

  useEffect(() => {
    if (!isSearchActive && !showBookmarksOnly) {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentView, isSearchActive, showBookmarksOnly]);

  const handleToggleSource = async (id: string) => {
    const source = sources.find(s => s.id === id);
    if (!source) return;
    
    const newState = !source.selected;
    setSources(prev => prev.map(s => s.id === id ? { ...s, selected: newState } : s));
    await dataService.toggleSourceSelection(id, newState);
  };
  
  // Opens the Confirmation Modal
  const handleRequestDelete = (id: string) => {
      const source = sources.find(s => s.id === id);
      if (source) {
          setSourceToDelete(source);
      }
  };

  // Executes the actual deletion
  const confirmDeleteSource = async () => {
      if (!sourceToDelete) return;
      setIsDeleting(true);

      try {
        // 1. Update Local State (Optimistic)
        const updatedSources = sources.filter(s => s.id !== sourceToDelete.id);
        setSources(updatedSources);
        
        if (project) {
            setProject({ ...project, sources: updatedSources });
        }

        // 2. DB Delete
        await dataService.deleteSource(sourceToDelete.id);
        
        // 3. Optional: Add a system message saying context was updated
        // (Keeping it silent for now to be less intrusive)
      } catch (error) {
          console.error("Erro ao excluir", error);
          alert("Erro ao excluir o documento. Tente novamente.");
      } finally {
          setIsDeleting(false);
          setSourceToDelete(null); // Close modal
      }
  };

  const handleUpdateProfile = (newProfile: UserProfile) => {
     if (project) {
        setProject({ ...project, userProfile: newProfile });
     }
  };
  
  const handleLogout = async () => {
      await supabase.auth.signOut();
  };

  const readFileContent = (file: File): Promise<string> => {
      return new Promise((resolve) => {
          if (file.type.startsWith('text/') || file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target?.result as string);
              reader.readAsText(file);
          } else {
             // For Images/PDFs, we will use the Gemini Processing result later.
             // This is just a fallback initial text.
             resolve(`[Arquivo em processamento: ${file.name}]`);
          }
      });
  };

  const handleAddSourceFile = async (file: File) => {
      if (!project || !session?.user?.id) return;
      
      // 1. Initial State for UI (Optimistic)
      setIsProcessing(true);
      const isImage = file.type.startsWith('image/');
      const todayStr = new Date().toLocaleDateString('pt-BR');
      
      // 2. Upload to Storage
      const filePath = await dataService.uploadFileToStorage(file, session.user.id, project.id);
      
      if (!filePath) {
          alert("Erro ao fazer upload do arquivo. Tente novamente.");
          setIsProcessing(false);
          return;
      }
      
      const tempUrl = URL.createObjectURL(file);
      
      // 3. PROCESS DOCUMENT (OCR + METRICS)
      // This is the heavy lifting using Gemini Vision
      const processingMsg: ChatMessage = {
          id: 'proc', role: 'model', text: '🔄 Analisando imagem e extraindo dados (OCR)...', timestamp: Date.now()
      };
      setMessages(prev => [...prev, processingMsg]);

      let finalContent = "";
      let extractedMetrics: { category: string; data: MetricPoint }[] = [];

      // If it's a text file, just read it. If it's an image/pdf, Process it.
      if (file.type.startsWith('text/') || file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
           finalContent = await readFileContent(file);
      } else {
           const result = await processDocument(file, todayStr);
           finalContent = result.extractedText;
           extractedMetrics = result.metrics;
      }

      // 4. Create Source Object with REAL CONTENT (OCR)
      const newSource: Source = {
        id: crypto.randomUUID(),
        title: file.name,
        type: isImage ? SourceType.IMAGE : SourceType.PDF,
        date: todayStr,
        selected: true,
        content: finalContent, // Persisting the OCR Text!
        filePath: filePath
      };

      // 5. Save Source to DB
      const dbError = await dataService.addSource(project.id, newSource);
      if (dbError) {
          console.error("Database Error:", dbError);
          // CRITICAL: Stop here if DB fails, so we don't think we succeeded
          setMessages(prev => prev.filter(m => m.id !== 'proc'));
          alert(`Erro de Persistência: Não foi possível salvar o arquivo no banco de dados.\n\nDetalhe: ${dbError.message}\n\nPor favor, rode o script SQL fornecido no Supabase para corrigir.`);
          setIsProcessing(false);
          return;
      }

      // 6. Save Metrics to DB
      for (const m of extractedMetrics) {
          await dataService.addMetric(project.id, m.category, m.data);
      }

      // 7. Update Local State
      setSources(prev => [...prev, { ...newSource, fileUrl: tempUrl }]);
      setProject(prev => {
        if (!prev) return null;
        const updatedMetrics = { ...prev.metrics };
        extractedMetrics.forEach(m => {
            if (!updatedMetrics[m.category]) updatedMetrics[m.category] = [];
            updatedMetrics[m.category].push(m.data);
        });
        return { ...prev, metrics: updatedMetrics };
      });
      
      // 8. Chat Feedback
      setMessages(prev => prev.filter(m => m.id !== 'proc')); // Remove loading msg
      
      let extractionDetails = "";
      if (extractedMetrics.length > 0) {
           const metricsList = extractedMetrics.map(m => `${m.category}: ${m.data.value}`).join(', ');
           extractionDetails = `\n\n📊 **Extraí os seguintes dados:** ${metricsList}`;
      }

      const sysMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'model',
          text: `Arquivo **${file.name}** processado com sucesso.${extractionDetails}\n\nO conteúdo do arquivo foi transcrito e salvo para futuras análises.`,
          timestamp: Date.now()
      };
      setMessages(prev => [...prev, sysMsg]);
      await dataService.addMessage(project.id, sysMsg);
      
      setIsProcessing(false);
  };
  
  const handleMobileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          handleAddSourceFile(file);
      }
      if (e.target) e.target.value = '';
  };

  const handleSaveInputData = async (data: DailyLogData) => {
    if (!project) return;

    const todayStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const contentString = `
    [REGISTRO DIÁRIO - ${todayStr}]
    Objetivo: ${data.goal}
    Calorias: ${data.calories} kcal
    Notas de Treino: ${data.trainingNotes}
    Protocolo Atual:
    ${data.protocol.map(p => `- ${p.compound}: ${p.dosage} (${p.frequency})`).join('\n')}
    `;

    const newSource: Source = {
        id: crypto.randomUUID(),
        title: `Input Diário - ${todayStr}`,
        date: todayStr,
        type: SourceType.USER_INPUT,
        content: contentString,
        selected: true
    };

    // 1. Save Source (History Log)
    const dbError = await dataService.addSource(project.id, newSource);
    if (dbError) {
        alert("Erro ao salvar registro no banco de dados.");
        return;
    }
        
    // 2. Save Calories Metric
    if (data.calories) {
        await dataService.addMetric(project.id, 'Calories', {
            date: todayStr,
            value: parseInt(data.calories),
            unit: 'kcal',
            label: 'Input'
        });
    }

    // 3. Update Project Settings (Goal, Protocol AND Training Notes) - Persistent Data
    await dataService.updateProjectSettings(project.id, data.goal, data.protocol, data.trainingNotes);
  
    // 4. Update Local State
    setSources(prev => [...prev, newSource]);
    setProject(prev => {
        if (!prev) return null;
        const updatedMetrics = { ...prev.metrics };
        if (data.calories) {
            updatedMetrics['Calories'] = [...(updatedMetrics['Calories'] || []), {
                 date: todayStr, value: parseInt(data.calories), unit: 'kcal', label: 'Input'
            }];
        }
        return { 
            ...prev, 
            metrics: updatedMetrics, 
            currentProtocol: data.protocol, 
            objective: data.goal as any,
            trainingNotes: data.trainingNotes // Update local state for Training Notes
        };
    });

    setIsProcessing(true);
    setCurrentView('dashboard');
    
    const userTriggerMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        text: `Atualizei meus dados (Treino, Dieta, Protocolo) no sistema.`,
        timestamp: Date.now()
    };
    setMessages(prev => [...prev, userTriggerMsg]);
    await dataService.addMessage(project.id, userTriggerMsg);

    const updatedSourcesList = [...sources, newSource];
    const response = await generateAIResponse(
        "O usuário atualizou os dados. Faça uma análise breve de risco e consistência com os novos dados inseridos.",
        updatedSourcesList,
        messages,
        project.userProfile,
        project.metrics // Pass metrics to context
    );

    const aiResponseMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response,
        timestamp: Date.now()
    };
    setMessages(prev => [...prev, aiResponseMsg]);
    await dataService.addMessage(project.id, aiResponseMsg);
    
    setIsProcessing(false);
  };

  const handleAddExerciseToRoutine = async (exercise: Exercise) => {
    if (!project) return;
    
    // 1. Update Note String
    const noteEntry = `\n[Exercício Adicionado da Biblioteca]: ${exercise.name} (${exercise.targetMuscle})`;
    const newNotes = (project.trainingNotes || "") + noteEntry;
    
    // 2. Update Local State
    setProject(prev => prev ? {...prev, trainingNotes: newNotes} : null);
    
    // 3. Update DB
    await dataService.updateProjectSettings(project.id, project.objective, project.currentProtocol || [], newNotes);

    // 4. Notify User via Chat System Message
    const msg: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: `✅ **${exercise.name}** adicionado ao seu contexto de treino.\n\nAgora posso avaliar sua execução ou sugerir onde encaixá-lo. Experimente perguntar: *"Como fazer ${exercise.name} corretamente?"*`,
        timestamp: Date.now()
    };
    setMessages(prev => [...prev, msg]);
    await dataService.addMessage(project.id, msg);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing || !project) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsProcessing(true);
    
    await dataService.addMessage(project.id, userMsg);

    const activeSources = sources.filter(s => s.selected);
    const responseText = await generateAIResponse(
        userMsg.text, 
        activeSources, 
        messages,
        project?.userProfile,
        project.metrics // Pass metrics to context
    );

    const modelMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, modelMsg]);
    await dataService.addMessage(project.id, modelMsg);

    setIsProcessing(false);
  };

  // --- SEMANTIC SEARCH LOGIC (HYBRID) ---
  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim() || !project) return;

    setIsSearching(true);
    try {
        // 1. Busca Semântica (Backend - Vector Search)
        const semanticResults = await dataService.searchMessagesSemantic(project.id, searchQuery);

        // 2. Busca Keyword Exata (Frontend - Local Filter)
        // Isso garante que se a palavra existe, ela aparece, mesmo que o vetor falhe ou mensagens antigas não tenham vetor.
        const keywordResults = messages.filter(msg => 
            msg.text.toLowerCase().includes(searchQuery.toLowerCase())
        );

        // 3. Combinar resultados (Remover duplicatas por ID)
        const combinedResults = [...keywordResults];
        semanticResults.forEach(semResult => {
            if (!combinedResults.find(k => k.id === semResult.id)) {
                combinedResults.push(semResult);
            }
        });

        // 4. Ordenar por Data (opcional, mas melhor para contexto)
        combinedResults.sort((a, b) => a.timestamp - b.timestamp);

        setSearchResults(combinedResults);
    } catch (error) {
        console.error("Search Error:", error);
        // Fallback para apenas keyword search se a API falhar
        const fallback = messages.filter(msg => 
            msg.text.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchResults(fallback);
    } finally {
        setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
      setSearchQuery('');
      setSearchResults([]);
      // Não sai do modo de busca, apenas limpa os resultados
  };

  const handleExitSearch = () => {
      setIsSearchActive(false);
      setSearchQuery('');
      setSearchResults([]);
  };

  const toggleBookmark = async (msg: ChatMessage) => {
      const newState = !msg.isBookmarked;
      
      // Optimistic update
      const updateMsg = (m: ChatMessage) => m.id === msg.id ? { ...m, isBookmarked: newState } : m;
      
      setMessages(prev => prev.map(updateMsg));
      setSearchResults(prev => prev.map(updateMsg));
      
      await dataService.toggleMessageBookmark(msg.id, newState);
  };

  const handleGenerateProntuario = async () => {
    if(isProcessing || !project) return;
    
    // 1. Redirecionar imediatamente para o Chat para dar feedback
    setCurrentView('dashboard');
    setIsProcessing(true);
    
    const requestMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        text: "Gerar Prontuário Completo (PDF)",
        timestamp: Date.now()
    };
    setMessages(prev => [...prev, requestMsg]);
    await dataService.addMessage(project.id, requestMsg);

    const activeSources = sources.filter(s => s.selected);
    const reportMarkdown = await generateProntuario(
        activeSources, 
        project?.userProfile,
        project.metrics // Pass metrics to prompt
    );
    
    const reportSource: Source = {
        id: crypto.randomUUID(),
        title: `Prontuário - ${new Date().toLocaleDateString('pt-BR')}`,
        type: SourceType.PRONTUARIO,
        date: new Date().toLocaleDateString('pt-BR'),
        content: reportMarkdown,
        selected: true
    };
    
    await dataService.addSource(project.id, reportSource);
    setSources(prev => [reportSource, ...prev]);

    setProntuarioContent(reportMarkdown);
    setIsProntuarioOpen(true);

    const doneMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: `Prontuário gerado com sucesso. O documento foi salvo na sua lista de fontes e aberto para impressão/download.`,
        timestamp: Date.now()
    };
    setMessages(prev => [...prev, doneMsg]);
    await dataService.addMessage(project.id, doneMsg);

    setIsProcessing(false);
  }

  // --- SOURCE SUMMARY LOGIC (DEEP DIVE) ---
  const handleViewSummary = async (source: Source) => {
      // 1. Open Modal Immediately
      setViewingSource(source);

      // 2. If summary exists, done.
      if (source.summary) {
          return;
      }

      // 3. If no summary, generate it
      setIsGeneratingSummary(true);
      const summary = await generateDocumentSummary(source.content, source.type);
      
      // 4. Update in DB
      await dataService.updateSourceSummary(source.id, summary);
      
      // 5. Update Local State
      setSources(prev => prev.map(s => s.id === source.id ? { ...s, summary: summary } : s));
      setViewingSource(prev => prev && prev.id === source.id ? { ...prev, summary: summary } : prev);
      
      setIsGeneratingSummary(false);
  };

  const getSourceIconColor = (type: SourceType) => {
      switch(type) {
          case SourceType.PDF: return 'bg-red-50 text-red-500';
          case SourceType.IMAGE: return 'bg-purple-50 text-purple-500';
          case SourceType.USER_INPUT: return 'bg-emerald-50 text-emerald-500';
          case SourceType.PRONTUARIO: return 'bg-gray-800 text-white';
          default: return 'bg-blue-50 text-blue-500';
      }
  };

  // --- MARKDOWN HIGHLIGHT HELPER FOR AI MESSAGES ---
  // Recursively process children to find strings and highlight them
  const processChildrenWithHighlight = (children: any, highlight: string): any => {
    if (typeof children === 'string') {
        return <HighlightText text={children} highlight={highlight} />;
    }
    if (Array.isArray(children)) {
        return children.map((child, i) => (
            <React.Fragment key={i}>
                {processChildrenWithHighlight(child, highlight)}
            </React.Fragment>
        ));
    }
    // If it's a React Element, clone and process its children
    if (React.isValidElement(children)) {
        const props: any = children.props;
        if (props.children) {
            return React.cloneElement(children, {
                ...props,
                children: processChildrenWithHighlight(props.children, highlight)
            });
        }
    }
    return children;
  };

  // --- RENDERING ---

  if (authChecking) {
      return (
          <div className="flex h-screen items-center justify-center bg-gray-50 flex-col gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
      )
  }

  if (!session) {
      return <AuthScreen />;
  }

  if (!disclaimerAccepted) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
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
            className="w-full py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-all active:scale-95 touch-manipulation"
          >
            Entendo e Concordo
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
       return (
          <div className="flex h-screen items-center justify-center bg-gray-50 flex-col gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
              <p className="text-gray-500 font-medium text-sm animate-pulse">Carregando seus dados...</p>
          </div>
      )
  }

  const displayedMessages = isSearchActive 
    ? searchResults 
    : showBookmarksOnly 
        ? messages.filter(m => m.isBookmarked) 
        : messages;

  return (
    <div className="flex h-[100dvh] bg-white overflow-hidden">
      {/* DESKTOP SIDEBAR - Hidden on Mobile unless triggered, but now we have a dedicated mobile view */}
      <div className="hidden md:block">
          <SourceSidebar 
            sources={sources} 
            onToggleSource={handleToggleSource}
            onAddSource={handleAddSourceFile}
            currentView={currentView}
            onViewChange={setCurrentView}
            isOpen={isSidebarOpen} // Only relevant if we kept the old toggle, but responsive CSS hides it
            onClose={() => setIsSidebarOpen(false)}
            onLogout={handleLogout}
            onViewSummary={handleViewSummary} 
            onDeleteSource={handleRequestDelete} // Calls the Modal Opener
            onOpenWizard={() => setIsWizardOpen(true)} // Open Wizard Manually
          />
      </div>

      <main className="flex-1 flex flex-col h-[100dvh] relative bg-white pb-20 md:pb-0 w-full min-w-0">
        
        {currentView === 'dashboard' && (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Fixed Header (Flex Item) */}
                <div className="h-16 border-b border-gray-100 flex items-center justify-between px-4 md:px-6 bg-white/95 backdrop-blur-md shrink-0 z-40 transition-all">
                    
                    {/* SEARCH HEADER MODE */}
                    {isSearchActive ? (
                         <form onSubmit={handleSearch} className="flex-1 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                             <button 
                                type="button"
                                onClick={handleExitSearch}
                                className="p-2 hover:bg-gray-100 rounded-full"
                             >
                                 <IconArrowLeft className="w-5 h-5 text-gray-500" />
                             </button>
                             <div className="flex-1 relative">
                                <input 
                                    autoFocus
                                    type="text" 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Busca semântica nas conversas..."
                                    className="w-full bg-gray-100 rounded-xl px-4 py-2 pl-10 pr-8 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                                <IconSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                {searchQuery && (
                                    <button 
                                        type="button" 
                                        onClick={handleClearSearch}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <IconClose className="w-4 h-4" />
                                    </button>
                                )}
                             </div>
                             <button 
                                type="submit"
                                disabled={isSearching || !searchQuery.trim()}
                                className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50"
                             >
                                 {isSearching ? '...' : 'BUSCAR'}
                             </button>
                         </form>
                    ) : (
                        // NORMAL HEADER MODE
                        <>
                            <div className="flex items-center gap-3">
                                {/* Mobile Profile Trigger */}
                                <button 
                                    onClick={() => setCurrentView('profile')}
                                    className="md:hidden w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 active:scale-95 transition-transform overflow-hidden"
                                >
                                    {project?.userProfile?.avatarUrl ? (
                                        <img src={project.userProfile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <IconUser className="w-4 h-4 text-gray-500" />
                                    )}
                                </button>
                                <h2 className="font-bold text-gray-800 truncate text-sm md:text-base">Notebook & Chat</h2>
                            </div>

                            <div className="flex gap-2">
                                {/* Search Toggle */}
                                <Tooltip content="Pesquisar no histórico (Busca Semântica)" position="bottom">
                                    <button 
                                        onClick={() => setIsSearchActive(true)}
                                        className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                                    >
                                        <IconSearch className="w-5 h-5" />
                                    </button>
                                </Tooltip>
                                
                                {/* Bookmarks Filter */}
                                <Tooltip content={showBookmarksOnly ? "Ver todas as mensagens" : "Ver apenas favoritos"} position="bottom">
                                    <button 
                                        onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
                                        className={`p-2 rounded-full transition-colors ${showBookmarksOnly ? 'bg-yellow-50 text-yellow-600' : 'hover:bg-gray-100 text-gray-500'}`}
                                    >
                                        {showBookmarksOnly ? <IconBookmarkFilled className="w-5 h-5" /> : <IconBookmark className="w-5 h-5" />}
                                    </button>
                                </Tooltip>

                                <Tooltip content="Adicione calorias do dia, treino realizado ou atualização de protocolo." position="bottom">
                                    <button 
                                        onClick={() => setIsModalOpen(true)}
                                        className="group relative px-4 py-2 rounded-full transition-all active:scale-95 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 ml-2"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full" />
                                        <div className="relative flex items-center gap-2 text-white">
                                            <IconPlus className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline font-bold text-xs tracking-wide">PARÂMETROS BIOMÉTRICOS</span>
                                            <span className="sm:hidden font-bold text-xs tracking-wide">PARÂMETROS</span>
                                        </div>
                                    </button>
                                </Tooltip>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 pb-4 scroll-smooth">
                    {/* Search Info Banner */}
                    {isSearchActive && (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 text-xs text-blue-800 flex items-center justify-between">
                            <span>
                                {searchResults.length > 0 
                                    ? `Encontramos ${searchResults.length} mensagens relevantes.` 
                                    : searchQuery ? "Nenhum resultado encontrado para este termo." : "Digite para buscar temas, sintomas ou treinos no seu histórico."}
                            </span>
                        </div>
                    )}
                    
                    {/* Bookmarks Info Banner */}
                    {!isSearchActive && showBookmarksOnly && (
                         <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 mb-4 text-xs text-yellow-800 flex items-center gap-2">
                            <IconBookmarkFilled className="w-4 h-4" />
                            <span>Exibindo apenas mensagens salvas.</span>
                        </div>
                    )}

                    {displayedMessages.map((msg, index) => {
                        const showDateSeparator = index === 0 || 
                            new Date(msg.timestamp).toDateString() !== new Date(displayedMessages[index - 1].timestamp).toDateString();

                        return (
                            <React.Fragment key={msg.id}>
                                {showDateSeparator && (
                                    <div className="flex justify-center my-6">
                                        <div className="bg-gray-100 text-gray-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                                            {new Date(msg.timestamp).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        </div>
                                    </div>
                                )}
                                <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}>
                                    <div className={`max-w-[90%] md:max-w-2xl w-full ${msg.role === 'user' ? 'ml-auto' : ''} relative`}>
                                        
                                        {/* Header Message Info */}
                                        <div className="flex justify-between items-center mb-1">
                                            {msg.role === 'model' && (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center">
                                                        <IconSparkles className="w-3 h-3 text-white" />
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                                        FitLM AI
                                                    </span>
                                                </div>
                                            )}
                                            
                                            {/* Bookmark Action - Visible on Hover or if Bookmarked */}
                                            <div className={`flex items-center gap-2 ml-auto ${msg.isBookmarked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity'}`}>
                                                <Tooltip content={msg.isBookmarked ? "Remover dos favoritos" : "Salvar esta mensagem"} position="left">
                                                    <button 
                                                        onClick={() => toggleBookmark(msg)}
                                                        className="p-1 hover:bg-gray-100 rounded-full"
                                                    >
                                                        {msg.isBookmarked ? (
                                                            <IconBookmarkFilled className="w-4 h-4 text-yellow-500" />
                                                        ) : (
                                                            <IconBookmark className="w-4 h-4 text-gray-300 hover:text-gray-500" />
                                                        )}
                                                    </button>
                                                </Tooltip>
                                            </div>
                                        </div>
                                        
                                        <div className={`
                                        ${msg.role === 'user' 
                                            ? 'bg-gray-100 text-gray-800 rounded-2xl rounded-tr-sm px-5 py-3 text-right inline-block float-right shadow-sm text-sm' 
                                            : 'bg-transparent text-gray-800 text-sm md:text-base leading-relaxed'}
                                        `}>
                                        {msg.role === 'user' ? (
                                            isSearchActive && searchQuery ? (
                                                <HighlightText text={msg.text} highlight={searchQuery} />
                                            ) : (
                                                msg.text
                                            )
                                        ) : (
                                            <div className="prose prose-blue prose-sm max-w-none">
                                                <ReactMarkdown
                                                    components={{
                                                        // Intercept text rendering to add highlights if searching
                                                        p: ({children}) => <p className="mb-3">{isSearchActive && searchQuery ? processChildrenWithHighlight(children, searchQuery) : children}</p>,
                                                        li: ({children}) => <li className="mb-1">{isSearchActive && searchQuery ? processChildrenWithHighlight(children, searchQuery) : children}</li>
                                                    }}
                                                >
                                                    {msg.text}
                                                </ReactMarkdown>
                                            </div>
                                        )}
                                        </div>
                                        
                                        {/* Timestamp Footer */}
                                        <div className={`text-[10px] text-gray-300 mt-1 clear-both ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute:'2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })}
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

                {!isSearchActive && !showBookmarksOnly && (
                    <div className="p-4 bg-white border-t border-gray-100 z-20 shrink-0">
                        <div className="max-w-3xl mx-auto relative">
                            <div className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400">
                                <IconMessage className="w-5 h-5" />
                            </div>
                            <Tooltip content="A IA usa suas fontes ativas (exames, inputs) para responder." position="top">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Pergunte sobre sua evolução..."
                                    className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all shadow-sm text-gray-700 placeholder-gray-400 text-sm"
                                />
                            </Tooltip>
                            <button 
                                onClick={handleSendMessage}
                                disabled={!inputValue.trim() || isProcessing}
                                className="absolute top-1/2 -translate-y-1/2 right-3 p-2 bg-black text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-all active:scale-95 touch-manipulation"
                            >
                                <IconSend className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* --- DEDICATED MOBILE SOURCES VIEW --- */}
        {currentView === 'sources' && (
             <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden">
                {/* Header */}
                <div className="p-5 bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                         {/* Mobile Profile Trigger (Sources View) */}
                         <button 
                            onClick={() => setCurrentView('profile')}
                            className="md:hidden w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 active:scale-95 transition-transform overflow-hidden"
                        >
                            {project?.userProfile?.avatarUrl ? (
                                <img src={project.userProfile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <IconUser className="w-4 h-4 text-gray-500" />
                            )}
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Fontes Ativas</h2>
                            <p className="text-xs text-gray-500 font-medium">Gerencie seus arquivos e exames</p>
                        </div>
                    </div>
                     <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-bold">{sources.length}</span>
                </div>

                {/* Upload Area */}
                <div className="p-4">
                     <button 
                        onClick={() => mobileFileInputRef.current?.click()}
                        className="w-full py-4 border-2 border-dashed border-blue-300 bg-blue-50/50 rounded-2xl text-blue-700 hover:bg-blue-50 transition-all flex flex-col items-center justify-center gap-2 active:scale-95 shadow-sm"
                    >
                        <div className="bg-blue-100 p-3 rounded-full">
                            <IconPlus className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-bold">Fazer Upload de Arquivo</span>
                        <span className="text-[10px] text-blue-500 font-medium">PDF, JPG, PNG ou TXT</span>
                    </button>
                    <input 
                        type="file" 
                        ref={mobileFileInputRef} 
                        className="hidden" 
                        onChange={handleMobileFileChange} 
                        accept=".pdf,.jpg,.jpeg,.png,.txt,.csv"
                    />
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto px-4 pb-32 space-y-3">
                    {sources.map((source) => (
                        <div 
                            key={source.id}
                            onClick={() => handleToggleSource(source.id)}
                            className={`group relative p-4 rounded-xl border transition-all duration-200 shadow-sm flex items-start gap-4 active:scale-[0.98] ${
                                source.selected 
                                ? 'bg-white border-blue-500 ring-1 ring-blue-500/20' 
                                : 'bg-white border-gray-200 opacity-80 grayscale'
                            }`}
                        >
                            {/* Icon Box */}
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${getSourceIconColor(source.type)}`}>
                                <IconFile className="w-6 h-6" />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-bold text-gray-900 truncate mb-1">{source.title}</h3>
                                <div className="flex items-center gap-2">
                                     <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase font-bold tracking-wide">{source.type}</span>
                                     <span className="text-[10px] text-gray-400">{source.date}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2 shrink-0">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleViewSummary(source); }}
                                    className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 active:scale-90 transition-transform"
                                >
                                    <IconSparkles className="w-5 h-5" />
                                </button>
                                
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleRequestDelete(source.id); }}
                                    className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 active:scale-90 transition-transform"
                                >
                                    <IconTrash className="w-5 h-5" />
                                </button>
                                
                                {source.selected && (
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                        <IconCheck className="w-5 h-5" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {sources.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                            <p>Nenhum arquivo encontrado.</p>
                        </div>
                    )}
                </div>
             </div>
        )}

        {currentView === 'profile' && (
            <ProfileView profile={project?.userProfile} onSave={handleUpdateProfile} />
        )}

        {currentView === 'training_library' && project && (
            <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
                <ExerciseLibrary project={project} onAddExercise={handleAddExerciseToRoutine} />
            </div>
        )}

        {currentView === 'protocol_library' && (
            <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
                <ProtocolLibrary />
            </div>
        )}

        {currentView === 'metrics' && project && (
            <div className="flex-1 flex flex-col h-full overflow-hidden lg:hidden w-full">
                <MetricDashboard 
                    project={project} 
                    risks={MOCK_RISKS} 
                    onGenerateProntuario={handleGenerateProntuario}
                    isMobileView={true}
                    isProcessing={isProcessing} // Pass processing state
                />
            </div>
        )}
      </main>

      {project && (
        <MetricDashboard 
            project={project} 
            risks={MOCK_RISKS} 
            onGenerateProntuario={handleGenerateProntuario}
            isProcessing={isProcessing} // Pass processing state
        />
      )}

      {/* Nav - UPDATED WITH FILES TAB */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 flex justify-around items-center py-2 px-2 z-[90] shadow-[0_-5px_30px_rgba(0,0,0,0.08)] md:hidden transition-all safe-area-pb">
          <button 
            onClick={() => setCurrentView('dashboard')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all active:scale-90 touch-manipulation w-16 ${currentView === 'dashboard' ? 'text-blue-600 font-bold' : 'text-gray-400 font-medium'}`}
          >
              <IconLayout className={`w-6 h-6 ${currentView === 'dashboard' ? 'fill-blue-100' : ''}`} />
              <span className="text-[9px] uppercase tracking-wider">Chat</span>
          </button>

          {/* NEW FILES TAB */}
          <button 
            onClick={() => setCurrentView('sources')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all active:scale-90 touch-manipulation w-16 md:hidden ${currentView === 'sources' ? 'text-blue-600 font-bold' : 'text-gray-400 font-medium'}`}
          >
              <IconFolder className={`w-6 h-6 ${currentView === 'sources' ? 'fill-blue-100' : ''}`} />
              <span className="text-[9px] uppercase tracking-wider">Arquivos</span>
          </button>
          
          <button 
            onClick={() => setCurrentView('training_library')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all active:scale-90 touch-manipulation w-16 ${currentView === 'training_library' ? 'text-blue-600 font-bold' : 'text-gray-400 font-medium'}`}
          >
              <IconDumbbell className={`w-6 h-6 ${currentView === 'training_library' ? 'fill-blue-100' : ''}`} />
              <span className="text-[9px] uppercase tracking-wider">Treinos</span>
          </button>
          
          <button 
            onClick={() => setCurrentView('protocol_library')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all active:scale-90 touch-manipulation w-16 ${currentView === 'protocol_library' ? 'text-blue-600 font-bold' : 'text-gray-400 font-medium'}`}
          >
              <IconScience className={`w-6 h-6 ${currentView === 'protocol_library' ? 'fill-blue-100' : ''}`} />
              <span className="text-[9px] uppercase tracking-wider">Pharma</span>
          </button>
          
          <button 
            onClick={() => setCurrentView('metrics')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all active:scale-90 touch-manipulation w-16 lg:hidden ${currentView === 'metrics' ? 'text-blue-600 font-bold' : 'text-gray-400 font-medium'}`}
          >
              <IconActivity className={`w-6 h-6 ${currentView === 'metrics' ? 'fill-blue-100' : ''}`} />
              <span className="text-[9px] uppercase tracking-wider">Painel</span>
          </button>
      </nav>

      {/* MODALS */}
      {project && (
        <WizardModal 
            isOpen={isWizardOpen}
            onClose={() => setIsWizardOpen(false)}
            project={project}
            onUpdateProfile={handleUpdateProfile}
            onUpdateProject={p => setProject(p)}
            onUpload={handleAddSourceFile} // PASSANDO A FUNÇÃO DE UPLOAD PARA O WIZARD
        />
      )}

      <InputModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveInputData}
        initialData={project}
      />

      <ProntuarioModal 
        isOpen={isProntuarioOpen}
        onClose={() => setIsProntuarioOpen(false)}
        markdownContent={prontuarioContent}
        profile={project?.userProfile}
      />
      
      <SourceDetailModal 
        isOpen={!!viewingSource}
        onClose={() => setViewingSource(null)}
        source={viewingSource}
        isLoading={isGeneratingSummary}
      />

      {/* DELETE CONFIRMATION MODAL */}
      {sourceToDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-600 mx-auto">
                      <IconTrash className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-center text-gray-900 mb-2">Excluir Arquivo?</h3>
                  <p className="text-sm text-center text-gray-500 mb-6 leading-relaxed">
                      Você está prestes a excluir <strong>{sourceToDelete.title}</strong>. A Inteligência Artificial deixará de considerar os dados deste arquivo nas análises futuras.
                  </p>
                  <div className="flex gap-3">
                      <button 
                        onClick={() => setSourceToDelete(null)}
                        className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors active:scale-95"
                      >
                          Cancelar
                      </button>
                      <button 
                        onClick={confirmDeleteSource}
                        disabled={isDeleting}
                        className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-500/30 active:scale-95 flex items-center justify-center gap-2"
                      >
                          {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;
