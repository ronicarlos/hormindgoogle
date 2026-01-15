
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { dataService } from './services/dataService';
import { Project, UserProfile, AppView, Source, Exercise, DailyLogData, SourceType } from './types';
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
import { generateProntuario, processDocument } from './services/geminiService';
import { IconSparkles, IconAlert, IconRefresh } from './components/Icons';

// --- CONTROLE DE VERSÃO E CACHE (Fallback manual + DB Sync) ---
// Esta constante serve como fallback se o banco falhar, ou para marcar a versão do código.
const CODE_VERSION = '1.5.7'; 

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [prontuarioContent, setProntuarioContent] = useState('');
  const [isProntuarioModalOpen, setIsProntuarioModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [billingTrigger, setBillingTrigger] = useState(0);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [currentBill, setCurrentBill] = useState(0);

  // --- AUTO-UPDATE LOGIC (DATABASE DRIVEN) ---
  useEffect(() => {
    const checkVersionAndClearCache = async () => {
      const storedVersion = localStorage.getItem('fitlm_app_version');
      
      // 1. Tenta pegar a versão mais recente do Supabase
      let targetVersion = CODE_VERSION; 
      try {
          const latestDB = await dataService.getLatestAppVersion();
          if (latestDB) {
              targetVersion = latestDB.version;
          }
      } catch (e) {
          console.warn("Falha ao checar versão no banco, usando local:", e);
      }

      // 2. Se a versão alvo (DB ou Code) for diferente da armazenada, limpa tudo.
      if (storedVersion !== targetVersion) {
        console.log(`Nova versão detectada (${targetVersion}). Limpando cache antigo...`);
        
        // Unregister Service Workers
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

        // Clear Browser Caches (Storage)
        if ('caches' in window) {
          try {
            const keys = await caches.keys();
            await Promise.all(keys.map(key => caches.delete(key)));
          } catch (err) {
            console.warn("Erro ao limpar Cache Storage (ignorado):", err);
          }
        }

        // Update Stored Version
        localStorage.setItem('fitlm_app_version', targetVersion);

        // Force Reload from Server (Ignora Cache)
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
    setIsLoading(true);
    const proj = await dataService.getOrCreateProject(userId);
    setProject(proj);
    
    // --- SYNC REMEMBER EMAIL PREFERENCE ---
    // Check if we have a pending sync from Login screen (User just checked/unchecked the box)
    const pendingSync = localStorage.getItem('fitlm_pending_remember_sync');
    
    if (pendingSync !== null) {
        // SYNC UP: Local choice -> Database
        const choice = pendingSync === 'true';
        await dataService.updateRememberEmailPreference(userId, choice);
        localStorage.removeItem('fitlm_pending_remember_sync'); // Clear flag
    } else {
        // SYNC DOWN: Database preference -> Local Storage
        // If user logged in on another device and set preference to true, we honor it here.
        if (proj && proj.userProfile && proj.userProfile.rememberEmail) {
            const currentEmail = session?.user?.email;
            if (currentEmail) {
                localStorage.setItem('fitlm_saved_email', currentEmail);
            }
        } else {
            // If preference is false in DB, ensure we don't remember locally for next time
            // Note: This logic assumes if I uncheck on Device A, I want it unchecked on Device B next time I log out.
            localStorage.removeItem('fitlm_saved_email');
        }
    }

    if (proj && proj.userProfile && !proj.userProfile.termsAcceptedAt) {
        setIsLegalModalOpen(true);
    }

    if (proj?.userProfile?.theme) {
        if (proj.userProfile.theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    } else {
        const savedTheme = localStorage.getItem('fitlm-theme');
        if (savedTheme === 'dark') {
             document.documentElement.classList.add('dark');
        }
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

  const handleUpload = async (files: File[]) => {
      if (!session?.user || !project) return;
      
      setIsLoading(true);

      for (const file of files) {
          try {
              const filePath = await dataService.uploadFileToStorage(file, session.user.id, project.id);
              
              if (!filePath) {
                  alert(`Erro ao salvar arquivo: ${file.name}. Verifique se o nome contém caracteres especiais.`);
                  continue;
              }

              const { extractedText, metrics, documentType, detectedDate } = await processDocument(file, new Date().toLocaleDateString('pt-BR'));
              
              for (const m of metrics) {
                  await dataService.addMetric(project.id, m.category, m.data);
              }
              
              const source: Source = {
                  id: '',
                  title: file.name,
                  type: (file.type === 'application/pdf' ? SourceType.PDF : SourceType.IMAGE) as SourceType,
                  date: detectedDate || new Date().toLocaleDateString('pt-BR'),
                  content: extractedText,
                  summary: 'Processado automaticamente via OCR IA.',
                  selected: true,
                  filePath: filePath,
                  specificType: documentType
              };
              
              await dataService.addSource(project.id, source);
              
              await dataService.logUsage(session.user.id, project.id, 'OCR', 500, 500); 
              setBillingTrigger(prev => prev + 1);

          } catch (err) {
              console.error(`Erro crítico processando ${file.name}:`, err);
              alert(`Erro ao processar ${file.name}.`);
          }
      }
      
      loadProject(session.user.id);
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

  const handleSaveDailyLog = async (data: DailyLogData) => {
      if (!project || !session?.user) return;
      
      await dataService.updateProjectSettings(project.id, data.goal, data.protocol, data.trainingNotes);
      
      if (data.calories) {
          await dataService.addMetric(project.id, 'Calories', {
              date: new Date().toLocaleDateString('pt-BR'),
              value: parseInt(data.calories),
              unit: 'kcal',
              label: 'Manual Input'
          });
      }

      loadProject(session.user.id);
  };

  if (!session) {
    return <AuthScreen />;
  }

  if (isLoading && !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium animate-pulse">
                Processando dados...
            </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white overflow-hidden">
      
      {/* Desktop Sidebar (Hidden on Mobile) */}
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          
          {/* MOBILE HEADER - Agora com onOpenParameters */}
          <MobileHeader 
              onOpenWizard={() => setIsWizardOpen(true)}
              onOpenProfile={() => setCurrentView('profile')}
              onOpenParameters={() => setIsInputModalOpen(true)}
          />

          <div className="flex-1 overflow-hidden relative pb-[60px] md:pb-0"> 
              {!project && !isLoading && (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in">
                      <div className="bg-red-50 p-4 rounded-full mb-4 dark:bg-red-900/20">
                          <IconAlert className="w-8 h-8 text-red-500" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2 dark:text-white">Erro ao carregar projeto</h3>
                      <p className="text-sm text-gray-500 max-w-xs mb-6 dark:text-gray-400">
                          Não foi possível conectar ao banco de dados. Tente recarregar.
                      </p>
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
                          <ChatInterface project={project} onUpdateProject={handleUpdateProject} />
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
          
          {/* Mobile Bottom Navigation */}
          <MobileNav 
              currentView={currentView}
              onChangeView={setCurrentView}
          />

          {/* Floating Actions (Dashboard Only) */}
          {currentView === 'dashboard' && project && (
              <div className="absolute bottom-20 right-6 z-30 flex flex-col gap-3 md:bottom-6">
                  <button
                      onClick={() => setIsInputModalOpen(true)}
                      className="p-4 bg-black text-white rounded-full shadow-xl hover:bg-gray-800 transition-transform active:scale-95 dark:bg-blue-600"
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
          />
      )}

      <InputModal 
          isOpen={isInputModalOpen}
          onClose={() => setIsInputModalOpen(false)}
          onSave={handleSaveDailyLog}
          initialData={project}
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
