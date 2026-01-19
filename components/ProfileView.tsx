
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, AppVersion, Project, ProtocolItem } from '../types';
import { dataService } from '../services/dataService';
import { supabase } from '../lib/supabase';
import CostTracker from './CostTracker';
import { Tooltip } from './Tooltip';
import BodyGuide from './BodyGuide';
import AuditLogModal from './AuditLogModal';
import EvolutionGallery from './EvolutionGallery';
import { 
    IconUser, IconPlus, IconSun, IconMoon, IconFlame, 
    IconActivity, IconAlert, IconShield, IconRefresh, 
    IconWizard, IconCheck, IconInfo, IconCopy, IconClock,
    IconPill, IconDumbbell, IconList, IconClose, IconScience,
    IconFile, IconCalendar, IconHistory, IconCamera, IconUpload, IconReportPDF
} from './Icons';

const CODE_VERSION = "v1.6.93";

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
    arm: 'Braço',
    waist: 'Cintura',
    hips: 'Quadril',
    thigh: 'Coxa',
    calf: 'Panturrilha'
};

interface ProfileViewProps {
    project: Project;
    onSave: (profile: UserProfile) => void;
    onUpdateProject?: (project: Project) => void;
    onOpenWizard?: () => void;
    billingTrigger: number;
    onOpenSubscription: () => void;
    onLogout?: () => void;
    onRequestAnalysis?: (context: string) => void;
    onGenerateProntuario?: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ 
    project, 
    onSave, 
    onUpdateProject, 
    onOpenWizard, 
    billingTrigger, 
    onOpenSubscription, 
    onLogout, 
    onRequestAnalysis,
    onGenerateProntuario
}) => {
    // State initialization
    const [formData, setFormData] = useState<UserProfile>(project.userProfile || {} as UserProfile);
    const [initialFormData, setInitialFormData] = useState<UserProfile>(JSON.parse(JSON.stringify(project.userProfile || {})));
    
    const [goal, setGoal] = useState(project.objective);
    const [initialGoal, setInitialGoal] = useState(project.objective);
    
    const [calories, setCalories] = useState('');
    const [initialCalories, setInitialCalories] = useState('');
    
    const [trainingNotes, setTrainingNotes] = useState(project.trainingNotes || '');
    const [initialTraining, setInitialTraining] = useState(project.trainingNotes || '');
    
    const [protocol, setProtocol] = useState<ProtocolItem[]>(project.currentProtocol || []);
    const [initialProtocol, setInitialProtocol] = useState<ProtocolItem[]>(JSON.parse(JSON.stringify(project.currentProtocol || [])));

    const [hormones, setHormones] = useState({ testo: '', e2: '' });
    const [initialHormones, setInitialHormones] = useState({ testo: '', e2: '' });

    const [isSaving, setIsSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [isAuditOpen, setIsAuditOpen] = useState(false);
    const [versionHistory, setVersionHistory] = useState<AppVersion[]>([]);
    const [userId, setUserId] = useState('');
    const [birthDateDisplay, setBirthDateDisplay] = useState('');
    const [activeMeasurement, setActiveMeasurement] = useState('chest');
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [showEvolutionGallery, setShowEvolutionGallery] = useState(false);

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Initial load logic
    useEffect(() => {
        const load = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) setUserId(session.user.id);
            
            const versions = await dataService.getAppVersionHistory();
            setVersionHistory(versions);

            // Metrics loading logic
            if (project.dietCalories) {
                setCalories(project.dietCalories);
                setInitialCalories(project.dietCalories);
            } else if (project.metrics?.['Calories']?.length) {
                const vals = project.metrics['Calories'];
                const val = vals[vals.length - 1].value.toString();
                setCalories(val);
                setInitialCalories(val);
            }

            const t = project.metrics?.['Testosterone'] || project.metrics?.['Testosterona'];
            const e = project.metrics?.['Estradiol'];
            const h = {
                testo: t && t.length > 0 ? t[t.length-1].value.toString() : '',
                e2: e && e.length > 0 ? e[e.length-1].value.toString() : ''
            };
            setHormones(h);
            setInitialHormones(h);
        };
        load();
    }, [project.id]);

    useEffect(() => {
        if (formData.birthDate) {
            const parts = formData.birthDate.split('-');
            if (parts.length === 3) {
                setBirthDateDisplay(`${parts[2]}/${parts[1]}/${parts[0]}`);
            }
        }
    }, [formData.birthDate]);

    // Helpers
    const handleChange = (field: keyof UserProfile, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleThemeChange = (newTheme: 'light' | 'dark') => {
        // 1. Atualiza estado do form para salvar no banco
        handleChange('theme', newTheme);
        
        // 2. Aplica visualmente AGORA (Zero delay)
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('fitlm-theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('fitlm-theme', 'light');
        }
    };

    const handleMeasurementChange = (type: 'current' | 'target', part: string, value: string) => {
        setFormData(prev => {
            if (type === 'current') {
                return { ...prev, measurements: { ...prev.measurements, [part]: value } };
            } else {
                return { ...prev, targetMeasurements: { ...(prev.targetMeasurements || {} as any), [part]: value } };
            }
        });
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 8) val = val.substring(0, 8);
        
        let formatted = val;
        if (val.length >= 5) formatted = `${val.substring(0, 2)}/${val.substring(2, 4)}/${val.substring(4)}`;
        else if (val.length >= 3) formatted = `${val.substring(0, 2)}/${val.substring(2)}`;
        
        setBirthDateDisplay(formatted);

        if (val.length === 8) {
            const day = val.substring(0, 2);
            const month = val.substring(2, 4);
            const year = val.substring(4, 8);
            handleChange('birthDate', `${year}-${month}-${day}`);
        }
    };

    const calculateAge = (dob: string) => {
        if (!dob) return '';
        const birth = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age.toString();
    };
    const currentAge = calculateAge(formData.birthDate);

    const handleAvatarClick = () => avatarInputRef.current?.click();
    
    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setIsUploadingAvatar(true);
            try {
                const url = await dataService.uploadAvatar(e.target.files[0], userId);
                if (url) handleChange('avatarUrl', url);
            } catch(e) { console.error(e); }
            finally { setIsUploadingAvatar(false); }
        }
    };

    const handleAddProtocolItem = () => setProtocol([...protocol, { compound: '', dosage: '', frequency: '' }]);
    const handleRemoveProtocol = (idx: number) => setProtocol(protocol.filter((_, i) => i !== idx));
    const handleUpdateProtocol = (idx: number, field: keyof ProtocolItem, value: string) => {
        const newP = [...protocol];
        newP[idx][field] = value;
        setProtocol(newP);
    };

    const copyUserId = () => {
        navigator.clipboard.writeText(userId);
        alert("ID copiado!");
    };

    const handleHardRefresh = () => {
        if ('caches' in window) {
            caches.keys().then((names) => {
                names.forEach(name => caches.delete(name));
            });
        }
        window.location.reload();
    };

    const normalize = (val: any) => val === null || val === undefined ? '' : String(val).trim();

    const detectChanges = (): string[] => {
        const changes: string[] = [];
        if (normalize(formData.weight) !== normalize(initialFormData.weight)) changes.push(`Peso: ${initialFormData.weight || 'N/A'} -> ${formData.weight}`);
        if (normalize(formData.bodyFat) !== normalize(initialFormData.bodyFat)) changes.push(`BF%: ${initialFormData.bodyFat || 'N/A'} -> ${formData.bodyFat}`);
        if (normalize(formData.height) !== normalize(initialFormData.height)) changes.push(`Altura: ${initialFormData.height || 'N/A'} -> ${formData.height}`);
        if (normalize(goal) !== normalize(initialGoal)) changes.push(`Objetivo: ${initialGoal} -> ${goal}`);
        if (normalize(calories) !== normalize(initialCalories)) changes.push(`Calorias: ${initialCalories} -> ${calories}`);
        if (normalize(trainingNotes) !== normalize(initialTraining)) changes.push("Notas de Treino atualizadas.");
        if (JSON.stringify(protocol) !== JSON.stringify(initialProtocol)) changes.push("Protocolo Farmacológico alterado.");
        if (normalize(hormones.testo) !== normalize(initialHormones.testo)) changes.push(`Testosterona: ${initialHormones.testo} -> ${hormones.testo}`);
        if (normalize(hormones.e2) !== normalize(initialHormones.e2)) changes.push(`Estradiol: ${initialHormones.e2} -> ${hormones.e2}`);
        return changes;
    };

    const handleSave = async () => {
        const currentChanges = detectChanges();
        setIsSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user && project) {
                await dataService.saveUserProfile(session.user.id, formData, 'PROFILE_VIEW');
                onSave(formData);

                const cleanProtocol = protocol.filter(p => p.compound.trim() !== '');
                await dataService.updateProjectSettings(
                    project.id,
                    goal,
                    cleanProtocol,
                    trainingNotes,
                    calories,
                    'PROFILE_VIEW'
                );

                const today = new Date().toLocaleDateString('pt-BR');
                const timestamp = Date.now();
                const updatedMetrics = { ...project.metrics };

                const addMetricLocal = async (category: string, valueStr: string, unit: string) => {
                    const val = parseFloat(valueStr);
                    if (!isNaN(val)) {
                        const pt = { 
                            date: today, 
                            value: val, 
                            unit: unit, 
                            label: 'Manual Profile Input',
                            createdAt: timestamp
                        };
                        await dataService.addMetric(project.id, category, pt, 'PROFILE_VIEW');
                        updatedMetrics[category] = [...(updatedMetrics[category] || []), pt];
                    }
                };

                if (hormones.testo && normalize(hormones.testo) !== normalize(initialHormones.testo)) {
                    await addMetricLocal('Testosterone', hormones.testo, 'ng/dL');
                }
                if (hormones.e2 && normalize(hormones.e2) !== normalize(initialHormones.e2)) {
                    await addMetricLocal('Estradiol', hormones.e2, 'pg/mL');
                }
                if (formData.weight && normalize(formData.weight) !== normalize(initialFormData.weight)) {
                    await addMetricLocal('Weight', formData.weight, 'kg');
                }
                if (formData.bodyFat && normalize(formData.bodyFat) !== normalize(initialFormData.bodyFat)) {
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
                if (currentChanges.length > 0 && onRequestAnalysis) {
                    onRequestAnalysis(`O usuário ATUALIZOU DADOS CRÍTICOS MANUALMENTE AGORA (${today}):\n${currentChanges.join('\n')}\n\nConsidere estes novos valores como a VERDADE ABSOLUTA e reavalie o cenário.`);
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

    if (showEvolutionGallery) {
        return (
            <EvolutionGallery 
                project={project} 
                onBack={() => setShowEvolutionGallery(false)} 
                onUpdateProject={(p) => {
                    if (onUpdateProject) onUpdateProject(p);
                }}
            />
        );
    }

    const inputClass = "w-full rounded-lg border-gray-300 p-3 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all border dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500";

    return (
        // LAYOUT "CAIXA DE VIDRO"
        <div className="absolute inset-0 flex flex-col bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white overflow-hidden">
             <AuditLogModal isOpen={isAuditOpen} onClose={() => setIsAuditOpen(false)} />

             {/* HEADER RÍGIDO (flex-none) */}
             <div className="flex-none z-40 bg-white border-b border-gray-200 shadow-sm px-4 md:px-6 py-4 flex items-center justify-between dark:bg-gray-900 dark:border-gray-800">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2 dark:text-white">
                    <IconUser className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                    Ficha Biométrica
                </h2>
                <div className="flex gap-2">
                    {onGenerateProntuario && (
                        <button 
                            onClick={onGenerateProntuario}
                            className="px-3 md:px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-medium hover:bg-indigo-100 transition-all active:scale-95 shadow-sm flex items-center gap-1.5 md:gap-2 text-xs md:text-sm border border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-900/30"
                            title="Gerar Prontuário Médico PDF"
                        >
                            <IconReportPDF className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            <span className="hidden md:inline">Prontuário</span>
                        </button>
                    )}

                    <button 
                        onClick={() => setShowEvolutionGallery(true)}
                        className="px-3 md:px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-all active:scale-95 shadow-sm flex items-center gap-1.5 md:gap-2 text-xs md:text-sm"
                        title="Ver Galeria de Fotos"
                    >
                        <IconCamera className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        <span className="hidden md:inline">Galeria</span>
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

            {/* CORPO COM SCROLL (flex-1) */}
            <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto min-h-0 p-4 md:p-10 pb-32"
            >
                <div className="max-w-4xl mx-auto w-full space-y-6 md:space-y-8">
                    
                    <CostTracker variant="inline" refreshTrigger={billingTrigger} onOpenSubscription={onOpenSubscription} />

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
                            
                            <div className="md:col-span-2">
                                <label className="block">
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Data de Nascimento</span>
                                    <div className="relative mt-1">
                                        <input 
                                            type="tel" 
                                            value={birthDateDisplay} 
                                            onChange={handleDateChange} 
                                            className={`${inputClass} mt-0 pl-10 tracking-widest font-mono`} 
                                            placeholder="DD/MM/AAAA"
                                            maxLength={10}
                                        />
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
                                            <IconCalendar className="w-5 h-5" />
                                        </div>
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
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2 flex items-center gap-2 dark:text-white dark:border-gray-800">
                            <IconActivity className="w-4 h-4 text-emerald-500" />
                            Metas & Evolução (Atual vs Pretendido)
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                            <div className="col-span-2 grid grid-cols-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                <span>Atual</span>
                                <span>Meta (Alvo)</span>
                            </div>

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
                                            onChange={(e) => handleMeasurementChange('current', part, e.target.value)}
                                            className="w-full rounded-md border-gray-300 p-2 text-sm bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                            placeholder="Atual"
                                            onFocus={() => setActiveMeasurement(part)}
                                        />
                                        <input 
                                            type="number"
                                            value={formData.targetMeasurements?.[part as any] || ''}
                                            onChange={(e) => handleMeasurementChange('target', part, e.target.value)}
                                            className="w-20 rounded-md border-gray-300 p-2 text-sm bg-emerald-50/50 focus:ring-emerald-500 border-dashed text-center dark:bg-emerald-900/10 dark:border-gray-700 dark:text-white"
                                            placeholder="Meta"
                                            onFocus={() => setActiveMeasurement(part)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

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
                                    <button onClick={() => handleThemeChange('light')} className={`p-1.5 rounded ${formData.theme === 'light' ? 'bg-white shadow text-yellow-600 dark:bg-gray-700 dark:text-yellow-400' : 'text-gray-400'}`}><IconSun className="w-4 h-4" /></button>
                                    <button onClick={() => handleThemeChange('dark')} className={`p-1.5 rounded ${formData.theme === 'dark' ? 'bg-white shadow text-purple-600 dark:bg-gray-700 dark:text-purple-400' : 'text-gray-400'}`}><IconMoon className="w-4 h-4" /></button>
                                </div>
                            </div>
                            
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
        </div>
    );
};

export default ProfileView;
