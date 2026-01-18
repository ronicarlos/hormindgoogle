
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { dataService } from './services/dataService';
import { generateAIResponse } from './services/geminiService'; // Import necessary for direct analysis
import { Project, UserProfile, AppView, Source, Exercise, DailyLogData, SourceType, ChatMessage, MetricPoint } from './types';
import AuthScreen from './components/AuthScreen';
import SourceSidebar from './components/SourceSidebar';
import MobileNav from './components/MobileNav'; 
import MobileHeader from './components/MobileHeader'; 
import MetricDashboard from './components/MetricDashboard';
import ChatInterface from './components/ChatInterface'; 
import ProfileView from './components/ProfileView';
import TimelineView from './components/TimelineView';
import SourceListView from './components/SourceListView';
import ProtocolLibrary from './components/ProtocolLibrary';
import ExerciseLibrary from './components/ExerciseLibrary';
import WizardModal from './components/WizardModal';
import InputModal from './components/InputModal';
import ProntuarioModal from './components/ProntuarioModal';
import SourceDetailModal from './components/SourceDetailModal';
import LegalContractModal from './components/LegalContractModal';
import { IOSInstallPrompt } from './components/IOSInstallPrompt';
import SubscriptionModal from './components/SubscriptionModal';
import AnalysisModal from './components/AnalysisModal';
import ProcessingOverlay, { ProcessingState } from './components/ProcessingOverlay'; // NEW COMPONENT
import DateConfirmationModal from './components/DateConfirmationModal'; // NEW COMPONENT
import { generateProntuario, processDocument, OCR_MODEL } from './services/geminiService';
import { IconSparkles, IconAlert, IconRefresh } from './components/Icons';

// --- CONTROLE DE VERSÃO E CACHE ---
/*
  SQL UPDATE SCRIPT FOR VERSION 1.6.71
  --------------------------------------------------
  INSERT INTO app_versions (version, description, created_at) 
  VALUES ('1.6.71', 'Correção de tipagem na análise de métricas (remoção de código inalcançável).', NOW());
  --------------------------------------------------
*/
const APP_VERSION = '1.6.71'; 

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Detecção Mobile Real (Híbrida: Largura OU Pointer Coarse)
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
      const checkMobile = () => {
          const isSmallScreen = window.innerWidth < 768;
          const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
          setIsMobile(isSmallScreen || isTouchDevice);
      };
      
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Feedback Visual State (New)
  const [processingState, setProcessingState] = useState<ProcessingState | null>(null);

  // --- FILA DE PROCESSAMENTO DE UPLOAD (PENDING DOCS) ---
  const [pendingDocs, setPendingDocs] = useState<any[]>([]);
  const [currentConfirmDoc, setCurrentConfirmDoc] = useState<any | null>(null);

  // Modals State
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [prontuarioContent, setProntuarioContent] = useState('');
  const [isProntuarioModalOpen, setIsProntuarioModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  
  // New Analysis Logic State
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [pendingAnalysisContext, setPendingAnalysisContext] = useState('');
  
  const [billingTrigger, setBillingTrigger] = useState(0);
  const [currentBill, setCurrentBill] = useState(0);

  // --- SAFETY TIMEOUT FOR PWA CRASH FIX ---
  useEffect(() => {
      // Se ficar carregando por mais de 12 segundos sem projeto, força parada
      // Isso corrige o travamento "Sincronizando Inteligência" no Android PWA
      const timer = setTimeout(() => {
          if (isLoading && !project) {
              console.warn("Safety Timeout Triggered: Forcing stop loading.");
              setIsLoading(false);
          }
      }, 12000); // 12s timeout

      return () => clearTimeout(timer);
  }, [isLoading, project]);

  // --- AUTO-UPDATE LOGIC ---
  useEffect(() => {
    const checkVersionAndClearCache = async () => {
      try {
          const storedVersion = localStorage.getItem('fitlm_app_version');
          
          let targetVersion = APP_VERSION; 
          try {
              const latestDB = await dataService.getLatestAppVersion();
              if (latestDB) {
                  targetVersion = latestDB.version;
              }
          } catch (e) {
              console.warn("Falha ao checar versão no banco, usando local:", e);
          }

          if (storedVersion !== targetVersion) {
            console.log(`Nova versão detectada (${targetVersion}). Limpando cache antigo...`);
            if ('serviceWorker' in navigator) {
              try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of registrations) {
                  await registration.unregister();
                }
              } catch (err) {
                console.warn("Erro ao limpar ServiceWorker (ignorado):", err);
              }
            }
            if ('caches' in window) {
              try {
                const keys = await caches.keys();
                await Promise.all(keys.map(key => caches.delete(key)));
              } catch (err) {
                console.warn("Erro ao limpar Cache Storage (ignorado):", err);
              }
            }
            localStorage.setItem('fitlm_app_version', targetVersion);
            // Evita reload loop se algo der errado no storage
            if (sessionStorage.getItem('reloaded') !== 'true') {
                sessionStorage.setItem('reloaded', 'true');
                window.location.reload();
            }
          }
      } catch (err) {
          console.error("Critical Update Error:", err);
      }
    };

    checkVersionAndClearCache();
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
          loadProject(session.user.id);
      } else {
          setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
          loadProject(session.user.id);
      } else {
          setProject(null);
          setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- LOGICA DE PROCESSAMENTO DA FILA DE UPLOAD (HUMAN IN THE LOOP) ---
  useEffect(() => {
      // Se não tem modal aberto e tem itens na fila, abre o próximo
      if (!currentConfirmDoc && pendingDocs.length > 0) {
          const nextDoc = pendingDocs[0];
          setCurrentConfirmDoc(nextDoc);
      }
  }, [pendingDocs, currentConfirmDoc]);

  const handleConfirmDate = async (confirmedDate: string) => {
      if (!currentConfirmDoc || !project || !session?.user) return;

      const doc = currentConfirmDoc;
      
      try {
          // 1. Salvar Métricas com a DATA CONFIRMADA
          // Atualiza a data em todos os pontos extraídos
          for (const m of doc.metrics) {
              const adjustedMetric = {
                  ...m.data,
                  date: confirmedDate // Override com a data do usuário
              };
              await dataService.addMetric(project.id, m.category, adjustedMetric);
          }

          // 2. Salvar Source com a DATA CONFIRMADA
          const source: Source = {
              id: '',
              title: doc.file.name,
              type: (doc.file.type === 'application/pdf' ? SourceType.PDF : SourceType.IMAGE) as SourceType,
              date: confirmedDate, // Override
              content: doc.extractedText,
              summary: 'Processado automaticamente via OCR IA.',
              selected: true,
              filePath: doc.filePath,
              specificType: doc.documentType
          };
          
          await dataService.addSource(project.id, source);

          // 3. Log de Custo
          await dataService.logUsage(
              session.user.id, 
              project.id, 
              'OCR', 
              500, 
              500, 
              OCR_MODEL 
          );

          // 4. Trigger Updates
          setBillingTrigger(prev => prev + 1);
          
      } catch (e) {
          console.error("Erro ao salvar documento confirmado:", e);
          alert("Erro ao salvar documento. Tente novamente.");
      }

      // Remove da fila e limpa modal atual
      setPendingDocs(prev => prev.slice(1));
      setCurrentConfirmDoc(null);

      // Se foi o último, recarrega o projeto
      if (pendingDocs.length <= 1) {
          await loadProject(session.user.id);
          handleTriggerAnalysisConfirmation(`Novos documentos processados. O usuário confirmou datas e dados de ${doc.file.name}.`);
      }
  };

  const handleCancelDate = () => {
      // Remove da fila sem salvar
      setPendingDocs(prev => prev.slice(1));
      setCurrentConfirmDoc(null);
  };

  const loadProject = async (userId: string) => {
    // Apenas define isLoading se não estivermos processando arquivos (para evitar piscar o overlay)
    if (!processingState && pendingDocs.length === 0) setIsLoading(true);
    
    try {
        const proj = await dataService.getOrCreateProject(userId);
        
        if (!proj) {
            throw new Error("Failed to load project structure");
        }

        setProject(proj);
        
        // Sync Remember Email
        const pendingSync = localStorage.getItem('fitlm_pending_remember_sync');
        if (pendingSync !== null) {
            await dataService.updateRememberEmailPreference(userId, pendingSync === 'true');
            localStorage.removeItem('fitlm_pending_remember_sync');
        } else {
            if (proj && proj.userProfile && proj.userProfile.rememberEmail) {
                const currentEmail = session?.user?.email;
                if (currentEmail) localStorage.setItem('fitlm_saved_email', currentEmail);
            } else {
                localStorage.removeItem('fitlm_saved_email');
            }
        }

        if (proj && proj.userProfile && !proj.userProfile.termsAcceptedAt) {
            setIsLegalModalOpen(true);
        }

        if (proj?.userProfile?.theme === 'dark' || (!proj?.userProfile?.theme && localStorage.getItem('fitlm-theme') === 'dark')) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        
        const bill = await dataService.getCurrentMonthBill(userId);
        setCurrentBill(bill);
    } catch (err) {
        console.error("CRITICAL APP LOAD ERROR:", err);
        // Não deixamos o app travar no loading
    } finally {
        setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProject(null);
  };

  const handleUpdateProfile = (profile: UserProfile) => {
    if (project) {
        setProject({ ...project, userProfile: profile });
    }
  };

  const handleUpdateProject = (updatedProject: Project) => {
    setProject(updatedProject);
  };

  const handleAcceptTerms = async () => {
      if (session?.user) {
          await dataService.acceptLegalTerms(session.user.id);
          setIsLegalModalOpen(false);
          setIsWizardOpen(true);

          if (project && project.userProfile) {
              setProject({
                  ...project,
                  userProfile: { ...project.userProfile, termsAcceptedAt: new Date().toISOString() }
              });
          }
      }
  };

  // --- CORE INTELLIGENCE LOGIC (OTIMIZADO) ---

  const handleTriggerAnalysisConfirmation = (context: string) => {
      setPendingAnalysisContext(context);
      setIsAnalysisModalOpen(true);
  };

  const handleExecuteAnalysis = async () => {
      if (!project || !session?.user || !pendingAnalysisContext) return;
      
      // 1. FECHAR MODAL IMEDIATAMENTE (UX Otimista)
      setIsAnalysisModalOpen(false);
      setPendingAnalysisContext(''); // Limpa o contexto pendente para evitar duplicação

      // 2. Criar mensagem do usuário
      const userMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'user',
          text: `[SISTEMA - ATUALIZAÇÃO DE CONTEXTO]\n${pendingAnalysisContext}\n\nCom base nessas mudanças e nos novos dados, faça uma análise detalhada do meu cenário atual.`,
          timestamp: Date.now()
      };

      // 3. Salvar no Banco (Sem await para não bloquear a UI)
      dataService.addMessage(project.id, userMsg);

      // 4. MUDAR PARA O CHAT IMEDIATAMENTE E ATIVAR LOADING
      // Isso dá feedback instantâneo ao usuário de que "algo está acontecendo"
      setCurrentView('chat'); 
      setIsLoading(true); // O ChatInterface usa isso para mostrar "Processando..."

      // 5. Executar Análise Pesada (Background)
      try {
          // Busca histórico atualizado (incluindo a mensagem nova que acabamos de adicionar)
          // Pequeno delay para garantir consistência do banco se necessário, mas getMessages é rápido
          const history = await dataService.getMessages(project.id);
          // Adiciona manualmente a msg atual se o banco ainda não indexou (segurança)
          if (!history.find(m => m.id === userMsg.id)) {
              history.push(userMsg);
          }

          const responseText = await generateAIResponse(
              userMsg.text,
              project.sources,
              history,
              project.userProfile,
              project.metrics
          );

          // 6. Salvar Resposta
          const aiMsg: ChatMessage = {
              id: (Date.now() + 1).toString(),
              role: 'model',
              text: responseText,
              timestamp: Date.now()
          };
          await dataService.addMessage(project.id, aiMsg);

          // 7. Atualizar UI Global
          setBillingTrigger(prev => prev + 1);
          
          // Recarrega o projeto (opcional, mas bom para sincronizar)
          await loadProject(session.user.id); 

      } catch (err) {
          console.error("Analysis failed", err);
          // Em caso de erro, avisa no chat (se possível) ou alert
          const errorMsg: ChatMessage = {
              id: Date.now().toString(),
              role: 'model',
              text: "⚠️ Ocorreu um erro ao processar a análise automática. Por favor, tente perguntar novamente no chat.",
              timestamp: Date.now()
          };
          await dataService.addMessage(project.id, errorMsg);
      } finally {
          setIsLoading(false); // Libera o Chat para interação
      }
  };

  const handleUpload = async (files: File[]) => {
      if (!session?.user || !project) return;
      
      // Inicializa o Overlay
      setProcessingState({
          current: 0,
          total: files.length,
          filename: '',
          step: 'uploading'
      });

      // Loop Sequencial para processamento
      for (let i = 0; i < files.length; i++) {
          const file = files[i];
          
          setProcessingState(prev => ({
              current: i + 1,
              total: files.length,
              filename: file.name,
              step: 'uploading'
          }));

          try {
              // 1. Upload Storage (Necessário para ter o link)
              const filePath = await dataService.uploadFileToStorage(file, session.user.id, project.id);
              
              if (!filePath) {
                  alert(`Erro ao salvar arquivo: ${file.name}. Verifique se o nome contém caracteres especiais.`);
                  continue;
              }

              // 2. OCR AI Processing
              setProcessingState(prev => ({ ...prev!, step: 'ocr' }));
              
              // Data padrão técnica (fallback extremo, mas o modal forçará a escolha)
              const fileDate = new Date(file.lastModified).toLocaleDateString('pt-BR');
              
              const { extractedText, metrics, documentType, detectedDate } = await processDocument(file, fileDate);
              
              // 3. NÃO SALVA AINDA! Coloca na fila para confirmação humana.
              // O estado `pendingDocs` acionará o modal `DateConfirmationModal`
              setPendingDocs(prev => [...prev, {
                  file,
                  filePath,
                  extractedText,
                  metrics,
                  documentType,
                  detectedDate // Data sugerida pela IA
              }]);

          } catch (err) {
              console.error(`Erro crítico processando ${file.name}:`, err);
          }
      }
      
      // Limpa overlay (O processo agora continua via Modais de Confirmação)
      setProcessingState(null);
  };

  const handleSaveDailyLog = async (data: DailyLogData) => {
      if (!project || !session?.user) return;
      
      await dataService.updateProjectSettings(
          project.id, 
          data.goal, 
          data.protocol, 
          data.trainingNotes, 
          data.calories 
      );
      
      if (data.calories) {
          await dataService.addMetric(project.id, 'Calories', {
              date: new Date().toLocaleDateString('pt-BR'),
              value: parseInt(data.calories),
              unit: 'kcal',
              label: 'Manual Input'
          });
      }

      await loadProject(session.user.id);
      
      const context = `O usuário atualizou seus parâmetros manualmente:\n- Objetivo: ${data.goal}\n- Dieta: ${data.calories} kcal\n- Protocolo: ${data.protocol.map(p => `${p.compound} (${p.dosage})`).join(', ')}\n- Notas de Treino: ${data.trainingNotes}`;
      handleTriggerAnalysisConfirmation(context);
  };

  const handleGenerateProntuario = async () => {
      if (!project || !session?.user) return;
      setIsLoading(true); 
      const text = await generateProntuario(project.sources, project.userProfile, project.metrics);
      setProntuarioContent(text);
      setIsProntuarioModalOpen(true);
      setIsLoading(false);
      setBillingTrigger(prev => prev + 1);
  };

  const handleAddExercise = (exercise: Exercise) => {
      alert(`Adicionado: ${exercise.name}`);
  };

  if (!session) {
    return <AuthScreen />;
  }

  if (isLoading && !project && !processingState && pendingDocs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-6 p-4 text-center">
            <div className="relative">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                </div>
            </div>
            
            <div>
                <p className="text-gray-900 dark:text-white font-bold mb-1">
                    Sincronizando Inteligência...
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Isso pode levar alguns segundos.
                </p>
            </div>

            {/* BOTÃO DE EMERGÊNCIA APÓS TIMEOUT */}
            <button 
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-bold shadow-sm hover:bg-gray-50 transition-colors animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-5000 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
            >
                Está demorando? Recarregar
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white overflow-hidden">
      
      {/* Componente Visual de Processamento Global (Upload/OCR) */}
      <ProcessingOverlay state={processingState} />

      {/* Modal de Confirmação de Data (Human-in-the-loop) */}
      <DateConfirmationModal 
          isOpen={!!currentConfirmDoc}
          fileName={currentConfirmDoc?.file.name || ''}
          suggestedDate={currentConfirmDoc?.detectedDate || null}
          metrics={currentConfirmDoc?.metrics || []} // Passando métricas para revisão
          onConfirm={handleConfirmDate}
          onCancel={handleCancelDate}
      />

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 shrink-0 h-full border-r border-gray-200 dark:border-gray-800">
          <SourceSidebar 
              currentView={currentView} 
              onChangeView={setCurrentView} 
              onLogout={handleLogout}
              onOpenWizard={() => setIsWizardOpen(true)}
              onUpload={handleUpload}
              className="w-full"
          />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          
          <MobileHeader 
              onOpenWizard={() => setIsWizardOpen(true)}
              onOpenProfile={() => setCurrentView('profile')}
              onOpenParameters={() => setIsInputModalOpen(true)}
          />

          <div className="flex-1 overflow-hidden relative pb-[60px] md:pb-0"> 
              {!project && !isLoading && !processingState && pendingDocs.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in">
                      <div className="bg-red-50 p-4 rounded-full mb-4 dark:bg-red-900/20">
                          <IconAlert className="w-8 h-8 text-red-500" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2 dark:text-white">Erro ao carregar projeto</h3>
                      <p className="text-sm text-gray-500 mb-6 dark:text-gray-400">Verifique sua conexão ou tente novamente.</p>
                      <button 
                          onClick={() => session?.user ? loadProject(session.user.id) : window.location.reload()}
                          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                      >
                          <IconRefresh className="w-4 h-4" />
                          Tentar Novamente
                      </button>
                  </div>
              )}

              {project && (
                  <>
                      {currentView === 'chat' && (
                          <ChatInterface 
                              project={project} 
                              onUpdateProject={handleUpdateProject} 
                              refreshTrigger={billingTrigger} // Pass trigger to force update
                              isProcessing={isLoading} // Feedback visual de processamento vindo do App
                          />
                      )}

                      {currentView === 'dashboard' && (
                          <MetricDashboard 
                              project={project}
                              risks={[]}
                              onGenerateProntuario={handleGenerateProntuario}
                              isProcessing={isLoading}
                              onViewSource={(id) => { setSelectedSourceId(id); }}
                              isMobileView={isMobile} 
                          />
                      )}

                      {currentView === 'sources' && ( 
                          <SourceListView
                              project={project}
                              onViewSource={(source) => setSelectedSourceId(source.id)}
                              onUpdateProject={handleUpdateProject}
                              onUpload={handleUpload}
                              onManualAnalysis={() => handleTriggerAnalysisConfirmation("O usuário solicitou uma REANÁLISE COMPLETA manual de todos os documentos e dados atuais.")}
                          />
                      )}

                      {currentView === 'timeline' && (
                          <TimelineView 
                              sources={project.sources}
                              messages={[]} 
                              projectId={project.id} 
                              metrics={project.metrics} // Passa métricas para o TimelineView (NOVO)
                          />
                      )}

                      {currentView === 'profile' && (
                          <ProfileView 
                              project={project}
                              onSave={handleUpdateProfile}
                              onUpdateProject={handleUpdateProject}
                              onOpenWizard={() => setIsWizardOpen(true)}
                              billingTrigger={billingTrigger}
                              onOpenSubscription={() => setIsSubscriptionModalOpen(true)}
                              onLogout={handleLogout}
                              onRequestAnalysis={(ctx) => handleTriggerAnalysisConfirmation(ctx)}
                          />
                      )}

                      {currentView === 'training_library' && (
                          <ExerciseLibrary 
                              project={project}
                              onAddExercise={handleAddExercise}
                          />
                      )}

                      {currentView === 'protocol_library' && (
                          <ProtocolLibrary />
                      )}
                  </>
              )}
          </div>
          
          <MobileNav 
              currentView={currentView}
              onChangeView={setCurrentView}
          />

          {/* Floating Action Button (Moved from Dashboard to Profile) */}
          {currentView === 'profile' && project && (
              <div className="absolute bottom-20 right-6 z-30 flex flex-col gap-3 md:bottom-6">
                  <button
                      onClick={() => setIsInputModalOpen(true)}
                      className="p-4 bg-black text-white rounded-full shadow-xl hover:bg-gray-800 transition-transform active:scale-95 dark:bg-blue-600"
                      title="Editar Parâmetros"
                  >
                      <IconSparkles className="w-6 h-6" />
                  </button>
              </div>
          )}

      </div>

      {/* Modals */}
      {project && (
          <WizardModal 
              isOpen={isWizardOpen} 
              onClose={() => setIsWizardOpen(false)} 
              project={project}
              onUpdateProfile={handleUpdateProfile}
              onUpdateProject={handleUpdateProject}
              onUpload={handleUpload} // Now handles uploading via Wizard too
              onRequestAnalysis={(ctx) => handleTriggerAnalysisConfirmation(ctx)}
          />
      )}

      <InputModal 
          isOpen={isInputModalOpen}
          onClose={() => setIsInputModalOpen(false)}
          onSave={handleSaveDailyLog}
          initialData={project}
      />

      <AnalysisModal 
          isOpen={isAnalysisModalOpen}
          onClose={() => setIsAnalysisModalOpen(false)}
          onConfirm={handleExecuteAnalysis}
          contextDescription={pendingAnalysisContext}
      />

      <ProntuarioModal 
          isOpen={isProntuarioModalOpen}
          onClose={() => setIsProntuarioModalOpen(false)}
          markdownContent={prontuarioContent}
          profile={project?.userProfile}
      />

      {selectedSourceId && project && (
          <SourceDetailModal 
              isOpen={!!selectedSourceId}
              onClose={() => setSelectedSourceId(null)}
              source={project.sources.find(s => s.id === selectedSourceId) || null}
              isLoading={false}
          />
      )}

      <LegalContractModal 
          isOpen={isLegalModalOpen}
          onAccept={handleAcceptTerms}
      />

      <SubscriptionModal 
          isOpen={isSubscriptionModalOpen}
          onClose={() => setIsSubscriptionModalOpen(false)}
          currentBill={currentBill}
      />

      <IOSInstallPrompt />
    </div>
  );
}
