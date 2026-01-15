
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, AppVersion } from '../types';
import { dataService } from '../services/dataService';
import { supabase } from '../lib/supabase';
import CostTracker from './CostTracker';
import { Tooltip } from './Tooltip';
import { 
    IconUser, IconPlus, IconSun, IconMoon, IconFlame, 
    IconActivity, IconAlert, IconShield, IconRefresh, 
    IconWizard, IconCheck, IconInfo, IconCopy, IconClock
} from './Icons';

interface ProfileViewProps {
    profile?: UserProfile;
    onSave: (profile: UserProfile) => void;
    onOpenWizard?: () => void;
    // Props para o CostTracker
    billingTrigger: number;
    onOpenSubscription: () => void;
    onLogout?: () => void;
}

// VERSÃO DO CÓDIGO LOCAL (Fallback)
const CODE_VERSION = "v1.5.7";

// --- COMPONENTE VISUAL DE CORPO (SVG) ---
const BodyGuide = ({ part, gender }: { part: string; gender: string }) => {
    const isMale = gender === 'Masculino';
    
    // Silhuetas simplificadas (SVG Paths)
    const silhouette = isMale 
        ? "M35,10 C35,5 45,5 45,10 L48,15 L65,18 L62,40 L55,80 L58,140 L50,140 L48,85 L40,85 L38,140 L30,140 L33,80 L26,40 L23,18 L40,15 Z" // Croqui Masculino
        : "M38,10 C38,5 46,5 46,10 L48,15 L60,20 L58,40 L65,55 L60,85 L62,140 L52,140 L50,90 L38,90 L36,140 L26,140 L28,85 L23,55 L30,40 L28,20 L40,15 Z"; // Croqui Feminino

    // Coordenadas das linhas de medição
    const guides: Record<string, React.ReactNode> = {
        chest: <line x1="28" y1="32" x2="60" y2="32" stroke="#ef4444" strokeWidth="3" strokeDasharray="3 1" />,
        arm: <line x1="18" y1="35" x2="28" y2="35" stroke="#ef4444" strokeWidth="3" strokeDasharray="3 1" />,
        waist: <line x1="30" y1={isMale ? "60" : "50"} x2={isMale ? "58" : "58"} y2={isMale ? "60" : "50"} stroke="#ef4444" strokeWidth="3" strokeDasharray="3 1" />,
        hips: <line x1="25" y1={isMale ? "75" : "70"} x2={isMale ? "63" : "63"} y2={isMale ? "75" : "70"} stroke="#ef4444" strokeWidth="3" strokeDasharray="3 1" />,
        thigh: <line x1="50" y1="100" x2="62" y2="100" stroke="#ef4444" strokeWidth="3" strokeDasharray="3 1" />,
        calf: <line x1="52" y1="125" x2="60" y2="125" stroke="#ef4444" strokeWidth="3" strokeDasharray="3 1" />
    };

    return (
        <svg width="60" height="100" viewBox="0 0 90 150" className="opacity-90">
            <path d={silhouette} fill="#374151" stroke="none" opacity="0.3" />
            {guides[part]}
        </svg>
    );
};

const MEASUREMENT_HINTS: Record<string, string> = {
    chest: 'Linha dos mamilos',
    arm: 'Bíceps contraído',
    waist: 'Altura do umbigo',
    hips: 'Maior circunferência',
    thigh: 'Meio da coxa',
    calf: 'Maior circunferência'
};

const ProfileView: React.FC<ProfileViewProps> = ({ profile, onSave, onOpenWizard, billingTrigger, onOpenSubscription, onLogout }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    
    const [newPassword, setNewPassword] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [userId, setUserId] = useState<string>('');
    const [versionHistory, setVersionHistory] = useState<AppVersion[]>([]);
    
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const birthDateInputRef = useRef<HTMLInputElement>(null);

    // Default structure
    const defaultProfile: UserProfile = {
        name: '',
        birthDate: '', 
        gender: 'Masculino',
        height: '',
        weight: '',
        bodyFat: '',
        comorbidities: '',
        medications: '',
        measurements: {
            chest: '',
            arm: '',
            waist: '',
            hips: '',
            thigh: '',
            calf: ''
        },
        calculatedStats: {
            bmi: '',
            bmr: '',
            whr: '',
            bmiClassification: '',
            whrRisk: ''
        },
        theme: 'light'
    };

    const [formData, setFormData] = useState<UserProfile>(profile || defaultProfile);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) setUserId(session.user.id);
        });
        
        // Fetch Version History from DB
        dataService.getAppVersionHistory().then(history => {
            setVersionHistory(history);
        });
    }, []);

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

    // Metabolic Engine Calculations
    useEffect(() => {
        const heightM = parseFloat(formData.height) / 100;
        const weightKg = parseFloat(formData.weight);
        const waistCm = parseFloat(formData.measurements.waist);
        const hipCm = parseFloat(formData.measurements.hips);
        const age = currentAge || 30;
        
        let newStats = {
            bmi: '',
            bmr: '',
            whr: '',
            bmiClassification: '',
            whrRisk: ''
        };

        if (heightM > 0 && weightKg > 0) {
            const bmi = weightKg / (heightM * heightM);
            newStats.bmi = bmi.toFixed(1);
            if (bmi < 18.5) newStats.bmiClassification = 'Abaixo do Peso';
            else if (bmi < 24.9) newStats.bmiClassification = 'Eutrófico (Normal)';
            else if (bmi < 29.9) newStats.bmiClassification = 'Sobrepeso';
            else newStats.bmiClassification = 'Obesidade';
        }

        if (weightKg > 0 && heightM > 0) {
            let bmr = (10 * weightKg) + (6.25 * (heightM * 100)) - (5 * age);
            if (formData.gender === 'Masculino') bmr += 5;
            else bmr -= 161;
            newStats.bmr = Math.round(bmr).toString();
        }

        if (waistCm > 0 && hipCm > 0) {
            const whr = waistCm / hipCm;
            newStats.whr = whr.toFixed(2);
            if (formData.gender === 'Masculino') {
                newStats.whrRisk = whr > 0.90 ? 'Alto Risco Cardíaco' : 'Risco Baixo';
            } else {
                newStats.whrRisk = whr > 0.85 ? 'Alto Risco Cardíaco' : 'Risco Baixo';
            }
        }

        if (JSON.stringify(newStats) !== JSON.stringify(formData.calculatedStats)) {
            setFormData(prev => ({ ...prev, calculatedStats: newStats }));
        }

    }, [formData.height, formData.weight, formData.measurements.waist, formData.measurements.hips, formData.gender, currentAge]);

    useEffect(() => {
        if (profile) {
            setFormData(prev => ({
                ...defaultProfile, 
                ...profile,        
                measurements: {    
                    ...defaultProfile.measurements,
                    ...(profile.measurements || {})
                },
                calculatedStats: prev.calculatedStats,
                theme: profile.theme || 'light'
            }));
        }
    }, [profile]);

    const handleChange = (field: keyof UserProfile, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        
        // FIX CRÍTICO: Aplica o tema imediatamente no DOM
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

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await dataService.saveUserProfile(session.user.id, formData);
                onSave(formData);
                setSuccessMsg('Perfil atualizado com sucesso! A IA agora usará estes dados.');
                setTimeout(() => setSuccessMsg(''), 3000);
            }
        } catch (error) {
            console.error("Error saving profile", error);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleUpdatePassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            alert("A senha deve ter pelo menos 6 caracteres.");
            return;
        }

        setIsUpdatingPassword(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            setSuccessMsg('Senha alterada com sucesso!');
            setNewPassword('');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error: any) {
            alert(error.message || "Erro ao atualizar senha.");
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    // --- HARD REFRESH LOGIC (PWA FIX) ---
    const handleHardRefresh = async () => {
        if (!confirm("Isso irá limpar o cache local e forçar o download da versão mais recente do app. Continuar?")) return;

        try {
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for(const registration of registrations) {
                    await registration.unregister();
                }
            }
        } catch (e) {
            console.warn("SW Cleanup error", e);
        }

        try {
            if ('caches' in window) {
                const names = await caches.keys();
                await Promise.all(names.map(name => caches.delete(name)));
            }
        } catch (e) {
            console.warn("Cache Cleanup error", e);
        }

        window.location.reload();
    };
    
    const handleAvatarClick = () => {
        avatarInputRef.current?.click();
    };

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
                    setSuccessMsg('Foto de perfil atualizada!');
                    setTimeout(() => setSuccessMsg(''), 3000);
                }
            }
        } catch (err) {
            console.error(err);
            alert("Erro ao enviar foto.");
        } finally {
            setIsUploadingAvatar(false);
            if (e.target) e.target.value = ''; 
        }
    };

    const handleOpenDatePicker = () => {
        if (birthDateInputRef.current) {
            if (typeof birthDateInputRef.current.showPicker === 'function') {
                birthDateInputRef.current.showPicker();
            } else {
                birthDateInputRef.current.focus();
            }
        }
    };

    const handleOpenWizardSafe = () => {
        if (onOpenWizard) {
            onOpenWizard();
        }
    };

    const copyUserId = () => {
        navigator.clipboard.writeText(userId);
        alert("ID copiado: " + userId);
    };

    const inputClass = "mt-1 block w-full rounded-lg border-gray-300 p-3 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm border dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500";

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white">
             {/* Header */}
             <div className="shrink-0 z-30 bg-white border-b border-gray-200 shadow-sm sticky top-0 px-6 py-4 flex items-center justify-between dark:bg-gray-900 dark:border-gray-800">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 dark:text-white">
                    <IconUser className="w-6 h-6 text-blue-600" />
                    Ficha Biométrico
                </h2>
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50 shadow-lg dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                    {isSaving ? 'Salvando...' : 'Salvar Perfil'}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-4xl mx-auto w-full space-y-8 pb-32">
                
                {/* 1. COST TRACKER */}
                <CostTracker 
                    variant="inline"
                    refreshTrigger={billingTrigger}
                    onOpenSubscription={onOpenSubscription}
                />

                {/* 2. WIZARD BANNER */}
                <div 
                    onClick={handleOpenWizardSafe}
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
                
                {/* 3. AVATAR & NAME */}
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
                            
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <IconPlus className="w-8 h-8 text-white drop-shadow-md" />
                            </div>
                        </div>

                        <div className="absolute bottom-1 right-1 bg-blue-600 text-white p-2 rounded-full shadow-md border-2 border-white transform transition-transform group-hover:scale-110 dark:border-gray-800">
                             <IconPlus className="w-4 h-4" />
                        </div>
                    </div>
                    
                    <div className="text-center mt-4">
                        <h3 className="font-bold text-gray-900 dark:text-white">{formData.name || 'Atleta'}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Toque na imagem para alterar</p>
                    </div>

                    <input type="file" ref={avatarInputRef} className="hidden" accept="image/png, image/jpeg, image/jpg" onChange={handleAvatarChange} />
                </div>

                {/* 4. THEME */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2 dark:border-gray-800 dark:text-gray-500">Aparência</h3>
                    <div className="flex gap-4">
                        <button onClick={() => handleChange('theme', 'light')} className={`flex-1 p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all ${formData.theme !== 'dark' ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400'}`}>
                            <IconSun className="w-5 h-5" /> <span className="font-bold text-sm">Claro</span>
                        </button>
                        <button onClick={() => handleChange('theme', 'dark')} className={`flex-1 p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all ${formData.theme === 'dark' ? 'border-blue-600 bg-gray-800 text-white' : 'border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400'}`}>
                            <IconMoon className="w-5 h-5" /> <span className="font-bold text-sm">Escuro</span>
                        </button>
                    </div>
                </div>

                {/* 5. METABOLIC STATS */}
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 md:p-8 rounded-2xl shadow-sm border border-indigo-100 relative overflow-hidden dark:from-gray-900 dark:to-gray-900 dark:border-indigo-900/30">
                    <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10 dark:text-indigo-300">
                        <IconFlame className="w-4 h-4 text-orange-500" /> Índices Metabólicos
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-indigo-100 shadow-sm dark:bg-gray-800/80 dark:border-gray-700">
                            <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">TMB (Basal)</p>
                            <span className="text-2xl font-black text-gray-900 dark:text-white">{formData.calculatedStats?.bmr || '--'} kcal</span>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-indigo-100 shadow-sm dark:bg-gray-800/80 dark:border-gray-700">
                            <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">IMC</p>
                            <span className="text-2xl font-black text-gray-900 dark:text-white">{formData.calculatedStats?.bmi || '--'}</span>
                            <p className="text-[10px] font-bold mt-1 text-gray-500">{formData.calculatedStats?.bmiClassification}</p>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-indigo-100 shadow-sm dark:bg-gray-800/80 dark:border-gray-700">
                            <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">RCQ (Cintura/Quadril)</p>
                            <span className="text-2xl font-black text-gray-900 dark:text-white">{formData.calculatedStats?.whr || '--'}</span>
                            <p className="text-[10px] font-bold mt-1 text-gray-500">{formData.calculatedStats?.whrRisk}</p>
                        </div>
                    </div>
                </div>

                {/* 6. DADOS VITAIS */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2 dark:border-gray-800 dark:text-gray-500">Dados Vitais</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <label className="block">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Nome Completo</span>
                            <input type="text" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} className={inputClass} />
                        </label>
                         <label className="block relative">
                            <div className="flex justify-between">
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Data de Nascimento</span>
                                {currentAge !== null && <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full dark:bg-blue-900/30 dark:text-blue-300">{currentAge} anos</span>}
                            </div>
                            <input ref={birthDateInputRef} type="date" value={formData.birthDate} onChange={(e) => handleChange('birthDate', e.target.value)} className={inputClass} />
                        </label>
                        <label className="block">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Gênero</span>
                            <select value={formData.gender} onChange={(e) => handleChange('gender', e.target.value as any)} className={inputClass}>
                                <option value="Masculino">Masculino</option>
                                <option value="Feminino">Feminino</option>
                            </select>
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

                {/* 7. ANTROPOMETRIA */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2 flex items-center gap-2 dark:border-gray-800 dark:text-gray-500">
                        <IconActivity className="w-4 h-4" />
                        ANTROPOMETRIA (MEDIDAS)
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                        <label className="block">
                            <span className="text-sm font-bold text-gray-700 block mb-1 dark:text-gray-300">Peitoral (cm)</span>
                            <input 
                                type="number" 
                                value={formData.measurements.chest} 
                                onChange={(e) => handleMeasurementChange('chest', e.target.value)}
                                className={inputClass}
                                placeholder="Ex: 105"
                            />
                        </label>
                        <label className="block">
                            <span className="text-sm font-bold text-gray-700 block mb-1 dark:text-gray-300">Braço (cm)</span>
                            <input 
                                type="number" 
                                value={formData.measurements.arm} 
                                onChange={(e) => handleMeasurementChange('arm', e.target.value)}
                                className={inputClass}
                                placeholder="Ex: 38.5"
                            />
                        </label>
                        <label className="block">
                            <span className="text-sm font-bold text-gray-700 block mb-1 dark:text-gray-300">Cintura (cm)</span>
                            <input 
                                type="number" 
                                value={formData.measurements.waist} 
                                onChange={(e) => handleMeasurementChange('waist', e.target.value)}
                                className={inputClass}
                                placeholder="Ex: 95"
                            />
                        </label>
                        <label className="block">
                            <span className="text-sm font-bold text-gray-700 block mb-1 dark:text-gray-300">Quadril (cm)</span>
                            <input 
                                type="number" 
                                value={formData.measurements.hips} 
                                onChange={(e) => handleMeasurementChange('hips', e.target.value)}
                                className={inputClass}
                                placeholder="Ex: 105"
                            />
                        </label>
                        <label className="block">
                            <span className="text-sm font-bold text-gray-700 block mb-1 dark:text-gray-300">Coxa (cm)</span>
                            <input 
                                type="number" 
                                value={formData.measurements.thigh} 
                                onChange={(e) => handleMeasurementChange('thigh', e.target.value)}
                                className={inputClass}
                                placeholder="Ex: 60"
                            />
                        </label>
                        <label className="block">
                            <span className="text-sm font-bold text-gray-700 block mb-1 dark:text-gray-300">Panturrilha (cm)</span>
                            <input 
                                type="number" 
                                value={formData.measurements.calf} 
                                onChange={(e) => handleMeasurementChange('calf', e.target.value)}
                                className={inputClass}
                                placeholder="Ex: 40"
                            />
                        </label>
                    </div>
                </div>

                {/* 8. HISTÓRICO MÉDICO */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 border-l-4 border-l-red-500 dark:bg-gray-900 dark:border-gray-800 dark:border-l-red-600">
                     <h3 className="text-sm font-black text-red-600 uppercase tracking-widest mb-6 border-b border-red-100 pb-2 flex items-center gap-2 dark:border-red-900/30">
                        <IconAlert className="w-4 h-4" />
                        Histórico Médico (Crítico para a IA)
                    </h3>
                    <div className="space-y-6">
                         <label className="block">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Comorbidades / Doenças Pré-existentes</span>
                            <textarea 
                                value={formData.comorbidities}
                                onChange={(e) => handleChange('comorbidities', e.target.value)}
                                placeholder="Ex: Hipertensão, Diabetes, Lesão no joelho..."
                                className={`${inputClass} h-24`}
                            />
                        </label>
                        <label className="block">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Medicamentos de Uso Contínuo</span>
                            <textarea 
                                value={formData.medications}
                                onChange={(e) => handleChange('medications', e.target.value)}
                                placeholder="Ex: Losartana 50mg, Puran T4..."
                                className={`${inputClass} h-24`}
                            />
                        </label>
                    </div>
                </div>

                 {/* 9. ADMINISTRAÇÃO & SEGURANÇA */}
                 <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2 flex items-center gap-2 dark:border-gray-800 dark:text-white">
                        <IconShield className="w-4 h-4" />
                        Administração & Segurança
                    </h3>
                    
                    <div className="space-y-8">
                        {/* ID Debug */}
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex justify-between items-center dark:bg-gray-800 dark:border-gray-700">
                            <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">ID de Suporte</span>
                                <code className="text-xs text-gray-600 font-mono dark:text-gray-300">{userId || 'Carregando...'}</code>
                            </div>
                            <button onClick={copyUserId} className="text-gray-400 hover:text-blue-600 transition-colors">
                                <IconCopy className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Change Password */}
                        <div>
                            <label className="block mb-2">
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Alterar Senha</span>
                            </label>
                            <div className="flex gap-2">
                                <input 
                                    type="password" 
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    className={`${inputClass} mt-0`}
                                />
                                <button 
                                    onClick={handleUpdatePassword}
                                    disabled={isUpdatingPassword || !newPassword}
                                    className="px-6 bg-gray-900 text-white rounded-lg font-bold text-sm hover:bg-black disabled:opacity-50 transition-colors whitespace-nowrap dark:bg-gray-700 dark:hover:bg-gray-600"
                                >
                                    {isUpdatingPassword ? '...' : 'Atualizar'}
                                </button>
                            </div>
                        </div>

                        {/* App Version History (Dynamic from DB) */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                            <div className="flex justify-between items-center mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">Histórico de Atualizações</h4>
                                    <p className="text-xs text-gray-500 mt-0.5 dark:text-gray-400">
                                        Versão Atual: <span className="font-mono text-blue-600 dark:text-blue-400">{versionHistory[0]?.version || CODE_VERSION}</span>
                                    </p>
                                </div>
                                <button 
                                    onClick={handleHardRefresh}
                                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                                    title="Forçar Atualização"
                                >
                                    <IconRefresh className="w-4 h-4" />
                                </button>
                            </div>
                            
                            {versionHistory.length > 0 ? (
                                <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                    {versionHistory.map((v) => (
                                        <div key={v.id} className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                            <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 bg-gray-300 rounded-full dark:bg-gray-600"></div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-black text-gray-900 bg-white px-1.5 py-0.5 rounded border border-gray-200 dark:bg-gray-900 dark:text-white dark:border-gray-600">
                                                    {v.version}
                                                </span>
                                                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                    <IconClock className="w-3 h-3" />
                                                    {new Date(v.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'})}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600 leading-relaxed dark:text-gray-400">
                                                {v.description}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-xs text-gray-400">Carregando histórico...</p>
                                </div>
                            )}
                        </div>

                        {/* Logout Button */}
                        {onLogout && (
                            <button 
                                onClick={onLogout}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 border-2 border-red-100 text-red-600 rounded-lg font-bold text-sm hover:bg-red-100 transition-all active:scale-95 dark:bg-red-900/20 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-900/30"
                            >
                                Sair da Conta
                            </button>
                        )}
                    </div>
                 </div>

            </div>
        </div>
    );
};

export default ProfileView;
