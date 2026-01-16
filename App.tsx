
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { dataService } from './services/dataService';
import { generateAIResponse } from './services/geminiService'; // Import necessary for direct analysis
import { Project, UserProfile, AppView, Source, Exercise, DailyLogData, SourceType, ChatMessage } from './types';
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
import { generateProntuario, processDocument } from './services/geminiService';
import { IconSparkles, IconAlert, IconRefresh } from './components/Icons';

// --- CONTROLE DE VERSÃO E CACHE ---
const APP_VERSION = '1.6.11'; 

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Feedback Visual State (New)
  const [processingState, setProcessingState] = useState<ProcessingState | null>(null);

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

  // --- AUTO-UPDATE LOGIC ---
  useEffect(() => {
    const checkVersionAndClearCache = async () => {
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
        window.location.reload();
      }
    };

    checkVersionAndClearCache();
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProject(session.user.id);
      else setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadProject(session.user.id);
      else {
          setProject(null);
          setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProject = async (userId: string) => {
    // Apenas define isLoading se não estivermos processando arquivos (para evitar piscar o overlay)
    if (!processingState) setIsLoading(true);
    
    const proj = await dataService.getOrCreateProject(userId);
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
    
    setIsLoading(false);
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

  // --- CORE INTELLIGENCE LOGIC ---

  const handleTriggerAnalysisConfirmation = (context: string) => {
      setPendingAnalysisContext(context);
      setIsAnalysisModalOpen(true);
  };

  const handleExecuteAnalysis = async () => {
      if (!project || !session?.user || !pendingAnalysisContext) return;
      
      setIsAnalysisModalOpen(false); // Close modal
      setIsLoading(true);

      try {
          // 1. Create User Context Message & Save FIRST
          const userMsg: ChatMessage = {
              id: Date.now().toString(),
              role: 'user',
              text: `[SISTEMA - ATUALIZAÇÃO DE CONTEXTO]\n${pendingAnalysisContext}\n\nCom base nessas mudanças e nos novos dados, faça uma análise detalhada do meu cenário atual.`,
              timestamp: Date.now()
          };
          await dataService.addMessage(project.id, userMsg);

          // 2. NOW redirect to Chat (it will load the just-added message)
          setCurrentView('chat'); 

          // 3. Fetch History for Context
          const history = await dataService.getMessages(project.id);

          // 4. Call AI
          const responseText = await generateAIResponse(
              userMsg.text,
              project.sources,
              history,
              project.userProfile,
              project.metrics
          );

          // 5. Save AI Response
          const aiMsg: ChatMessage = {
              id: (Date.now() + 1).toString(),
              role: 'model',
              text: responseText,
              timestamp: Date.now()
          };
          await dataService.addMessage(project.id, aiMsg);

          // 6. Update Billing & Force Chat Refresh via Trigger
          setBillingTrigger(prev => prev + 1); // This updates ChatInterface instantly
          
          await loadProject(session.user.id); 

      } catch (err) {
          console.error("Analysis failed", err);
          alert("Erro ao processar análise. Tente novamente.");
      } finally {
          setIsLoading(false);
          setPendingAnalysisContext('');
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

      let newFilesCount = 0;

      // Loop Sequencial para garantir ordem e feedback
      for (let i = 0; i < files.length; i++) {
          const file = files[i];
          
          // Atualiza estado para UI
          setProcessingState(prev => ({
              current: i + 1,
              total: files.length,
              filename: file.name,
              step: 'uploading'
          }));

          try {
              // 1. Upload Storage
              const filePath = await dataService.uploadFileToStorage(file, session.user.id, project.id);
              
              if (!filePath) {
                  alert(`Erro ao salvar arquivo: ${file.name}. Verifique se o nome contém caracteres especiais.`);
                  continue;
              }

              // 2. OCR AI Processing
              setProcessingState(prev => ({ ...prev!, step: 'ocr' }));
              
              // CRÍTICO: Usa a data de modificação do arquivo como fallback se a IA não achar data impressa
              const fileDate = new Date(file.lastModified).toLocaleDateString('pt-BR');
              const { extractedText, metrics, documentType, detectedDate } = await processDocument(file, fileDate);
              
              // 3. Salvando dados
              setProcessingState(prev => ({ ...prev!, step: 'saving' }));

              for (const m of metrics) {
                  await dataService.addMetric(project.id, m.category, m.data);
              }
              
              const source: Source = {
                  id: '',
                  title: file.name,
                  type: (file.type === 'application/pdf' ? SourceType.PDF : SourceType.IMAGE) as SourceType,
                  date: detectedDate || fileDate, // Usa detectedDate se existir, senão usa data do arquivo
                  content: extractedText,
                  summary: 'Processado automaticamente via OCR IA.',
                  selected: true,
                  filePath: filePath,
                  specificType: documentType
              };
              
              await dataService.addSource(project.id, source);
              await dataService.logUsage(session.user.id, project.id, 'OCR', 500, 500); 
              newFilesCount++;

          } catch (err) {
              console.error(`Erro crítico processando ${file.name}:`, err);
              // Não alerta bloqueante no loop, apenas loga. O usuário verá o que faltou.
          }
      }
      
      setBillingTrigger(prev => prev + 1);
      
      // Finalizando e Recarregando
      setProcessingState(prev => ({ ...prev!, step: 'analyzing' }));
      await loadProject(session.user.id);
      
      // Limpa overlay
      setProcessingState(null);

      if (newFilesCount > 0) {
          handleTriggerAnalysisConfirmation(`Novos documentos processados (${newFilesCount} arquivos). O usuário fez upload de exames ou planilhas recentes.`);
      }
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

  // Se estiver carregando, mas não for por causa do Overlay de Processamento (que tem seu próprio UI)
  if (isLoading && !project && !processingState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium animate-pulse">
                Sincronizando Inteligência...
            </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white overflow-hidden">
      
      {/* Componente Visual de Processamento Global */}
      <ProcessingOverlay state={processingState} />

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
              {!project && !isLoading && !processingState && (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in">
                      <div className="bg-red-50 p-4 rounded-full mb-4 dark:bg-red-900/20">
                          <IconAlert className="w-8 h-8 text-red-500" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2 dark:text-white">Erro ao carregar projeto</h3>
                      <button 
                          onClick={() => session?.user && loadProject(session.user.id)}
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
                          />
                      )}

                      {currentView === 'dashboard' && (
                          <MetricDashboard 
                              project={project}
                              risks={[]}
                              onGenerateProntuario={handleGenerateProntuario}
                              isProcessing={isLoading}
                              onViewSource={(id) => { setSelectedSourceId(id); }}
                              isMobileView={true} 
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
                          />
                      )}

                      {currentView === 'profile' && (
                          <ProfileView 
                              profile={project.userProfile}
                              onSave={handleUpdateProfile}
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
              onUpload={handleUpload}
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
