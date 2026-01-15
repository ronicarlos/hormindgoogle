
import { GoogleGenAI } from "@google/genai";
import { Source, ChatMessage, UserProfile, MetricPoint } from '../types';
import { FITLM_ARCHITECTURE_EXPLANATION } from '../lib/systemKnowledge';
import { dataService } from './dataService';
import { supabase } from '../lib/supabase';

// Initialize Gemini Client
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const MODEL_ID = 'gemini-3-flash-preview'; 
const VISION_MODEL_ID = 'gemini-3-flash-preview'; 
const EMBEDDING_MODEL_ID = 'text-embedding-004';

/**
 * Calculates age from birth date string (YYYY-MM-DD)
 */
const calculateAge = (birthDate?: string): string => {
    if (!birthDate) return 'Não informada (Assumir adulto saudável)';
    const today = new Date();
    const birth = new Date(birthDate);
    
    // Validate Date
    if (isNaN(birth.getTime())) return 'Data Inválida';

    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age.toString();
};

/**
 * Constructs a context-aware prompt based on profile, sources, AND structured metrics.
 */
const buildContext = (
    sources: Source[], 
    profile?: UserProfile, 
    metrics?: Record<string, MetricPoint[]>
): string => {
  const today = new Date().toLocaleDateString('pt-BR');
  
  // Header com Data do Sistema para ancoragem temporal
  let context = `DATA DO SISTEMA: ${today}\n`;
  context += "INSTRUÇÃO DE SISTEMA CRÍTICA (FITLM KERNEL):\n\n";
  context += "Você é o FitLM, uma IA de alta precisão para análise fisiológica e farmacológica.\n";
  
  // Regra de Ouro: Prioridade de Contexto
  context += "REGRA DE OURO (ANTI-ALUCINAÇÃO): O histórico de chat pode conter dados antigos, incorretos ou alucinados (ex: idade 87 anos, datas em 2026, medidas erradas). IGNORE COMPLETAMENTE quaisquer medidas, idades ou datas citadas em mensagens anteriores do usuário ou do próprio modelo se diferirem dos DADOS VITAIS abaixo.\n";
  context += "A ÚNICA FONTE DE VERDADE para a condição física atual é o bloco JSON 'CURRENT_BIOMETRICS' a seguir. Confie APENAS nestes valores numéricos.\n\n";

  // 1. DADOS VITAIS DO PACIENTE/ATLETA (Prioridade Máxima - JSON Format)
  if (profile) {
      const age = calculateAge(profile.birthDate);
      
      // Estruturamos como Objeto JS para serializar em JSON limpo
      const biometricsData = {
          patientName: profile.name,
          age: age,
          birthDate: profile.birthDate,
          gender: profile.gender,
          height_cm: profile.height,
          weight_kg: profile.weight,
          bodyFat_percent: profile.bodyFat || 'N/A',
          measurements_cm: {
              chest: profile.measurements.chest || 'N/A',
              arm: profile.measurements.arm || 'N/A',
              waist: profile.measurements.waist || 'N/A',
              hips: profile.measurements.hips || 'N/A',
              thigh: profile.measurements.thigh || 'N/A',
              calf: profile.measurements.calf || 'N/A'
          },
          clinical: {
              comorbidities: profile.comorbidities || 'None',
              medications: profile.medications || 'None'
          },
          calculated: profile.calculatedStats
      };

      context += `=== 1. PERFIL BIOMÉTRICO ATUAL (FONTE DE VERDADE) ===\n`;
      context += "```json\n";
      context += JSON.stringify({ CURRENT_BIOMETRICS: biometricsData }, null, 2);
      context += "\n```\n";
      context += `(Atenção: Se 'waist' (Cintura) for > 90cm, considere risco metabólico aumentado independente do peso.)\n`;
      context += `=======================================================\n\n`;
  } else {
      context += `[AVISO CRÍTICO: Perfil biométrico vazio. Peça para o usuário preencher a Ficha Biométrica antes de analisar.]\n\n`;
  }

  // 2. DADOS ESTRUTURADOS (CLEAN READ)
  if (metrics && Object.keys(metrics).length > 0) {
      context += `=== 2. HISTÓRICO DE EXAMES (DADOS LABORATORIAIS) ===\n`;
      for (const [category, points] of Object.entries(metrics)) {
          const sorted = [...points].sort((a,b) => {
              const dateA = a.date.split('/').reverse().join('-'); 
              const dateB = b.date.split('/').reverse().join('-');
              return new Date(dateB).getTime() - new Date(dateA).getTime();
          });
          
          if (sorted.length > 0) {
              const latest = sorted[0];
              context += `- ${category}: ${latest.value} ${latest.unit} (Data: ${latest.date})\n`;
          }
      }
      context += `======================================================\n\n`;
  }

  // 3. FONTES DE DADOS
  context += "=== 3. CONTEXTO DOCUMENTAL (INPUTS/DIÁRIOS) ===\n";
  if (sources.length > 0) {
      sources.forEach(source => {
        // Prioritize structured summaries or user inputs
        const prefix = source.type === 'USER_INPUT' ? '[REGISTRO DIÁRIO]' : `[DOC: ${source.title}]`;
        // Use document specific type if available for better context
        const typeInfo = source.specificType ? ` (Tipo: ${source.specificType})` : '';
        const dateInfo = source.date ? ` (Data do Exame: ${source.date})` : '';
        
        let contentSnippet = source.summary || source.content;
        
        // Truncate massively long texts to keep focus on profile
        if (contentSnippet.length > 8000) contentSnippet = contentSnippet.substring(0, 8000) + "...";
        
        context += `${prefix}${typeInfo}${dateInfo}:\n${contentSnippet}\n\n`;
      });
  }
  
  context += `\nDIRETRIZES DE RESPOSTA:
1. Responda em Português do Brasil (pt-BR).
2. Prioridade Absoluta: Use os dados do bloco JSON 'CURRENT_BIOMETRICS'. Se o chat histórico disser que o braço é 55cm, mas o JSON disser 38cm, assuma 38cm e ignore o erro do passado.
3. Se a data dos inputs parecer futura (ex: 2026) em relação a data do sistema (${today}), avise o usuário sobre a inconsistência temporal mas analise os dados.
4. Para análise de risco, cruze as "Comorbidades" com os "Medicamentos" e o "Protocolo".
`;
  
  return context;
};

// Helper to get User ID for logging
const getCurrentUserId = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id;
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
    
    // Filter history to reduce hallucination noise
    const safeHistory = history.slice(-4).map(h => ({ role: h.role, parts: [{ text: h.text }] }));

    const response = await ai.models.generateContent({
      model: MODEL_ID, 
      contents: [
        { role: 'user', parts: [{ text: systemInstruction }] }, 
        ...safeHistory,
        { role: 'user', parts: [{ text: `(Responda com base ESTRITAMENTE no JSON 'CURRENT_BIOMETRICS' acima. Ignore dados contraditórios do histórico): ${message}` }] }
      ],
      config: {
        temperature: 0.4 
      }
    });

    const userId = await getCurrentUserId();
    if (userId && response.usageMetadata) {
        const inputT = response.usageMetadata.promptTokenCount || 0;
        const outputT = response.usageMetadata.candidatesTokenCount || 0;
        await dataService.logUsage(userId, undefined, 'CHAT', inputT, outputT);
    }

    return response.text || "Analisei seus dados, mas não consegui gerar uma resposta em texto.";

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes('not supported') || error.status === 400 || error.status === 404) {
         try {
            const fallbackResponse = await ai.models.generateContent({
                model: 'gemini-3-flash-preview', 
                contents: `Contexto: ${buildContext(sources, profile, metrics)}\n\nPergunta: ${message}`
            });
            return fallbackResponse.text || "Erro no fallback.";
         } catch (e) {
             return "Erro crítico no serviço de IA.";
         }
    }
    return "Erro ao analisar dados.";
  }
};

export const generateProntuario = async (
    sources: Source[], 
    profile?: UserProfile,
    metrics?: Record<string, MetricPoint[]>
): Promise<string> => {
    if (!apiKey) return "Chave de API ausente.";
 
    const systemInstruction = buildContext(sources, profile, metrics);
    const prompt = `${systemInstruction}\nTarefa: Emitir PRONTUÁRIO MÉDICO-ESPORTIVO COMPLETO.\nBaseie-se ESTRITAMENTE nos dados do "PERFIL BIOMÉTRICO ATUAL". Não invente dados.`;
 
     try {
       const response = await ai.models.generateContent({
         model: MODEL_ID, 
         contents: prompt
       });

       const userId = await getCurrentUserId();
       if (userId && response.usageMetadata) {
           const inputT = response.usageMetadata.promptTokenCount || 0;
           const outputT = response.usageMetadata.candidatesTokenCount || 0;
           await dataService.logUsage(userId, undefined, 'PRONTUARIO', inputT, outputT);
       }

       return response.text || "Erro ao gerar prontuário.";
     } catch (err) {
         console.error(err);
         return "Erro ao comunicar com a IA.";
     }
};

export const embedText = async (text: string): Promise<number[] | null> => {
  if (!apiKey) return null;
  try {
    const result = await ai.models.embedContent({
      model: EMBEDDING_MODEL_ID,
      contents: text, 
    });
    const response = result as any;
    const embedding = response.embedding || (response.embeddings && response.embeddings[0]);
    if (embedding && embedding.values) return embedding.values;
    return null;
  } catch (error) {
    console.warn("Embedding API Warning:", error);
    return null;
  }
};

export const generateDocumentSummary = async (content: string, type: string): Promise<string> => {
    if (!apiKey) return "Chave de API ausente.";
    const prompt = `Analise este documento (${type}) e gere um RESUMO ESTRUTURADO.\n\nTEXTO:\n${content.substring(0, 15000)}`;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_ID,
            contents: prompt
        });
        return response.text || "Não foi possível gerar resumo.";
    } catch (err) {
        return "Erro ao gerar resumo.";
    }
};

const fileToGenerativePart = (file: File): Promise<{ inlineData: { data: string, mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve({ inlineData: { data: base64Data, mimeType: file.type } });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const processDocument = async (file: File, defaultDate: string): Promise<{ extractedText: string, metrics: { category: string, data: MetricPoint }[], documentType?: string, detectedDate?: string }> => {
    if (!apiKey) throw new Error("API Key missing");

    try {
        const filePart = await fileToGenerativePart(file);
        // ATUALIZADO: Prompt muito mais agressivo para extrair dados de medicina esportiva e DATA
        const extractionPrompt = `
        ATUE COMO OCR MÉDICO ESPECIALISTA EM MEDICINA ESPORTIVA.
        
        TAREFA 1: CLASSIFICAÇÃO
        Classifique o documento em UM destes tipos exatos: 'Hemograma', 'Hormonal', 'Bioimpedância', 'Cardíaco', 'Imagem', 'Rotina', 'Outros'. Se for um laudo específico (ex: Testosterona), use o nome do exame principal.

        TAREFA 2: DATA DO EXAME (CRÍTICO)
        Encontre a "Data da Coleta", "Data de Realização" ou "Data do Exame" no documento.
        - Formato de saída OBRIGATÓRIO: DD/MM/AAAA (Ex: 14/01/2025).
        - Se houver múltiplas datas, prefira a data da COLETA.
        - Se NÃO encontrar data no texto, retorne null (não invente).

        TAREFA 3: EXTRAÇÃO DE MÉTRICAS
        Procure obsessivamente por valores numéricos para estas categorias:
        - Próstata: "PSA Total", "PSA Livre".
        - Rins: Creatinina, Ureia.
        - Inflamatórios: PCR, Fator Reumatoide, CPK.
        - Hormônios: Testosterona Total, Estradiol, Prolactina.
        - Colesterol: LDL, HDL, Triglicerídeos.
        - Fígado: TGO, TGP, Gama GT.
        - Sangue: Hematócrito, Hemoglobina.
        IMPORTANTE: CONVERTA VÍRGULA PARA PONTO DECIMAL EM NÚMEROS (Ex: "4,56" -> 4.56).

        TAREFA 4: TRANSCRIÇÃO
        Transcreva o texto visível.

        RETORNE APENAS JSON VÁLIDO: 
        { 
          "documentType": "Nome do Tipo Identificado",
          "detectedDate": "DD/MM/AAAA" or null,
          "transcription": "...", 
          "metrics": [{ "category": "...", "value": 0, "unit": "..." }] 
        }
        `;

        const result = await ai.models.generateContent({
            model: VISION_MODEL_ID, 
            contents: { parts: [filePart, { text: extractionPrompt }] },
            config: { responseMimeType: "application/json" }
        });

        const jsonText = result.text;
        if (!jsonText) throw new Error("No data");

        const parsed = JSON.parse(jsonText);
        // Use detected date if available, otherwise use default (today) but flag it
        const finalDate = parsed.detectedDate || defaultDate;

        const finalMetrics = (parsed.metrics || []).map((m: any) => ({
            category: m.category,
            data: {
                date: finalDate,
                value: typeof m.value === 'number' ? m.value : parseFloat(m.value),
                unit: m.unit || '',
                label: m.label || 'OCR'
            }
        }));

        return {
            extractedText: parsed.transcription || "Sem texto transcrito.",
            metrics: finalMetrics,
            documentType: parsed.documentType || 'Geral',
            detectedDate: parsed.detectedDate // Return raw detected date
        };

    } catch (error) {
        console.error("OCR Processing Error:", error);
        return { extractedText: `[Erro OCR: ${file.name}]`, metrics: [] };
    }
};
