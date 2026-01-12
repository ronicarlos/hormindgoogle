
import React, { useState, useEffect } from 'react';
import { IconDumbbell, IconFlame, IconPill, IconCheck, IconClose, IconPlus } from './Icons';
import { ProtocolItem, DailyLogData, Project } from '../types';

interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: DailyLogData) => void;
  initialData?: Project | null; // Added to receive current DB state
}

const InputModal: React.FC<InputModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [activeTab, setActiveTab] = useState<'meta' | 'treino' | 'dieta' | 'protocolo'>('meta');
  
  // Form State
  const [goal, setGoal] = useState('Bulking');
  const [calories, setCalories] = useState('');
  const [trainingNotes, setTrainingNotes] = useState('');
  const [protocol, setProtocol] = useState<ProtocolItem[]>([
    { compound: '', dosage: '', frequency: '' }
  ]);

  // Load initial data when modal opens or project data changes
  useEffect(() => {
    if (initialData) {
        setGoal(initialData.objective || 'Bulking');
        
        // Load persistent Training Notes
        setTrainingNotes(initialData.trainingNotes || '');
        
        // Try to find latest calorie entry
        const calMetrics = initialData.metrics['Calories'];
        if (calMetrics && calMetrics.length > 0) {
            setCalories(calMetrics[calMetrics.length - 1].value.toString());
        }

        // Load existing protocol
        if (initialData.currentProtocol && initialData.currentProtocol.length > 0) {
            setProtocol(initialData.currentProtocol);
        } else {
             // Default placeholder if empty
             setProtocol([{ compound: '', dosage: '', frequency: '' }]);
        }
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleAddProtocolItem = () => {
    setProtocol([...protocol, { compound: '', dosage: '', frequency: '' }]);
  };

  const handleUpdateProtocol = (index: number, field: keyof ProtocolItem, value: string) => {
    const newProtocol = [...protocol];
    newProtocol[index][field] = value;
    setProtocol(newProtocol);
  };

  const handleRemoveProtocol = (index: number) => {
    setProtocol(protocol.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    // Filter out empty protocol lines
    const cleanProtocol = protocol.filter(p => p.compound.trim() !== '');

    onSave({
        goal,
        calories,
        trainingNotes,
        protocol: cleanProtocol
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Parâmetros & Métricas</h2>
            <p className="text-sm text-gray-500">Os dados salvos aqui persistem no seu projeto.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
            <IconClose className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 border-b border-gray-100">
          {[
            { id: 'meta', icon: IconCheck, label: 'Objetivo' },
            { id: 'treino', icon: IconDumbbell, label: 'Treino' },
            { id: 'dieta', icon: IconFlame, label: 'Dieta' },
            { id: 'protocolo', icon: IconPill, label: 'Protocolo' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          
          {activeTab === 'meta' && (
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Objetivo Atual</span>
                <select 
                    value={goal} 
                    onChange={(e) => setGoal(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 bg-gray-50 text-gray-900"
                >
                  <option value="Bulking">Bulking (Ganho de Massa)</option>
                  <option value="Cutting">Cutting (Perda de Gordura)</option>
                  <option value="Performance">Performance Esportiva</option>
                  <option value="Manutencao">Manutenção / Longevidade</option>
                </select>
              </label>
              <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                A IA usará este objetivo para calibrar sugestões de dieta e treino.
              </div>
            </div>
          )}

          {activeTab === 'treino' && (
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Registro do Treino / Rotina Atual</span>
                <textarea
                  value={trainingNotes}
                  onChange={(e) => setTrainingNotes(e.target.value)}
                  placeholder="Ex: Treino de Perna. Agachamento 140kg 3x5. Senti desconforto no joelho. Volume total alto."
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 bg-gray-50 h-40 text-gray-900 placeholder-gray-400"
                />
              </label>
              <div className="bg-green-50 p-4 rounded-lg text-sm text-green-800">
                Nota: Este campo agora salva sua rotina ou observações para análise contínua da IA.
              </div>
            </div>
          )}

          {activeTab === 'dieta' && (
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Calorias Diárias (Média Atual)</span>
                <div className="relative mt-1 rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <IconFlame className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="number"
                        value={calories}
                        onChange={(e) => setCalories(e.target.value)}
                        className="block w-full rounded-md border-gray-300 pl-10 p-3 bg-gray-50 focus:border-blue-500 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                        placeholder="Ex: 2500"
                    />
                </div>
              </label>
              <p className="text-xs text-gray-500">Você pode detalhar macros no campo de notas de treino se preferir.</p>
            </div>
          )}

          {activeTab === 'protocolo' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                 <h3 className="text-sm font-semibold text-gray-700">Compostos / Ergogênicos</h3>
                 <button onClick={handleAddProtocolItem} className="text-xs text-blue-600 font-medium flex items-center gap-1 hover:underline">
                    <IconPlus className="w-3 h-3" /> Adicionar
                 </button>
              </div>
              
              {protocol.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start bg-gray-50 p-3 rounded-lg border border-gray-200">
                   <div className="flex-1 space-y-2">
                      <input 
                        type="text" 
                        placeholder="Composto (Ex: Testosterona)"
                        value={item.compound}
                        onChange={(e) => handleUpdateProtocol(idx, 'compound', e.target.value)}
                        className="w-full text-sm border-gray-300 rounded p-1.5 bg-white text-gray-900 placeholder-gray-400"
                      />
                      <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="Dose (Ex: 250mg)"
                            value={item.dosage}
                            onChange={(e) => handleUpdateProtocol(idx, 'dosage', e.target.value)}
                            className="w-1/2 text-sm border-gray-300 rounded p-1.5 bg-white text-gray-900 placeholder-gray-400"
                        />
                        <input 
                            type="text" 
                            placeholder="Freq (Ex: 1x/sem)"
                            value={item.frequency}
                            onChange={(e) => handleUpdateProtocol(idx, 'frequency', e.target.value)}
                            className="w-1/2 text-sm border-gray-300 rounded p-1.5 bg-white text-gray-900 placeholder-gray-400"
                        />
                      </div>
                   </div>
                   <button onClick={() => handleRemoveProtocol(idx)} className="text-gray-400 hover:text-red-500 p-1">
                      <IconClose className="w-4 h-4" />
                   </button>
                </div>
              ))}
              
              <div className="bg-yellow-50 p-3 rounded-md border border-yellow-100 flex gap-2 items-start">
                 <div className="text-yellow-600 mt-0.5"><IconCheck className="w-4 h-4" /></div>
                 <p className="text-xs text-yellow-800">
                    Estes dados são salvos no banco e usados para calcular interações medicamentosas com seu perfil.
                 </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button onClick={handleSave} className="px-6 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-800">Salvar & Analisar</button>
        </div>
      </div>
    </div>
  );
};

export default InputModal;
