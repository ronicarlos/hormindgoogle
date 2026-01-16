
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

const calculateAge = (birthDate?: string): string => {
    if (!birthDate) return 'Não informada (Assumir adulto saudável)';
    const today = new Date();
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return 'Data Inválida';
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age.toString();
};

const buildContext = (
    sources: Source[], 
    profile?: UserProfile, 
    metrics?: Record<string, MetricPoint[]>
): string => {
  const today = new Date().toLocaleDateString('pt-BR');
  
  let context = `DATA DO SISTEMA: ${today}\n`;
  context += "INSTRUÇÃO DE SISTEMA CRÍTICA (FITLM KERNEL):\n\n";
  context += "Você é o FitLM, uma IA de alta precisão para análise fisiológica e farmacológica.\n";
  context += "REGRA DE OURO (ANTI-ALUCINAÇÃO): O histórico de chat pode conter dados antigos ou incorretos. IGNORE COMPLETAMENTE quaisquer medidas, idades ou datas citadas em mensagens anteriores se diferirem dos DADOS VITAIS abaixo.\n";
  context += "A ÚNICA FONTE DE VERDADE para a condição física atual é o bloco JSON 'CURRENT_BIOMETRICS'.\n\n";

  if (profile) {
      const age = calculateAge(profile.birthDate);
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
      context += `=======================================================\n\n`;
  }

  if (metrics && Object.keys(metrics).length > 0) {
      context += `=== 2. HISTÓRICO DE EXAMES (DADOS LABORATORIAIS) ===\n`;
      // Ordena métricas para garantir que o Hematócrito e outros apareçam
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

  context += "=== 3. CONTEXTO DOCUMENTAL (INPUTS/DIÁRIOS) ===\n";
  if (sources.length > 0) {
      sources.forEach(source => {
        const prefix = source.type === 'USER_INPUT' ? '[REGISTRO DIÁRIO]' : `[DOC: ${source.title}]`;
        const typeInfo = source.specificType ? ` (Tipo: ${source.specificType})` : '';
        const dateInfo = source.date ? ` (Data do Exame: ${source.date})` : '';
        
        let contentSnippet = source.summary || source.content;
        if (contentSnippet.length > 8000) contentSnippet = contentSnippet.substring(0, 8000) + "...";
        
        context += `${prefix}${typeInfo}${dateInfo}:\n${contentSnippet}\n\n`;
      });
  }
  
  context += `\nDIRETRIZES DE RESPOSTA:
1. Responda em Português do Brasil (pt-BR).
2. Prioridade Absoluta: Use os dados do bloco JSON 'CURRENT_BIOMETRICS'.
3. Ao analisar exames, considere TODO o histórico disponível na seção 2, incluindo Hematócrito, Plaquetas e outros marcadores do hemograma.
`;
  return context;
};

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
  if (!apiKey) return "Erro: Chave de API ausente.";

  try {
    const systemInstruction = buildContext(sources, profile, metrics);
    const safeHistory = history.slice(-4).map(h => ({ role: h.role, parts: [{ text: h.text }] }));

    const response = await ai.models.generateContent({
      model: MODEL_ID, 
      contents: [
        { role: 'user', parts: [{ text: systemInstruction }] }, 
        ...safeHistory,
        { role: 'user', parts: [{ text: `(Responda com base ESTRITAMENTE no JSON 'CURRENT_BIOMETRICS'. Se perguntado sobre Hematócrito ou outros exames, consulte a seção HISTÓRICO DE EXAMES): ${message}` }] }
      ],
      config: { temperature: 0.4 }
    });

    const userId = await getCurrentUserId();
    if (userId && response.usageMetadata) {
        await dataService.logUsage(userId, undefined, 'CHAT', response.usageMetadata.promptTokenCount || 0, response.usageMetadata.candidatesTokenCount || 0);
    }

    return response.text || "Sem resposta.";
  } catch (error) {
    console.error("Gemini API Error:", error);
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
    const prompt = `${systemInstruction}\nTarefa: Emitir PRONTUÁRIO MÉDICO-ESPORTIVO COMPLETO.\nInclua análise detalhada do Hemograma (Série Vermelha e Branca) se disponível.`;
 
     try {
       const response = await ai.models.generateContent({ model: MODEL_ID, contents: prompt });
       const userId = await getCurrentUserId();
       if (userId && response.usageMetadata) {
           await dataService.logUsage(userId, undefined, 'PRONTUARIO', response.usageMetadata.promptTokenCount || 0, response.usageMetadata.candidatesTokenCount || 0);
       }
       return response.text || "Erro.";
     } catch (err) {
         console.error(err);
         return "Erro ao comunicar com a IA.";
     }
};

export const embedText = async (text: string): Promise<number[] | null> => {
  if (!apiKey) return null;
  try {
    const result = await ai.models.embedContent({ model: EMBEDDING_MODEL_ID, contents: text });
    return (result as any).embedding?.values || null;
  } catch (error) {
    return null;
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
        
        // PROMPT "ANALISTA DE ELITE" - VERSÃO TOTAL EXTRACT
        const extractionPrompt = `
        ATUE COMO UM ANALISTA DE LABORATÓRIO E OCR MÉDICO AVANÇADO.
        
        Sua tarefa é processar este documento (Imagem/PDF) e gerar dois outputs:

        === PARTE 1: RELATÓRIO DE LEITURA (Markdown Visível) ===
        - Transcreva TODO o conteúdo relevante (Laudos, Tabelas, Observações).
        - Destaque em **NEGRITO** valores fora da referência.
        - Se for Hemograma, transcreva TODOS os itens (Série Vermelha, Série Branca, Plaquetas).

        === PARTE 2: DADOS TÉCNICOS (JSON Oculto) ===
        No FINAL, adicione o separador "---END_OF_TEXT---" e um JSON estrito.
        
        REGRA CRÍTICA DE EXTRAÇÃO:
        Extraia TODO e QUALQUER valor numérico que seja um biomarcador, medida ou indicador de saúde. NÃO FILTRE.
        
        Priorize a extração destes grupos, mas não se limite a eles:
        1. HEMOGRAMA COMPLETO: Hematócrito (Hct), Hemoglobina (Hb), Hemácias, VCM, HCM, CHCM, RDW, Leucócitos, Plaquetas.
        2. PERFIL LIPÍDICO: Colesterol Total, HDL, LDL, VLDL, Triglicerídeos.
        3. HORMONAL: Testosterona (Total/Livre), Estradiol, Prolactina, FSH, LH, TSH, T3, T4.
        4. BIOQUÍMICA: Glicose, Insulina, HbA1c, Ureia, Creatinina, TGO, TGP, GGT, CPK, Ferritina.
        5. VITAMINAS: Vitamina D, B12.
        
        Padronize os nomes das chaves (Ex: "Hematocrito", "Hemoglobina", "Testosterona Total").
        
        JSON Schema:
        { 
          "documentType": "string", 
          "detectedDate": "DD/MM/AAAA", 
          "metrics": [{ "category": "Nome Padronizado", "value": 0.0, "unit": "unidade" }] 
        }
        `;

        const result = await ai.models.generateContent({
            model: VISION_MODEL_ID, 
            contents: { parts: [filePart, { text: extractionPrompt }] },
        });

        const fullText = result.text || "";
        
        const parts = fullText.split('---END_OF_TEXT---');
        let visibleContent = parts[0].trim();
        let jsonContent = parts.length > 1 ? parts[1].trim() : "{}";

        // Limpa formatação Markdown do JSON se houver
        jsonContent = jsonContent.replace(/```json/g, '').replace(/```/g, '').trim();

        let parsed: any = {};
        try {
            parsed = JSON.parse(jsonContent);
        } catch (e) {
            console.warn("Falha ao parsear JSON de métricas (mantendo texto OCR):", e);
            return {
                extractedText: visibleContent, // Mantém a análise rica mesmo se o JSON falhar
                metrics: [],
                documentType: 'Documento (OCR)',
                detectedDate: defaultDate
            };
        }

        const finalDate = parsed.detectedDate || defaultDate;
        const finalMetrics = (parsed.metrics || []).map((m: any) => ({
            category: m.category,
            data: {
                date: finalDate,
                value: typeof m.value === 'number' ? m.value : parseFloat(m.value),
                unit: m.unit || '',
                label: 'OCR'
            }
        }));

        return {
            extractedText: visibleContent,
            metrics: finalMetrics,
            documentType: parsed.documentType || 'Geral',
            detectedDate: parsed.detectedDate
        };

    } catch (error) {
        console.error("OCR Error:", error);
        return { extractedText: `[Erro OCR: Falha ao ler arquivo. Tente uma imagem mais nítida.]`, metrics: [] };
    }
};
