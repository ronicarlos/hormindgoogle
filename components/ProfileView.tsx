
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { IconUser, IconActivity, IconCheck, IconAlert, IconPlus, IconClose, IconCalendar, IconFlame, IconScience, IconWizard, IconMoon, IconSun } from './Icons';
import { supabase } from '../lib/supabase';
import { dataService } from '../services/dataService';
import CostTracker from './CostTracker';

interface ProfileViewProps {
    profile?: UserProfile;
    onSave: (profile: UserProfile) => void;
    onOpenWizard?: () => void;
    // Props para o CostTracker
    billingTrigger: number;
    onOpenSubscription: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ profile, onSave, onOpenWizard, billingTrigger, onOpenSubscription }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    
    // Password Update State
    const [newPassword, setNewPassword] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    
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

    // Calculate Age helper
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

    // --- REAL-TIME CALCULATIONS (METABOLIC ENGINE) ---
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

    const handleDeleteAvatar = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Remover foto de perfil?")) return;

        try {
             const { data: { session } } = await supabase.auth.getSession();
             if (session?.user) {
                 await dataService.deleteAvatar(session.user.id);
                 setFormData(prev => ({ ...prev, avatarUrl: undefined }));
                 onSave({ ...formData, avatarUrl: undefined });
             }
        } catch (err) {
            console.error(err);
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
                
                {/* 1. SECTION: ASSINATURA & CUSTOS (NEW) */}
                <CostTracker 
                    variant="inline"
                    refreshTrigger={billingTrigger}
                    onOpenSubscription={onOpenSubscription}
                />

                {/* 2. SECTION: WIZARD BANNER */}
                <div 
                    onClick={onOpenWizard}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white shadow-xl shadow-blue-500/20 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform group"
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
                
                {/* 3. SECTION: AVATAR */}
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
                        
                        {formData.avatarUrl && (
                             <button 
                                onClick={handleDeleteAvatar}
                                className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full shadow-md border-2 border-white transform hover:scale-110 dark:border-gray-800"
                                title="Remover foto"
                            >
                                <IconClose className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                    
                    <div className="text-center mt-4">
                        <h3 className="font-bold text-gray-900 dark:text-white">{formData.name || 'Atleta'}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Toque na imagem para alterar a foto</p>
                    </div>

                    <input 
                        type="file" 
                        ref={avatarInputRef} 
                        className="hidden" 
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={handleAvatarChange}
                    />
                </div>

                {/* 4. SECTION: THEME */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2 dark:border-gray-800 dark:text-gray-500">Aparência do App</h3>
                    <div className="flex gap-4">
                        <button
                            onClick={() => handleChange('theme', 'light')}
                            className={`flex-1 p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all ${
                                formData.theme !== 'dark' 
                                ? 'border-blue-600 bg-blue-50 text-blue-900' 
                                : 'border-gray-200 text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600'
                            }`}
                        >
                            <IconSun className="w-5 h-5" />
                            <span className="font-bold text-sm">Modo Claro</span>
                        </button>
                        <button
                            onClick={() => handleChange('theme', 'dark')}
                            className={`flex-1 p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all ${
                                formData.theme === 'dark' 
                                ? 'border-blue-600 bg-gray-800 text-white' 
                                : 'border-gray-200 text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600'
                            }`}
                        >
                            <IconMoon className="w-5 h-5" />
                            <span className="font-bold text-sm">Modo Escuro</span>
                        </button>
                    </div>
                </div>

                {/* 5. SECTION: CALCULATED STATS */}
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 md:p-8 rounded-2xl shadow-sm border border-indigo-100 relative overflow-hidden dark:from-gray-900 dark:to-gray-900 dark:border-indigo-900/30">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <IconScience className="w-24 h-24 text-indigo-900 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10 dark:text-indigo-300">
                        <IconFlame className="w-4 h-4 text-orange-500" />
                        Índices Metabólicos (Estimados)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-indigo-100 shadow-sm dark:bg-gray-800/80 dark:border-gray-700">
                            <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">TMB (Basal)</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-gray-900 dark:text-white">{formData.calculatedStats?.bmr || '--'}</span>
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">kcal</span>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1 dark:text-gray-500">Fórmula Mifflin-St Jeor</p>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-indigo-100 shadow-sm dark:bg-gray-800/80 dark:border-gray-700">
                            <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">IMC</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-gray-900 dark:text-white">{formData.calculatedStats?.bmi || '--'}</span>
                            </div>
                            <p className={`text-[10px] font-bold mt-1 ${
                                formData.calculatedStats?.bmiClassification === 'Eutrófico (Normal)' ? 'text-green-600 dark:text-green-400' : 'text-orange-500'
                            }`}>
                                {formData.calculatedStats?.bmiClassification || 'Aguardando dados'}
                            </p>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-indigo-100 shadow-sm dark:bg-gray-800/80 dark:border-gray-700">
                            <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">Relação Cintura-Quadril</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-gray-900 dark:text-white">{formData.calculatedStats?.whr || '--'}</span>
                            </div>
                            <p className={`text-[10px] font-bold mt-1 ${
                                formData.calculatedStats?.whrRisk === 'Risco Baixo' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                            }`}>
                                {formData.calculatedStats?.whrRisk || 'Aguardando medidas'}
                            </p>
                        </div>
                    </div>
                    <div className="mt-4 text-[10px] text-indigo-800/60 font-medium dark:text-indigo-300/60">
                        * Estes valores são calculados com base na sua antropometria básica. A bioimpedância (se enviada) terá prioridade na análise da IA.
                    </div>
                </div>

                {/* 6. SECTION: DADOS VITAIS */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2 dark:border-gray-800 dark:text-gray-500">Dados Vitais</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <label className="block">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Nome Completo / Apelido</span>
                            <input 
                                type="text" 
                                value={formData.name} 
                                onChange={(e) => handleChange('name', e.target.value)}
                                className={inputClass}
                                placeholder="Seu nome"
                            />
                        </label>
                         <label className="block relative">
                            <div className="flex justify-between">
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Data de Nascimento</span>
                                {currentAge !== null && (
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                                        {currentAge} anos
                                    </span>
                                )}
                            </div>
                            <div className="relative">
                                <input 
                                    ref={birthDateInputRef}
                                    type="date" 
                                    value={formData.birthDate} 
                                    onChange={(e) => handleChange('birthDate', e.target.value)}
                                    className={`${inputClass} pr-12`}
                                />
                                <button 
                                    type="button"
                                    onClick={handleOpenDatePicker}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-700"
                                    title="Abrir calendário"
                                >
                                    <IconCalendar className="w-5 h-5" />
                                </button>
                            </div>
                        </label>
                        <label className="block">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Gênero Biológico</span>
                            <select 
                                value={formData.gender}
                                onChange={(e) => handleChange('gender', e.target.value as any)}
                                className={inputClass}
                            >
                                <option value="Masculino">Masculino</option>
                                <option value="Feminino">Feminino</option>
                            </select>
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                             <label className="block">
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Altura (cm)</span>
                                <input type="number" value={formData.height} onChange={(e) => handleChange('height', e.target.value)} className={inputClass} placeholder="175" />
                            </label>
                             <label className="block">
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Peso (kg)</span>
                                <input type="number" value={formData.weight} onChange={(e) => handleChange('weight', e.target.value)} className={inputClass} placeholder="80" />
                            </label>
                             <label className="block">
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">BF % (Est.)</span>
                                <input type="number" value={formData.bodyFat} onChange={(e) => handleChange('bodyFat', e.target.value)} className={inputClass} placeholder="15" />
                            </label>
                        </div>
                    </div>
                </div>

                {/* 7. SECTION: ANTROPOMETRIA */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2 flex items-center gap-2 dark:border-gray-800 dark:text-gray-500">
                        <IconActivity className="w-4 h-4" />
                        Antropometria (Medidas)
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {Object.entries({
                            chest: 'Peitoral',
                            arm: 'Braço (Contraído)',
                            waist: 'Cintura (Umbigo)',
                            hips: 'Quadril',
                            thigh: 'Coxa Medial',
                            calf: 'Panturrilha'
                        }).map(([key, label]) => (
                            <label key={key} className="block">
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{label} (cm)</span>
                                <input 
                                    type="number" 
                                    value={formData.measurements[key as keyof typeof formData.measurements] || ''} 
                                    onChange={(e) => handleMeasurementChange(key as any, e.target.value)}
                                    className={inputClass}
                                    placeholder="0"
                                />
                            </label>
                        ))}
                    </div>
                </div>

                {/* 8. SECTION: HISTÓRICO MÉDICO */}
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
                                placeholder="Ex: Hipertensão, Diabetes Tipo 2, Hipotireoidismo, Lesão no joelho direito..."
                                className={`${inputClass} h-24`}
                            />
                        </label>
                        <label className="block">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Medicamentos de Uso Contínuo</span>
                            <textarea 
                                value={formData.medications}
                                onChange={(e) => handleChange('medications', e.target.value)}
                                placeholder="Ex: Losartana 50mg, Puran T4 100mcg, Antidepressivos..."
                                className={`${inputClass} h-24`}
                            />
                        </label>
                        <div className="bg-yellow-50 p-4 rounded-lg text-xs text-yellow-800 leading-relaxed font-medium border border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800">
                            <strong className="block mb-1 text-yellow-900 dark:text-yellow-200">Por que preencher isso?</strong>
                            A Inteligência Artificial usará esses dados para cruzar riscos. Exemplo: Se você marcar "Hipertensão", a IA alertará sobre riscos cardíacos se você adicionar estimulantes fortes (como Clembuterol) ao seu protocolo.
                        </div>
                    </div>
                </div>

                 {/* 9. SECTION: SENHA */}
                 <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2 dark:border-gray-800 dark:text-white">Segurança da Conta</h3>
                    <div className="space-y-4">
                        <label className="block">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Nova Senha</span>
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
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Digite sua nova senha e clique em atualizar. 
                        </p>
                    </div>
                 </div>

            </div>
        </div>
    );
};

export default ProfileView;
