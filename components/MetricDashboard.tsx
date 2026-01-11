import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';
import { Project, RiskFlag } from '../types';
import { IconActivity, IconAlert, IconSparkles, IconFlame, IconDumbbell } from './Icons';

interface MetricDashboardProps {
  project: Project;
  risks: RiskFlag[];
  onGenerateProntuario: () => void;
}

const MetricDashboard: React.FC<MetricDashboardProps> = ({ project, risks, onGenerateProntuario }) => {
  const [activeTab, setActiveTab] = useState<'health' | 'performance'>('health');

  // Dynamic Data from Project Props
  const testosteroneData = project.metrics['Testosterone'] || [];
  const bodyWeightData = project.metrics['BodyWeight'] || [];
  const strengthData = project.metrics['Strength'] || [];
  const calorieData = project.metrics['Calories'] || [];

  return (
    <div className="w-96 bg-white border-l border-gray-200 h-screen flex flex-col overflow-y-auto hidden lg:flex">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <div>
            <h2 className="text-lg font-bold text-gray-800">Painel</h2>
            <p className="text-sm text-gray-500">{project.name}</p>
        </div>
        <button 
            onClick={onGenerateProntuario}
            className="text-[10px] bg-gray-900 text-white px-2 py-1 rounded hover:bg-gray-700 transition-colors"
        >
            Emitir Prontuário
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        <button 
            onClick={() => setActiveTab('health')}
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'health' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
        >
            Saúde
        </button>
        <button 
            onClick={() => setActiveTab('performance')}
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'performance' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}
        >
            Performance
        </button>
      </div>

      {/* Risks Section (Always Visible if High) */}
      {risks.length > 0 && (
        <div className="p-6 border-b border-gray-100 bg-red-50/50">
          <div className="flex items-center gap-2 mb-3 text-red-700">
            <IconAlert className="w-5 h-5" />
            <h3 className="font-semibold text-sm uppercase tracking-wide">Alertas Críticos</h3>
          </div>
          <div className="space-y-3">
            {risks.map((risk, idx) => (
              <div key={idx} className="bg-white p-3 rounded-md border border-red-100 shadow-sm">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-red-500 border border-red-200 px-1.5 rounded">
                    {risk.category === 'Health' ? 'Saúde' : risk.category === 'Training' ? 'Treino' : 'Farmaco'}
                  </span>
                  <span className="text-[10px] text-gray-400 uppercase">{risk.level === 'HIGH' ? 'ALTO' : 'MÉDIO'}</span>
                </div>
                <p className="text-sm text-gray-700 mt-1 leading-snug">{risk.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="p-6 space-y-8">
        
        {activeTab === 'health' && (
            <>
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                            <IconActivity className="w-4 h-4 text-blue-500" />
                            Biomarcadores
                        </h3>
                    </div>
                    {testosteroneData.length > 0 ? (
                        <div className="h-40 w-full bg-gray-50 rounded-lg p-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={testosteroneData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis dataKey="date" hide />
                                    <YAxis hide domain={['dataMin - 50', 'dataMax + 50']} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                                </LineChart>
                            </ResponsiveContainer>
                            <div className="text-center mt-1"><span className="text-xs text-gray-500">Testosterona (ng/dL)</span></div>
                        </div>
                    ) : (
                        <div className="h-20 flex items-center justify-center text-xs text-gray-400 bg-gray-50 rounded">Sem dados de exames</div>
                    )}
                </div>

                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                            <IconActivity className="w-4 h-4 text-emerald-500" />
                            Peso Corporal
                        </h3>
                    </div>
                    {bodyWeightData.length > 0 ? (
                        <div className="h-40 w-full bg-gray-50 rounded-lg p-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={bodyWeightData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis dataKey="date" hide />
                                    <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                                    <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                                </LineChart>
                            </ResponsiveContainer>
                            <div className="text-center mt-1"><span className="text-xs text-gray-500">Peso (kg)</span></div>
                        </div>
                    ) : (
                        <div className="h-20 flex items-center justify-center text-xs text-gray-400 bg-gray-50 rounded">Sem dados de peso</div>
                    )}
                </div>
            </>
        )}

        {activeTab === 'performance' && (
            <>
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                            <IconDumbbell className="w-4 h-4 text-purple-500" />
                            Força (1RM Est.)
                        </h3>
                    </div>
                    {strengthData.length > 0 ? (
                        <div className="h-40 w-full bg-gray-50 rounded-lg p-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={strengthData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis dataKey="date" tick={{fontSize: 10}} />
                                    <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                                    <Line type="step" dataKey="value" stroke="#8b5cf6" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-20 flex items-center justify-center text-xs text-gray-400 bg-gray-50 rounded">Adicione dados de treino</div>
                    )}
                </div>

                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                            <IconFlame className="w-4 h-4 text-orange-500" />
                            Consumo Calórico
                        </h3>
                    </div>
                    {calorieData.length > 0 ? (
                        <div className="h-40 w-full bg-gray-50 rounded-lg p-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={calorieData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis dataKey="date" tick={{fontSize: 10}} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                                    <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-20 flex items-center justify-center text-xs text-gray-400 bg-gray-50 rounded">Adicione dados de dieta</div>
                    )}
                </div>
            </>
        )}

        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
            <div className="flex items-center gap-2 mb-2 text-indigo-700">
                <IconSparkles className="w-4 h-4" />
                <h4 className="font-semibold text-sm">Sugestão Holística</h4>
            </div>
            <p className="text-sm text-indigo-800 leading-relaxed">
                {activeTab === 'health' 
                    ? "Devido aos níveis de LDL, considere ajustar a dieta antes de alterar o protocolo hormonal."
                    : "Sua força estagnou na última semana. Considere um Deload ou aumento leve de carboidratos pré-treino."
                }
            </p>
        </div>
      </div>
    </div>
  );
};

export default MetricDashboard;