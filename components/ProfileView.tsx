
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, AppVersion, Project, ProtocolItem } from '../types';
import { dataService } from '../services/dataService';
import { supabase } from '../lib/supabase';
import CostTracker from './CostTracker';
import { Tooltip } from './Tooltip';
import { 
    IconUser, IconPlus, IconSun, IconMoon, IconFlame, 
    IconActivity, IconAlert, IconShield, IconRefresh, 
    IconWizard, IconCheck, IconInfo, IconCopy, IconClock,
    IconPill, IconDumbbell, IconList, IconClose, IconScience,
    IconFile
} from './Icons';

interface ProfileViewProps {
    project?: Project; // Agora recebe o projeto completo para acessar protocolos/metas
    profile?: UserProfile; // Mantido para compatibilidade, mas idealmente usaria project.userProfile
    onSave: (profile: UserProfile) => void;
    onUpdateProject?: (project: Project) => void; // Callback para atualizar o projeto pai
    onOpenWizard?: () => void;
    billingTrigger: number;
    onOpenSubscription: () => void;
    onLogout?: () => void;
    onRequestAnalysis?: (context: string) => void;
}

const CODE_VERSION = "v1.6.17";

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
    
    const [newPassword, setNewPassword] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [userId, setUserId] = useState<string>('');
    const [versionHistory, setVersionHistory] = useState<AppVersion[]>([]);
    
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const birthDateInputRef = useRef<HTMLInputElement>(null);

    // Default Profile Structure
    const defaultProfile: UserProfile = {
        name: '',
        birthDate: '', 
        gender: 'Masculino',
        height: '',
        weight: '',
        bodyFat: '',
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
                calculatedStats: defaultProfile.calculatedStats,
                theme: p.theme || 'light'
            };
            setFormData(newProfile);
            setInitialFormData(JSON.parse(JSON.stringify(newProfile)));

            setGoal(project.objective);
            setInitialGoal(project.objective);

            setCalories(project.dietCalories || '');
            setInitialCalories(project.dietCalories || '');

            setTrainingNotes(project.trainingNotes || '');
            setInitialTraining(project.trainingNotes || '');

            setProtocol(project.currentProtocol || []);
            setInitialProtocol(project.currentProtocol || []);
        }
    }, [project]);

    // Metabolic Logic (IMC/RCQ/TMB) - Same as previous version
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

    const handleMeasurementChange = (field: keyof UserProfile['measurements'], value: string) => {
        setFormData(prev => ({
            ...prev,
            measurements: { ...prev.measurements, [field]: value }
        }));
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
                // 1. Save Profile
                await dataService.saveUserProfile(session.user.id, formData);
                onSave(formData);

                // 2. Save Project Settings (Protocol, Goal, Diet, Training)
                const cleanProtocol = protocol.filter(p => p.compound.trim() !== '');
                await dataService.updateProjectSettings(
                    project.id,
                    goal,
                    cleanProtocol,
                    trainingNotes,
                    calories
                );

                // 3. Update Parent State
                if (onUpdateProject) {
                    onUpdateProject({
                        ...project,
                        userProfile: formData,
                        objective: goal as any,
                        currentProtocol: cleanProtocol,
                        trainingNotes,
                        dietCalories: calories
                    });
                }

                setSuccessMsg('Perfil e Estratégia salvos!');
                
                // 4. Trigger Analysis if needed
                const changes = detectChanges();
                if (changes.length > 0 && onRequestAnalysis) {
                    onRequestAnalysis(`O usuário atualizou dados críticos do perfil e planejamento:\n${changes.join('\n')}\n\nAnalise o impacto dessas mudanças no plano geral.`);
                }
                
                // Update Baselines
                setInitialFormData(JSON.parse(JSON.stringify(formData)));
                setInitialGoal(goal);
                setInitialCalories(calories);
                setInitialTraining(trainingNotes);
                setInitialProtocol(cleanProtocol);

                setTimeout(() => setSuccessMsg(''), 3000);
            }
        } catch (error) {
            console.error("Error saving profile", error);
        } finally {
            setIsSaving(false);
        }
    };
    
    // --- ADMIN ACTIONS ---
    const handleHardRefresh = async () => {
        if ('serviceWorker' in navigator) {
            try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of registrations) {
                    await registration.unregister();
                }
            } catch (err) {
                console.warn(err);
            }
        }
        if ('caches' in window) {
            try {
                const keys = await caches.keys();
                await Promise.all(keys.map(key => caches.delete(key)));
            } catch (err) {
                console.warn(err);
            }
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

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white">
             {/* Header */}
             <div className="shrink-0 z-30 bg-white border-b border-gray-200 shadow-sm sticky top-0 px-6 py-4 flex items-center justify-between dark:bg-gray-900 dark:border-gray-800">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 dark:text-white">
                    <IconUser className="w-6 h-6 text-blue-600" />
                    Ficha Biométrica
                </h2>
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50 shadow-lg dark:bg-blue-600 dark:hover:bg-blue-700 flex items-center gap-2"
                >
                    {isSaving ? <IconRefresh className="w-4 h-4 animate-spin" /> : <IconCheck className="w-4 h-4" />}
                    Salvar Tudo
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-4xl mx-auto w-full space-y-8 pb-32">
                
                <CostTracker variant="inline" refreshTrigger={billingTrigger} onOpenSubscription={onOpenSubscription} />

                {/* WIZARD BANNER */}
                <div 
                    onClick={onOpenWizard}
                    role="button"
                    tabIndex={0}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white shadow-xl shadow-blue-500/20 flex items-center justify-between cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                            <IconWizard className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg leading-tight">Modo Assistente</h3>
                            <p className="text-sm text-blue-100 font-medium mt-0.5">Preenchimento guiado passo-a-passo</p>
                        </div>
                    </div>
                    <div className="bg-white/10 p-2 rounded-full group-hover:bg-white/20 transition-colors">
                         <span className="text-sm font-bold px-2">Iniciar →</span>
                    </div>
                </div>

                {successMsg && (
                    <div className="bg-green-50 text-green-800 p-4 rounded-xl border border-green-200 flex items-center gap-3 animate-in slide-in-from-top-4 shadow-sm font-medium dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                        <IconCheck className="w-5 h-5" />
                        {successMsg}
                    </div>
                )}
                
                {/* 1. PERFIL BIOMÉTRICO (AVATAR + STATS) */}
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
                        <div className="grid grid-cols-3 gap-3">
                             <label className="block">
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Altura (cm)</span>
                                <input type="number" value={formData.height} onChange={(e) => handleChange('height', e.target.value)} className={inputClass} />
                            </label>
                             <label className="block">
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Peso (kg)</span>
                                <input type="number" value={formData.weight} onChange={(e) => handleChange('weight', e.target.value)} className={inputClass} />
                            </label>
                             <label className="block">
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">BF %</span>
                                <input type="number" value={formData.bodyFat} onChange={(e) => handleChange('bodyFat', e.target.value)} className={inputClass} />
                            </label>
                        </div>
                    </div>
                </div>

                {/* 2. PLANEJAMENTO ESTRATÉGICO (NOVA SEÇÃO) */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
                    <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest mb-6 border-b border-blue-100 pb-2 flex items-center gap-2 dark:text-blue-400 dark:border-blue-900/30">
                        <IconActivity className="w-4 h-4" />
                        Planejamento Estratégico
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <label className="block">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Objetivo Atual</span>
                            <select value={goal} onChange={(e) => setGoal(e.target.value as any)} className={inputClass}>
                                <option value="Bulking">Bulking (Ganho de Massa)</option>
                                <option value="Cutting">Cutting (Perda de Gordura)</option>
                                <option value="Performance">Performance Esportiva</option>
                                <option value="Longevity">Longevidade / Manutenção</option>
                            </select>
                        </label>
                        
                        <label className="block">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Meta Calórica (Dieta)</span>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    value={calories} 
                                    onChange={(e) => setCalories(e.target.value)} 
                                    className={`${inputClass} pr-12`} 
                                    placeholder="Ex: 2500"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 dark:text-gray-500">kcal</span>
                            </div>
                        </label>
                    </div>

                    <label className="block">
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">Resumo do Treino / Rotina</span>
                        <textarea 
                            value={trainingNotes}
                            onChange={(e) => setTrainingNotes(e.target.value)}
                            placeholder="Ex: ABCDE com foco em ombros. Cardio 30min TSD."
                            className={`${inputClass} h-24 resize-none`}
                        />
                    </label>
                </div>

                {/* 3. PROTOCOLO FARMACOLÓGICO (NOVA SEÇÃO) */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-2 dark:border-gray-800">
                        <h3 className="text-sm font-black text-purple-600 uppercase tracking-widest flex items-center gap-2 dark:text-purple-400">
                            <IconPill className="w-4 h-4" />
                            Protocolo Farmacológico
                        </h3>
                        <button 
                            onClick={handleAddProtocolItem}
                            className="text-xs flex items-center gap-1 font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors dark:bg-purple-900/20 dark:text-purple-300 dark:hover:bg-purple-900/40"
                        >
                            <IconPlus className="w-3 h-3" /> Adicionar
                        </button>
                    </div>

                    <div className="space-y-3">
                        {protocol.length === 0 && (
                            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                                <IconScience className="w-8 h-8 mx-auto text-gray-300 mb-2 dark:text-gray-600" />
                                <p className="text-xs text-gray-400 dark:text-gray-500">Nenhum ergogênico ou suplemento registrado.</p>
                            </div>
                        )}
                        
                        {protocol.map((item, idx) => (
                            <div key={idx} className="flex gap-2 items-start bg-gray-50 p-3 rounded-xl border border-gray-100 dark:bg-gray-800 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="Composto (Ex: Dura)"
                                        value={item.compound}
                                        onChange={(e) => handleUpdateProtocol(idx, 'compound', e.target.value)}
                                        className="w-full text-sm border-gray-300 rounded p-2 bg-white text-gray-900 placeholder-gray-400 focus:ring-1 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-500"
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="Dose (Ex: 250mg)"
                                        value={item.dosage}
                                        onChange={(e) => handleUpdateProtocol(idx, 'dosage', e.target.value)}
                                        className="w-full text-sm border-gray-300 rounded p-2 bg-white text-gray-900 placeholder-gray-400 focus:ring-1 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-500"
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="Freq (Ex: 1x/sem)"
                                        value={item.frequency}
                                        onChange={(e) => handleUpdateProtocol(idx, 'frequency', e.target.value)}
                                        className="w-full text-sm border-gray-300 rounded p-2 bg-white text-gray-900 placeholder-gray-400 focus:ring-1 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-500"
                                    />
                                </div>
                                <button 
                                    onClick={() => handleRemoveProtocol(idx)} 
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-900/20 dark:hover:text-red-400"
                                >
                                    <IconClose className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. ANTROPOMETRIA E MEDICAMENTOS (LEGACY) */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 dark:text-gray-500">Medidas (cm)</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {['chest', 'arm', 'waist', 'hips', 'thigh', 'calf'].map((part) => (
                                <label key={part} className="block">
                                    <span className="text-xs font-bold text-gray-500 capitalize dark:text-gray-400">{part}</span>
                                    <input 
                                        type="number" 
                                        value={formData.measurements[part as keyof typeof formData.measurements]} 
                                        onChange={(e) => handleMeasurementChange(part as any, e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 p-2 text-sm bg-gray-50 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                    />
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 border-l-4 border-l-red-500 dark:bg-gray-900 dark:border-gray-800 dark:border-l-red-600">
                        <h3 className="text-sm font-black text-red-600 uppercase tracking-widest mb-4 flex items-center gap-2 dark:text-red-400">
                            <IconAlert className="w-4 h-4" /> Saúde
                        </h3>
                        <div className="space-y-4">
                            <label className="block">
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Comorbidades</span>
                                <textarea 
                                    value={formData.comorbidities}
                                    onChange={(e) => handleChange('comorbidities', e.target.value)}
                                    className="mt-1 w-full rounded-md border-gray-300 p-2 text-sm h-16 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                />
                            </label>
                            <label className="block">
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Medicamentos (Saúde)</span>
                                <textarea 
                                    value={formData.medications}
                                    onChange={(e) => handleChange('medications', e.target.value)}
                                    className="mt-1 w-full rounded-md border-gray-300 p-2 text-sm h-16 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                />
                            </label>
                        </div>
                    </div>
                </div>

                 {/* 5. ADMINISTRAÇÃO & VERSÃO */}
                 <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2 flex items-center gap-2 dark:text-white dark:border-gray-800">
                        <IconShield className="w-4 h-4" />
                        Sistema & Controle de Versão
                    </h3>
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-4">
                            <button onClick={() => handleChange('theme', 'light')} className={`flex-1 p-3 rounded-xl border text-xs font-bold transition-all ${formData.theme !== 'dark' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700'}`}><IconSun className="w-4 h-4 inline mr-2"/>Claro</button>
                            <button onClick={() => handleChange('theme', 'dark')} className={`flex-1 p-3 rounded-xl border text-xs font-bold transition-all ${formData.theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700'}`}><IconMoon className="w-4 h-4 inline mr-2"/>Escuro</button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button onClick={handleHardRefresh} className="flex-1 p-3 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors border border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-900/30 flex items-center justify-center gap-2">
                                <IconRefresh className="w-4 h-4" /> Atualizar App / Limpar Cache
                            </button>
                            {onLogout && (
                                <button onClick={onLogout} className="flex-1 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30">
                                    Sair da Conta
                                </button>
                            )}
                        </div>

                        {/* CARD DE VERSÕES */}
                        {versionHistory.length > 0 && (
                            <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest dark:text-gray-400">Histórico de Atualizações</h4>
                                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold dark:bg-green-900/30 dark:text-green-400">
                                        Atual: {CODE_VERSION}
                                    </span>
                                </div>
                                <div className="space-y-3 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                                    {versionHistory.map((v) => (
                                        <div key={v.id} className="text-xs border-l-2 border-gray-300 pl-3 dark:border-gray-600">
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-gray-900 dark:text-white">v{v.version}</span>
                                                <span className="text-[10px] text-gray-400">{new Date(v.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-gray-600 mt-0.5 dark:text-gray-400">{v.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div className="text-center mt-2">
                            <div onClick={copyUserId} className="inline-block cursor-pointer hover:bg-gray-100 px-2 py-1 rounded text-[10px] text-gray-400 dark:hover:bg-gray-800" title="Clique para copiar ID">
                                ID: {userId}
                            </div>
                        </div>
                    </div>
                 </div>

            </div>
        </div>
    );
};

export default ProfileView;
