
import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, ReferenceArea, AreaChart, Area } from 'recharts';
import { Project, RiskFlag, MetricPoint } from '../types';
import { IconActivity, IconAlert, IconSparkles, IconFlame, IconDumbbell, IconUser } from './Icons';
import { Tooltip } from './Tooltip';

interface MetricDashboardProps {
  project: Project;
  risks: RiskFlag[];
  onGenerateProntuario: () => void;
  isMobileView?: boolean;
  isProcessing?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as MetricPoint;
    return (
      <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-lg text-xs z-50">
        <p className="font-bold text-gray-900 mb-1">{data.date}</p>
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].color }} />
            <span className="text-gray-600 font-medium">{data.value} {data.unit}</span>
        </div>
        {data.label && <p className="text-[10px] text-gray-400 mt-1 italic">{data.label}</p>}
      </div>
    );
  }
  return null;
};

const EmptyChartState = ({ message }: { message: string }) => (
    <div className="h-40 w-full bg-gray-50/50 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 gap-2">
        <IconActivity className="w-5 h-5 opacity-20" />
        <p className="text-[10px] font-medium">{message}</p>
    </div>
);

const BiomarkerChart = ({ 
    title, 
    data, 
    color, 
    minRef, 
    maxRef, 
    yDomain,
    type = 'line'
}: { 
    title: string; 
    data: MetricPoint[]; 
    color: string;
    minRef?: number;
    maxRef?: number;
    yDomain?: [number | string, number | string];
    type?: 'line' | 'area';
}) => {
    // Memoize data cleaning to maintain reference stability across renders
    const cleanData = useMemo(() => {
        if (!data || data.length === 0) return [];
        return data.map(d => ({...d, value: Number(d.value)}));
    }, [data]);

    // Stable config objects to prevent Recharts internal update loops
    const dotConfig = useMemo(() => ({ r: 3, fill: color, strokeWidth: 2, stroke: '#fff' }), [color]);
    const activeDotConfig = useMemo(() => ({ r: 5, strokeWidth: 0 }), []);

    if (!data || data.length === 0) return (
        <div className="mb-6">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-tight mb-2">{title}</h3>
            <EmptyChartState message="Sem dados suficientes" />
        </div>
    );

    return (
        <div className="mb-8 w-full">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-tight">{title}</h3>
                {data[0].unit && <span className="text-[10px] text-gray-400 font-medium">{data[0].unit}</span>}
                {minRef && maxRef && <span className="text-[10px] text-gray-400 font-medium">Ref: {minRef} - {maxRef}</span>}
            </div>
            <div className="h-40 w-full bg-white rounded-xl p-2 border border-gray-100 shadow-sm relative">
                {/* 
                   Fix: Added minWidth={0} to allow shrinking in flex containers.
                   The container div has explicit height (h-40) and w-full.
                */}
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    {type === 'area' ? (
                        <AreaChart data={cleanData}>
                            <defs>
                                <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor={color} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="date" hide />
                            <YAxis hide domain={yDomain || ['auto', 'auto']} />
                            <RechartsTooltip content={<CustomTooltip />} />
                            <Area 
                                type="monotone" 
                                dataKey="value" 
                                stroke={color} 
                                fillOpacity={1} 
                                fill={`url(#grad-${title})`} 
                                strokeWidth={2}
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    ) : (
                        <LineChart data={cleanData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="date" hide />
                            <YAxis hide domain={yDomain || ['auto', 'auto']} />
                            <RechartsTooltip content={<CustomTooltip />} />
                            
                            {minRef && maxRef && (
                                <ReferenceArea 
                                    y1={minRef} 
                                    y2={maxRef} 
                                    fill={color} 
                                    fillOpacity={0.05} 
                                    stroke="none"
                                />
                            )}
                            
                            <Line 
                                type="monotone" 
                                dataKey="value" 
                                stroke={color} 
                                strokeWidth={3} 
                                dot={dotConfig} 
                                activeDot={activeDotConfig}
                                isAnimationActive={false}
                            />
                        </LineChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const MetricDashboard: React.FC<MetricDashboardProps> = ({ project, risks, onGenerateProntuario, isMobileView, isProcessing = false }) => {
  const [activeTab, setActiveTab] = useState<'health' | 'performance'>('health');

  // Dynamic Data from Project Props - Mapped from the new standardized keys
  const testosteroneData = project.metrics['Testosterone'] || [];
  const hdlData = project.metrics['HDL'] || [];
  const ldlData = project.metrics['LDL'] || [];
  const bodyWeightData = project.metrics['BodyWeight'] || []; // Supports Bioimpedance Weight
  const bodyFatData = project.metrics['BodyFat'] || [];       // New: Supports Bioimpedance BF%
  const muscleMassData = project.metrics['MuscleMass'] || []; // New: Supports Bioimpedance Muscle
  const strengthData = project.metrics['Strength'] || [];

  return (
    <div className={`${isMobileView ? 'w-full' : 'w-96 border-l hidden lg:flex'} bg-white border-gray-200 h-screen flex flex-col overflow-y-auto`}>
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div>
            <h2 className="text-lg font-bold text-gray-800">Painel</h2>
            <p className="text-sm text-gray-500">{project.name}</p>
        </div>
        <Tooltip content="Gera um relatório médico completo (PDF style) analisando todas as suas fontes ativas." position="left">
            <button 
                onClick={onGenerateProntuario}
                disabled={isProcessing}
                className={`text-[10px] px-3 py-1.5 rounded transition-all font-bold uppercase shadow-sm flex items-center gap-2 border ${
                    isProcessing 
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                    : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50 active:scale-95'
                }`}
            >
                {isProcessing && (
                     <div className="w-3 h-3 border-2 border-gray-400 border-t-gray-900 rounded-full animate-spin"></div>
                )}
                {isProcessing ? 'Lendo...' : 'Relatório'}
            </button>
        </Tooltip>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 bg-white sticky top-0 z-10">
        <button 
            onClick={() => setActiveTab('health')}
            className={`flex-1 py-3 text-sm font-semibold transition-all border-b-2 ${activeTab === 'health' ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
        >
            Saúde & Bio
        </button>
        <button 
            onClick={() => setActiveTab('performance')}
            className={`flex-1 py-3 text-sm font-semibold transition-all border-b-2 ${activeTab === 'performance' ? 'text-purple-600 border-purple-600 bg-purple-50/50' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
        >
            Físico & Treino
        </button>
      </div>

      {/* Risks Section */}
      {risks.length > 0 && (
        <div className="p-5 border-b border-gray-100 bg-red-50/30">
          <div className="flex items-center gap-2 mb-3 text-red-700">
            <IconAlert className="w-4 h-4" />
            <h3 className="font-bold text-[11px] uppercase tracking-wider">Alertas Críticos</h3>
          </div>
          <div className="space-y-2">
            {risks.map((risk, idx) => (
              <div key={idx} className="bg-white p-3 rounded-lg border border-red-100 shadow-sm">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[9px] font-black text-red-500 bg-red-50 px-1.5 py-0.5 rounded uppercase">
                    {risk.category}
                  </span>
                  <span className="text-[9px] text-gray-400 font-bold">{risk.level}</span>
                </div>
                <p className="text-[12px] text-gray-800 font-medium leading-tight">{risk.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="p-6 space-y-2 pb-24 w-full">
        
        {activeTab === 'health' && (
            <div className="w-full">
                <div className="mb-6 w-full">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4 text-sm">
                        <IconActivity className="w-4 h-4 text-blue-500" />
                        Hormônios & Lipídios
                    </h3>
                    
                    <BiomarkerChart 
                        title="Testosterona Total"
                        data={testosteroneData}
                        color="#3b82f6"
                        minRef={264}
                        maxRef={916}
                        yDomain={[0, 'auto']}
                    />

                    <div className="grid grid-cols-2 gap-4 w-full">
                         <BiomarkerChart 
                            title="HDL (Bom)"
                            data={hdlData}
                            color="#10b981"
                            minRef={40}
                            yDomain={[0, 100]}
                        />
                        <BiomarkerChart 
                            title="LDL (Ruim)"
                            data={ldlData}
                            color="#ef4444"
                            maxRef={130}
                            yDomain={[0, 200]}
                        />
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'performance' && (
            <div className="w-full">
                <div className="w-full">
                     <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4 text-sm">
                        <IconUser className="w-4 h-4 text-indigo-500" />
                        Composição Corporal (Bioimpedância)
                    </h3>

                    {/* Weight Chart */}
                    <BiomarkerChart 
                        title="Peso Corporal (kg)"
                        data={bodyWeightData}
                        color="#4f46e5"
                        type="area"
                        yDomain={['dataMin - 2', 'dataMax + 2']}
                    />
                    
                    {/* Body Fat Chart */}
                    <BiomarkerChart 
                        title="Gordura Corporal (%)"
                        data={bodyFatData}
                        color="#f59e0b"
                        type="line"
                        yDomain={[5, 35]}
                    />
                    
                     {/* Muscle Mass Chart */}
                     <BiomarkerChart 
                        title="Massa Muscular (kg)"
                        data={muscleMassData}
                        color="#ec4899"
                        type="area"
                        yDomain={['dataMin - 1', 'dataMax + 1']}
                    />

                </div>

                <div className="border-t border-gray-100 pt-6 mt-6 w-full">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4 text-sm">
                        <IconDumbbell className="w-4 h-4 text-purple-500" />
                        Força (Cargas)
                    </h3>
                     <BiomarkerChart 
                        title="Evolução de Cargas (kg)"
                        data={strengthData}
                        color="#8b5cf6"
                        type="line"
                        yDomain={['auto', 'auto']}
                    />
                </div>
            </div>
        )}

        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-xl border border-indigo-100 mt-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-indigo-700">
                <IconSparkles className="w-4 h-4" />
                <h4 className="font-bold text-xs uppercase">Insight IA</h4>
            </div>
            <p className="text-xs text-indigo-900 leading-relaxed font-medium">
                {activeTab === 'health' 
                    ? "Analisando seus marcadores, sua saúde metabólica parece estável. Se houve Upload de exame recente, os dados foram plotados acima."
                    : "Sua composição corporal está sendo rastreada. Certifique-se de fazer bioimpedância ou pesagem sempre no mesmo horário para consistência."
                }
            </p>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MetricDashboard);
