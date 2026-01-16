
import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, ReferenceLine, ComposedChart, Bar, Legend } from 'recharts';
import { Project, RiskFlag, MetricPoint } from '../types';
import { IconActivity, IconAlert, IconSparkles, IconFlame, IconDumbbell, IconUser, IconHeart, IconScale, IconScience, IconReportPDF, IconDownload, IconCheck, IconShield, IconArrowLeft, IconFile, IconSearch } from './Icons';
import { Tooltip } from './Tooltip';
import RichTooltip from './RichTooltip'; // IMPORTADO

interface MetricDashboardProps {
  project: Project;
  risks: RiskFlag[];
  onGenerateProntuario: () => void;
  isMobileView?: boolean;
  isProcessing?: boolean;
  onViewSource?: (sourceId: string) => void;
}

// Helper para gerar cor consistente baseada no nome da string (Hash to Color)
const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
};

const CustomizedLabel = (props: any) => {
  const { x, y, stroke, value, index, dataLength, color } = props;
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
    type = 'line',
    gender // PASSADO GÊNERO PARA O CHART
}: { 
    title: string; 
    data: MetricPoint[]; 
    color: string;
    minRef?: number;
    maxRef?: number;
    yDomain?: [number | string, number | string];
    type?: 'line' | 'area';
    gender: 'Masculino' | 'Feminino';
}) => {
    const cleanData = useMemo(() => {
        if (!data || data.length === 0) return [];
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
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-tight dark:text-gray-300 truncate pr-2" title={title}>
                    {title}
                </h3>
                <div className="flex gap-2 shrink-0">
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
                            
                            {/* RICH TOOLTIP INTEGRATION */}
                            <RechartsTooltip 
                                content={<RichTooltip gender={gender} history={data} />} 
                                cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '3 3' }}
                            />
                            
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
                            
                            {/* RICH TOOLTIP INTEGRATION */}
                            <RechartsTooltip 
                                content={<RichTooltip gender={gender} history={data} />} 
                                cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '3 3' }}
                            />

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

const HormonalBalanceChart = ({ testoData, e2Data, gender }: { testoData: MetricPoint[]; e2Data: MetricPoint[]; gender: 'Masculino' | 'Feminino'; }) => {
    const mergedData = useMemo(() => {
        const map = new Map();
        testoData.forEach(d => map.set(d.date, { date: d.date, testo: Number(d.value) }));
        e2Data.forEach(d => {
            const existing = map.get(d.date) || { date: d.date };
            map.set(d.date, { ...existing, e2: Number(d.value) });
        });
        return Array.from(map.values()).sort((a,b) => {
            const da = a.date.split('/').reverse().join('-');
            const db = b.date.split('/').reverse().join('-');
            return new Date(da).getTime() - new Date(db).getTime();
        });
    }, [testoData, e2Data]);

    if (!testoData?.length && !e2Data?.length) return null;
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
                            
                            {/* Rich Tooltip Adaptado para Composed Chart - Vai mostrar o que estiver hovered */}
                            <RechartsTooltip content={<RichTooltip gender={gender} history={[]} />} />
                            
                            <Legend verticalAlign="top" height={36} iconSize={8} wrapperStyle={{ fontSize: '10px' }}/>
                            <Area yAxisId="left" type="monotone" dataKey="testo" name="Testosterona" fill="#3b82f6" stroke="#2563eb" fillOpacity={0.1} label={<CustomizedLabel dataLength={mergedData.length} color="#2563eb" />} />
                            <Line yAxisId="right" type="monotone" dataKey="e2" name="Estradiol" stroke="#ec4899" strokeWidth={2} dot={{r:3}} label={<CustomizedLabel dataLength={mergedData.length} color="#ec4899" />} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

const CastelliChart = ({ ldlData, hdlData, gender }: { ldlData: MetricPoint[]; hdlData: MetricPoint[]; gender: 'Masculino' | 'Feminino'; }) => {
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

    // Transformar para MetricPoint[] para passar pro tooltip
    const historyForTooltip: MetricPoint[] = ratioData.map(d => ({ date: d.date, value: d.value, unit: 'Ratio', label: 'Castelli' }));

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
                        
                        <RechartsTooltip content={<RichTooltip gender={gender} history={historyForTooltip} />} />

                        <ReferenceLine y={3.5} stroke="red" strokeDasharray="3 3" label={{ value: 'Risco', fontSize: 9, fill: 'red' }} />
                        <Area type="monotone" dataKey="value" name="Índice Castelli" stroke={isDanger ? '#ef4444' : '#10b981'} fill="url(#colorRisk)" strokeWidth={2} label={<CustomizedLabel dataLength={ratioData.length} color={isDanger ? '#ef4444' : '#10b981'} />} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const EfficiencyChart = ({ strengthData, weightData, gender }: { strengthData: MetricPoint[]; weightData: MetricPoint[]; gender: 'Masculino' | 'Feminino'; }) => {
    const ratioData = useMemo(() => {
        const map = new Map();
        weightData.forEach(d => map.set(d.date, { date: d.date, bw: Number(d.value) }));
        const result: any[] = [];
        strengthData.forEach(d => {
            let entry = map.get(d.date);
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

    if (!strengthData?.length) return null;

    // Transformar para MetricPoint[]
    const historyForTooltip: MetricPoint[] = ratioData.map(d => ({ date: d.date, value: d.value, unit: 'x BW', label: 'Eficiência' }));

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
                            
                            <RechartsTooltip content={<RichTooltip gender={gender} history={historyForTooltip} />} />

                            <Line type="step" dataKey="value" name="Eficiência" stroke="#2563eb" strokeWidth={3} dot={{r: 4, fill: '#2563eb'}} label={<CustomizedLabel dataLength={ratioData.length} color="#2563eb" />} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

// --- UPDATED RISK CARD (INTERACTIVE) ---
const RiskCard: React.FC<{ risk: RiskFlag; onViewSource?: (id: string) => void }> = ({ risk, onViewSource }) => {
    return (
        <div 
            onClick={() => risk.sourceId && onViewSource && onViewSource(risk.sourceId)}
            className={`group relative p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg cursor-pointer ${
                risk.level === 'HIGH' 
                ? 'bg-red-50 border-red-200 hover:bg-red-100 dark:bg-red-900/10 dark:border-red-900/50 dark:hover:bg-red-900/20' 
                : 'bg-orange-50 border-orange-200 hover:bg-orange-100 dark:bg-orange-900/10 dark:border-orange-900/50 dark:hover:bg-orange-900/20'
            }`}
        >
            {/* Header Badge */}
            <div className="flex justify-between items-start mb-3">
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-sm ${
                    risk.level === 'HIGH' 
                    ? 'bg-red-600 text-white dark:bg-red-700' 
                    : 'bg-orange-500 text-white dark:bg-orange-600'
                }`}>
                    {risk.category}
                </span>
                
                {/* Date */}
                <span className={`text-[10px] font-bold opacity-60 ${
                    risk.level === 'HIGH' ? 'text-red-900 dark:text-red-200' : 'text-orange-900 dark:text-orange-200'
                }`}>
                    {risk.date}
                </span>
            </div>
            
            {/* Icon */}
            <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <IconAlert className="w-12 h-12" />
            </div>

            {/* Message Body */}
            <div className="pr-2">
                <h4 className={`font-bold text-sm leading-tight mb-2 ${
                    risk.level === 'HIGH' ? 'text-red-900 dark:text-red-100' : 'text-orange-900 dark:text-orange-100'
                }`}>
                    {risk.level === 'HIGH' ? 'Alerta Crítico' : 'Atenção Necessária'}
                </h4>
                <p className={`text-xs font-medium leading-relaxed ${
                    risk.level === 'HIGH' ? 'text-red-800 dark:text-red-200' : 'text-orange-800 dark:text-orange-200'
                }`}>
                    {risk.message}
                </p>
            </div>

            {/* Call to Action */}
            {risk.sourceId && (
                <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs font-bold uppercase tracking-wider ${
                    risk.level === 'HIGH' 
                    ? 'border-red-200 text-red-600 dark:border-red-800 dark:text-red-400' 
                    : 'border-orange-200 text-orange-600 dark:border-orange-800 dark:text-orange-400'
                }`}>
                    <span>Ver Exame Original</span>
                    <IconFile className="w-4 h-4 transform group-hover:scale-110 transition-transform" />
                </div>
            )}
        </div>
    );
};

const MetricDashboard: React.FC<MetricDashboardProps> = ({ project, risks, onGenerateProntuario, isMobileView, isProcessing, onViewSource }) => {
    // 1. Prepare Data for Advanced Charts
    const metrics = project.metrics;
    const ldl = metrics['LDL'] || [];
    const hdl = metrics['HDL'] || [];
    const testo = metrics['Testosterone'] || metrics['Testosterona'] || [];
    const e2 = metrics['Estradiol'] || [];
    const strength = metrics['Strength'] || metrics['Carga'] || metrics['Força'] || [];
    const weight = metrics['Weight'] || metrics['Peso'] || [];
    const allCategories = Object.keys(metrics);

    // Get Gender safely
    const gender = project.userProfile?.gender || 'Masculino';

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
                
                {!isProcessing && (
                    <div className="flex flex-col items-end gap-1">
                        <button 
                            onClick={onGenerateProntuario}
                            className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors shadow-lg active:scale-95 dark:bg-blue-600 dark:hover:bg-blue-700"
                        >
                            <IconReportPDF className="w-4 h-4" />
                            PRONTUÁRIO PDF
                        </button>
                    </div>
                )}
            </div>

            {/* --- RISK ALERTS SECTION (GRID LAYOUT) --- */}
            <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                    <div className="bg-red-100 p-1.5 rounded-lg dark:bg-red-900/30">
                        <IconShield className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest dark:text-white">
                        Diagnóstico de Riscos ({risks.length})
                    </h3>
                </div>
                
                {risks && risks.length > 0 ? (
                    /* GRID RESPONSIVO PARA CARDS DE RISCO */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {risks.map((risk, idx) => (
                            <RiskCard key={idx} risk={risk} onViewSource={onViewSource} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 flex items-center gap-4 dark:bg-emerald-900/10 dark:border-emerald-900/30">
                        <div className="bg-emerald-100 text-emerald-600 p-3 rounded-full dark:bg-emerald-900 dark:text-emerald-300">
                            <IconCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-emerald-900 text-sm dark:text-emerald-200">Status Saudável</h4>
                            <p className="text-xs text-emerald-700 mt-1 leading-relaxed dark:text-emerald-400/80">
                                Nenhum marcador crítico foi detectado nos seus dados recentes. O sistema monitora constantemente novos exames.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* --- ADVANCED INTELLIGENCE SECTION --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
                <HormonalBalanceChart testoData={testo} e2Data={e2} gender={gender} />
                <CastelliChart ldlData={ldl} hdlData={hdl} gender={gender} />
                <EfficiencyChart strengthData={strength} weightData={weight} gender={gender} />
            </div>

            {/* SEPARATOR */}
            <div className="flex items-center gap-4 mb-6">
                <div className="h-px bg-gray-200 flex-1 dark:bg-gray-800" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Métricas Individuais</span>
                <div className="h-px bg-gray-200 flex-1 dark:bg-gray-800" />
            </div>

            {/* INDIVIDUAL CHARTS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {allCategories.map(cat => {
                    const cleanCat = cat.toLowerCase();
                    const isBloodRed = cleanCat.includes('hema') || cleanCat.includes('eritro') || cleanCat.includes('plaqueta') || cleanCat.includes('leuco') || cleanCat.includes('hemo') || cleanCat.includes('vcm');
                    
                    // Definição de cor:
                    // 1. Prioridade Hardcoded (Testo, E2, Peso)
                    // 2. Sangue (Vermelho)
                    // 3. Fallback: Hash dinâmico para garantir cores consistentes para métricas novas (ex: Ureia sempre será a mesma cor)
                    let chartColor = stringToColor(cat); 
                    
                    if (cat.includes('Testo')) chartColor = '#2563eb';
                    else if (cat.includes('Estradiol')) chartColor = '#ec4899';
                    else if (cat.includes('Peso')) chartColor = '#4b5563';
                    else if (isBloodRed) chartColor = '#ef4444';

                    return (
                        <div key={cat} className="animate-in fade-in duration-500">
                            <BiomarkerChart 
                                title={cat} 
                                data={metrics[cat]} 
                                color={chartColor}
                                type={cat.includes('Peso') ? 'area' : 'line'}
                                gender={gender}
                            />
                        </div>
                    );
                })}
            </div>

            {allCategories.length === 0 && (
                 <div className="text-center py-20 opacity-50">
                    <IconActivity className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm font-medium text-gray-400">Nenhuma métrica registrada ainda.</p>
                </div>
            )}

            {isMobileView && !isProcessing && (
                <div className="md:hidden fixed bottom-24 right-4 z-40">
                    <Tooltip content="Gerar Prontuário PDF" position="left">
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
