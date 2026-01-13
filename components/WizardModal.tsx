
import React, { useState, useEffect, useRef } from 'react';
import { Project, UserProfile, ProtocolItem } from '../types';
import { dataService } from '../services/dataService';
import { supabase } from '../lib/supabase';
import { IconWizard, IconCheck, IconArrowLeft, IconUser, IconActivity, IconFlame, IconAlert, IconScience, IconDumbbell, IconPill, IconPlus, IconClose, IconFolder } from './Icons';

interface WizardModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    onUpdateProfile: (profile: UserProfile) => void;
    onUpdateProject: (project: Project) => void;
    onUpload: (file: File) => Promise<void>; // NEW PROP
}

const steps = [
    { id: 'bio', title: 'Identificação', icon: IconUser, description: 'Dados básicos para a IA te conhecer.' },
    { id: 'anthro', title: 'Antropometria', icon: IconActivity, description: 'Peso e altura para cálculos metabólicos.' },
    { id: 'measure', title: 'Medidas', icon: IconFlame, description: 'Cintura e quadril (Risco Cardíaco).' },
    { id: 'health', title: 'Saúde', icon: IconAlert, description: 'Histórico médico e medicamentos.' },
    { id: 'upload', title: 'Exames & Arquivos', icon: IconFolder, description: 'Importe exames de sangue ou treinos antigos.' }, // NEW STEP
    { id: 'routine', title: 'Rotina & Dieta', icon: IconDumbbell, description: 'Contexto de treino e calorias.' },
    { id: 'protocol', title: 'Protocolo', icon: IconPill, description: 'Uso de recursos ergogênicos.' },
    { id: 'goal', title: 'Objetivo Final', icon: IconScience, description: 'Onde vamos chegar?' }
];

const WizardModal: React.FC<WizardModalProps> = ({ isOpen, onClose, project, onUpdateProfile, onUpdateProject, onUpload }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    
    // Upload State
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form States
    const [profileData, setProfileData] = useState<UserProfile>(project.userProfile || {} as UserProfile);
    const [objective, setObjective] = useState(project.objective);
    
    // Extended Data States (Project Level)
    const [trainingNotes, setTrainingNotes] = useState(project.trainingNotes || '');
    const [calories, setCalories] = useState('');
    const [protocol, setProtocol] = useState<ProtocolItem[]>([]);

    // Sync local state with project when it changes or opens
    useEffect(() => {
        if (project.userProfile) {
            setProfileData(project.userProfile);
        }
        if (project.objective) setObjective(project.objective);
        if (project.trainingNotes) setTrainingNotes(project.trainingNotes);
        if (project.currentProtocol) setProtocol(project.currentProtocol.length > 0 ? project.currentProtocol : [{ compound: '', dosage: '', frequency: '' }]);
        
        // Try to get latest calories
        const calMetrics = project.metrics['Calories'];
        if (calMetrics && calMetrics.length > 0) {
            setCalories(calMetrics[0].value.toString());
        }
    }, [project, isOpen]);

    // Intelligent Step Detection
    useEffect(() => {
        if (isOpen && project.userProfile) {
            const p = project.userProfile;
            let startStep = 0;

            if (!p.name || !p.birthDate || !p.gender) startStep = 0;
            else if (!p.height || !p.weight) startStep = 1;
            else if (!p.measurements.waist || !p.measurements.hips) startStep = 2;
            // Skip health check (optional)
            // Step 4 is Upload (Optional), we can skip to it if user has sources? No, let them see it.
            else if (!project.trainingNotes && !calories) startStep = 5; // Jump to Routine (index 5 now)
            else if ((!project.currentProtocol || project.currentProtocol.length === 0) && project.objective !== 'Longevity') startStep = 6; // Jump to Protocol
            else if (!project.objective) startStep = 7;
            else startStep = 0; // Review mode

            setCurrentStep(startStep);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // --- HANDLERS ---

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
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            await onUpload(file);
            setUploadedFiles(prev => [...prev, file.name]);
        } catch (error) {
            console.error("Upload error inside wizard", error);
            alert("Erro ao processar arquivo. Tente novamente.");
        } finally {
            setIsUploading(false);
            if (e.target) e.target.value = '';
        }
    };

    const handleNext = async () => {
        setIsSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                // 1. Save Profile Data (Steps 0-3)
                if (currentStep <= 3) {
                    await dataService.saveUserProfile(session.user.id, profileData);
                    onUpdateProfile(profileData);
                }
                
                // Step 4 is Upload (handled immediately by onUpload), so no explicit save needed here.

                // 2. Save Routine & Diet (Step 5 - moved index)
                if (currentStep === 5) {
                    // Update notes
                    await dataService.updateProjectSettings(project.id, objective, protocol, trainingNotes);
                    // Add calorie metric if changed/new
                    if (calories) {
                        const today = new Date().toLocaleDateString('pt-BR');
                        await dataService.addMetric(project.id, 'Calories', {
                            date: today,
                            value: parseInt(calories),
                            unit: 'kcal',
                            label: 'Wizard Setup'
                        });
                    }
                    onUpdateProject({ ...project, trainingNotes, objective, currentProtocol: protocol });
                }

                // 3. Save Protocol (Step 6) & Final Objective (Step 7)
                if (currentStep >= 6) {
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

    const inputClass = "w-full rounded-lg border-gray-300 p-3 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all border";

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh]">
                
                {/* Header */}
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
                    {/* Progress Bar */}
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

                {/* Body */}
                <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            {React.createElement(steps[currentStep].icon, { className: "w-5 h-5 text-blue-600" })}
                            {steps[currentStep].title}
                        </h3>
                        <p className="text-sm text-gray-500">{steps[currentStep].description}</p>
                    </div>

                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300" key={currentStep}>
                        
                        {/* STEP 0: Identificação */}
                        {currentStep === 0 && (
                            <>
                                <label className="block">
                                    <span className="text-sm font-bold text-gray-700">Nome ou Apelido</span>
                                    <input type="text" value={profileData.name} onChange={e => handleProfileChange('name', e.target.value)} className={inputClass} placeholder="Como quer ser chamado?" autoFocus />
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                     <label className="block">
                                        <span className="text-sm font-bold text-gray-700">Nascimento</span>
                                        <input type="date" value={profileData.birthDate} onChange={e => handleProfileChange('birthDate', e.target.value)} className={inputClass} />
                                    </label>
                                    <label className="block">
                                        <span className="text-sm font-bold text-gray-700">Gênero</span>
                                        <select value={profileData.gender} onChange={e => handleProfileChange('gender', e.target.value as any)} className={inputClass}>
                                            <option value="Masculino">Masculino</option>
                                            <option value="Feminino">Feminino</option>
                                        </select>
                                    </label>
                                </div>
                            </>
                        )}

                        {/* STEP 1: Antropometria */}
                        {currentStep === 1 && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                     <label className="block">
                                        <span className="text-sm font-bold text-gray-700">Altura (cm)</span>
                                        <input type="number" value={profileData.height} onChange={e => handleProfileChange('height', e.target.value)} className={inputClass} placeholder="175" autoFocus />
                                    </label>
                                    <label className="block">
                                        <span className="text-sm font-bold text-gray-700">Peso (kg)</span>
                                        <input type="number" value={profileData.weight} onChange={e => handleProfileChange('weight', e.target.value)} className={inputClass} placeholder="80" />
                                    </label>
                                </div>
                                <label className="block">
                                    <span className="text-sm font-bold text-gray-700">BF % Estimado (Opcional)</span>
                                    <input type="number" value={profileData.bodyFat} onChange={e => handleProfileChange('bodyFat', e.target.value)} className={inputClass} placeholder="15" />
                                </label>
                                <p className="text-xs text-gray-500 bg-gray-100 p-2 rounded">Isso permite o cálculo automático do seu IMC e TMB (Metabolismo Basal).</p>
                            </>
                        )}

                        {/* STEP 2: Medidas Críticas */}
                        {currentStep === 2 && (
                            <>
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800 mb-2">
                                    <strong>Importante:</strong> Usamos a Cintura e Quadril para calcular seu risco cardíaco (RCQ).
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                     <label className="block">
                                        <span className="text-sm font-bold text-gray-700">Cintura (Umbigo)</span>
                                        <input type="number" value={profileData.measurements.waist} onChange={e => handleMeasurementChange('waist', e.target.value)} className={inputClass} placeholder="cm" autoFocus />
                                    </label>
                                    <label className="block">
                                        <span className="text-sm font-bold text-gray-700">Quadril (Maior porção)</span>
                                        <input type="number" value={profileData.measurements.hips} onChange={e => handleMeasurementChange('hips', e.target.value)} className={inputClass} placeholder="cm" />
                                    </label>
                                </div>
                            </>
                        )}

                        {/* STEP 3: Saúde */}
                        {currentStep === 3 && (
                            <>
                                <label className="block">
                                    <span className="text-sm font-bold text-gray-700">Doenças / Comorbidades</span>
                                    <textarea value={profileData.comorbidities} onChange={e => handleProfileChange('comorbidities', e.target.value)} className={`${inputClass} h-20`} placeholder="Ex: Hipertensão, Diabetes, Lesão no joelho..." />
                                </label>
                                <label className="block">
                                    <span className="text-sm font-bold text-gray-700">Medicamentos em Uso</span>
                                    <textarea value={profileData.medications} onChange={e => handleProfileChange('medications', e.target.value)} className={`${inputClass} h-20`} placeholder="Ex: Antidepressivos, Losartana..." />
                                </label>
                            </>
                        )}

                        {/* STEP 4: Exames e Arquivos (NEW) */}
                        {currentStep === 4 && (
                            <div className="space-y-4">
                                <div className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-xl p-6 text-center">
                                    <div className="mx-auto w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
                                        {isUploading ? (
                                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <IconFolder className="w-6 h-6" />
                                        )}
                                    </div>
                                    <h4 className="text-sm font-bold text-gray-900 mb-1">Importar Documentos</h4>
                                    <p className="text-xs text-gray-500 mb-4 px-4">
                                        Arraste ou clique para enviar exames de sangue (PDF) ou fotos de treinos/dietas. A IA analisará tudo automaticamente.
                                    </p>
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="bg-white border border-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg text-xs hover:bg-gray-50 transition-colors shadow-sm"
                                    >
                                        {isUploading ? 'Processando...' : 'Selecionar Arquivo'}
                                    </button>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        onChange={handleFileUpload}
                                        accept=".pdf,.jpg,.jpeg,.png,.txt,.csv"
                                    />
                                </div>

                                {uploadedFiles.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Enviados nesta sessão:</p>
                                        {uploadedFiles.map((f, i) => (
                                            <div key={i} className="flex items-center gap-2 bg-green-50 p-2 rounded-lg border border-green-100 text-xs text-green-800">
                                                <IconCheck className="w-4 h-4" />
                                                <span className="truncate flex-1">{f}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                <p className="text-[10px] text-gray-400 text-center italic">
                                    Os dados extraídos dos exames (como testosterona, colesterol) aparecerão no seu painel assim que processados.
                                </p>
                            </div>
                        )}

                        {/* STEP 5: Rotina e Dieta (Moved index) */}
                        {currentStep === 5 && (
                            <>
                                <label className="block">
                                    <span className="text-sm font-bold text-gray-700">Dieta: Média Calórica (Kcal/dia)</span>
                                    <input 
                                        type="number" 
                                        value={calories} 
                                        onChange={e => setCalories(e.target.value)} 
                                        className={inputClass} 
                                        placeholder="Ex: 2500" 
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Se não souber, deixe em branco. A IA calculará sua TMB.</p>
                                </label>
                                <label className="block">
                                    <span className="text-sm font-bold text-gray-700">Resumo do Treino / Rotina</span>
                                    <textarea 
                                        value={trainingNotes} 
                                        onChange={e => setTrainingNotes(e.target.value)} 
                                        className={`${inputClass} h-32`} 
                                        placeholder="Ex: Musculação ABCDE (Seg a Sex). Cardio 30min TSD. Foco em ombros." 
                                    />
                                </label>
                            </>
                        )}

                        {/* STEP 6: Protocolo (Moved index) */}
                        {currentStep === 6 && (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-bold text-gray-700">O que você está usando?</span>
                                    <button onClick={addProtocolRow} className="text-xs text-blue-600 font-bold flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded transition-colors">
                                        <IconPlus className="w-3 h-3" /> Adicionar Item
                                    </button>
                                </div>
                                {protocol.length === 0 && (
                                    <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                        <p className="text-xs text-gray-400">Nenhum protocolo cadastrado.</p>
                                        <button onClick={addProtocolRow} className="mt-2 text-sm text-blue-600 font-bold underline">Adicionar</button>
                                    </div>
                                )}
                                {protocol.map((item, idx) => (
                                    <div key={idx} className="flex gap-2 items-start bg-gray-50 p-2 rounded-lg border border-gray-200">
                                        <div className="flex-1 space-y-2">
                                            <input 
                                                type="text" 
                                                placeholder="Composto (Ex: Dura)"
                                                value={item.compound}
                                                onChange={(e) => handleProtocolChange(idx, 'compound', e.target.value)}
                                                className="w-full text-xs border-gray-300 rounded p-1.5"
                                            />
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    placeholder="Dose"
                                                    value={item.dosage}
                                                    onChange={(e) => handleProtocolChange(idx, 'dosage', e.target.value)}
                                                    className="w-1/2 text-xs border-gray-300 rounded p-1.5"
                                                />
                                                <input 
                                                    type="text" 
                                                    placeholder="Freq"
                                                    value={item.frequency}
                                                    onChange={(e) => handleProtocolChange(idx, 'frequency', e.target.value)}
                                                    className="w-1/2 text-xs border-gray-300 rounded p-1.5"
                                                />
                                            </div>
                                        </div>
                                        <button onClick={() => removeProtocolRow(idx)} className="text-gray-400 hover:text-red-500 p-1">
                                            <IconClose className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-800 leading-relaxed">
                                    Se você for <strong>Natural</strong>, deixe vazio ou escreva "Natural". A IA usará isso para ajustar expectativas de recuperação.
                                </div>
                            </div>
                        )}

                        {/* STEP 7: Objetivo (Moved index) */}
                        {currentStep === 7 && (
                            <>
                                <label className="block">
                                    <span className="text-sm font-bold text-gray-700">Qual seu foco atual?</span>
                                    <select value={objective} onChange={e => setObjective(e.target.value as any)} className={inputClass}>
                                        <option value="Bulking">Bulking (Ganhar Massa)</option>
                                        <option value="Cutting">Cutting (Perder Gordura)</option>
                                        <option value="Performance">Performance Esportiva</option>
                                        <option value="Longevity">Longevidade / Saúde</option>
                                    </select>
                                </label>
                                <p className="text-xs text-gray-500 mt-2">A IA adaptará todas as respostas com base neste objetivo.</p>
                            </>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex justify-between bg-gray-50 shrink-0">
                    <button 
                        onClick={handleBack}
                        disabled={currentStep === 0 || isSaving}
                        className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-200 rounded-lg disabled:opacity-30 transition-colors flex items-center gap-2"
                    >
                        <IconArrowLeft className="w-4 h-4" />
                        Voltar
                    </button>
                    <button 
                        onClick={handleNext}
                        disabled={isSaving || isUploading} // Disable if uploading
                        className="px-8 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all active:scale-95 shadow-lg flex items-center gap-2 disabled:opacity-50"
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
