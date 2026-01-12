
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { IconUser, IconActivity, IconCheck, IconAlert, IconPlus, IconClose, IconCalendar } from './Icons';
import { supabase } from '../lib/supabase';
import { dataService } from '../services/dataService';

interface ProfileViewProps {
    profile?: UserProfile;
    onSave: (profile: UserProfile) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ profile, onSave }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    
    // Password Update State
    const [newPassword, setNewPassword] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const birthDateInputRef = useRef<HTMLInputElement>(null);

    // Default structure to ensure inputs are never uncontrolled
    const defaultProfile: UserProfile = {
        name: '',
        birthDate: '', // Default empty string for date input
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
        }
    };

    const [formData, setFormData] = useState<UserProfile>(profile || defaultProfile);

    // Sync state when prop changes (e.g. after DB load)
    useEffect(() => {
        if (profile) {
            setFormData(prev => ({
                ...defaultProfile, // Start with defaults
                ...profile,        // Override with DB data
                measurements: {    // Deep merge measurements
                    ...defaultProfile.measurements,
                    ...(profile.measurements || {})
                }
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
    
    // --- AVATAR LOGIC ---
    
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
                // Upload returns signed URL for immediate display
                const signedUrl = await dataService.uploadAvatar(file, session.user.id);
                if (signedUrl) {
                    // Update Local State
                    setFormData(prev => ({ ...prev, avatarUrl: signedUrl }));
                    // Trigger global update via props
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
            if (e.target) e.target.value = ''; // Reset input
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

    // Shared input class to ensure consistent visibility and contrast
    const inputClass = "mt-1 block w-full rounded-lg border-gray-300 p-3 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm border";

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 text-gray-900">
             {/* Header */}
             <div className="shrink-0 z-30 bg-white border-b border-gray-200 shadow-sm sticky top-0 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <IconUser className="w-6 h-6 text-blue-600" />
                    Ficha Biométrica
                </h2>
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50 shadow-lg"
                >
                    {isSaving ? 'Salvando...' : 'Salvar Perfil'}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-4xl mx-auto w-full space-y-8 pb-32">
                
                {successMsg && (
                    <div className="bg-green-50 text-green-800 p-4 rounded-xl border border-green-200 flex items-center gap-3 animate-in slide-in-from-top-4 shadow-sm font-medium">
                        <IconCheck className="w-5 h-5" />
                        {successMsg}
                    </div>
                )}
                
                {/* AVATAR SECTION */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center justify-center">
                    <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                        <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center relative">
                            {formData.avatarUrl ? (
                                <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <IconUser className="w-12 h-12 text-gray-300" />
                            )}
                            
                            {/* Loading Overlay */}
                            {isUploadingAvatar && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <div className="w-8 h-8 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                                </div>
                            )}
                            
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <IconPlus className="w-8 h-8 text-white drop-shadow-md" />
                            </div>
                        </div>

                        {/* Edit Button Badge */}
                        <div className="absolute bottom-1 right-1 bg-blue-600 text-white p-2 rounded-full shadow-md border-2 border-white transform transition-transform group-hover:scale-110">
                             <IconPlus className="w-4 h-4" />
                        </div>
                        
                        {/* Delete Button (Only if avatar exists) */}
                        {formData.avatarUrl && (
                             <button 
                                onClick={handleDeleteAvatar}
                                className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full shadow-md border-2 border-white transform hover:scale-110"
                                title="Remover foto"
                            >
                                <IconClose className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                    
                    <div className="text-center mt-4">
                        <h3 className="font-bold text-gray-900">{formData.name || 'Atleta'}</h3>
                        <p className="text-xs text-gray-500">Toque na imagem para alterar a foto</p>
                    </div>

                    <input 
                        type="file" 
                        ref={avatarInputRef} 
                        className="hidden" 
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={handleAvatarChange}
                    />
                </div>

                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2">Dados Vitais</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <label className="block">
                            <span className="text-sm font-bold text-gray-700">Nome Completo / Apelido</span>
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
                                <span className="text-sm font-bold text-gray-700">Data de Nascimento</span>
                                {currentAge !== null && (
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
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
                                    className={`${inputClass} pr-12`} // Padding extra para o ícone
                                />
                                <button 
                                    type="button"
                                    onClick={handleOpenDatePicker}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Abrir calendário"
                                >
                                    <IconCalendar className="w-5 h-5" />
                                </button>
                            </div>
                        </label>
                        <label className="block">
                            <span className="text-sm font-bold text-gray-700">Gênero Biológico</span>
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
                                <span className="text-sm font-bold text-gray-700">Altura (cm)</span>
                                <input type="number" value={formData.height} onChange={(e) => handleChange('height', e.target.value)} className={inputClass} placeholder="175" />
                            </label>
                             <label className="block">
                                <span className="text-sm font-bold text-gray-700">Peso (kg)</span>
                                <input type="number" value={formData.weight} onChange={(e) => handleChange('weight', e.target.value)} className={inputClass} placeholder="80" />
                            </label>
                             <label className="block">
                                <span className="text-sm font-bold text-gray-700">BF % (Est.)</span>
                                <input type="number" value={formData.bodyFat} onChange={(e) => handleChange('bodyFat', e.target.value)} className={inputClass} placeholder="15" />
                            </label>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2 flex items-center gap-2">
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
                                <span className="text-sm font-bold text-gray-700">{label} (cm)</span>
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

                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 border-l-4 border-l-red-500">
                     <h3 className="text-sm font-black text-red-600 uppercase tracking-widest mb-6 border-b border-red-100 pb-2 flex items-center gap-2">
                        <IconAlert className="w-4 h-4" />
                        Histórico Médico (Crítico para a IA)
                    </h3>
                    <div className="space-y-6">
                         <label className="block">
                            <span className="text-sm font-bold text-gray-700">Comorbidades / Doenças Pré-existentes</span>
                            <textarea 
                                value={formData.comorbidities}
                                onChange={(e) => handleChange('comorbidities', e.target.value)}
                                placeholder="Ex: Hipertensão, Diabetes Tipo 2, Hipotireoidismo, Lesão no joelho direito..."
                                className={`${inputClass} h-24`}
                            />
                        </label>
                        <label className="block">
                            <span className="text-sm font-bold text-gray-700">Medicamentos de Uso Contínuo</span>
                            <textarea 
                                value={formData.medications}
                                onChange={(e) => handleChange('medications', e.target.value)}
                                placeholder="Ex: Losartana 50mg, Puran T4 100mcg, Antidepressivos..."
                                className={`${inputClass} h-24`}
                            />
                        </label>
                        <div className="bg-yellow-50 p-4 rounded-lg text-xs text-yellow-800 leading-relaxed font-medium border border-yellow-100">
                            <strong className="block mb-1 text-yellow-900">Por que preencher isso?</strong>
                            A Inteligência Artificial usará esses dados para cruzar riscos. Exemplo: Se você marcar "Hipertensão", a IA alertará sobre riscos cardíacos se você adicionar estimulantes fortes (como Clembuterol) ao seu protocolo.
                        </div>
                    </div>
                </div>

                 {/* Password Update Section */}
                 <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2">Segurança da Conta</h3>
                    <div className="space-y-4">
                        <label className="block">
                            <span className="text-sm font-bold text-gray-700">Nova Senha</span>
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
                                    className="px-6 bg-gray-900 text-white rounded-lg font-bold text-sm hover:bg-black disabled:opacity-50 transition-colors whitespace-nowrap"
                                >
                                    {isUpdatingPassword ? '...' : 'Atualizar'}
                                </button>
                            </div>
                        </label>
                        <p className="text-xs text-gray-500">
                            Digite sua nova senha e clique em atualizar. 
                        </p>
                    </div>
                 </div>

            </div>
        </div>
    );
};

export default ProfileView;
