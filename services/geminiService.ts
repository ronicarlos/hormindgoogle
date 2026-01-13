

import { GoogleGenAI } from "@google/genai";
import { Source, ChatMessage, UserProfile, MetricPoint } from '../types';

// Initialize Gemini Client
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// UPDATED: Using Gemini 3 Flash Preview as the main model.
// Supports Thinking Config defined in generation.
const MODEL_ID = 'gemini-3-flash-preview'; 
const VISION_MODEL_ID = 'gemini-3-flash-preview'; 
const EMBEDDING_MODEL_ID = 'text-embedding-004';

/**
 * Calculates age from birth date string (YYYY-MM-DD)
 */
const calculateAge = (birthDate?: string): string => {
    if (!birthDate) return 'Não informada';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age.toString();
};

/**
 * Constructs a context-aware prompt based on profile, sources, AND structured metrics.
 * Implements the "Clean Read" pipeline step.
 */
const buildContext = (
    sources: Source[], 
    profile?: UserProfile, 
    metrics?: Record<string, MetricPoint[]>
): string => {
  let context = "Você é o FitLM, um analista de fitness avançado com IA (Esporte, Medicina, Farmacologia).\n\n";

  // 1. DADOS VITAIS DO PACIENTE/ATLETA (Prioridade Máxima)
  if (profile) {
      const age = calculateAge(profile.birthDate);
      
      context += `=== FICHA BIOMÉTRICA DO USUÁRIO ===\n`;
      context += `Nome: ${profile.name}\n`;
      context += `Idade Calculada: ${age} anos (Nasc: ${profile.birthDate || 'N/A'}) | Sexo: ${profile.gender}\n`;
      context += `Antropometria: Altura ${profile.height}cm | Peso ${profile.weight}kg\n`;
      
      // ADDED: Calculated Stats injection with Hierarchy Rule
      if (profile.calculatedStats) {
          context += `>> ÍNDICES METABÓLICOS MATEMÁTICOS (LINHA DE BASE):\n`;
          context += `- IMC: ${profile.calculatedStats.bmi} (${profile.calculatedStats.bmiClassification})\n`;
          context += `- TMB (Mifflin-St Jeor): ${profile.calculatedStats.bmr} kcal (Use para calcular déficit/superávit se não houver calorimetria)\n`;
          context += `- RCQ (Cintura-Quadril): ${profile.calculatedStats.whr} (${profile.calculatedStats.whrRisk})\n`;
      }

      context += `Medidas: Braço ${profile.measurements.arm}cm, Cintura ${profile.measurements.waist}cm, Perna ${profile.measurements.thigh}cm, Quadril ${profile.measurements.hips}cm\n`;
      context += `Histórico Médico/Comorbidades: ${profile.comorbidities || 'Nenhuma relatada'}\n`;
      context += `Uso de Medicamentos: ${profile.medications || 'Nenhum relatado'}\n`;
      context += `====================================\n\n`;
  } else {
      context += `[AVISO: Perfil biométrico do usuário não preenchido. Solicite esses dados para uma análise precisa.]\n\n`;
  }

  // 2. DADOS ESTRUTURADOS (CLEAN READ)
  // Isso garante que a IA veja os números exatos extraídos do banco, não apenas o texto OCR.
  if (metrics && Object.keys(metrics).length > 0) {
      context += `=== HISTÓRICO DE MÉTRICAS ESTRUTURADAS (FONTE DE VERDADE 1) ===\n`;
      context += `Estes valores foram extraídos de exames reais (Bioimpedância, Sangue, etc). Eles TÊM PRIORIDADE sobre os índices matemáticos acima se houver divergência.\n`;
      
      for (const [category, points] of Object.entries(metrics)) {
          // Ordenar por data (mais recente primeiro)
          const sorted = [...points].sort((a,b) => {
              const dateA = a.date.split('/').reverse().join('-'); // PT-BR to ISO fallback
              const dateB = b.date.split('/').reverse().join('-');
              return new Date(dateB).getTime() - new Date(dateA).getTime();
          });
          
          if (sorted.length > 0) {
              const latest = sorted[0];
              const historyStr = sorted.slice(0, 5).map(p => `${p.value} ${p.unit} (${p.date})`).join(', ');
              context += `- **${category}**: Atual: ${latest.value} ${latest.unit} (${latest.date}). Histórico Recente: [${historyStr}]\n`;
          }
      }
      context += `============================================================\n\n`;
  }

  // 3. FONTES DE DADOS (TEXTO OCR / RAW)
  context += "--- CONTEXTO DOCUMENTAL (OCR/RAW) ---\n";
  
  if (sources.length === 0) {
      context += "[Nenhuma fonte de dados adicional selecionada]\n";
  } else {
      sources.forEach(source => {
        const prefix = source.type === 'USER_INPUT' ? '[INPUT DIÁRIO ATUALIZADO]' : `[Documento: ${source.title} (${source.date})]`;
        // Limit context size per source, prioritizing summarization if available
        let contentSnippet = source.content;
        
        // Se tiver resumo gerado pela IA (Deep Dive), use-o para economizar tokens e dar clareza
        if (source.summary) {
            contentSnippet = `RESUMO ESTRUTURADO DA IA:\n${source.summary}\n\nTRECHO RAW:\n${source.content.substring(0, 2000)}...`;
        } else {
            contentSnippet = source.content.length > 30000 ? source.content.substring(0, 30000) + "...[cortado]" : source.content;
        }

        context += `${prefix}\n${contentSnippet}\n\n`;
      });
  }
  
  context += "--- FIM DAS FONTES ---\n\n";
  context += `Regras de Comportamento e Hierarquia de Dados:
1. Responda SEMPRE em Português do Brasil (pt-BR).
2. HIERARQUIA DE ANÁLISE CORPORAL:
   - Prioridade 1 (Ouro): Use os dados de Bioimpedância/Exames Reais listados no "HISTÓRICO DE MÉTRICAS" (Ex: BF%, Massa Muscular).
   - Prioridade 2 (Prata): Se não houver bioimpedância, use os "ÍNDICES METABÓLICOS MATEMÁTICOS" (IMC, TMB, RCQ) calculados na Ficha Biométrica.
   - NUNCA ignore o RCQ (Relação Cintura-Quadril) para avaliar risco cardíaco, mesmo que o peso esteja normal.
3. PROTOCOLOS E RISCO:
   - Se o usuário usar termogênicos (Clembuterol, T3), verifique a TMB e o histórico cardíaco.
   - Se o IMC for > 30 (Obesidade) mas o BF% for baixo (Atleta), ignore o IMC e avise o usuário que a massa muscular justifica o peso.
4. ANÁLISE CRUZADA: Cruze as drogas listadas com as comorbidades da ficha.
5. FORMATO: Use Markdown.
`;
  
  return context;
};

export const generateAIResponse = async (
  message: string,
  sources: Source[],
  history: ChatMessage[],
  profile?: UserProfile,
  metrics?: Record<string, MetricPoint[]>
): Promise<string> => {
  if (!apiKey) {
    return "Erro: Chave de API ausente. Verifique a configuração do ambiente.";
  }

  try {
    const systemInstruction = buildContext(sources, profile, metrics);
    
    // For Thinking Models, we usually pass the thinking config.
    // Gemini 3 Flash Preview supports thinking.
    const response = await ai.models.generateContent({
      model: MODEL_ID, 
      contents: [
        { role: 'user', parts: [{ text: systemInstruction }] }, // System Context injected as first user message for robustness
        ...history.slice(-3).map(h => ({ role: h.role, parts: [{ text: h.text }] })),
        { role: 'user', parts: [{ text: `Pergunta Atual: ${message}` }] }
      ],
      config: {
        thinkingConfig: { thinkingBudget: 2048 }, 
      }
    });

    return response.text || "Analisei seus dados, mas não consegui gerar uma resposta em texto.";

  } catch (error: any) {
    console.error("Gemini API Error:", error);

    // Fallback logic
    if (error.message?.includes('not supported') || error.status === 400 || error.status === 404 || error.message?.includes('not found')) {
         console.warn("Thinking model failed or not found, falling back to standard config.");
         try {
            // Retry with same model but NO thinking config (sometimes it's the config causing issues if model capabilities changed)
            // Or fallback to a known stable alias if MODEL_ID itself is bad.
            const fallbackResponse = await ai.models.generateContent({
                model: 'gemini-3-flash-preview', 
                contents: `Contexto: ${buildContext(sources, profile, metrics)}\n\nPergunta: ${message}`
            });
            return fallbackResponse.text || "Erro no fallback.";
         } catch (e) {
             console.error("Fallback error:", e);
             return "Erro crítico no serviço de IA. Verifique se o modelo está disponível.";
         }
    }
    return "Encontrei um erro ao analisar seus dados de fitness. Por favor, tente novamente.";
  }
};

export const generateProntuario = async (
    sources: Source[], 
    profile?: UserProfile,
    metrics?: Record<string, MetricPoint[]>
): Promise<string> => {
    if (!apiKey) return "Chave de API ausente.";
 
    const systemInstruction = buildContext(sources, profile, metrics);
    const prompt = `${systemInstruction}\nTarefa: Emitir PRONTUÁRIO COMPLETO DO ATLETA.
    Estruture como um documento médico-esportivo formal.
    Seções Obrigatórias:
    1. Identificação e Antropometria (Use os índices metabólicos calculados como base inicial).
    2. Análise da Evolução das Métricas (Priorize Bioimpedância se houver).
    3. Análise do Protocolo Farmacológico vs Comorbidades.
    4. Análise dos Exames (Cruze com o histórico médico).
    5. Conclusão e Prognóstico.
    `;
 
     try {
       const response = await ai.models.generateContent({
         model: MODEL_ID, // Consistent model usage
         contents: prompt
       });
       return response.text || "Erro ao gerar prontuário.";
     } catch (err) {
         console.error(err);
         return "Erro ao comunicar com a IA.";
     }
};

/**
 * Generates text embeddings for semantic search
 */
export const embedText = async (text: string): Promise<number[] | null> => {
  if (!apiKey) return null;
  try {
    const result = await ai.models.embedContent({
      model: EMBEDDING_MODEL_ID,
      contents: text, 
    });
    
    // Type assertion/check to handle potential SDK version discrepancies (embedding vs embeddings)
    const response = result as any;
    const embedding = response.embedding || (response.embeddings && response.embeddings[0]);
    
    if (embedding && embedding.values) {
        return embedding.values;
    }
    return null;
  } catch (error) {
    console.warn("Embedding API Warning (non-fatal):", error);
    return null;
  }
};

/**
 * Generates a summary for the "Deep Dive" / Source Detail View
 */
export const generateDocumentSummary = async (content: string, type: string): Promise<string> => {
    if (!apiKey) return "Chave de API ausente.";
    
    const prompt = `
    Analise o seguinte documento (${type}) e gere um RESUMO ESTRUTURADO PROFISSIONAL.
    
    Se for EXAME DE SANGUE:
    - Liste os marcadores fora de referência.
    - Analise tendências hormonais.
    
    Se for DIETA/TREINO:
    - Resuma os macros e volume total.
    
    TEXTO:
    ${content.substring(0, 30000)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_ID, // Consistent model usage
            contents: prompt
        });
        return response.text || "Não foi possível gerar resumo.";
    } catch (err) {
        return "Erro ao gerar resumo.";
    }
};

/**
 * Helper to convert file to base64
 */
const fileToGenerativePart = (file: File): Promise<{ inlineData: { data: string, mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * REAL implementation of Multimodal OCR.
 * Extracts text AND structured metrics with Date detection.
 */
export const processDocument = async (file: File, defaultDate: string): Promise<{ extractedText: string, metrics: { category: string, data: MetricPoint }[] }> => {
    if (!apiKey) throw new Error("API Key missing");

    try {
        const filePart = await fileToGenerativePart(file);
        
        // Advanced System Prompt for Extraction
        const extractionPrompt = `
        ATUE COMO UM ANALISTA DE DADOS MÉDICOS E OCR.
        
        TAREFA 1: TRANSCRIÇÃO
        Transcreva o conteúdo legível deste documento para Markdown. Se for ilegível, diga "[Ilegível]".

        TAREFA 2: EXTRAÇÃO DE DADOS (CRÍTICO)
        Identifique a DATA DE COLETA/REALIZAÇÃO do exame no documento. Se encontrar, use o formato DD/MM/AAAA.
        Se NÃO encontrar data específica no documento, use a data de hoje: ${defaultDate}.

        Identifique os seguintes biomarcadores se existirem (ignore se não houver):
        - Testosterone (Total), HDL, LDL, BodyWeight (Peso), BodyFat (Gordura %), MuscleMass, Strength (Cargas principais).

        RETORNE APENAS UM JSON (SEM MARKDOWN EM VOLTA) NO SEGUINTE FORMATO:
        {
            "transcription": "Texto completo transcrito aqui...",
            "detectedDate": "DD/MM/AAAA", 
            "metrics": [
                { "category": "Testosterone", "value": 500, "unit": "ng/dL", "label": "Exame de Sangue" },
                { "category": "HDL", "value": 45, "unit": "mg/dL", "label": "Exame de Sangue" }
            ]
        }
        `;

        const result = await ai.models.generateContent({
            model: VISION_MODEL_ID, // Use fast vision model for OCR
            contents: {
                // Fix: Pass filePart (which has inlineData property), not filePart.inlineData directly
                parts: [filePart, { text: extractionPrompt }]
            },
            config: {
                responseMimeType: "application/json" // Force JSON mode
            }
        });

        const jsonText = result.text;
        if (!jsonText) throw new Error("No data returned from AI");

        const parsed = JSON.parse(jsonText);
        const finalDate = parsed.detectedDate || defaultDate;

        // Map metrics to include the detect date
        const finalMetrics = (parsed.metrics || []).map((m: any) => ({
            category: m.category,
            data: {
                date: finalDate, // Use the date FOUND in the PDF, effectively "Time Traveling" the data point
                value: typeof m.value === 'number' ? m.value : parseFloat(m.value),
                unit: m.unit || '',
                label: m.label || 'OCR Extraído'
            }
        }));

        return {
            extractedText: parsed.transcription || "Sem texto transcrito.",
            metrics: finalMetrics
        };

    } catch (error) {
        console.error("OCR Processing Error:", error);
        // Graceful fallback
        return {
            extractedText: `[Erro ao processar arquivo via IA. Nome: ${file.name}]`,
            metrics: []
        };
    }
};
