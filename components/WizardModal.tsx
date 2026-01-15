
import React, { useState, useEffect, useRef } from 'react';
import { Project, UserProfile, ProtocolItem } from '../types';
import { dataService } from '../services/dataService';
import { supabase } from '../lib/supabase';
import { IconWizard, IconCheck, IconArrowLeft, IconUser, IconActivity, IconFlame, IconAlert, IconScience, IconDumbbell, IconPill, IconPlus, IconClose, IconFolder, IconInfo } from './Icons';
import { Tooltip } from './Tooltip';

interface WizardModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    onUpdateProfile: (profile: UserProfile) => void;
    onUpdateProject: (project: Project) => void;
    onUpload: (files: File[]) => Promise<void>;
}

// Passos reordenados e expandidos para fluxo completo
const steps = [
    { id: 'bio', title: 'Identificação', icon: IconUser, description: 'Dados básicos para a IA te conhecer.' },
    { id: 'anthro', title: 'Antropometria', icon: IconActivity, description: 'Peso e altura para cálculos metabólicos.' },
    { id: 'measure', title: 'Medidas', icon: IconFlame, description: 'Circunferências corporais (Biometria).' },
    { id: 'metrics', title: 'Marcadores Chave', icon: IconScience, description: 'Valores recentes de referência (Opcional).' }, // NOVO
    { id: 'health', title: 'Saúde', icon: IconAlert, description: 'Histórico médico e medicamentos.' },
    { id: 'upload', title: 'Exames & Arquivos', icon: IconFolder, description: 'Importe exames de sangue ou treinos antigos.' },
    { id: 'diet', title: 'Dieta & Calorias', icon: IconFlame, description: 'Sua ingestão calórica atual.' }, // SEPARADO
    { id: 'training', title: 'Rotina de Treino', icon: IconDumbbell, description: 'Como você está treinando hoje.' }, // SEPARADO
    { id: 'protocol', title: 'Protocolo', icon: IconPill, description: 'Uso de recursos ergogênicos.' },
    { id: 'goal', title: 'Objetivo Final', icon: IconCheck, description: 'Onde vamos chegar?' }
];

// --- COMPONENTE VISUAL DE CORPO (SVG) ---
const BodyGuide = ({ part, gender }: { part: string; gender: string }) => {
    const isMale = gender === 'Masculino';
    
    // Silhuetas simplificadas
    const silhouette = isMale 
        ? "M35,10 C35,5 45,5 45,10 L48,15 L65,18 L62,40 L55,80 L58,140 L50,140 L48,85 L40,85 L38,140 L30,140 L33,80 L26,40 L23,18 L40,15 Z"
        : "M38,10 C38,5 46,5 46,10 L48,15 L60,20 L58,40 L65,55 L60,85 L62,140 L52,140 L50,90 L38,90 L36,140 L26,140 L28,85 L23,55 L30,40 L28,20 L40,15 Z";

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
            {guides[part] || null}
        </svg>
    );
};

const MEASUREMENT_HINTS: Record<string, string> = {
    chest: 'Passe a fita na linha dos mamilos, sob as axilas.',
    arm: 'Maior circunferência do bíceps contraído.',
    waist: 'Circunferência na altura do umbigo (relaxado).',
    hips: 'Maior circunferência na região dos glúteos.',
    thigh: 'Meio da coxa, entre o joelho e o quadril.',
    calf: 'Maior circunferência da panturrilha.'
};

const WizardModal: React.FC<WizardModalProps> = ({ isOpen, onClose, project, onUpdateProfile, onUpdateProject, onUpload }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial safe state (avoid crash on null profile)
    const [profileData, setProfileData] = useState<UserProfile>(() => {
        const base = project.userProfile || {} as any;
        return {
            ...base,
            measurements: base.measurements || {}
        };
    });
    
    const [objective, setObjective] = useState(project.objective);
    const [trainingNotes, setTrainingNotes] = useState(project.trainingNotes || '');
    const [calories, setCalories] = useState('');
    const [protocol, setProtocol] = useState<ProtocolItem[]>([]);
    
    // Novos estados para métricas manuais
    const [manualTesto, setManualTesto] = useState('');
    const [manualE2, setManualE2] = useState('');

    useEffect(() => {
        if (project.userProfile) {
            setProfileData({
                ...project.userProfile,
                measurements: project.userProfile.measurements || {} as any
            });
        }
        if (project.objective) setObjective(project.objective);
        if (project.trainingNotes) setTrainingNotes(project.trainingNotes);
        if (project.currentProtocol) setProtocol(project.currentProtocol.length > 0 ? project.currentProtocol : [{ compound: '', dosage: '', frequency: '' }]);
        
        // Carrega o valor mais recente de calorias para o input
        const calMetrics = project.metrics['Calories'];
        if (calMetrics && calMetrics.length > 0) {
            // Ordena para pegar o mais recente
            const sorted = [...calMetrics].sort((a,b) => {
                 const da = a.date.split('/').reverse().join('-');
                 const db = b.date.split('/').reverse().join('-');
                 return new Date(db).getTime() - new Date(da).getTime();
            });
            setCalories(sorted[0].value.toString());
        }
        
        // Tenta preencher métricas manuais se já existirem (pega a mais recente)
        const testoMetrics = project.metrics['Testosterone'] || project.metrics['Testosterona'];
        if (testoMetrics && testoMetrics.length > 0) setManualTesto(testoMetrics[testoMetrics.length - 1].value.toString());
        
        const e2Metrics = project.metrics['Estradiol'];
        if (e2Metrics && e2Metrics.length > 0) setManualE2(e2Metrics[e2Metrics.length - 1].value.toString());

    }, [project, isOpen]);

    useEffect(() => {
        if (isOpen && project.userProfile) {
            const p = project.userProfile;
            let startStep = 0;

            if (!p.name || !p.birthDate || !p.gender) startStep = 0;
            else if (!p.height || !p.weight) startStep = 1;
            // SAFE CHECK with optional chaining
            else if (!p.measurements?.waist || !p.measurements?.hips) startStep = 2;
            else if (!manualTesto && !manualE2 && !project.metrics['Testosterone']) startStep = 3; // Step Métricas
            else if (!p.comorbidities && !p.medications) startStep = 4;
            // ... resto do fluxo
            else startStep = 0; 

            setCurrentStep(startStep);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleProfileChange = (field: keyof UserProfile, value: string) => {
        setProfileData(prev => ({ ...prev, [field]: value }));
    };

    const handleMeasurementChange = (field: string, value: string) => {
        setProfileData(prev => ({
            ...prev,
            measurements: { ...prev.measurements, [field]: value }
        }));
    };

    const handleProtocolChange = (index: number, field: keyof ProtocolItem, value: string) => {
        const newProtocol = [...protocol];
        newProtocol[index][field] = value;
        setProtocol(newProtocol);
    };

    const addProtocolRow = () => {
        setProtocol([...protocol, { compound: '', dosage: '', frequency: '' }]);
    };

    const removeProtocolRow = (index: number) => {
        setProtocol(protocol.filter((_, i) => i !== index));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setIsUploading(true);
            const files = Array.from(e.target.files) as File[];
            try {
                await onUpload(files);
                setUploadedFiles(prev => [...prev, ...files.map(f => f.name)]);
            } catch (error) {
                console.error("Upload error inside wizard", error);
                alert("Erro ao processar arquivos.");
            } finally {
                setIsUploading(false);
                if (e.target) e.target.value = '';
            }
        }
    };

    const handleNext = async () => {
        setIsSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                // Clone do objeto de métricas para atualização otimista local
                const updatedMetrics = { ...project.metrics };

                // Steps de Perfil e Biometria
                if (currentStep <= 4) {
                    await dataService.saveUserProfile(session.user.id, profileData);
                    onUpdateProfile(profileData);
                }
                
                // Step de Métricas Manuais
                if (currentStep === 3) {
                    const today = new Date().toLocaleDateString('pt-BR');
                    
                    if (manualTesto) {
                        const point = { date: today, value: parseFloat(manualTesto), unit: 'ng/dL', label: 'Wizard Input' };
                        await dataService.addMetric(project.id, 'Testosterone', point);
                        updatedMetrics['Testosterone'] = [...(updatedMetrics['Testosterone'] || []), point];
                    }
                    
                    if (manualE2) {
                        const point = { date: today, value: parseFloat(manualE2), unit: 'pg/mL', label: 'Wizard Input' };
                        await dataService.addMetric(project.id, 'Estradiol', point);
                        updatedMetrics['Estradiol'] = [...(updatedMetrics['Estradiol'] || []), point];
                    }
                    
                    // Propaga atualização para o App
                    onUpdateProject({ ...project, metrics: updatedMetrics });
                }

                // Step de Dieta (FIX: Agora atualiza o estado local 'metrics' com as calorias)
                if (currentStep === 6) {
                    await dataService.updateProjectSettings(project.id, objective, protocol, trainingNotes);
                    
                    if (calories) {
                        const today = new Date().toLocaleDateString('pt-BR');
                        const point = { 
                            date: today, 
                            value: parseInt(calories), 
                            unit: 'kcal', 
                            label: 'Wizard Setup' 
                        };
                        
                        await dataService.addMetric(project.id, 'Calories', point);
                        updatedMetrics['Calories'] = [...(updatedMetrics['Calories'] || []), point];
                    }
                    
                    onUpdateProject({ 
                        ...project, 
                        trainingNotes, 
                        objective, 
                        currentProtocol: protocol,
                        metrics: updatedMetrics // Envia as métricas atualizadas
                    });
                }

                // Step de Treino
                if (currentStep === 7) {
                    await dataService.updateProjectSettings(project.id, objective, protocol, trainingNotes);
                    onUpdateProject({ ...project, trainingNotes });
                }

                // Step de Protocolo e Final
                if (currentStep >= 8) {
                    const cleanProtocol = protocol.filter(p => p.compound.trim() !== '');
                    await dataService.updateProjectSettings(project.id, objective, cleanProtocol, trainingNotes);
                    onUpdateProject({ ...project, objective, currentProtocol: cleanProtocol, trainingNotes });
                }
            }

            if (currentStep < steps.length - 1) {
                setCurrentStep(prev => prev + 1);
            } else {
                onClose();
            }
        } catch (error) {
            console.error("Error saving wizard step:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(prev => prev - 1);
    };

    const inputClass = "w-full rounded-lg border-gray-300 p-3 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all border dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500";

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] dark:bg-gray-900 dark:border dark:border-gray-800">
                
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative shrink-0">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <IconWizard className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Completar Perfil</h2>
                            <p className="text-blue-100 text-xs font-medium">Passo {currentStep + 1} de {steps.length}</p>
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-black/20 rounded-full mt-4 overflow-hidden">
                        <div 
                            className="h-full bg-white transition-all duration-500 ease-out"
                            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                        />
                    </div>
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
                        ✕
                    </button>
                </div>

                <div className="p-8 flex-1 overflow-y-auto custom-scrollbar dark:bg-gray-900">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 dark:text-white">
                            {React.createElement(steps[currentStep].icon, { className: "w-5 h-5 text-blue-600 dark:text-blue-400" })}
                            {steps[currentStep].title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{steps[currentStep].description}</p>
                    </div>

                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300" key={currentStep}>
                        
                        {currentStep === 0 && (
                            <>
                                <label className="block">
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Nome ou Apelido</span>
                                    <input type="text" value={profileData.name || ''} onChange={e => handleProfileChange('name', e.target.value)} className={inputClass} placeholder="Como quer ser chamado?" autoFocus />
                                </label>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                     <label className="block">
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Nascimento</span>
                                        <input type="date" value={profileData.birthDate || ''} onChange={e => handleProfileChange('birthDate', e.target.value)} className={inputClass} />
                                    </label>
                                    <label className="block">
                                        <div className="flex items-center gap-1">
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Gênero</span>
                                            <Tooltip content="Usado para selecionar a fórmula correta de Taxa Metabólica Basal (Mifflin-St Jeor) e faixas de risco." position="top">
                                                <IconInfo className="w-3.5 h-3.5 text-gray-400 cursor-help dark:text-gray-500" />
                                            </Tooltip>
                                        </div>
                                        <select value={profileData.gender || 'Masculino'} onChange={e => handleProfileChange('gender', e.target.value as any)} className={inputClass}>
                                            <option value="Masculino">Masculino</option>
                                            <option value="Feminino">Feminino</option>
                                        </select>
                                    </label>
                                </div>
                            </>
                        )}

                        {currentStep === 1 && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                     <label className="block">
                                        <span className="text-sm font-bold text-gray-700 block mb-1 dark:text-gray-300">Altura</span>
                                        <div className="relative">
                                            <input type="number" value={profileData.height || ''} onChange={e => handleProfileChange('height', e.target.value)} className={`${inputClass} pr-8`} placeholder="175" autoFocus />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 dark:text-gray-500">cm</span>
                                        </div>
                                    </label>
                                    <label className="block">
                                        <span className="text-sm font-bold text-gray-700 block mb-1 dark:text-gray-300">Peso</span>
                                        <div className="relative">
                                            <input type="number" value={profileData.weight || ''} onChange={e => handleProfileChange('weight', e.target.value)} className={`${inputClass} pr-8`} placeholder="80" />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 dark:text-gray-500">kg</span>
                                        </div>
                                    </label>
                                </div>
                                <label className="block">
                                    <div className="flex items-center gap-1 mb-1">
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">BF (Percentual de Gordura)</span>
                                        <Tooltip content="Body Fat %. Se não souber exato, estime visualmente: ~15% (gomos aparecendo levemente), ~20% (sem definição), ~10% (muito definido)." position="top">
                                            <IconInfo className="w-3.5 h-3.5 text-gray-400 cursor-help dark:text-gray-500" />
                                        </Tooltip>
                                    </div>
                                    <div className="relative">
                                        <input type="number" value={profileData.bodyFat || ''} onChange={e => handleProfileChange('bodyFat', e.target.value)} className={`${inputClass} pr-8`} placeholder="15" />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 dark:text-gray-500">%</span>
                                    </div>
                                </label>
                            </>
                        )}

                        {currentStep === 2 && (
                            <>
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800 mb-2 flex gap-2 items-start dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-900/30">
                                    <IconInfo className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span>As medidas de Cintura e Quadril são obrigatórias para o cálculo de risco cardíaco (RCQ).</span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                     <label className="block">
                                        <div className="flex items-center gap-1 mb-1">
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Cintura</span>
                                            <Tooltip position="top" content={<div className="flex flex-col items-center"><BodyGuide part="waist" gender={profileData.gender} /><span className="text-center text-[10px] mt-2 leading-tight">{MEASUREMENT_HINTS.waist}</span></div>}>
                                                <IconInfo className="w-3.5 h-3.5 text-gray-400 cursor-help dark:text-gray-500" />
                                            </Tooltip>
                                        </div>
                                        <div className="relative">
                                            <input type="number" value={profileData.measurements?.waist || ''} onChange={e => handleMeasurementChange('waist', e.target.value)} className={`${inputClass} pr-8`} placeholder="80" autoFocus />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 dark:text-gray-500">cm</span>
                                        </div>
                                    </label>
                                    <label className="block">
                                        <div className="flex items-center gap-1 mb-1">
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Quadril</span>
                                            <Tooltip position="top" content={<div className="flex flex-col items-center"><BodyGuide part="hips" gender={profileData.gender} /><span className="text-center text-[10px] mt-2 leading-tight">{MEASUREMENT_HINTS.hips}</span></div>}>
                                                <IconInfo className="w-3.5 h-3.5 text-gray-400 cursor-help dark:text-gray-500" />
                                            </Tooltip>
                                        </div>
                                        <div className="relative">
                                            <input type="number" value={profileData.measurements?.hips || ''} onChange={e => handleMeasurementChange('hips', e.target.value)} className={`${inputClass} pr-8`} placeholder="100" />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 dark:text-gray-500">cm</span>
                                        </div>
                                    </label>
                                </div>

                                <div className="h-px bg-gray-200 my-2 dark:bg-gray-700" />
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <label className="block">
                                        <div className="flex items-center gap-1 mb-1">
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Peitoral</span>
                                            <Tooltip position="top" content={<div className="flex flex-col items-center"><BodyGuide part="chest" gender={profileData.gender} /><span className="text-center text-[10px] mt-2 leading-tight">{MEASUREMENT_HINTS.chest}</span></div>}>
                                                <IconInfo className="w-3.5 h-3.5 text-gray-400 cursor-help dark:text-gray-500" />
                                            </Tooltip>
                                        </div>
                                        <input type="number" value={profileData.measurements?.chest || ''} onChange={e => handleMeasurementChange('chest', e.target.value)} className={inputClass} placeholder="0" />
                                    </label>
                                    <label className="block">
                                        <div className="flex items-center gap-1 mb-1">
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Braço</span>
                                            <Tooltip position="top" content={<div className="flex flex-col items-center"><BodyGuide part="arm" gender={profileData.gender} /><span className="text-center text-[10px] mt-2 leading-tight">{MEASUREMENT_HINTS.arm}</span></div>}>
                                                <IconInfo className="w-3.5 h-3.5 text-gray-400 cursor-help dark:text-gray-500" />
                                            </Tooltip>
                                        </div>
                                        <input type="number" value={profileData.measurements?.arm || ''} onChange={e => handleMeasurementChange('arm', e.target.value)} className={inputClass} placeholder="0" />
                                    </label>
                                    <label className="block">
                                        <div className="flex items-center gap-1 mb-1">
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Coxa</span>
                                            <Tooltip position="top" content={<div className="flex flex-col items-center"><BodyGuide part="thigh" gender={profileData.gender} /><span className="text-center text-[10px] mt-2 leading-tight">{MEASUREMENT_HINTS.thigh}</span></div>}>
                                                <IconInfo className="w-3.5 h-3.5 text-gray-400 cursor-help dark:text-gray-500" />
                                            </Tooltip>
                                        </div>
                                        <input type="number" value={profileData.measurements?.thigh || ''} onChange={e => handleMeasurementChange('thigh', e.target.value)} className={inputClass} placeholder="0" />
                                    </label>
                                    <label className="block">
                                        <div className="flex items-center gap-1 mb-1">
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Panturrilha</span>
                                            <Tooltip position="top" content={<div className="flex flex-col items-center"><BodyGuide part="calf" gender={profileData.gender} /><span className="text-center text-[10px] mt-2 leading-tight">{MEASUREMENT_HINTS.calf}</span></div>}>
                                                <IconInfo className="w-3.5 h-3.5 text-gray-400 cursor-help dark:text-gray-500" />
                                            </Tooltip>
                                        </div>
                                        <input type="number" value={profileData.measurements?.calf || ''} onChange={e => handleMeasurementChange('calf', e.target.value)} className={inputClass} placeholder="0" />
                                    </label>
                                </div>
                            </>
                        )}

                        {/* NOVO STEP: MÉTRICAS MANUAIS */}
                        {currentStep === 3 && (
                            <>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 mb-2 flex gap-2 items-start dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-900/30">
                                    <IconInfo className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span>Se você tiver valores recentes de exames, insira-os aqui para popular o dashboard. Caso contrário, apenas avance.</span>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <label className="block">
                                        <div className="flex items-center gap-1 mb-1">
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Testosterona Total</span>
                                            <Tooltip content="Valor total de referência hormonal." position="top">
                                                <IconInfo className="w-3.5 h-3.5 text-gray-400 cursor-help dark:text-gray-500" />
                                            </Tooltip>
                                        </div>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                value={manualTesto} 
                                                onChange={e => setManualTesto(e.target.value)} 
                                                className={`${inputClass} pr-12`} 
                                                placeholder="Ex: 500" 
                                                autoFocus
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 dark:text-gray-500">ng/dL</span>
                                        </div>
                                    </label>
                                    
                                    <label className="block">
                                        <div className="flex items-center gap-1 mb-1">
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Estradiol (E2)</span>
                                            <Tooltip content="Importante para controle de colaterais." position="top">
                                                <IconInfo className="w-3.5 h-3.5 text-gray-400 cursor-help dark:text-gray-500" />
                                            </Tooltip>
                                        </div>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                value={manualE2} 
                                                onChange={e => setManualE2(e.target.value)} 
                                                className={`${inputClass} pr-12`} 
                                                placeholder="Ex: 30" 
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 dark:text-gray-500">pg/mL</span>
                                        </div>
                                    </label>
                                </div>
                            </>
                        )}

                        {currentStep === 4 && (
                            <>
                                <label className="block">
                                    <div className="flex items-center gap-1 mb-1">
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Doenças / Comorbidades</span>
                                        <Tooltip content="A IA usa isso para evitar sugerir treinos ou dietas perigosas para sua condição." position="top">
                                            <IconInfo className="w-3.5 h-3.5 text-gray-400 cursor-help dark:text-gray-500" />
                                        </Tooltip>
                                    </div>
                                    <textarea value={profileData.comorbidities || ''} onChange={e => handleProfileChange('comorbidities', e.target.value)} className={`${inputClass} h-20`} placeholder="Ex: Hipertensão, Diabetes, Lesão no joelho..." />
                                </label>
                                <label className="block">
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Medicamentos de Uso Contínuo</span>
                                    <textarea value={profileData.medications || ''} onChange={e => handleProfileChange('medications', e.target.value)} className={`${inputClass} h-20`} placeholder="Ex: Antidepressivos, Losartana..." />
                                </label>
                            </>
                        )}

                        {currentStep === 5 && (
                            <div className="space-y-4">
                                <div className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-xl p-6 text-center dark:bg-blue-900/10 dark:border-blue-900/30">
                                    <div className="mx-auto w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3 dark:bg-blue-900 dark:text-blue-300">
                                        {isUploading ? (
                                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <IconFolder className="w-6 h-6" />
                                        )}
                                    </div>
                                    <h4 className="text-sm font-bold text-gray-900 mb-1 dark:text-white">Importar Documentos</h4>
                                    <p className="text-xs text-gray-500 mb-4 px-4 dark:text-gray-400">
                                        Arraste ou clique para enviar exames de sangue (PDF) ou fotos de treinos/dietas. A IA analisará tudo automaticamente.
                                    </p>
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="bg-white border border-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg text-xs hover:bg-gray-50 transition-colors shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700"
                                    >
                                        {isUploading ? 'Processando...' : 'Selecionar Arquivos'}
                                    </button>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        onChange={handleFileUpload}
                                        accept=".pdf,.jpg,.jpeg,.png,.txt,.csv"
                                        multiple
                                    />
                                </div>

                                {uploadedFiles.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400">Enviados nesta sessão:</p>
                                        {uploadedFiles.map((f, i) => (
                                            <div key={i} className="flex items-center gap-2 bg-green-50 p-2 rounded-lg border border-green-100 text-xs text-green-800 dark:bg-green-900/20 dark:text-green-200 dark:border-green-900/30">
                                                <IconCheck className="w-4 h-4" />
                                                <span className="truncate flex-1">{f}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* STEP DIETA (Separado) */}
                        {currentStep === 6 && (
                            <label className="block">
                                <div className="flex items-center gap-1 mb-1">
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Dieta: Média Calórica</span>
                                    <Tooltip content="Quantas calorias você consome em média por dia atualmente? Se não souber, deixe em branco para a IA estimar." position="top">
                                        <IconInfo className="w-3.5 h-3.5 text-gray-400 cursor-help dark:text-gray-500" />
                                    </Tooltip>
                                </div>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        value={calories} 
                                        onChange={e => setCalories(e.target.value)} 
                                        className={`${inputClass} pr-12`} 
                                        placeholder="2500" 
                                        autoFocus
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 dark:text-gray-500">kcal/dia</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2 dark:text-gray-400">
                                    Dica: Se você usa apps como MyFitnessPal, coloque a média semanal aqui.
                                </p>
                            </label>
                        )}

                        {/* STEP TREINO (Separado) */}
                        {currentStep === 7 && (
                            <label className="block">
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Resumo do Treino / Rotina</span>
                                <textarea 
                                    value={trainingNotes} 
                                    onChange={e => setTrainingNotes(e.target.value)} 
                                    className={`${inputClass} h-40`} 
                                    placeholder="Ex: Musculação ABCDE (Seg a Sex). Cardio 30min TSD. Foco em ombros e pernas." 
                                    autoFocus
                                />
                                <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200 text-xs text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400">
                                    A IA usará isso para entender seu volume de treino atual.
                                </div>
                            </label>
                        )}

                        {currentStep === 8 && (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-1">
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">O que você está usando?</span>
                                        <Tooltip content="Liste tudo que usa para performance: Testosterona, Creatina, Whey, etc." position="top">
                                            <IconInfo className="w-3.5 h-3.5 text-gray-400 cursor-help dark:text-gray-500" />
                                        </Tooltip>
                                    </div>
                                    <button onClick={addProtocolRow} className="text-xs text-blue-600 font-bold flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded transition-colors dark:text-blue-400 dark:hover:bg-blue-900/30">
                                        <IconPlus className="w-3 h-3" /> Adicionar Item
                                    </button>
                                </div>
                                {protocol.length === 0 && (
                                    <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300 dark:bg-gray-800 dark:border-gray-700">
                                        <p className="text-xs text-gray-400 dark:text-gray-500">Nenhum protocolo cadastrado.</p>
                                        <button onClick={addProtocolRow} className="mt-2 text-sm text-blue-600 font-bold underline dark:text-blue-400">Adicionar</button>
                                    </div>
                                )}
                                {protocol.map((item, idx) => (
                                    <div key={idx} className="flex gap-2 items-start bg-gray-50 p-2 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                                        <div className="flex-1 space-y-2">
                                            <input 
                                                type="text" 
                                                placeholder="Composto (Ex: Dura)"
                                                value={item.compound}
                                                onChange={(e) => handleProtocolChange(idx, 'compound', e.target.value)}
                                                className="w-full text-xs border-gray-300 rounded p-1.5 bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            />
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    placeholder="Dose (Ex: 250mg)"
                                                    value={item.dosage}
                                                    onChange={(e) => handleProtocolChange(idx, 'dosage', e.target.value)}
                                                    className="w-1/2 text-xs border-gray-300 rounded p-1.5 bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                />
                                                <input 
                                                    type="text" 
                                                    placeholder="Freq (Ex: 1x/sem)"
                                                    value={item.frequency}
                                                    onChange={(e) => handleProtocolChange(idx, 'frequency', e.target.value)}
                                                    className="w-1/2 text-xs border-gray-300 rounded p-1.5 bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                />
                                            </div>
                                        </div>
                                        <button onClick={() => removeProtocolRow(idx)} className="text-gray-400 hover:text-red-500 p-1 dark:hover:text-red-400">
                                            <IconClose className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {currentStep === 9 && (
                            <>
                                <label className="block">
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Qual seu foco atual?</span>
                                    <select value={objective} onChange={e => setObjective(e.target.value as any)} className={inputClass}>
                                        <option value="Bulking">Bulking (Ganhar Massa)</option>
                                        <option value="Cutting">Cutting (Perder Gordura)</option>
                                        <option value="Performance">Performance Esportiva</option>
                                        <option value="Longevity">Longevidade / Saúde</option>
                                    </select>
                                </label>
                                <p className="text-xs text-gray-500 mt-2 dark:text-gray-400">A IA adaptará todas as respostas com base neste objetivo.</p>
                            </>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 flex justify-between bg-gray-50 shrink-0 dark:bg-gray-900 dark:border-gray-800">
                    <button 
                        onClick={handleBack}
                        disabled={currentStep === 0 || isSaving}
                        className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-200 rounded-lg disabled:opacity-30 transition-colors flex items-center gap-2 dark:text-gray-400 dark:hover:bg-gray-800"
                    >
                        <IconArrowLeft className="w-4 h-4" />
                        Voltar
                    </button>
                    <button 
                        onClick={handleNext}
                        disabled={isSaving || isUploading}
                        className="px-8 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all active:scale-95 shadow-lg flex items-center gap-2 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700"
                    >
                        {isSaving ? 'Salvando...' : currentStep === steps.length - 1 ? 'Concluir' : 'Próximo'}
                        {currentStep < steps.length - 1 && !isSaving && <span className="text-lg leading-none">→</span>}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default WizardModal;
