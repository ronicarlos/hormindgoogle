
import React, { useState, useEffect, useRef } from 'react';
import { Project, UserProfile, ProtocolItem } from '../types';
import { dataService } from '../services/dataService';
import { supabase } from '../lib/supabase';
import { IconWizard, IconCheck, IconArrowLeft, IconUser, IconActivity, IconFlame, IconAlert, IconScience, IconDumbbell, IconPill, IconPlus, IconClose, IconFolder, IconInfo } from './Icons';
import { Tooltip } from './Tooltip';
import BodyGuide from './BodyGuide'; // Usando componente centralizado

interface WizardModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    onUpdateProfile: (profile: UserProfile) => void;
    onUpdateProject: (project: Project) => void;
    onUpload: (files: File[]) => Promise<void>;
    onRequestAnalysis?: (context: string) => void; 
}

const steps = [
    { id: 'bio', title: 'Identificação', icon: IconUser, description: 'Dados básicos para a IA te conhecer.' },
    { id: 'anthro', title: 'Metas & Antropometria', icon: IconActivity, description: 'Defina seu ponto de partida e onde quer chegar.' },
    { id: 'measure', title: 'Medidas (Biometria)', icon: IconFlame, description: 'Circunferências corporais atuais e alvos.' },
    { id: 'metrics', title: 'Marcadores Chave', icon: IconScience, description: 'Valores recentes de referência (Opcional).' },
    { id: 'health', title: 'Saúde', icon: IconAlert, description: 'Histórico médico e medicamentos.' },
    { id: 'upload', title: 'Exames & Arquivos', icon: IconFolder, description: 'Importe exames de sangue ou treinos antigos.' },
    { id: 'diet', title: 'Dieta & Calorias', icon: IconFlame, description: 'Sua ingestão calórica atual.' },
    { id: 'training', title: 'Rotina de Treino', icon: IconDumbbell, description: 'Como você está treinando hoje.' },
    { id: 'protocol', title: 'Protocolo', icon: IconPill, description: 'Uso de recursos ergogênicos.' },
    { id: 'goal', title: 'Objetivo Final', icon: IconCheck, description: 'Onde vamos chegar?' }
];

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

const WizardModal: React.FC<WizardModalProps> = ({ isOpen, onClose, project, onUpdateProfile, onUpdateProject, onUpload, onRequestAnalysis }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Estado local com suporte a Targets
    const [profileData, setProfileData] = useState<UserProfile>(() => {
        const base = project.userProfile || {} as any;
        return {
            ...base,
            measurements: base.measurements || { chest: '', arm: '', waist: '', hips: '', thigh: '', calf: '' },
            targetMeasurements: base.targetMeasurements || { chest: '', arm: '', waist: '', hips: '', thigh: '', calf: '' }
        };
    });
    
    const [objective, setObjective] = useState(project.objective);
    const [trainingNotes, setTrainingNotes] = useState(project.trainingNotes || '');
    const [calories, setCalories] = useState('');
    const [protocol, setProtocol] = useState<ProtocolItem[]>([]);
    
    const [manualTesto, setManualTesto] = useState('');
    const [manualE2, setManualE2] = useState('');
    
    // Estado visual para o BodyGuide
    const [activeMeasurement, setActiveMeasurement] = useState<string>('chest');

    useEffect(() => {
        if (!isOpen) return;

        if (project.userProfile) {
            const p = project.userProfile;
            setProfileData({
                ...p,
                measurements: p.measurements || { chest: '', arm: '', waist: '', hips: '', thigh: '', calf: '' },
                targetMeasurements: p.targetMeasurements || { chest: '', arm: '', waist: '', hips: '', thigh: '', calf: '' }
            });
        }

        if (project.objective) setObjective(project.objective);
        if (project.trainingNotes) setTrainingNotes(project.trainingNotes);
        if (project.currentProtocol) setProtocol(project.currentProtocol.length > 0 ? project.currentProtocol : [{ compound: '', dosage: '', frequency: '' }]);
        
        // Carregar calorias
        if (project.dietCalories) {
            setCalories(project.dietCalories);
        } else {
            const calMetrics = project.metrics['Calories'];
            if (calMetrics && calMetrics.length > 0) {
                const sorted = [...calMetrics].sort((a,b) => {
                     const da = a.date.split('/').reverse().join('-');
                     const db = b.date.split('/').reverse().join('-');
                     return new Date(db).getTime() - new Date(da).getTime();
                });
                setCalories(sorted[0].value.toString());
            } else {
                setCalories(''); 
            }
        }
        
        const testoMetrics = project.metrics['Testosterone'] || project.metrics['Testosterona'];
        if (testoMetrics && testoMetrics.length > 0) setManualTesto(testoMetrics[testoMetrics.length - 1].value.toString());
        
        const e2Metrics = project.metrics['Estradiol'];
        if (e2Metrics && e2Metrics.length > 0) setManualE2(e2Metrics[e2Metrics.length - 1].value.toString());

    }, [project, isOpen]);

    // Lógica de "Resume" (começar de onde parou)
    useEffect(() => {
        if (isOpen && project.userProfile) {
            const p = project.userProfile;
            let startStep = 0;

            if (!p.name || !p.birthDate || !p.gender) startStep = 0;
            else if (!p.height || !p.weight) startStep = 1;
            else if (!p.measurements?.waist || !p.measurements?.hips) startStep = 2;
            else if (!manualTesto && !manualE2 && !project.metrics['Testosterone']) startStep = 3;
            else if (!p.comorbidities && !p.medications) startStep = 4;
            else startStep = 0; 

            setCurrentStep(startStep);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleProfileChange = (field: keyof UserProfile, value: string) => {
        setProfileData(prev => ({ ...prev, [field]: value }));
    };

    const handleMeasurementChange = (type: 'current' | 'target', field: string, value: string) => {
        setActiveMeasurement(field);
        setProfileData(prev => {
            if (type === 'current') {
                return { 
                    ...prev, 
                    measurements: { ...prev.measurements, [field]: value } 
                };
            } else {
                return { 
                    ...prev, 
                    targetMeasurements: { ...(prev.targetMeasurements || {}), [field]: value } as any
                };
            }
        });
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
                const updatedMetrics = { ...project.metrics };
                const cleanProtocol = protocol.filter(p => p.compound.trim() !== '');

                // Salva perfil progressivamente nos primeiros passos
                if (currentStep <= 4) {
                    await dataService.saveUserProfile(session.user.id, profileData);
                    onUpdateProfile(profileData);
                }
                
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
                    onUpdateProject({ ...project, metrics: updatedMetrics });
                }

                if (currentStep >= 6) {
                    // Update settings for Diet/Training/Protocol/Goals
                    await dataService.updateProjectSettings(project.id, objective, cleanProtocol, trainingNotes, calories);
                    
                    // Se for o passo de dieta, adiciona métrica
                    if (currentStep === 6) {
                        const calValue = parseInt(calories);
                        if (!isNaN(calValue) && calValue > 0) {
                            const today = new Date().toLocaleDateString('pt-BR');
                            const point = { date: today, value: calValue, unit: 'kcal', label: 'Wizard Setup' };
                            await dataService.addMetric(project.id, 'Calories', point);
                            updatedMetrics['Calories'] = [...(updatedMetrics['Calories'] || []), point];
                        }
                    }
                    
                    onUpdateProject({ 
                        ...project, 
                        trainingNotes, 
                        objective, 
                        currentProtocol: cleanProtocol, 
                        dietCalories: calories,
                        metrics: updatedMetrics
                    });
                }
            }

            if (currentStep < steps.length - 1) {
                setCurrentStep(prev => prev + 1);
            } else {
                onClose();
                if (onRequestAnalysis) {
                    onRequestAnalysis("O usuário completou o preenchimento inicial do Wizard (Perfil, Dieta, Treino, Protocolo e Objetivos).");
                }
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
                
                {/* Header Gradient */}
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

                {/* Content */}
                <div className="p-6 md:p-8 flex-1 overflow-y-auto custom-scrollbar dark:bg-gray-900">
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

                        {/* STEP 1: ANTROPOMETRIA (COM METAS) */}
                        {currentStep === 1 && (
                            <div className="space-y-4">
                                {/* Altura (Fixo) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <label className="block">
                                        <span className="text-sm font-bold text-gray-700 block mb-1 dark:text-gray-300">Altura (cm)</span>
                                        <div className="relative">
                                            <input type="number" value={profileData.height || ''} onChange={e => handleProfileChange('height', e.target.value)} className={inputClass} placeholder="175" autoFocus />
                                        </div>
                                    </label>
                                    <div className="hidden md:block"></div> {/* Spacer */}
                                </div>

                                <div className="h-px bg-gray-200 dark:bg-gray-800" />

                                {/* Peso (Atual vs Meta) */}
                                <div className="grid grid-cols-2 gap-4">
                                    <label className="block">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block dark:text-gray-400">Peso Atual</span>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                value={profileData.weight || ''} 
                                                onChange={e => handleProfileChange('weight', e.target.value)} 
                                                className={`${inputClass} border-l-4 border-l-blue-500`} 
                                                placeholder="80" 
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">kg</span>
                                        </div>
                                    </label>
                                    <label className="block">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block dark:text-gray-400">Meta</span>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                value={profileData.targetWeight || ''} 
                                                onChange={e => handleProfileChange('targetWeight', e.target.value)} 
                                                className={`${inputClass} border-l-4 border-l-emerald-500 bg-emerald-50/20 dark:bg-emerald-900/10`} 
                                                placeholder="75" 
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">kg</span>
                                        </div>
                                    </label>
                                </div>

                                {/* BF (Atual vs Meta) */}
                                <div className="grid grid-cols-2 gap-4">
                                    <label className="block">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block dark:text-gray-400">BF% Atual</span>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                value={profileData.bodyFat || ''} 
                                                onChange={e => handleProfileChange('bodyFat', e.target.value)} 
                                                className={`${inputClass} border-l-4 border-l-blue-500`} 
                                                placeholder="20" 
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">%</span>
                                        </div>
                                    </label>
                                    <label className="block">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block dark:text-gray-400">Meta</span>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                value={profileData.targetBodyFat || ''} 
                                                onChange={e => handleProfileChange('targetBodyFat', e.target.value)} 
                                                className={`${inputClass} border-l-4 border-l-emerald-500 bg-emerald-50/20 dark:bg-emerald-900/10`} 
                                                placeholder="12" 
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">%</span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: MEDIDAS (COM BODYGUIDE E METAS) */}
                        {currentStep === 2 && (
                            <div className="space-y-4">
                                {/* Lista de Medidas */}
                                <div className="grid grid-cols-3 text-[10px] font-bold text-gray-400 uppercase text-center mb-1">
                                    <span className="text-left pl-1">Local</span>
                                    <span>Atual</span>
                                    <span>Meta</span>
                                </div>

                                {['waist', 'hips', 'chest', 'arm', 'thigh', 'calf'].map((part) => (
                                    <div key={part} className="grid grid-cols-3 gap-2 items-center group" onMouseEnter={() => setActiveMeasurement(part)}>
                                        
                                        {/* Label + Tooltip Visual */}
                                        <div className="flex items-center gap-1.5 pl-1">
                                            <span className={`text-xs font-bold capitalize ${activeMeasurement === part ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                                {LABELS_PT[part]}
                                            </span>
                                            <Tooltip content={
                                                <div className="flex flex-col items-center gap-2 p-2">
                                                    <span className="text-[10px] text-center text-gray-300">{MEASUREMENT_HINTS[part]}</span>
                                                    {/* Mini BodyGuide no Tooltip */}
                                                    <BodyGuide part={part} gender={profileData.gender} className="h-24 w-auto bg-white/5 rounded p-1" />
                                                </div>
                                            } position="right">
                                                <IconInfo className="w-3 h-3 text-gray-400 cursor-help hover:text-blue-500 transition-colors" />
                                            </Tooltip>
                                        </div>

                                        {/* Input Atual */}
                                        <input 
                                            type="number"
                                            value={profileData.measurements?.[part as any] || ''}
                                            onChange={(e) => handleMeasurementChange('current', part, e.target.value)}
                                            className="w-full rounded-md border-gray-300 p-2 text-xs text-center bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                            placeholder="-"
                                            onFocus={() => setActiveMeasurement(part)}
                                        />

                                        {/* Input Meta */}
                                        <input 
                                            type="number"
                                            value={profileData.targetMeasurements?.[part as any] || ''}
                                            onChange={(e) => handleMeasurementChange('target', part, e.target.value)}
                                            className="w-full rounded-md border-gray-300 p-2 text-xs text-center bg-emerald-50/50 focus:ring-emerald-500 border-dashed dark:bg-emerald-900/10 dark:border-gray-700 dark:text-white"
                                            placeholder="-"
                                            onFocus={() => setActiveMeasurement(part)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="grid grid-cols-1 gap-4">
                                <label className="block">
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Testosterona Total</span>
                                    <div className="relative">
                                        <input type="number" value={manualTesto} onChange={e => setManualTesto(e.target.value)} className={`${inputClass} pr-12`} placeholder="Ex: 500" autoFocus />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 dark:text-gray-500">ng/dL</span>
                                    </div>
                                </label>
                                <label className="block">
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Estradiol (E2)</span>
                                    <div className="relative">
                                        <input type="number" value={manualE2} onChange={e => setManualE2(e.target.value)} className={`${inputClass} pr-12`} placeholder="Ex: 30" />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 dark:text-gray-500">pg/mL</span>
                                    </div>
                                </label>
                            </div>
                        )}
                        {currentStep === 4 && (
                            <>
                                <label className="block">
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Doenças / Comorbidades</span>
                                    <textarea value={profileData.comorbidities || ''} onChange={e => handleProfileChange('comorbidities', e.target.value)} className={`${inputClass} h-20`} placeholder="Ex: Hipertensão, Diabetes..." />
                                </label>
                                <label className="block">
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Medicamentos</span>
                                    <textarea value={profileData.medications || ''} onChange={e => handleProfileChange('medications', e.target.value)} className={`${inputClass} h-20`} placeholder="Ex: Losartana..." />
                                </label>
                            </>
                        )}
                        {currentStep === 5 && (
                            <div className="space-y-4">
                                <div className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-xl p-6 text-center dark:bg-blue-900/10 dark:border-blue-900/30">
                                    <IconFolder className="mx-auto w-12 h-12 text-blue-600 mb-3 dark:text-blue-300" />
                                    <h4 className="text-sm font-bold text-gray-900 mb-1 dark:text-white">Importar Documentos</h4>
                                    <button onClick={() => fileInputRef.current?.click()} className="bg-white border border-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg text-xs hover:bg-gray-50 transition-colors shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                                        {isUploading ? 'Processando...' : 'Selecionar Arquivos'}
                                    </button>
                                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".pdf,.jpg,.jpeg,.png" multiple />
                                </div>
                                {uploadedFiles.length > 0 && <div className="space-y-2">{uploadedFiles.map((f, i) => <div key={i} className="flex items-center gap-2 bg-green-50 p-2 rounded-lg border border-green-100 text-xs text-green-800 dark:bg-green-900/20 dark:text-green-200"><IconCheck className="w-4 h-4" /><span>{f}</span></div>)}</div>}
                            </div>
                        )}

                        {/* STEP DIETA (Separado) */}
                        {currentStep === 6 && (
                            <label className="block">
                                <div className="flex items-center gap-1 mb-1">
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Dieta: Média Calórica</span>
                                    <Tooltip content="Quantas calorias você consome em média por dia atualmente?" position="top">
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
                                    Dica: Isso será salvo nas configurações do seu projeto e no histórico de métricas.
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
                        {isSaving ? 'Salvando...' : currentStep === steps.length - 1 ? 'Salvar & Continuar' : 'Próximo'}
                        {currentStep < steps.length - 1 && !isSaving && <span className="text-lg leading-none">→</span>}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default WizardModal;
