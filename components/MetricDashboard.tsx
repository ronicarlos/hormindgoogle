
import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, ReferenceLine, ComposedChart, Bar, Legend } from 'recharts';
import { Project, RiskFlag, MetricPoint } from '../types';
import { IconActivity, IconAlert, IconSparkles, IconFlame, IconDumbbell, IconUser, IconHeart, IconScale, IconScience, IconReportPDF, IconDownload } from './Icons';
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
    return (
      <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-lg text-xs z-50 dark:bg-gray-900 dark:border-gray-700">
        <p className="font-bold text-gray-900 mb-2 border-b border-gray-100 pb-1 dark:text-white dark:border-gray-700">{label}</p>
        {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.stroke || entry.fill }} />
                <span className="text-gray-600 font-medium dark:text-gray-300">
                    {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value} {entry.unit}
                </span>
            </div>
        ))}
      </div>
    );
  }
  return null;
};

// --- CUSTOM LABEL COMPONENT (SHOWS VALUE ON LAST POINT) ---
const CustomizedLabel = (props: any) => {
  const { x, y, stroke, value, index, dataLength, color } = props;
  
  // Show only the last point to avoid clutter
  if (index === dataLength - 1) {
    return (
      <text 
        x={x} 
        y={y} 
        dy={-12} 
        fill={color || stroke} 
        fontSize={11} 
        textAnchor="middle" 
        fontWeight="bold"
        className="drop-shadow-sm filter"
      >
        {typeof value === 'number' ? value : value}
      </text>
    );
  }
  return null;
};

const EmptyChartState = ({ message }: { message: string }) => (
    <div className="h-32 w-full bg-gray-50/50 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 gap-2 dark:bg-gray-800/50 dark:border-gray-700">
        <IconActivity className="w-5 h-5 opacity-20" />
        <p className="text-[10px] font-medium text-center px-4">{message}</p>
    </div>
);

// --- COMPONENTES DE GRÁFICO ---

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
    const cleanData = useMemo(() => {
        if (!data || data.length === 0) return [];
        // Sort by date ascending
        return [...data]
            .map(d => ({...d, value: Number(d.value)}))
            .sort((a,b) => {
                 const da = a.date.split('/').reverse().join('-');
                 const db = b.date.split('/').reverse().join('-');
                 return new Date(da).getTime() - new Date(db).getTime();
            });
    }, [data]);

    const dotConfig = useMemo(() => ({ r: 3, fill: color, strokeWidth: 2, stroke: '#fff' }), [color]);
    const activeDotConfig = useMemo(() => ({ r: 5, strokeWidth: 0 }), []);

    if (!data || data.length === 0) return null;

    return (
        <div className="mb-8 w-full">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-tight dark:text-gray-300">{title}</h3>
                <div className="flex gap-2">
                    {data[0].unit && <span className="text-[10px] text-gray-400 font-medium">{data[0].unit}</span>}
                    {minRef && maxRef && <span className="text-[10px] text-gray-400 font-medium bg-gray-100 px-1.5 rounded dark:bg-gray-800">Ref: {minRef}-{maxRef}</span>}
                </div>
            </div>
            <div className="h-40 w-full bg-white rounded-xl p-2 border border-gray-100 shadow-sm relative dark:bg-gray-900 dark:border-gray-800">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    {type === 'area' ? (
                        <AreaChart data={cleanData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor={color} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-gray-800" />
                            <XAxis dataKey="date" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                            <YAxis hide domain={yDomain || ['auto', 'auto']} />
                            <RechartsTooltip content={<CustomTooltip />} />
                            <Area 
                                type="monotone" 
                                dataKey="value" 
                                name={title}
                                stroke={color} 
                                fillOpacity={1} 
                                fill={`url(#grad-${title})`} 
                                strokeWidth={2}
                                isAnimationActive={true}
                                label={<CustomizedLabel dataLength={cleanData.length} color={color} />}
                            />
                             {minRef && <ReferenceLine y={minRef} stroke="#e5e7eb" strokeDasharray="3 3" className="dark:stroke-gray-700" />}
                             {maxRef && <ReferenceLine y={maxRef} stroke="#e5e7eb" strokeDasharray="3 3" className="dark:stroke-gray-700" />}
                        </AreaChart>
                    ) : (
                        <LineChart data={cleanData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-gray-800" />
                            <XAxis dataKey="date" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                            <YAxis hide domain={yDomain || ['auto', 'auto']} />
                            <RechartsTooltip content={<CustomTooltip />} />
                            {minRef && <ReferenceLine y={minRef} stroke="#e5e7eb" strokeDasharray="3 3" className="dark:stroke-gray-700" />}
                            {maxRef && <ReferenceLine y={maxRef} stroke="#e5e7eb" strokeDasharray="3 3" className="dark:stroke-gray-700" />}
                            <Line 
                                type="monotone" 
                                dataKey="value" 
                                name={title}
                                stroke={color} 
                                strokeWidth={3} 
                                dot={dotConfig} 
                                activeDot={activeDotConfig}
                                isAnimationActive={true}
                                label={<CustomizedLabel dataLength={cleanData.length} color={color} />}
                            />
                        </LineChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// 1. HORMONAL RADAR (Testo vs Estradiol)
const HormonalBalanceChart = ({ 
    testoData, 
    e2Data 
}: { 
    testoData: MetricPoint[]; 
    e2Data: MetricPoint[]; 
}) => {
    const mergedData = useMemo(() => {
        const map = new Map();
        testoData.forEach(d => map.set(d.date, { date: d.date, testo: Number(d.value) }));
        e2Data.forEach(d => {
            const existing = map.get(d.date) || { date: d.date };
            map.set(d.date, { ...existing, e2: Number(d.value) });
        });
        
        return Array.from(map.values())
            .filter(d => d.testo !== undefined || d.e2 !== undefined)
            .sort((a,b) => {
                const da = a.date.split('/').reverse().join('-');
                const db = b.date.split('/').reverse().join('-');
                return new Date(da).getTime() - new Date(db).getTime();
            });
    }, [testoData, e2Data]);

    if (!testoData?.length && !e2Data?.length) return null;

    // Se só tiver um dos dados, mostra aviso mas renderiza o que tem
    const isMissingOne = !testoData.length || !e2Data.length;

    return (
        <div className="w-full bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group dark:bg-gray-900 dark:border-gray-800">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 rounded-l-2xl" />
            <div className="flex items-center justify-between mb-4 pl-3">
                <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight flex items-center gap-2 dark:text-white">
                        <IconScience className="w-4 h-4 text-purple-600" />
                        Radar Hormonal (Aromatização)
                    </h3>
                    <p className="text-[10px] text-gray-400 font-medium mt-1">
                        Cruze Testosterona Total vs Estradiol para evitar ginecomastia ou libido baixa.
                    </p>
                </div>
            </div>
            
            {isMissingOne ? (
                <EmptyChartState message="Adicione exames de Testosterona e Estradiol para desbloquear este insight." />
            ) : (
                <div className="h-48 w-full pl-3">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={mergedData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-gray-800" />
                            <XAxis dataKey="date" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="left" orientation="left" hide />
                            <YAxis yAxisId="right" orientation="right" hide />
                            <RechartsTooltip content={<CustomTooltip />} />
                            <Legend verticalAlign="top" height={36} iconSize={8} wrapperStyle={{ fontSize: '10px' }}/>
                            
                            <Area 
                                yAxisId="left" 
                                type="monotone" 
                                dataKey="testo" 
                                name="Testosterona" 
                                fill="#3b82f6" 
                                stroke="#2563eb" 
                                fillOpacity={0.1}
                                label={<CustomizedLabel dataLength={mergedData.length} color="#2563eb" />} 
                            />
                            <Line 
                                yAxisId="right" 
                                type="monotone" 
                                dataKey="e2" 
                                name="Estradiol" 
                                stroke="#ec4899" 
                                strokeWidth={2} 
                                dot={{r:3}}
                                label={<CustomizedLabel dataLength={mergedData.length} color="#ec4899" />} 
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

// 2. CASTELLI INDEX (LDL / HDL Ratio)
const CastelliChart = ({ 
    ldlData, 
    hdlData 
}: { 
    ldlData: MetricPoint[]; 
    hdlData: MetricPoint[]; 
}) => {
    const ratioData = useMemo(() => {
        const map = new Map();
        ldlData.forEach(d => map.set(d.date, { date: d.date, ldl: Number(d.value) }));
        
        const result: any[] = [];
        hdlData.forEach(d => {
            const entry = map.get(d.date);
            if (entry && entry.ldl && Number(d.value) > 0) {
                const ratio = entry.ldl / Number(d.value);
                result.push({
                    date: d.date,
                    value: Number(ratio.toFixed(2)),
                    unit: 'Ratio',
                    risk: ratio > 3.5 ? 'Alto' : ratio > 3.0 ? 'Médio' : 'Ótimo'
                });
            }
        });
        
        return result.sort((a,b) => {
             const da = a.date.split('/').reverse().join('-');
             const db = b.date.split('/').reverse().join('-');
             return new Date(da).getTime() - new Date(db).getTime();
        });
    }, [ldlData, hdlData]);

    if (!ldlData?.length || !hdlData?.length) return null;
    if (ratioData.length === 0) return null;

    const currentRatio = ratioData[ratioData.length - 1].value;
    const isDanger = currentRatio > 3.5;

    return (
        <div className="w-full bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden dark:bg-gray-900 dark:border-gray-800">
            <div className={`absolute top-0 left-0 w-1 h-full ${isDanger ? 'bg-red-500' : 'bg-emerald-500'} rounded-l-2xl`} />
            <div className="flex items-center justify-between mb-4 pl-3">
                 <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight flex items-center gap-2 dark:text-white">
                        <IconHeart className={`w-4 h-4 ${isDanger ? 'text-red-500' : 'text-emerald-500'}`} />
                        Risco Cardíaco (Índice Castelli)
                    </h3>
                    <p className="text-[10px] text-gray-400 font-medium mt-1">
                        Relação LDL/HDL. Acima de 3.5 indica formação de placas (aterosclerose).
                    </p>
                </div>
                <div className={`px-2 py-1 rounded-lg text-xs font-black ${isDanger ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'} dark:bg-opacity-20`}>
                    {currentRatio}
                </div>
            </div>
            
            <div className="h-40 w-full pl-3">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={ratioData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={isDanger ? '#ef4444' : '#10b981'} stopOpacity={0.3}/>
                                <stop offset="95%" stopColor={isDanger ? '#ef4444' : '#10b981'} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-gray-800" />
                        <XAxis dataKey="date" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                        <YAxis hide domain={[0, 'auto']} />
                        <ReferenceLine y={3.5} stroke="red" strokeDasharray="3 3" label={{ value: 'Risco', fontSize: 9, fill: 'red' }} />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Area 
                            type="monotone" 
                            dataKey="value" 
                            name="LDL/HDL"
                            stroke={isDanger ? '#ef4444' : '#10b981'} 
                            fill="url(#colorRisk)" 
                            strokeWidth={2}
                            label={<CustomizedLabel dataLength={ratioData.length} color={isDanger ? '#ef4444' : '#10b981'} />}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// 3. RELATIVE STRENGTH (Strength / Weight)
const EfficiencyChart = ({ 
    strengthData, 
    weightData 
}: { 
    strengthData: MetricPoint[]; 
    weightData: MetricPoint[]; 
}) => {
    const ratioData = useMemo(() => {
        const map = new Map();
        weightData.forEach(d => map.set(d.date, { date: d.date, bw: Number(d.value) }));
        
        const result: any[] = [];
        strengthData.forEach(d => {
            // Find closest weight entry (simplified to exact date match for now, or fallback)
            let entry = map.get(d.date);
            // If no exact match, use the last known weight? (Simplification: exact match for reliable data)
            
            if (entry && entry.bw && Number(d.value) > 0) {
                const ratio = Number(d.value) / entry.bw;
                result.push({
                    date: d.date,
                    value: Number(ratio.toFixed(2)),
                    unit: 'x BW'
                });
            }
        });
        
        return result.sort((a,b) => {
             const da = a.date.split('/').reverse().join('-');
             const db = b.date.split('/').reverse().join('-');
             return new Date(da).getTime() - new Date(db).getTime();
        });
    }, [strengthData, weightData]);

    if (!strengthData?.length) return null; // If no strength data, don't show, or show empty state if weight exists

    return (
        <div className="w-full bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden dark:bg-gray-900 dark:border-gray-800">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-2xl" />
            <div className="flex items-center justify-between mb-4 pl-3">
                <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight flex items-center gap-2 dark:text-white">
                        <IconDumbbell className="w-4 h-4 text-blue-600" />
                        Força Relativa (Pound-for-Pound)
                    </h3>
                    <p className="text-[10px] text-gray-400 font-medium mt-1">
                        Carga / Peso Corporal. Se o peso sobe e isso cai, você está ganhando gordura, não força.
                    </p>
                </div>
            </div>
            
            {ratioData.length === 0 ? (
                <EmptyChartState message="Adicione dados de Carga (Strength) e Peso na mesma data para ver sua eficiência real." />
            ) : (
                <div className="h-40 w-full pl-3">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={ratioData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-gray-800" />
                            <XAxis dataKey="date" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                            <YAxis hide domain={['auto', 'auto']} />
                            <RechartsTooltip content={<CustomTooltip />} />
                            <Line 
                                type="step" 
                                dataKey="value" 
                                name="Eficiência"
                                stroke="#2563eb" 
                                strokeWidth={3}
                                dot={{r: 4, fill: '#2563eb'}}
                                label={<CustomizedLabel dataLength={ratioData.length} color="#2563eb" />}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

const RiskCard = ({ risk }: { risk: RiskFlag }) => (
    <div className={`p-4 rounded-xl border flex flex-col gap-2 shadow-sm ${
        risk.level === 'HIGH' 
        ? 'bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30' 
        : 'bg-orange-50 border-orange-100 dark:bg-orange-900/10 dark:border-orange-900/30'
    }`}>
        <div className="flex justify-between items-start">
            <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
                risk.level === 'HIGH' 
                ? 'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200' 
                : 'bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
            }`}>
                {risk.category}
            </span>
            <span className={`text-[10px] font-bold ${
                risk.level === 'HIGH' ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'
            }`}>
                {risk.level}
            </span>
        </div>
        
        <p className={`text-sm font-medium leading-relaxed ${
            risk.level === 'HIGH' ? 'text-red-900 dark:text-red-100' : 'text-orange-900 dark:text-orange-100'
        }`}>
            {risk.message}
        </p>
    </div>
);

const MetricDashboard: React.FC<MetricDashboardProps> = ({ project, risks, onGenerateProntuario, isMobileView, isProcessing }) => {
    // 1. Prepare Data for Advanced Charts
    const metrics = project.metrics;

    // Castelli
    const ldl = metrics['LDL'] || [];
    const hdl = metrics['HDL'] || [];

    // Hormonal
    const testo = metrics['Testosterone'] || metrics['Testosterona'] || [];
    const e2 = metrics['Estradiol'] || [];

    // Efficiency (Looks for 'Strength', 'Carga', 'Squat', 'Bench')
    const strength = metrics['Strength'] || metrics['Carga'] || metrics['Força'] || [];
    const weight = metrics['Weight'] || metrics['Peso'] || [];

    // All categories for the bottom list
    const allCategories = Object.keys(metrics);

    return (
        <div className="flex-1 overflow-y-auto bg-gray-50 h-full p-4 md:p-8 pb-32 dark:bg-gray-950">
            {/* Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2 dark:text-white">
                        <IconActivity className="w-6 h-6 text-gray-400" />
                        MÉTRICAS
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-wider dark:text-gray-400">
                        Inteligência de Decisão & Saúde
                    </p>
                </div>
                
                {/* BUTTON (Desktop/Tablet) - EXPLICIT 'PRONTUARIO PDF' */}
                {!isProcessing && (
                    <div className="flex flex-col items-end gap-1">
                        <button 
                            onClick={onGenerateProntuario}
                            className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors shadow-lg active:scale-95 dark:bg-blue-600 dark:hover:bg-blue-700"
                        >
                            <IconReportPDF className="w-4 h-4" />
                            PRONTUÁRIO PDF
                        </button>
                        <span className="text-[9px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full dark:bg-green-900/30 dark:text-green-400 hidden md:block">
                            ⚡ Modo Econômico Ativo
                        </span>
                    </div>
                )}
            </div>

            {/* RESTORED RISK ALERTS SECTION */}
            {risks && risks.length > 0 && (
                <div className="mb-8 animate-in slide-in-from-top-4 duration-500">
                    <h3 className="text-xs font-black text-red-600 uppercase tracking-widest mb-4 flex items-center gap-2 dark:text-red-400">
                        <IconAlert className="w-4 h-4" />
                        Alertas Críticos
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {risks.map((risk, idx) => (
                            <RiskCard key={idx} risk={risk} />
                        ))}
                    </div>
                </div>
            )}

            {/* --- ADVANCED INTELLIGENCE SECTION --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
                <HormonalBalanceChart testoData={testo} e2Data={e2} />
                <CastelliChart ldlData={ldl} hdlData={hdl} />
                <EfficiencyChart strengthData={strength} weightData={weight} />
                
                {/* Placeholder for future insights if needed */}
                {(!testo.length && !ldl.length && !strength.length) && (
                    <div className="col-span-1 lg:col-span-2 bg-blue-50 border border-blue-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center dark:bg-blue-900/10 dark:border-blue-900/30">
                        <IconSparkles className="w-8 h-8 text-blue-400 mb-2" />
                        <h3 className="font-bold text-blue-900 dark:text-blue-300">Comece a monitorar</h3>
                        <p className="text-sm text-blue-700/80 mt-1 max-w-md dark:text-blue-400/80">
                            Faça upload de exames de sangue ou registre suas cargas de treino para desbloquear os gráficos de inteligência avançada (Risco Cardíaco, Hormônios e Eficiência).
                        </p>
                    </div>
                )}
            </div>

            {/* SEPARATOR */}
            <div className="flex items-center gap-4 mb-6">
                <div className="h-px bg-gray-200 flex-1 dark:bg-gray-800" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Métricas Individuais</span>
                <div className="h-px bg-gray-200 flex-1 dark:bg-gray-800" />
            </div>

            {/* INDIVIDUAL CHARTS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {allCategories.map(cat => (
                    <div key={cat} className="animate-in fade-in duration-500">
                        <BiomarkerChart 
                            title={cat} 
                            data={metrics[cat]} 
                            color={
                                cat.includes('Testo') ? '#2563eb' : 
                                cat.includes('Estradiol') ? '#ec4899' : 
                                cat.includes('Peso') ? '#4b5563' :
                                '#10b981'
                            }
                            // Example references (would need a real DB mapping)
                            type={cat.includes('Peso') ? 'area' : 'line'}
                        />
                    </div>
                ))}
            </div>

            {allCategories.length === 0 && (
                 <div className="text-center py-20 opacity-50">
                    <IconActivity className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm font-medium text-gray-400">Nenhuma métrica registrada ainda.</p>
                </div>
            )}

            {/* Mobile Fab for Report - UPDATED ICON & TOOLTIP */}
            {isMobileView && !isProcessing && (
                <div className="md:hidden fixed bottom-24 right-4 z-40">
                    <Tooltip content="Gerar Prontuário PDF (Modo Econômico)" position="left">
                        <button 
                            onClick={onGenerateProntuario}
                            className="bg-black text-white p-4 rounded-full shadow-2xl active:scale-90 transition-transform dark:bg-blue-600 border border-gray-800 dark:border-blue-500"
                        >
                            <IconReportPDF className="w-6 h-6" />
                        </button>
                    </Tooltip>
                </div>
            )}
        </div>
    );
};

export default MetricDashboard;
