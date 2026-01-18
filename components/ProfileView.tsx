
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, AppVersion, Project, ProtocolItem } from '../types';
import { dataService } from '../services/dataService';
import { supabase } from '../lib/supabase';
import CostTracker from './CostTracker';
import { Tooltip } from './Tooltip';
import BodyGuide from './BodyGuide';
import AuditLogModal from './AuditLogModal';
import EvolutionGallery from './EvolutionGallery'; // Import da Galeria
import { 
    IconUser, IconPlus, IconSun, IconMoon, IconFlame, 
    IconActivity, IconAlert, IconShield, IconRefresh, 
    IconWizard, IconCheck, IconInfo, IconCopy, IconClock,
    IconPill, IconDumbbell, IconList, IconClose, IconScience,
    IconFile, IconCalendar, IconHistory, IconCamera, IconUpload
} from './Icons';

// ============================================================================
// DOCUMENTAÇÃO DA TELA DE PERFIL (CRÍTICO)
// ============================================================================
// Esta tela é o coração dos dados do usuário.
// COMPONENTES OBRIGATÓRIOS (NÃO REMOVER):
// 1. Header Fixo: Título + Botão Galeria + Botão Salvar.
// 2. CostTracker: Resumo de custos da IA.
// 3. Banner Evolução: Acesso rápido à comparação de fotos.
// 4. Avatar & Dados Básicos: Foto, Nome, Altura, Peso, Idade.
// 5. Metas & Evolução: Comparativo Peso/BF Atual vs Meta.
// 6. Antropometria: Medidas corporais com guia visual.
// 7. Painel Hormonal: Testo, E2, Comorbidades.
// 8. Estratégia: Objetivo, Dieta, Treino, Protocolo.
// 9. SISTEMA & VERSÃO: Controle de versão, Histórico de updates (Changelog), Tema, Logs e Cache Reset.
// ============================================================================

interface ProfileViewProps {
    project?: Project;
    profile?: UserProfile;
    onSave: (profile: UserProfile) => void;
    onUpdateProject?: (project: Project) => void;
    onOpenWizard?: () => void;
    billingTrigger: number;
    onOpenSubscription: () => void;
    onLogout?: () => void;
    onRequestAnalysis?: (context: string) => void;
}

const CODE_VERSION = "v1.6.63"; 

const MEASUREMENT_HINTS: Record<string, string> = {
    chest: 'Passe a fita na linha dos mamilos, sob as axilas.',
    arm: 'Maior circunferência do bíceps contraído.',
    waist: 'Circunferência na altura do umbigo (relaxado).',
    hips: 'Maior circunferência na região dos glúteos.',
    thigh: 'Meio da coxa, entre o joelho e o quadril.',
    calf: 'Maior circunferência da panturrilha.'
};

const LABELS_PT: Record<string, string> = {
    chest: 'Peitoral',
    arm: 'Braço (Bíceps)',
    waist: 'Cintura',
    hips: 'Quadril',
    thigh: 'Coxa',
    calf: 'Panturrilha'
};

const ProfileView: React.FC<ProfileViewProps> = ({ 
    project, 
    profile, 
    onSave, 
    onUpdateProject,
    onOpenWizard, 
    billingTrigger, 
    onOpenSubscription, 
    onLogout, 
    onRequestAnalysis 
}) => {
    const [isSaving, setIsSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    
    const [userId, setUserId] = useState<string>('');
    const [versionHistory, setVersionHistory] = useState<AppVersion[]>([]);
    
    // Audit Modal State
    const [isAuditOpen, setIsAuditOpen] = useState(false);
    
    // Evolution Gallery State
    const [showEvolutionGallery, setShowEvolutionGallery] = useState(false);
    
    const avatarInputRef = useRef<HTMLInputElement>(null);

    // Default Profile Structure
    const defaultProfile: UserProfile = {
        name: '',
        birthDate: '', 
        gender: 'Masculino',
        height: '',
        weight: '',
        bodyFat: '',
        targetWeight: '',
        targetBodyFat: '',
        targetMeasurements: { chest: '', arm: '', waist: '', hips: '', thigh: '', calf: '' },
        comorbidities: '',
        medications: '',
        measurements: { chest: '', arm: '', waist: '', hips: '', thigh: '', calf: '' },
        calculatedStats: { bmi: '', bmr: '', whr: '', bmiClassification: '', whrRisk: '' },
        theme: 'light'
    };

    // States for Profile Data
    const effectiveProfile = project?.userProfile || profile || defaultProfile;
    const [formData, setFormData] = useState<UserProfile>(effectiveProfile);
    const [initialFormData, setInitialFormData] = useState<UserProfile>(effectiveProfile);

    // Date Mask State (DD/MM/YYYY)
    const [birthDateDisplay, setBirthDateDisplay] = useState('');

    // Hormones State (Testo/E2)
    const [hormones, setHormones] = useState({ testo: '', e2: '' });
    const [initialHormones, setInitialHormones] = useState({ testo: '', e2: '' });

    // States for Project Data (Goal, Protocol, Training, Diet)
    const [goal, setGoal] = useState(project?.objective || 'Bulking');
    const [calories, setCalories] = useState(project?.dietCalories || '');
    const [trainingNotes, setTrainingNotes] = useState(project?.trainingNotes || '');
    const [protocol, setProtocol] = useState<ProtocolItem[]>(project?.currentProtocol || []);
    
    // Initial States for Dirty Checking (Project Data)
    const [initialGoal, setInitialGoal] = useState(project?.objective || 'Bulking');
    const [initialCalories, setInitialCalories] = useState(project?.dietCalories || '');
    const [initialTraining, setInitialTraining] = useState(project?.trainingNotes || '');
    const [initialProtocol, setInitialProtocol] = useState<ProtocolItem[]>(project?.currentProtocol || []);

    // Visual Interaction State
    const [activeMeasurement, setActiveMeasurement] = useState<string>('chest');

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) setUserId(session.user.id);
        });
        
        dataService.getAppVersionHistory().then(history => {
            setVersionHistory(history);
        });
    }, []);

    // Sync state when props change
    useEffect(() => {
        if (project) {
            const p = project.userProfile || defaultProfile;
            const newProfile = {
                ...defaultProfile, 
                ...p,        
                measurements: { ...defaultProfile.measurements, ...(p.measurements || {}) },
                targetMeasurements: { ...defaultProfile.targetMeasurements, ...(p.targetMeasurements || {}) },
                calculatedStats: defaultProfile.calculatedStats,
                theme: p.theme || 'light'
            };
            setFormData(newProfile);
            setInitialFormData(JSON.parse(JSON.stringify(newProfile)));

            // Convert ISO YYYY-MM-DD to DD/MM/YYYY for display
            if (newProfile.birthDate) {
                const parts = newProfile.birthDate.split('-');
                if (parts.length === 3) {
                    setBirthDateDisplay(`${parts[2]}/${parts[1]}/${parts[0]}`);
                }
            }

            setGoal(project.objective);
            setInitialGoal(project.objective);

            setCalories(project.dietCalories || '');
            setInitialCalories(project.dietCalories || '');

            setTrainingNotes(project.trainingNotes || '');
            setInitialTraining(project.trainingNotes || '');

            setProtocol(project.currentProtocol || []);
            setInitialProtocol(project.currentProtocol || []);

            // Load Latest Hormones from Metrics
            const tMetrics = project.metrics['Testosterone'] || project.metrics['Testosterona'] || [];
            const eMetrics = project.metrics['Estradiol'] || [];
            
            const sortedT = [...tMetrics].sort((a,b) => {
                 const da = a.date.split('/').reverse().join('-');
                 const db = b.date.split('/').reverse().join('-');
                 return new Date(da).getTime() - new Date(db).getTime();
            });
            const sortedE = [...eMetrics].sort((a,b) => {
                 const da = a.date.split('/').reverse().join('-');
                 const db = b.date.split('/').reverse().join('-');
                 return new Date(da).getTime() - new Date(db).getTime();
            });

            const latestTesto = sortedT.length > 0 ? sortedT[sortedT.length - 1].value.toString() : '';
            const latestE2 = sortedE.length > 0 ? sortedE[sortedE.length - 1].value.toString() : '';

            setHormones({ testo: latestTesto, e2: latestE2 });
            setInitialHormones({ testo: latestTesto, e2: latestE2 });
        }
    }, [project]);

    // Metabolic Logic (IMC/RCQ/TMB)
    const calculateAge = (dateString: string) => {
        if (!dateString) return null;
        const today = new Date();
        const birthDate = new Date(dateString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };
    const currentAge = calculateAge(formData.birthDate);

    useEffect(() => {
        const heightM = parseFloat(formData.height) / 100;
        const weightKg = parseFloat(formData.weight);
        const bfPercent = parseFloat(formData.bodyFat);
        const waistCm = parseFloat(formData.measurements.waist);
        const hipCm = parseFloat(formData.measurements.hips);
        const age = currentAge || 30;
        const isMale = formData.gender === 'Masculino';
        
        let newStats = { bmi: '', bmr: '', whr: '', bmiClassification: '', whrRisk: '' };

        if (heightM > 0 && weightKg > 0) {
            const bmi = weightKg / (heightM * heightM);
            newStats.bmi = bmi.toFixed(1);
            let classification = '';
            if (bmi < 18.5) classification = 'Abaixo do Peso';
            else if (bmi < 24.9) classification = 'Eutrófico (Normal)';
            else if (bmi < 29.9) classification = 'Sobrepeso';
            else classification = 'Obesidade';

            if (!isNaN(bfPercent)) {
                const athleticLimit = isMale ? 16 : 24;
                if (bmi >= 25 && bfPercent <= athleticLimit) {
                    classification = 'Sobrecarga Muscular (Atlético)';
                } else if (bmi < 25 && bfPercent > (isMale ? 25 : 32)) {
                    classification = 'Peso Normal (Alta Adiposidade)';
                }
            }
            newStats.bmiClassification = classification;
        } else {
            newStats.bmi = '--';
            newStats.bmiClassification = 'Aguardando dados';
        }

        if (weightKg > 0 && heightM > 0) {
            let bmr = (10 * weightKg) + (6.25 * (heightM * 100)) - (5 * age);
            if (isMale) bmr += 5; else bmr -= 161;
            if (!isNaN(bfPercent) && bfPercent < (isMale ? 12 : 20)) {
                bmr = bmr * 1.05; 
            }
            newStats.bmr = Math.round(bmr).toString();
        } else {
            newStats.bmr = '--';
        }

        if (waistCm > 0 && hipCm > 0) {
            const whr = waistCm / hipCm;
            newStats.whr = whr.toFixed(2);
            if (isMale) newStats.whrRisk = whr > 0.90 ? 'Alto Risco Cardíaco' : 'Risco Baixo';
            else newStats.whrRisk = whr > 0.85 ? 'Alto Risco Cardíaco' : 'Risco Baixo';
        } else {
            newStats.whr = '--';
            newStats.whrRisk = 'Aguardando medidas';
        }

        if (JSON.stringify(newStats) !== JSON.stringify(formData.calculatedStats)) {
            setFormData(prev => ({ ...prev, calculatedStats: newStats }));
        }
    }, [formData.height, formData.weight, formData.bodyFat, formData.measurements.waist, formData.measurements.hips, formData.gender, currentAge]);

    // Handlers
    const handleChange = (field: keyof UserProfile, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (field === 'theme') {
            if (value === 'dark') {
                document.documentElement.classList.add('dark');
                localStorage.setItem('fitlm-theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('fitlm-theme', 'light');
            }
        }
    };

    // Date Mask Handler
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, ''); // Remove non-digits
        if (val.length > 8) val = val.substring(0, 8);

        // Apply Mask
        let formatted = val;
        if (val.length >= 5) {
            formatted = `${val.substring(0, 2)}/${val.substring(2, 4)}/${val.substring(4)}`;
        } else if (val.length >= 3) {
            formatted = `${val.substring(0, 2)}/${val.substring(2)}`;
        }

        setBirthDateDisplay(formatted);

        // Validate and Sync with Profile (ISO)
        if (val.length === 8) {
            const day = parseInt(val.substring(0, 2));
            const month = parseInt(val.substring(2, 4));
            const year = parseInt(val.substring(4, 8));
            const currentYear = new Date().getFullYear();

            // Validation strict logic
            if (day > 0 && day <= 31 && month > 0 && month <= 12 && year > 1900 && year <= currentYear) {
                const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                handleChange('birthDate', isoDate);
            }
        }
    };

    const handleMeasurementChange = (type: 'current' | 'target', field: keyof UserProfile['measurements'], value: string) => {
        setActiveMeasurement(field as string); // Visual highlight
        if (type === 'current') {
            setFormData(prev => ({
                ...prev,
                measurements: { ...prev.measurements, [field]: value }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                targetMeasurements: { ...(prev.targetMeasurements || defaultProfile.measurements), [field]: value }
            }));
        }
    };

    // Protocol Handlers
    const handleAddProtocolItem = () => {
        setProtocol([...protocol, { compound: '', dosage: '', frequency: '' }]);
    };
    const handleUpdateProtocol = (index: number, field: keyof ProtocolItem, value: string) => {
        const newP = [...protocol];
        newP[index][field] = value;
        setProtocol(newP);
    };
    const handleRemoveProtocol = (index: number) => {
        setProtocol(protocol.filter((_, i) => i !== index));
    };

    const detectChanges = (): string[] => {
        const changes: string[] = [];
        
        // Profile Changes
        if (formData.weight !== initialFormData.weight) changes.push(`Peso: ${initialFormData.weight || '0'} -> ${formData.weight}`);
        if (formData.bodyFat !== initialFormData.bodyFat) changes.push(`BF%: ${initialFormData.bodyFat || '0'} -> ${formData.bodyFat}`);
        if (JSON.stringify(formData.measurements) !== JSON.stringify(initialFormData.measurements)) changes.push("Medidas corporais atualizadas.");
        if (formData.comorbidities !== initialFormData.comorbidities) changes.push("Histórico de doenças alterado.");
        if (formData.medications !== initialFormData.medications) changes.push("Medicamentos em uso alterados.");

        // Targets
        if (formData.targetWeight !== initialFormData.targetWeight) changes.push(`Meta de Peso: ${initialFormData.targetWeight || '?'} -> ${formData.targetWeight}`);
        if (formData.targetBodyFat !== initialFormData.targetBodyFat) changes.push(`Meta de BF%: ${initialFormData.targetBodyFat || '?'} -> ${formData.targetBodyFat}`);
        if (JSON.stringify(formData.targetMeasurements) !== JSON.stringify(initialFormData.targetMeasurements)) changes.push("Metas de medidas corporais atualizadas.");

        // Hormones
        if (hormones.testo !== initialHormones.testo) changes.push(`Testosterona Atualizada: ${hormones.testo}`);
        if (hormones.e2 !== initialHormones.e2) changes.push(`Estradiol Atualizado: ${hormones.e2}`);

        // Project Changes
        if (goal !== initialGoal) changes.push(`Novo Objetivo: ${goal}`);
        if (calories !== initialCalories) changes.push(`Meta Calórica: ${initialCalories || '?'} -> ${calories}`);
        if (trainingNotes !== initialTraining) changes.push("Rotina de treino atualizada.");
        if (JSON.stringify(protocol) !== JSON.stringify(initialProtocol)) changes.push("Protocolo farmacológico alterado.");

        return changes;
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user && project) {
                // 1. Save Profile (COM SOURCE='PROFILE_VIEW')
                await dataService.saveUserProfile(session.user.id, formData, 'PROFILE_VIEW');
                onSave(formData);

                // 2. Save Project Settings (COM SOURCE='PROFILE_VIEW')
                const cleanProtocol = protocol.filter(p => p.compound.trim() !== '');
                await dataService.updateProjectSettings(
                    project.id,
                    goal,
                    cleanProtocol,
                    trainingNotes,
                    calories,
                    'PROFILE_VIEW'
                );

                // 3. Save Hormones & Critical Stats (COM SOURCE='PROFILE_VIEW')
                const today = new Date().toLocaleDateString('pt-BR');
                const updatedMetrics = { ...project.metrics };

                const addMetricLocal = async (category: string, valueStr: string, unit: string) => {
                    const val = parseFloat(valueStr);
                    if (!isNaN(val)) {
                        const pt = { date: today, value: val, unit: unit, label: 'Manual Profile Input' };
                        await dataService.addMetric(project.id, category, pt, 'PROFILE_VIEW');
                        updatedMetrics[category] = [...(updatedMetrics[category] || []), pt];
                    }
                };

                if (hormones.testo && hormones.testo !== initialHormones.testo) {
                    await addMetricLocal('Testosterone', hormones.testo, 'ng/dL');
                }
                if (hormones.e2 && hormones.e2 !== initialHormones.e2) {
                    await addMetricLocal('Estradiol', hormones.e2, 'pg/mL');
                }
                if (formData.weight && formData.weight !== initialFormData.weight) {
                    await addMetricLocal('Weight', formData.weight, 'kg');
                }
                if (formData.bodyFat && formData.bodyFat !== initialFormData.bodyFat) {
                    await addMetricLocal('BodyFat', formData.bodyFat, '%');
                }

                if (onUpdateProject) {
                    onUpdateProject({
                        ...project,
                        userProfile: formData,
                        objective: goal as any,
                        currentProtocol: cleanProtocol,
                        trainingNotes,
                        dietCalories: calories,
                        metrics: updatedMetrics
                    });
                }

                setSuccessMsg('Perfil e Estratégia salvos!');
                
                const changes = detectChanges();
                if (changes.length > 0 && onRequestAnalysis) {
                    setTimeout(() => {
                        onRequestAnalysis(`O usuário ATUALIZOU DADOS CRÍTICOS MANUALMENTE AGORA (${today}):\n${changes.join('\n')}\n\nConsidere estes novos valores como a VERDADE ABSOLUTA e reavalie o cenário.`);
                    }, 200);
                }
                
                setInitialFormData(JSON.parse(JSON.stringify(formData)));
                setInitialGoal(goal);
                setInitialCalories(calories);
                setInitialTraining(trainingNotes);
                setInitialProtocol(cleanProtocol);
                setInitialHormones(hormones);

                setTimeout(() => setSuccessMsg(''), 3000);
            }
        } catch (error) {
            console.error("Error saving profile", error);
        } finally {
            setIsSaving(false);
        }
    };
    
    // --- ADMIN ACTIONS (SYSTEM) ---
    const handleHardRefresh = async () => {
        if ('serviceWorker' in navigator) {
            try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of registrations) {
                    await registration.unregister();
                }
            } catch (err) { console.warn(err); }
        }
        if ('caches' in window) {
            try {
                const keys = await caches.keys();
                await Promise.all(keys.map(key => caches.delete(key)));
            } catch (err) { console.warn(err); }
        }
        window.location.reload();
    };

    const handleAvatarClick = () => { avatarInputRef.current?.click(); };
    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingAvatar(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const signedUrl = await dataService.uploadAvatar(file, session.user.id);
                if (signedUrl) {
                    setFormData(prev => ({ ...prev, avatarUrl: signedUrl }));
                    onSave({ ...formData, avatarUrl: signedUrl });
                    setSuccessMsg('Foto atualizada!');
                    setTimeout(() => setSuccessMsg(''), 3000);
                }
            }
        } catch (err) { alert("Erro ao enviar foto."); } finally { setIsUploadingAvatar(false); }
    };
    const copyUserId = () => { navigator.clipboard.writeText(userId); alert("ID copiado: " + userId); };

    const inputClass = "mt-1 block w-full rounded-lg border-gray-300 p-3 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm border dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500";

    if (showEvolutionGallery && project) {
        return <EvolutionGallery project={project} onBack={() => setShowEvolutionGallery(false)} onUpdateProject={(p) => { if(onUpdateProject) onUpdateProject(p); }} />;
    }

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white">
             
             {/* Audit Modal */}
             <AuditLogModal isOpen={isAuditOpen} onClose={() => setIsAuditOpen(false)} />

             {/* === SEÇÃO 1: HEADER FIXO === */}
             <div className="shrink-0 z-30 bg-white border-b border-gray-200 shadow-sm sticky top-0 px-4 md:px-6 py-4 flex items-center justify-between dark:bg-gray-900 dark:border-gray-800">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2 dark:text-white">
                    <IconUser className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                    Ficha Biométrica
                </h2>
                <div className="flex gap-2">
                    {/* BOTÃO DA GALERIA DE EVOLUÇÃO (Ajustado para PWA) */}
                    <button 
                        onClick={() => setShowEvolutionGallery(true)}
                        className="px-3 md:px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-all active:scale-95 shadow-sm flex items-center gap-1.5 md:gap-2 text-xs md:text-sm"
                        title="Ver Galeria de Fotos"
                    >
                        <IconCamera className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        <span>Galeria</span> {/* Removido hidden para garantir que apareça no PWA */}
                    </button>

                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 md:px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50 shadow-lg dark:bg-blue-600 dark:hover:bg-blue-700 flex items-center gap-2 text-xs md:text-sm"
                    >
                        {isSaving ? <IconRefresh className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" /> : <IconCheck className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                        <span className="hidden md:inline">Salvar Tudo</span>
                        <span className="md:hidden">Salvar</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-10 max-w-4xl mx-auto w-full space-y-6 md:space-y-8 pb-32">
                
                {/* === SEÇÃO 2: RASTREADOR DE CUSTOS === */}
                <CostTracker variant="inline" refreshTrigger={billingTrigger} onOpenSubscription={onOpenSubscription} />

                {/* === SEÇÃO 3: BANNER DE EVOLUÇÃO (ATALHO PRINCIPAL) === */}
                <div 
                    onClick={() => setShowEvolutionGallery(true)}
                    role="button"
                    tabIndex={0}
                    className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center justify-between cursor-pointer hover:border-purple-300 hover:shadow-md transition-all group dark:bg-gray-900 dark:border-gray-800"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-purple-100 p-3 rounded-xl dark:bg-purple-900/30">
                            <IconCamera className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg leading-tight text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors">Galeria de Evolução</h3>
                            <p className="text-sm text-gray-500 font-medium mt-0.5 dark:text-gray-400">Analise seu físico, compare fotos e acompanhe o progresso visual.</p>
                        </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-full group-hover:bg-purple-50 transition-colors dark:bg-gray-800 dark:group-hover:bg-purple-900/30">
                         <span className="text-sm font-bold px-2 text-gray-400 group-hover:text-purple-600">Ver Galeria →</span>
                    </div>
                </div>

                {successMsg && (
                    <div className="bg-green-50 text-green-800 p-4 rounded-xl border border-green-200 flex items-center gap-3 animate-in slide-in-from-top-4 shadow-sm font-medium dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                        <IconCheck className="w-5 h-5" />
                        {successMsg}
                    </div>
                )}
                
                {/* === SEÇÃO 4: DADOS CADASTRAIS (AVATAR/NOME) === */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center justify-center dark:bg-gray-900 dark:border-gray-800">
                    <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                        <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center relative dark:bg-gray-800 dark:border-gray-700">
                            {formData.avatarUrl ? (
                                <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <IconUser className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                            )}
                            {isUploadingAvatar && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <div className="w-8 h-8 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                        <div className="absolute bottom-1 right-1 bg-blue-600 text-white p-2 rounded-full shadow-md border-2 border-white transform transition-transform group-hover:scale-110 dark:border-gray-800">
                             <IconPlus className="w-4 h-4" />
                        </div>
                    </div>
                    <input type="file" ref={avatarInputRef} className="hidden" accept="image/png, image/jpeg, image/jpg" onChange={handleAvatarChange} />
                    
                    <div className="mt-6 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                        <label className="block">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Nome</span>
                            <input type="text" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} className={inputClass} />
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                             <label className="block">
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Altura (cm)</span>
                                <input type="number" value={formData.height} onChange={(e) => handleChange('height', e.target.value)} className={inputClass} />
                            </label>
                             <label className="block">
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Gênero</span>
                                <select value={formData.gender} onChange={e => handleChange('gender', e.target.value as any)} className={inputClass}>
                                    <option value="Masculino">Masculino</option>
                                    <option value="Feminino">Feminino</option>
                                </select>
                            </label>
                        </div>
                        
                        {/* INPUT DE DATA MELHORADO (MASK) */}
                        <div className="md:col-span-2">
                            <label className="block">
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Data de Nascimento</span>
                                <div className="relative mt-1">
                                    <input 
                                        type="tel" // Melhor teclado numérico no mobile
                                        value={birthDateDisplay} 
                                        onChange={handleDateChange} 
                                        className={`${inputClass} mt-0 pl-10 tracking-widest font-mono`} 
                                        placeholder="DD/MM/AAAA"
                                        maxLength={10}
                                    />
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
                                        <IconCalendar className="w-5 h-5" />
                                    </div>
                                    {/* Fallback de Validade Visual */}
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {currentAge ? (
                                            <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full dark:bg-green-900/30 dark:text-green-400">
                                                {currentAge} anos
                                            </span>
                                        ) : birthDateDisplay.length === 10 ? (
                                            <span className="text-xs font-bold text-red-500">Data Inválida</span>
                                        ) : null}
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1 pl-1">Digite apenas os números. O formato será automático.</p>
                            </label>
                        </div>
                    </div>
                </div>

                {/* === SEÇÃO 5: METAS (PESO/BF) === */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2 flex items-center gap-2 dark:text-white dark:border-gray-800">
                        <IconActivity className="w-4 h-4 text-emerald-500" />
                        Metas & Evolução (Atual vs Pretendido)
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                        {/* Header Colunas */}
                        <div className="col-span-2 grid grid-cols-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                            <span>Atual</span>
                            <span>Meta (Alvo)</span>
                        </div>

                        {/* Linha Peso */}
                        <div className="contents">
                            <div className="relative">
                                <label className="text-[10px] font-bold text-gray-500 absolute -top-4 left-0">PESO (KG)</label>
                                <input 
                                    type="number" 
                                    value={formData.weight} 
                                    onChange={(e) => handleChange('weight', e.target.value)} 
                                    className={`${inputClass} border-l-4 border-l-blue-500`}
                                    placeholder="Atual"
                                />
                            </div>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    value={formData.targetWeight} 
                                    onChange={(e) => handleChange('targetWeight', e.target.value)} 
                                    className={`${inputClass} border-l-4 border-l-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10`}
                                    placeholder="Meta"
                                />
                            </div>
                        </div>

                        {/* Linha BF */}
                        <div className="contents">
                            <div className="relative mt-4">
                                <label className="text-[10px] font-bold text-gray-500 absolute -top-4 left-0">GORDURA (BF%)</label>
                                <input 
                                    type="number" 
                                    value={formData.bodyFat} 
                                    onChange={(e) => handleChange('bodyFat', e.target.value)} 
                                    className={`${inputClass} border-l-4 border-l-blue-500`}
                                    placeholder="Atual"
                                />
                            </div>
                            <div className="relative mt-4">
                                <input 
                                    type="number" 
                                    value={formData.targetBodyFat} 
                                    onChange={(e) => handleChange('targetBodyFat', e.target.value)} 
                                    className={`${inputClass} border-l-4 border-l-emerald-500 bg-emerald-50/20 dark:bg-emerald-900/10`} 
                                    placeholder="12" 
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* === SEÇÃO 6: ANTROPOMETRIA === */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-2 dark:border-gray-800">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2 dark:text-white">
                            <IconFlame className="w-4 h-4 text-orange-500" />
                            Antropometria
                        </h3>
                        <BodyGuide part={activeMeasurement} gender={formData.gender} className="w-10 h-16" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        {['chest', 'arm', 'waist', 'hips', 'thigh', 'calf'].map((part) => (
                            <div key={part} className="space-y-1" onMouseEnter={() => setActiveMeasurement(part)}>
                                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                                    <span className="flex items-center gap-1">
                                        {LABELS_PT[part]}
                                        <Tooltip content={MEASUREMENT_HINTS[part]} position="top">
                                            <IconInfo className="w-3 h-3 text-gray-300 hover:text-blue-500" />
                                        </Tooltip>
                                    </span>
                                    <span>Meta</span>
                                </div>
                                <div className="flex gap-2">
                                    <input 
                                        type="number"
                                        value={formData.measurements?.[part as any] || ''}
                                        onChange={(e) => handleMeasurementChange('current', part as any, e.target.value)}
                                        className="w-full rounded-md border-gray-300 p-2 text-sm bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                        placeholder="Atual"
                                        onFocus={() => setActiveMeasurement(part)}
                                    />
                                    <input 
                                        type="number"
                                        value={formData.targetMeasurements?.[part as any] || ''}
                                        onChange={(e) => handleMeasurementChange('target', part as any, e.target.value)}
                                        className="w-20 rounded-md border-gray-300 p-2 text-sm bg-emerald-50/50 focus:ring-emerald-500 border-dashed text-center dark:bg-emerald-900/10 dark:border-gray-700 dark:text-white"
                                        placeholder="Meta"
                                        onFocus={() => setActiveMeasurement(part)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* === SEÇÃO 7: PAINEL HORMONAL === */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2 flex items-center gap-2 dark:text-white dark:border-gray-800">
                        <IconScience className="w-4 h-4 text-purple-500" />
                        Painel Hormonal & Saúde
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <label className="block">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block dark:text-gray-400">Testosterona Total</span>
                            <div className="relative">
                                <input type="number" value={hormones.testo} onChange={e => setHormones({...hormones, testo: e.target.value})} className={`${inputClass} pr-12`} placeholder="Ex: 500" />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 dark:text-gray-500">ng/dL</span>
                            </div>
                        </label>
                        <label className="block">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block dark:text-gray-400">Estradiol (E2)</span>
                            <div className="relative">
                                <input type="number" value={hormones.e2} onChange={e => setHormones({...hormones, e2: e.target.value})} className={`${inputClass} pr-12`} placeholder="Ex: 30" />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 dark:text-gray-500">pg/mL</span>
                            </div>
                        </label>
                    </div>

                    <div className="space-y-4">
                        <label className="block">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block dark:text-gray-400">Comorbidades / Doenças</span>
                            <textarea value={formData.comorbidities} onChange={e => handleChange('comorbidities', e.target.value)} className={`${inputClass} h-20`} placeholder="Ex: Hipertensão, Diabetes..." />
                        </label>
                        <label className="block">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block dark:text-gray-400">Medicamentos de Uso Contínuo</span>
                            <textarea value={formData.medications} onChange={e => handleChange('medications', e.target.value)} className={`${inputClass} h-20`} placeholder="Ex: Losartana 50mg..." />
                        </label>
                    </div>
                </div>

                {/* === SEÇÃO 8: ESTRATÉGIA === */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2 flex items-center gap-2 dark:text-white dark:border-gray-800">
                        <IconDumbbell className="w-4 h-4 text-blue-600" />
                        Estratégia Vigente
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <label className="block">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block dark:text-gray-400">Objetivo Principal</span>
                            <select value={goal} onChange={e => setGoal(e.target.value as any)} className={inputClass}>
                                <option value="Bulking">Bulking (Ganho de Massa)</option>
                                <option value="Cutting">Cutting (Perda de Gordura)</option>
                                <option value="Performance">Performance Esportiva</option>
                                <option value="Longevity">Longevidade / Saúde</option>
                            </select>
                        </label>
                        <label className="block">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block dark:text-gray-400">Meta Calórica (Média)</span>
                            <div className="relative">
                                <input type="number" value={calories} onChange={e => setCalories(e.target.value)} className={`${inputClass} pr-12`} placeholder="2500" />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 dark:text-gray-500">kcal</span>
                            </div>
                        </label>
                    </div>

                    <label className="block mb-6">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block dark:text-gray-400">Resumo do Treino</span>
                        <textarea value={trainingNotes} onChange={e => setTrainingNotes(e.target.value)} className={`${inputClass} h-32`} placeholder="Ex: ABCDE, foco em ombros..." />
                    </label>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400">Protocolo Farmacológico</span>
                            <button onClick={handleAddProtocolItem} className="text-xs text-blue-600 font-bold flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded transition-colors dark:text-blue-400 dark:hover:bg-blue-900/30">
                                <IconPlus className="w-3 h-3" /> Adicionar
                            </button>
                        </div>
                        {protocol.map((item, idx) => (
                            <div key={idx} className="flex gap-2 items-start bg-gray-50 p-2 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                                <div className="flex-1 space-y-2">
                                    <input 
                                        type="text" 
                                        placeholder="Composto" 
                                        value={item.compound} 
                                        onChange={(e) => handleUpdateProtocol(idx, 'compound', e.target.value)} 
                                        className="w-full text-xs border-gray-300 rounded p-1.5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                    <div className="flex gap-2">
                                        <input type="text" placeholder="Dose" value={item.dosage} onChange={(e) => handleUpdateProtocol(idx, 'dosage', e.target.value)} className="w-1/2 text-xs border-gray-300 rounded p-1.5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                                        <input type="text" placeholder="Freq" value={item.frequency} onChange={(e) => handleUpdateProtocol(idx, 'frequency', e.target.value)} className="w-1/2 text-xs border-gray-300 rounded p-1.5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                                    </div>
                                </div>
                                <button onClick={() => handleRemoveProtocol(idx)} className="text-gray-400 hover:text-red-500 p-1 dark:hover:text-red-400"><IconClose className="w-4 h-4" /></button>
                            </div>
                        ))}
                        {protocol.length === 0 && <p className="text-xs text-gray-400 text-center py-2">Nenhum item adicionado.</p>}
                    </div>
                </div>

                {/* === SEÇÃO 9: SISTEMA & CONTROLE DE VERSÃO (RESTAURADO E COMPLETO) === */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2 dark:text-white">
                        <IconInfo className="w-4 h-4 text-gray-400" />
                        Sistema e Controle de Versão
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Versão Atual</span>
                            <span className="font-mono font-bold text-gray-900 dark:text-white">{CODE_VERSION}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 dark:text-gray-400">ID do Usuário</span>
                            <button onClick={copyUserId} className="font-mono text-xs text-blue-600 hover:underline truncate max-w-[150px] dark:text-blue-400">{userId}</button>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Tema</span>
                            <div className="flex bg-gray-100 rounded-lg p-1 dark:bg-gray-800">
                                <button onClick={() => handleChange('theme', 'light')} className={`p-1.5 rounded ${formData.theme === 'light' ? 'bg-white shadow text-yellow-600 dark:bg-gray-700 dark:text-yellow-400' : 'text-gray-400'}`}><IconSun className="w-4 h-4" /></button>
                                <button onClick={() => handleChange('theme', 'dark')} className={`p-1.5 rounded ${formData.theme === 'dark' ? 'bg-white shadow text-purple-600 dark:bg-gray-700 dark:text-purple-400' : 'text-gray-400'}`}><IconMoon className="w-4 h-4" /></button>
                            </div>
                        </div>
                        
                        {/* LISTA DE HISTÓRICO DE VERSÕES (CHANGELOG) */}
                        <div className="mt-6 border-t border-gray-100 pt-4 dark:border-gray-800">
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 dark:text-gray-400">Histórico de Atualizações</h4>
                            <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                                {versionHistory.map((v) => (
                                    <div key={v.id} className="text-xs border-b border-gray-50 pb-2 last:border-0 dark:border-gray-800">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-gray-900 dark:text-white">{v.version}</span>
                                            <span className="text-[10px] text-gray-400">{new Date(v.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-[11px]">{v.description}</p>
                                    </div>
                                ))}
                                {versionHistory.length === 0 && <p className="text-xs text-gray-400 italic">Nenhum histórico disponível.</p>}
                            </div>
                        </div>

                        {/* Botões de Ação do Sistema */}
                        <div className="pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-3 dark:border-gray-800">
                            <button onClick={() => setIsAuditOpen(true)} className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                                <IconList className="w-3.5 h-3.5" /> Ver Logs de Auditoria
                            </button>
                            
                            <button 
                                onClick={handleHardRefresh} 
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/30"
                            >
                                <IconRefresh className="w-3.5 h-3.5" /> Atualizar App / Limpar Cache
                            </button>
                        </div>
                    </div>
                </div>

                {onLogout && (
                    <button onClick={onLogout} className="w-full py-3 text-red-500 font-bold text-sm hover:bg-red-50 rounded-xl transition-colors dark:hover:bg-red-900/20">
                        Sair da Conta
                    </button>
                )}

            </div>
        </div>
    );
};

export default ProfileView;
