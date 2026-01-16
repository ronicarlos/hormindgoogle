
import { GoogleGenAI } from "@google/genai";
import { Source, ChatMessage, UserProfile, MetricPoint } from '../types';
import { FITLM_ARCHITECTURE_EXPLANATION } from '../lib/systemKnowledge';
import { dataService } from './dataService';
import { supabase } from '../lib/supabase';

// Initialize Gemini Client
const apiKey = process.env.API_KEY || '';

// --- VERIFICAÇÃO DE CHAVE (DEBUG) ---
if (!apiKey) {
    console.error("❌ ERRO CRÍTICO: GEMINI API_KEY NÃO ENCONTRADA.");
} else {
    const keyPrefix = apiKey.substring(0, 10);
    console.log(`✅ Gemini Service Active. Key Prefix: ${keyPrefix}...`);
}

const ai = new GoogleGenAI({ apiKey });

// --- CONFIGURAÇÃO DE MODELOS ---
// Prioridade: Gemini 2.0 Flash (Experimental) -> Melhor visão e raciocínio
// Fallback: Gemini 1.5 Flash -> Estável
const MODEL_PRIORITY_LIST = ['gemini-2.0-flash-exp', 'gemini-1.5-flash'];
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
  context += "A ÚNICA FONTE DE VERDADE para a condição física atual é o bloco JSON 'CURRENT_BIOMETRICS' e o 'HISTÓRICO DE EXAMES'.\n\n";

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
      context += "DIRETRIZ DE INTERPRETAÇÃO CORPORAL:\n";
      context += "- Se algum dado estiver como 'N/A' ou vazio, ASSUMA QUE NÃO FOI MEDIDO. Não invente valores.\n";
      context += "- Ao analisar o IMC: CRUZE OBRIGATORIAMENTE com o Percentual de Gordura (BF). Se o usuário tem IMC > 25 mas BF baixo (homem < 16%, mulher < 24%) ou usa esteroides, classifique como 'Sobrecarga Muscular/Atlético', JAMAIS como Obesidade.\n";
      context += "- Priorize os valores de bioimpedância (BF%) sobre o IMC isolado sempre.\n";
      context += `=======================================================\n\n`;
  }

  if (metrics && Object.keys(metrics).length > 0) {
      context += `=== 2. HISTÓRICO DE EXAMES (DADOS LABORATORIAIS COMPLETO) ===\n`;
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
3. Ao analisar exames, considere TODO o histórico disponível na seção 2. NÃO IGNORE NENHUM MARCADOR (Hematócrito, Plaquetas, TGO, TGP, etc). Se está na lista, é relevante.
`;
  return context;
};

const getCurrentUserId = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id;
};

// --- FUNÇÃO AUXILIAR PARA TENTATIVA DE MODELO COM FALLBACK ---
const generateWithFallback = async (params: any): Promise<any> => {
    // Tenta o modelo experimental (2.0 Flash)
    try {
        console.log(`Tentando modelo principal: ${MODEL_PRIORITY_LIST[0]}`);
        return await ai.models.generateContent({
            ...params,
            model: MODEL_PRIORITY_LIST[0]
        });
    } catch (error: any) {
        // Se der 404 (Not Found) ou 400 (Bad Request), tenta o estável (1.5 Flash)
        if (error.message?.includes('404') || error.message?.includes('not found') || error.message?.includes('400')) {
            console.warn(`Modelo principal falhou (${error.message}). Tentando fallback: ${MODEL_PRIORITY_LIST[1]}`);
            return await ai.models.generateContent({
                ...params,
                model: MODEL_PRIORITY_LIST[1]
            });
        }
        throw error; // Se for outro erro (ex: quota), repassa
    }
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

    const response = await generateWithFallback({
      contents: [
        { role: 'user', parts: [{ text: systemInstruction }] }, 
        ...safeHistory,
        { role: 'user', parts: [{ text: `(Responda com base ESTRITAMENTE no JSON 'CURRENT_BIOMETRICS' e na seção 'HISTÓRICO DE EXAMES'. Use dados reais extraídos.): ${message}` }] }
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
    return "Erro ao analisar dados. Verifique sua conexão e chave de API.";
  }
};

export const generateProntuario = async (
    sources: Source[], 
    profile?: UserProfile,
    metrics?: Record<string, MetricPoint[]>
): Promise<string> => {
    if (!apiKey) return "Chave de API ausente.";
    const systemInstruction = buildContext(sources, profile, metrics);
    const prompt = `${systemInstruction}\nTarefa: Emitir PRONTUÁRIO MÉDICO-ESPORTIVO COMPLETO.\nInclua análise detalhada de TODOS os exames disponíveis no histórico (Série Vermelha, Branca, Bioquímica, Hormonal).`;
 
     try {
       const response = await generateWithFallback({ contents: prompt });
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
        
        // PROMPT ATUALIZADO: "RAG VISUAL & JSON PARSER"
        const extractionPrompt = `
        VOCÊ É UM SISTEMA DE VISÃO COMPUTACIONAL E EXTRAÇÃO DE DADOS CLÍNICOS (GEMINI VISION).
        
        OBJETIVO: Converter este documento (Imagem/PDF) em dados estruturados para análise médica.
        
        === TAREFA 1: TRANSCRIÇÃO VISUAL (MARKDOWN) ===
        - Leia o documento de cima a baixo.
        - Transcreva TODO o texto visível, mantendo a formatação de tabelas (se houver).
        - Se for um exame de sangue, liste: Exame | Resultado | Unidade | Referência.
        - Se for um treino, liste: Exercício | Séries | Repetições | Carga.
        
        === TAREFA 2: EXTRAÇÃO DE DADOS (JSON) ===
        No FINAL da resposta, adicione ESTRITAMENTE o separador "---END_OF_TEXT---" e um objeto JSON contendo os dados numéricos encontrados.
        
        REGRAS DE EXTRAÇÃO:
        1. DATA: Procure "Data de Coleta", "Data de Emissão" ou datas no cabeçalho. Se não achar, use null.
        2. TIPO: Identifique se é "Hemograma", "Bioquímica", "Hormonal", "Treino", "Dieta", etc.
        3. MÉTRICAS: Extraia APENAS resultados numéricos claros de exames.
           - Padronize nomes: "Testosterona Total" -> "Testosterona", "Eritrócitos/Hemácias" -> "Eritrócitos".
           - Ignore valores de referência no JSON (eles vão apenas no texto).
        
        JSON Schema Obrigatório:
        { 
          "documentType": "string", 
          "detectedDate": "DD/MM/AAAA" | null, 
          "metrics": [{ "category": "Nome Padronizado", "value": 0.0, "unit": "unidade" }] 
        }
        `;

        // Usa a função com fallback para garantir que o OCR funcione mesmo se o 2.0 falhar
        const result = await generateWithFallback({
            contents: { parts: [filePart, { text: extractionPrompt }] },
        });

        const fullText = result.text || "";
        
        const parts = fullText.split('---END_OF_TEXT---');
        let visibleContent = parts[0].trim();
        let jsonContent = parts.length > 1 ? parts[1].trim() : "{}";

        // Limpeza robusta do JSON (remove markdown block quotes ```json ...)
        jsonContent = jsonContent.replace(/```json/g, '').replace(/```/g, '').trim();

        let parsed: any = {};
        try {
            parsed = JSON.parse(jsonContent);
        } catch (e) {
            console.warn("Falha ao parsear JSON de métricas (mantendo texto OCR):", e);
            // Tenta recuperar JSON parcial se possível, senão segue apenas com texto
            return {
                extractedText: visibleContent,
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
            detectedDate: finalDate
        };

    } catch (error) {
        console.error("OCR Critical Error:", error);
        return { extractedText: `[Erro OCR: Falha crítica na leitura. O arquivo pode estar corrompido ou o modelo indisponível.]`, metrics: [] };
    }
};
