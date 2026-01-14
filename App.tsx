
import React, { useState, useEffect, useRef, useMemo } from 'react';
import SourceSidebar from './components/SourceSidebar';
import MetricDashboard from './components/MetricDashboard';
import InputModal from './components/InputModal';
import ProntuarioModal from './components/ProntuarioModal';
import SourceDetailModal from './components/SourceDetailModal'; 
import WizardModal from './components/WizardModal'; 
import LegalContractModal from './components/LegalContractModal'; 
import ExerciseLibrary from './components/ExerciseLibrary';
import ProtocolLibrary from './components/ProtocolLibrary';
import ProfileView from './components/ProfileView';
import TimelineView from './components/TimelineView'; // IMPORTADO
import AuthScreen from './components/AuthScreen';
import SubscriptionModal from './components/SubscriptionModal'; 
import { IOSInstallPrompt } from './components/IOSInstallPrompt'; 
import { Source, SourceType, Project, ChatMessage, RiskFlag, DailyLogData, MetricPoint, AppView, UserProfile, Exercise } from './types';
import { generateAIResponse, generateProntuario, generateDocumentSummary, processDocument } from './services/geminiService';
import { dataService } from './services/dataService';
import { supabase } from './lib/supabase';
import { IconSend, IconSparkles, IconMessage, IconAlert, IconPlus, IconLayout, IconDumbbell, IconActivity, IconScience, IconUser, IconFile, IconFolder, IconDownload, IconCheck, IconTrash, IconSearch, IconArrowLeft, IconBookmark, IconBookmarkFilled, IconClose, IconWizard, IconMic, IconCopy, IconShare, IconList, IconClock } from './components/Icons';
import ReactMarkdown from 'react-markdown';
import { Tooltip } from './components/Tooltip';

// Add type definition for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

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

// MODIFIED: 'onOpenFiles' now triggers view change to 'sources' instead of sidebar overlay
const MobileBottomNav = ({ currentView, onViewChange }: { currentView: AppView, onViewChange: (view: AppView) => void }) => (
    <div className="fixed bottom-0 left-0 right-0 h-[84px] bg-white border-t border-gray-200 flex justify-around items-center z-50 md:hidden pb-5 pt-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] dark:bg-gray-900 dark:border-gray-800 px-1">
        <button 
            onClick={() => onViewChange('dashboard')}
            className={`flex flex-col items-center gap-1 p-1 w-full transition-colors active:scale-95 ${currentView === 'dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-600'}`}
        >
            <IconMessage className={`w-5 h-5 ${currentView === 'dashboard' ? 'fill-current' : ''}`} />
            <span className="text-[9px] font-bold tracking-tight">Chat</span>
        </button>
        <button 
            onClick={() => onViewChange('timeline')}
            className={`flex flex-col items-center gap-1 p-1 w-full transition-colors active:scale-95 ${currentView === 'timeline' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-600'}`}
        >
            <IconClock className={`w-5 h-5 ${currentView === 'timeline' ? 'fill-current' : ''}`} />
            <span className="text-[9px] font-bold tracking-tight">Timeline</span>
        </button>
        <button 
            onClick={() => onViewChange('metrics')}
            className={`flex flex-col items-center gap-1 p-1 w-full transition-colors active:scale-95 ${currentView === 'metrics' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-600'}`}
        >
            <IconActivity className={`w-5 h-5 ${currentView === 'metrics' ? 'fill-current' : ''}`} />
            <span className="text-[9px] font-bold tracking-tight">Métricas</span>
        </button>
        <button 
            onClick={() => onViewChange('training_library')}
            className={`flex flex-col items-center gap-1 p-1 w-full transition-colors active:scale-95 ${currentView === 'training_library' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-600'}`}
        >
            <IconDumbbell className={`w-5 h-5 ${currentView === 'training_library' ? 'fill-current' : ''}`} />
            <span className="text-[9px] font-bold tracking-tight">Treinos</span>
        </button>
        {/* RESTORED: Pharma / Protocol Library */}
        <button 
            onClick={() => onViewChange('protocol_library')}
            className={`flex flex-col items-center gap-1 p-1 w-full transition-colors active:scale-95 ${currentView === 'protocol_library' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-600'}`}
        >
            <IconScience className={`w-5 h-5 ${currentView === 'protocol_library' ? 'fill-current' : ''}`} />
            <span className="text-[9px] font-bold tracking-tight">Pharma</span>
        </button>
        <button 
            onClick={() => onViewChange('sources')}
            className={`flex flex-col items-center gap-1 p-1 w-full transition-colors active:scale-95 ${currentView === 'sources' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-600'}`}
        >
            <IconFolder className={`w-5 h-5 ${currentView === 'sources' ? 'fill-current' : ''}`} />
            <span className="text-[9px] font-bold tracking-tight">Docs</span>
        </button>
    </div>
);

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Voice Input State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Message Actions State
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Disclaimer & Legal State
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false); // Controls the per-session modal
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false); // Controls the "Contract" modal
  const [dontShowDisclaimerAgain, setDontShowDisclaimerAgain] = useState(false);

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
  
  // Billing State (NEW)
  const [billingTrigger, setBillingTrigger] = useState(0); // Used to force refresh billing
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [currentBillAmount, setCurrentBillAmount] = useState(0); // To pass to modal

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);

  // Helper to refresh billing
  const refreshBilling = () => {
      setBillingTrigger(prev => prev + 1);
  };

  // --- DYNAMIC RISK CALCULATION ENGINE (NEW) ---
  const calculateRealRisks = (metrics: Record<string, MetricPoint[]>): RiskFlag[] => {
      const risks: RiskFlag[] = [];
      
      // Helper to get latest value of a metric
      const getLastValue = (key: string) => {
          const arr = metrics[key] || [];
          if (arr.length > 0) {
              // Sort by date (assuming strings DD/MM/YYYY need parsing, but simplified here for robust array check)
              // Actually, dataService sorts by created_at, so usually the last in array is newest or we sort manually
              const sorted = [...arr].sort((a,b) => {
                  const da = a.date.split('/').reverse().join('-'); 
                  const db = b.date.split('/').reverse().join('-');
                  return new Date(da).getTime() - new Date(db).getTime();
              });
              return sorted[sorted.length - 1].value;
          }
          return null;
      };

      // 1. Hematócrito (Risco Cardíaco/Trombose)
      const hema = getLastValue('Hematocrito') || getLastValue('Hematócrito');
      if (hema && hema > 53) {
          risks.push({
              category: 'Health',
              level: 'HIGH',
              message: `Hematócrito CRÍTICO (${hema}%). Risco de trombose elevado. Sangue muito viscoso.`
          });
      } else if (hema && hema > 50) {
          risks.push({
              category: 'Health',
              level: 'MEDIUM',
              message: `Hematócrito elevado (${hema}%). Monitore a hidratação e pressão arterial.`
          });
      }

      // 2. Colesterol (Cardio)
      const ldl = getLastValue('LDL') || getLastValue('Colesterol LDL');
      if (ldl && ldl > 160) {
          risks.push({
              category: 'Health',
              level: 'HIGH',
              message: `LDL (Ruim) muito alto (${ldl} mg/dL). Risco aterosclerótico.`
          });
      }
      const hdl = getLastValue('HDL') || getLastValue('Colesterol HDL');
      if (hdl && hdl < 35) {
          risks.push({
              category: 'Health',
              level: 'MEDIUM',
              message: `HDL (Bom) muito baixo (${hdl} mg/dL). Proteção cardíaca comprometida.`
          });
      }

      // 3. Fígado (TGO/TGP)
      const tgo = getLastValue('TGO') || getLastValue('AST');
      const tgp = getLastValue('TGP') || getLastValue('ALT');
      if ((tgo && tgo > 60) || (tgp && tgp > 60)) {
          risks.push({
              category: 'Protocol',
              level: 'HIGH',
              message: 'Enzimas hepáticas alteradas (TGO/TGP). Estresse no fígado detectado.'
          });
      }

      // 4. Rins (Creatinina)
      const creat = getLastValue('Creatinina') || getLastValue('Creatinine');
      if (creat && creat > 1.5) {
          risks.push({
              category: 'Health',
              level: 'HIGH',
              message: `Creatinina alta (${creat}). Atenção à função renal e hidratação.`
          });
      }

      // 5. Testosterona (Supressão ou Excesso)
      const testo = getLastValue('Testosterona') || getLastValue('Testosterone') || getLastValue('Testo Total');
      if (testo && testo < 250) {
          risks.push({
              category: 'Health',
              level: 'HIGH',
              message: `Testosterona em nível de Hipogonadismo (${testo} ng/dL). Sintomas: Fadiga, baixa libido.`
          });
      }

      // 6. Estradiol
      const e2 = getLastValue('Estradiol') || getLastValue('E2');
      if (e2 && e2 > 100) {
           risks.push({
              category: 'Protocol',
              level: 'MEDIUM',
              message: `Estradiol alto (${e2} pg/mL). Risco de ginecomastia e retenção hídrica.`
          });
      }

      return risks;
  };

  const realRisks = useMemo(() => {
      if (!project || !project.metrics) return [];
      return calculateRealRisks(project.metrics);
  }, [project]);

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

                // --- LEGAL CHECKS & WIZARD TRIGGER ---
                if (loadedProject.userProfile) {
                    const p = loadedProject.userProfile;
                    
                    // 1. Check if Contract Signed
                    if (!p.termsAcceptedAt) {
                        setIsLegalModalOpen(true);
                        // NOTE: We do NOT open wizard here to avoid conflict. 
                        // It will trigger inside handleLegalAccept.
                    } else {
                        // 2. Already signed? Check if critical data is missing
                        const isMissingCritical = !p.name || !p.height || !p.weight || !p.measurements.waist;
                        if (isMissingCritical) {
                            setIsWizardOpen(true);
                        }

                        // 3. Check Disclaimer Preference
                        if (p.hideStartupDisclaimer) {
                            setDisclaimerAccepted(true); // Skip disclaimer
                        }
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
        refreshBilling(); // Load initial bill
    }
  }, [session]);

  // THEME MANAGEMENT - CORRIGIDO PARA PERSISTÊNCIA LOCAL
  useEffect(() => {
      const applyTheme = (isDark: boolean) => {
          if (isDark) {
              document.documentElement.classList.add('dark');
          } else {
              document.documentElement.classList.remove('dark');
          }
      };

      // 1. Se tem perfil carregado, usa a preferência do DB e salva no local
      if (project?.userProfile?.theme) {
          const isDark = project.userProfile.theme === 'dark';
          applyTheme(isDark);
          localStorage.setItem('fitlm-theme', isDark ? 'dark' : 'light');
      } 
      // 2. Se não tem perfil (Logout ou Login Screen), checa LocalStorage
      else {
          const localTheme = localStorage.getItem('fitlm-theme');
          if (localTheme) {
              applyTheme(localTheme === 'dark');
          } 
          // 3. Fallback para preferência do Sistema Operacional
          else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
              applyTheme(true);
          }
      }
  }, [project?.userProfile?.theme]);

  useEffect(() => {
    if (!isSearchActive && !showBookmarksOnly) {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentView, isSearchActive, showBookmarksOnly]);

  // --- LEGAL HANDLERS ---
  const handleLegalAccept = async () => {
      if (!session?.user?.id || !project) return;
      
      // Update DB
      await dataService.acceptLegalTerms(session.user.id);
      
      // Update Local State
      const updatedProfile = { ...project.userProfile!, termsAcceptedAt: new Date().toISOString() };
      
      if (project.userProfile) {
          setProject({
              ...project,
              userProfile: updatedProfile
          });
      }
      
      setIsLegalModalOpen(false);

      // --- WIZARD TRIGGER (IMMEDIATE AFTER SIGNING) ---
      // Check if data is missing on the updated profile
      const p = updatedProfile;
      const isMissingCritical = !p.name || !p.height || !p.weight || !p.measurements.waist;
      if (isMissingCritical) {
          // Open Wizard right after closing Legal Modal
          setIsWizardOpen(true);
      }
  };

  const handleDisclaimerAccept = async () => {
      if (dontShowDisclaimerAgain && session?.user?.id) {
          await dataService.toggleStartupDisclaimer(session.user.id, true);
      }
      setDisclaimerAccepted(true);
  };

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

  // NEW: Batch Processor Wrapper
  const handleBatchAddSources = async (files: File[]) => {
      if (!project || !session?.user?.id) return;
      
      setIsProcessing(true);
      
      for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const tempId = `proc-${i}`;
          
          // Temporary status message
          const statusMsg: ChatMessage = {
              id: tempId, 
              role: 'model', 
              text: `🔄 Processando arquivo ${i+1} de ${files.length}: **${file.name}**...`, 
              timestamp: Date.now()
          };
          setMessages(prev => [...prev, statusMsg]);

          try {
              // Process Single File Logic
              const isImage = file.type.startsWith('image/');
              const todayStr = new Date().toLocaleDateString('pt-BR');
              
              // 1. Upload to Storage
              const filePath = await dataService.uploadFileToStorage(file, session.user.id, project.id);
              
              if (!filePath) {
                  // If upload fails, just show error and continue loop
                  setMessages(prev => prev.map(m => m.id === tempId ? { ...m, text: `❌ Erro ao enviar **${file.name}**.` } : m));
                  continue;
              }
              
              const tempUrl = URL.createObjectURL(file);
              
              // 2. PROCESS DOCUMENT (OCR + METRICS)
              let finalContent = "";
              let extractedMetrics: { category: string; data: MetricPoint }[] = [];

              if (file.type.startsWith('text/') || file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
                  finalContent = await readFileContent(file);
              } else {
                  const result = await processDocument(file, todayStr);
                  finalContent = result.extractedText;
                  extractedMetrics = result.metrics;
              }

              // 3. Create Source Object with REAL CONTENT (OCR)
              const newSource: Source = {
                  id: crypto.randomUUID(),
                  title: file.name,
                  type: isImage ? SourceType.IMAGE : SourceType.PDF,
                  date: todayStr,
                  selected: true,
                  content: finalContent, 
                  filePath: filePath
              };

              // 4. Save Source to DB
              const dbError = await dataService.addSource(project.id, newSource);
              if (dbError) {
                  console.error("Database Error:", dbError);
                  setMessages(prev => prev.map(m => m.id === tempId ? { ...m, text: `❌ Erro ao salvar **${file.name}** no banco de dados.` } : m));
                  continue;
              }

              // 5. Save Metrics to DB
              for (const m of extractedMetrics) {
                  await dataService.addMetric(project.id, m.category, m.data);
              }

              // 6. Update Local State (Optimistic)
              // Note: We use functional update to ensure we don't lose state from previous iterations in the loop
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
              
              // 7. Success Feedback
              let extractionDetails = "";
              if (extractedMetrics.length > 0) {
                  const metricsList = extractedMetrics.map(m => `${m.category}: ${m.data.value}`).join(', ');
                  extractionDetails = `\nExtraí: ${metricsList}`;
              }
              
              // Replace temporary message with permanent success
              const sysMsg: ChatMessage = {
                  id: Date.now().toString() + i, // Ensure unique ID
                  role: 'model',
                  text: `✅ **${file.name}** processado.${extractionDetails}`,
                  timestamp: Date.now()
              };
              
              // Remove temp, add final
              setMessages(prev => [...prev.filter(m => m.id !== tempId), sysMsg]);
              await dataService.addMessage(project.id, sysMsg);
              
              refreshBilling(); // Update Cost

          } catch (error) {
              console.error(`Error processing file ${file.name}:`, error);
              setMessages(prev => prev.map(m => m.id === tempId ? { ...m, text: `❌ Erro crítico ao processar **${file.name}**.` } : m));
          }
      }
      
      setIsProcessing(false);
  };
  
  // Handler for mobile input (Single file from camera, usually, but can be multiple)
  const handleMobileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const files = Array.from(e.target.files) as File[];
          handleBatchAddSources(files);
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
    
    refreshBilling(); // Update cost
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
    
    refreshBilling(); // Update Cost
    setIsProcessing(false);
  };

  // --- MIC LOGIC FIXED (Interim Results) ---
  const handleMicClick = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Seu navegador não suporta reconhecimento de voz.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false; 
    recognition.interimResults = true; // IMPORTANT: Enables realtime text feedback

    recognition.onstart = () => setIsListening(true);
    
    recognition.onend = () => setIsListening(false);
    
    recognition.onerror = (event: any) => {
        console.error("Speech error", event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
            alert("Permissão de microfone negada. Clique no ícone de cadeado/permissões no seu navegador e permita o uso do microfone.");
        }
    };
    
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      // Update input: append final, show interim
      // Simple logic: We just replace input with final for now to keep it simple, or append if we want continuous dictation history.
      // Here we append if it's new
      if (finalTranscript) {
          setInputValue(prev => (prev ? prev + ' ' : '') + finalTranscript);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // --- COPY & SHARE LOGIC ---
  const handleCopy = (text: string, id: string) => {
      navigator.clipboard.writeText(text).then(() => {
          setCopiedMessageId(id);
          setTimeout(() => setCopiedMessageId(null), 2000);
      });
  };

  const handleShare = async (text: string) => {
      if (navigator.share) {
          try {
              await navigator.share({
                  title: 'FitLM Insight',
                  text: text,
              });
          } catch (error) {
              console.log('Error sharing', error);
          }
      } else {
          // Fallback if native share not supported
          alert("Compartilhamento não suportado neste navegador. O texto foi copiado.");
          navigator.clipboard.writeText(text);
      }
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
    
    refreshBilling(); // Update cost
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
      refreshBilling(); // Update Cost
  };

  const getSourceIconColor = (type: SourceType) => {
      switch(type) {
          case SourceType.PDF: return 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400';
          case SourceType.IMAGE: return 'bg-purple-50 text-purple-500 dark:bg-purple-900/30 dark:text-purple-400';
          case SourceType.USER_INPUT: return 'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-400';
          case SourceType.PRONTUARIO: return 'bg-gray-800 text-white dark:bg-gray-700';
          default: return 'bg-blue-50 text-blue-500 dark:bg-blue-900/30 dark:text-blue-400';
      }
  };

  // --- MARKDOWN HIGHLIGHT HELPER FOR AI MESSAGES ---
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
          <div className="flex h-screen items-center justify-center bg-gray-50 flex-col gap-4 dark:bg-gray-950">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
          </div>
      )
  }

  if (!session) {
      return <AuthScreen />;
  }

  // --- RENDERING MODALS & SCREENS ---

  if (isLegalModalOpen) {
      return <LegalContractModal isOpen={true} onAccept={handleLegalAccept} />;
  }

  if (!disclaimerAccepted) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl animate-in fade-in zoom-in duration-300 dark:bg-gray-900 dark:border dark:border-gray-800">
          <div className="flex justify-center mb-4">
             <div className="bg-red-100 p-3 rounded-full dark:bg-red-900/30">
                <IconAlert className="w-8 h-8 text-red-600 dark:text-red-400" />
             </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2 dark:text-white">Aviso de Segurança</h2>
          <p className="text-gray-600 text-center mb-6 text-sm leading-relaxed dark:text-gray-300">
            {DISCLAIMER_TEXT}
          </p>
          
          <label className="flex items-center justify-center gap-2 mb-6 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={dontShowDisclaimerAgain}
                onChange={e => setDontShowDisclaimerAgain(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
              />
              <span className="text-xs text-gray-500 font-medium dark:text-gray-400">Não mostrar novamente</span>
          </label>

          <button 
            onClick={handleDisclaimerAccept}
            className="w-full py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-all active:scale-95 touch-manipulation dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            Entendo e Concordo
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
       return (
          <div className="flex h-screen items-center justify-center bg-gray-50 flex-col gap-4 dark:bg-gray-950">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
              <p className="text-gray-500 font-medium text-sm animate-pulse dark:text-gray-400">Carregando seus dados...</p>
          </div>
      )
  }

  const displayedMessages = isSearchActive 
    ? searchResults 
    : showBookmarksOnly 
        ? messages.filter(m => m.isBookmarked) 
        : messages;

  return (
    <div className="flex h-[100dvh] bg-white overflow-hidden dark:bg-gray-950">
      
      {/* iOS INSTALL PROMPT */}
      <IOSInstallPrompt />

      <div className="hidden md:block">
          <SourceSidebar 
            sources={sources} 
            onToggleSource={handleToggleSource}
            onAddSource={handleBatchAddSources}
            currentView={currentView}
            onViewChange={setCurrentView}
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)}
            onLogout={handleLogout}
            onViewSummary={handleViewSummary} 
            onDeleteSource={handleRequestDelete} 
            onOpenWizard={() => setIsWizardOpen(true)} 
          />
      </div>

      <main className="flex-1 flex flex-col h-[100dvh] relative bg-white pb-20 md:pb-0 w-full min-w-0 dark:bg-gray-950">
        
        {currentView === 'dashboard' && (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Fixed Header */}
                <div className="h-16 border-b border-gray-100 flex items-center justify-between px-4 md:px-6 bg-white/95 backdrop-blur-md shrink-0 z-40 transition-all dark:bg-gray-900/95 dark:border-gray-800">
                    
                    {isSearchActive ? (
                         <form onSubmit={handleSearch} className="flex-1 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                             <button 
                                type="button"
                                onClick={handleExitSearch}
                                className="p-2 hover:bg-gray-100 rounded-full dark:hover:bg-gray-800"
                             >
                                 <IconArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                             </button>
                             <div className="flex-1 relative">
                                <input 
                                    autoFocus
                                    type="text" 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Busca semântica nas conversas..."
                                    className="w-full bg-gray-100 rounded-xl px-4 py-2 pl-10 pr-8 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:bg-gray-800 dark:text-white dark:focus:ring-blue-900"
                                />
                                <IconSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                {searchQuery && (
                                    <button 
                                        type="button" 
                                        onClick={handleClearSearch}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        <IconClose className="w-4 h-4" />
                                    </button>
                                )}
                             </div>
                             <button 
                                type="submit"
                                disabled={isSearching || !searchQuery.trim()}
                                className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50 dark:bg-blue-600"
                             >
                                 {isSearching ? '...' : 'BUSCAR'}
                             </button>
                         </form>
                    ) : (
                        <>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => setCurrentView('profile')}
                                    className="md:hidden w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 active:scale-95 transition-transform overflow-hidden dark:bg-gray-800 dark:border-gray-700"
                                >
                                    {project?.userProfile?.avatarUrl ? (
                                        <img src={project.userProfile.avatarUrl} alt="Menu" className="w-full h-full object-cover" />
                                    ) : (
                                        <IconUser className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                    )}
                                </button>
                                <h2 className="font-bold text-gray-800 truncate text-sm md:text-base dark:text-white">Notebook & Chat</h2>
                            </div>

                            <div className="flex gap-2">
                                <Tooltip content="Pesquisar no histórico (Busca Semântica)" position="bottom">
                                    <button 
                                        onClick={() => setIsSearchActive(true)}
                                        className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors dark:hover:bg-gray-800 dark:text-gray-400"
                                    >
                                        <IconSearch className="w-5 h-5" />
                                    </button>
                                </Tooltip>
                                
                                <Tooltip content={showBookmarksOnly ? "Ver todas as mensagens" : "Ver apenas favoritos"} position="bottom">
                                    <button 
                                        onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
                                        className={`p-2 rounded-full transition-colors ${showBookmarksOnly ? 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' : 'hover:bg-gray-100 text-gray-500 dark:hover:bg-gray-800 dark:text-gray-400'}`}
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
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 text-xs text-blue-800 flex items-center justify-between dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                            <span>
                                {searchResults.length > 0 
                                    ? `Encontramos ${searchResults.length} mensagens relevantes.` 
                                    : searchQuery ? "Nenhum resultado encontrado para este termo." : "Digite para buscar temas, sintomas ou treinos no seu histórico."}
                            </span>
                        </div>
                    )}
                    
                    {/* Bookmarks Info Banner */}
                    {!isSearchActive && showBookmarksOnly && (
                         <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 mb-4 text-xs text-yellow-800 flex items-center gap-2 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800">
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
                                        <div className="bg-gray-100 text-gray-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest dark:bg-gray-800 dark:text-gray-400">
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
                                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide dark:text-gray-400">
                                                        FitLM AI
                                                    </span>
                                                </div>
                                            )}
                                            
                                            {/* ACTIONS: Copy, Share, Bookmark - Visible on Hover or if active */}
                                            <div className={`flex items-center gap-1 ml-auto transition-opacity ${msg.isBookmarked || copiedMessageId === msg.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                
                                                {/* Copy Button */}
                                                <Tooltip content="Copiar texto" position="top">
                                                    <button 
                                                        onClick={() => handleCopy(msg.text, msg.id)}
                                                        className="p-1 hover:bg-gray-100 rounded-full dark:hover:bg-gray-800"
                                                    >
                                                        {copiedMessageId === msg.id ? (
                                                            <IconCheck className="w-3.5 h-3.5 text-green-500" />
                                                        ) : (
                                                            <IconCopy className="w-3.5 h-3.5 text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400" />
                                                        )}
                                                    </button>
                                                </Tooltip>

                                                {/* Share Button */}
                                                <Tooltip content="Compartilhar" position="top">
                                                    <button 
                                                        onClick={() => handleShare(msg.text)}
                                                        className="p-1 hover:bg-gray-100 rounded-full dark:hover:bg-gray-800"
                                                    >
                                                        <IconShare className="w-3.5 h-3.5 text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400" />
                                                    </button>
                                                </Tooltip>

                                                {/* Bookmark Button */}
                                                <Tooltip content={msg.isBookmarked ? "Remover dos favoritos" : "Salvar esta mensagem"} position="left">
                                                    <button 
                                                        onClick={() => toggleBookmark(msg)}
                                                        className="p-1 hover:bg-gray-100 rounded-full dark:hover:bg-gray-800"
                                                    >
                                                        {msg.isBookmarked ? (
                                                            <IconBookmarkFilled className="w-3.5 h-3.5 text-yellow-500" />
                                                        ) : (
                                                            <IconBookmark className="w-3.5 h-3.5 text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400" />
                                                        )}
                                                    </button>
                                                </Tooltip>
                                            </div>
                                        </div>
                                        
                                        <div className={`
                                        ${msg.role === 'user' 
                                            ? 'bg-gray-100 text-gray-800 rounded-2xl rounded-tr-sm px-5 py-3 text-right inline-block float-right shadow-sm text-sm dark:bg-blue-900/30 dark:text-blue-100 dark:border dark:border-blue-800' 
                                            : 'bg-transparent text-gray-800 text-sm md:text-base leading-relaxed dark:text-gray-300'}
                                        `}>
                                        {msg.role === 'user' ? (
                                            isSearchActive && searchQuery ? (
                                                <HighlightText text={msg.text} highlight={searchQuery} />
                                            ) : (
                                                msg.text
                                            )
                                        ) : (
                                            <div className="prose prose-blue prose-sm max-w-none dark:prose-invert">
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
                                        <div className={`text-[10px] text-gray-300 mt-1 clear-both dark:text-gray-600 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
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
                                    <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-800" />
                                    <div className="h-3 w-16 bg-gray-200 rounded dark:bg-gray-800" />
                                </div>
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-100 rounded w-3/4 dark:bg-gray-800/50" />
                                    <div className="h-4 bg-gray-100 rounded w-1/2 dark:bg-gray-800/50" />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {!isSearchActive && !showBookmarksOnly && (
                    <div className="p-4 bg-white border-t border-gray-100 z-20 shrink-0 dark:bg-gray-900 dark:border-gray-800 md:mb-0 mb-[76px]">
                        <div className="max-w-3xl mx-auto relative flex items-center gap-2">
                            <div className="relative w-full">
                                <div className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400">
                                    <IconMessage className="w-5 h-5" />
                                </div>
                                <Tooltip content="A IA usa suas fontes ativas (exames, inputs) para responder." position="top">
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder={isListening ? "Ouvindo..." : "Pergunte sobre sua evolução..."}
                                        className={`w-full pl-12 pr-24 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all shadow-sm text-gray-700 placeholder-gray-400 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:ring-blue-900 dark:placeholder-gray-500 ${isListening ? 'ring-2 ring-red-100 border-red-200 dark:ring-red-900/30 dark:border-red-900' : ''}`}
                                    />
                                </Tooltip>
                                
                                <div className="absolute top-1/2 -translate-y-1/2 right-3 flex items-center gap-2">
                                    {/* Mic Button */}
                                    <button
                                        onClick={handleMicClick}
                                        className={`p-2 rounded-xl transition-all active:scale-95 touch-manipulation ${isListening ? 'bg-red-50 text-red-500 animate-pulse dark:bg-red-900/50' : 'text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700'}`}
                                        title="Falar"
                                    >
                                        <IconMic className="w-4 h-4" />
                                    </button>

                                    {/* Send Button */}
                                    <button 
                                        onClick={handleSendMessage}
                                        disabled={!inputValue.trim() || isProcessing}
                                        className="p-2 bg-black text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-all active:scale-95 touch-manipulation dark:bg-blue-600 dark:hover:bg-blue-700"
                                    >
                                        <IconSend className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* --- DEDICATED MOBILE SOURCES VIEW HANDLER --- */}
        <div className="md:hidden">
             <SourceSidebar 
                sources={sources} 
                onToggleSource={handleToggleSource}
                onAddSource={handleBatchAddSources}
                currentView={currentView}
                onViewChange={setCurrentView}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onLogout={handleLogout}
                onViewSummary={handleViewSummary} 
                onDeleteSource={handleRequestDelete}
                onOpenWizard={() => setIsWizardOpen(true)}
            />
        </div>

        {/* --- CONTENT VIEWS --- */}
        
        {/* NEW: TIMELINE VIEW */}
        {currentView === 'timeline' && (
            <TimelineView 
                sources={sources} 
                messages={messages} 
            />
        )}

        {/* NEW: MOBILE FULL SCREEN SOURCES VIEW */}
        {currentView === 'sources' && (
             <div className="h-full w-full flex flex-col">
                <SourceSidebar 
                    sources={sources} 
                    onToggleSource={handleToggleSource}
                    onAddSource={handleBatchAddSources}
                    currentView={currentView}
                    onViewChange={setCurrentView}
                    isOpen={true} // Always open in this view
                    onClose={() => {}} // No close needed here
                    onLogout={handleLogout}
                    onViewSummary={handleViewSummary} 
                    onDeleteSource={handleRequestDelete} 
                    onOpenWizard={() => setIsWizardOpen(true)}
                    isMobileFullView={true} // Activate full screen mode
                />
            </div>
        )}
        
        {currentView === 'metrics' && project && (
            <MetricDashboard 
                project={project}
                risks={realRisks} 
                onGenerateProntuario={handleGenerateProntuario}
                isMobileView={true}
                isProcessing={isProcessing}
            />
        )}
        
        {currentView === 'training_library' && project && (
            <ExerciseLibrary 
                project={project}
                onAddExercise={handleAddExerciseToRoutine}
            />
        )}
        
        {currentView === 'protocol_library' && (
            <ProtocolLibrary />
        )}
        
        {currentView === 'profile' && (
            <ProfileView 
                profile={project?.userProfile}
                onSave={handleUpdateProfile}
                onOpenWizard={() => setIsWizardOpen(true)}
                billingTrigger={billingTrigger} // PASSANDO PROPS
                onOpenSubscription={() => setIsSubscriptionModalOpen(true)} // PASSANDO PROPS
            />
        )}

        {/* --- MODALS --- */}
        <InputModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveInputData}
            initialData={project}
        />
        
        <SourceDetailModal 
            isOpen={!!viewingSource}
            onClose={() => setViewingSource(null)}
            source={viewingSource}
            isLoading={isGeneratingSummary}
        />
        
        <ProntuarioModal 
            isOpen={isProntuarioOpen}
            onClose={() => setIsProntuarioOpen(false)}
            markdownContent={prontuarioContent}
            profile={project?.userProfile}
        />

        {project && (
            <WizardModal 
                isOpen={isWizardOpen}
                onClose={() => setIsWizardOpen(false)}
                project={project}
                onUpdateProfile={handleUpdateProfile}
                onUpdateProject={(p) => setProject(p)}
                onUpload={handleBatchAddSources}
            />
        )}

        {/* DELETE CONFIRMATION MODAL */}
        {sourceToDelete && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 dark:bg-gray-900 dark:border-gray-800">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 dark:bg-red-900/30">
                            <IconTrash className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2 dark:text-white">Excluir Fonte?</h3>
                        <p className="text-sm text-gray-500 mb-6 dark:text-gray-400">
                            Tem certeza que deseja remover <strong>{sourceToDelete.title}</strong>? <br/>
                            A IA perderá acesso a este contexto.
                        </p>
                        <div className="flex gap-3 w-full">
                            <button 
                                onClick={() => setSourceToDelete(null)}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmDeleteSource}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 dark:bg-red-600 dark:hover:bg-red-700"
                            >
                                {isDeleting ? 'Excluindo...' : 'Excluir'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* SUBSCRIPTION MODAL (NEW) */}
        <SubscriptionModal 
            isOpen={isSubscriptionModalOpen}
            onClose={() => setIsSubscriptionModalOpen(false)}
            currentBill={currentBillAmount} // Could pass actual bill here if lifted
        />

        {/* NEW: MOBILE BOTTOM NAVIGATION */}
        <MobileBottomNav currentView={currentView} onViewChange={setCurrentView} />

      </main>
    </div>
  );
};

export default App;
