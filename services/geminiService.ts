
import { GoogleGenAI, Modality } from "@google/genai";
import { Source, ChatMessage, UserProfile, MetricPoint, SourceType } from '../types';
import { FITLM_ARCHITECTURE_EXPLANATION } from '../lib/systemKnowledge';
import { dataService } from './dataService';
import { supabase } from '../lib/supabase';

/**
 * ==============================================================================
 * 🧠 FITLM CORE ARCHITECTURE: ANTI-HALLUCINATION & DATA SOURCE OF TRUTH
 * ==============================================================================
 */

// --- INICIALIZAÇÃO ROBUSTA DA API KEY ---
const getApiKey = () => {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
        return (import.meta as any).env.VITE_GEMINI_API_KEY || (import.meta as any).env.VITE_API_KEY;
    }
    return process.env.API_KEY || process.env.VITE_GEMINI_API_KEY;
};

const apiKey = getApiKey() || '';

if (!apiKey) {
    console.error("❌ ERRO CRÍTICO: GEMINI API_KEY NÃO ENCONTRADA.");
} else {
    const keyPrefix = apiKey.substring(0, 10);
    console.log(`✅ Gemini Service Active. Key Prefix: ${keyPrefix}...`);
}

const ai = new GoogleGenAI({ apiKey });

// --- CONFIGURAÇÃO DE MODELOS (TWO-STAGE ARCHITECTURE) ---

// 1. Modelo de Extração (OCR/Visão Rápida)
const getOcrModel = () => {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
        return (import.meta as any).env.VITE_GEMINI_MODEL; // Ex: gemini-2.0-flash-lite
    }
    return null;
}

// 2. Modelo de Análise Clínica (Raciocínio Profundo)
const getMedicalModel = () => {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
        return (import.meta as any).env.VITE_GEMINI_MODEL_MEDICAL; // Ex: gemini-3-pro-preview
    }
    return null;
}

export const OCR_MODEL = getOcrModel() || 'gemini-2.0-flash-lite-preview-02-05';
export const MEDICAL_MODEL = getMedicalModel() || 'gemini-3-pro-preview';
export const VISION_MODEL = 'gemini-2.5-flash-image'; // Novo modelo para análise visual (Nano Banana)
export const TTS_MODEL = 'gemini-2.5-flash-preview-tts'; // Modelo para Texto para Fala

console.log(`🤖 Arquitetura Ativa:\n - OCR: ${OCR_MODEL}\n - Cérebro Clínico: ${MEDICAL_MODEL}\n - Visão: ${VISION_MODEL}\n - Voz: ${TTS_MODEL}`);

const EMBEDDING_MODEL_ID = 'text-embedding-004';

// --- HELPERS ---

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

const parseDate = (dateStr: string): number => {
    try {
        if (!dateStr) return 0;
        // Formato DD/MM/YYYY (Padrão do App)
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                // Mês em JS é base 0 (0-11)
                return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
            }
        }
        // Formato ISO YYYY-MM-DD (Supabase)
        return new Date(dateStr).getTime();
    } catch (e) {
        return 0;
    }
};

// --- LOGICA DE ORDENAÇÃO DE MÉTRICAS (CRUCIAL PARA CORREÇÃO) ---
const sortMetrics = (points: MetricPoint[], futureLimit: number): MetricPoint[] => {
    // 1. Mapeia com índice original para usar como fallback
    const mapped = points.map((p, i) => ({ ...p, originalIndex: i }));

    // 2. Filtra datas futuras
    const valid = mapped.filter(p => parseDate(p.date) <= futureLimit);

    // 3. Ordena: 
    //    A) Data Decrescente (Mais novo primeiro)
    //    B) Se data igual (NORMALIZADA): Data de Criação no Banco (Timestamp exato)
    //    C) Se data igual e sem timestamp: Índice original Maior
    return valid.sort((a, b) => {
        const timestampA = parseDate(a.date);
        const timestampB = parseDate(b.date);

        // NORMALIZAÇÃO CRÍTICA: Zera as horas para comparar apenas o DIA.
        // Isso resolve o problema de fuso horário (UTC vs Local) fazendo dias iguais parecerem diferentes.
        const dayA = new Date(timestampA).setHours(0,0,0,0);
        const dayB = new Date(timestampB).setHours(0,0,0,0);

        // Critério 1: Dia do Exame (Cronológico)
        if (dayA !== dayB) {
            return dayB - dayA; // Mais recente primeiro
        }

        // Critério 2: Timestamp de Criação (O registro inserido por ÚLTIMO ganha)
        // Isso garante que se eu corrigi um valor hoje, o valor corrigido (mais novo no banco) apareça no topo.
        const createdA = a.createdAt || 0;
        const createdB = b.createdAt || 0;
        
        if (createdA !== createdB) {
             return createdB - createdA; // Maior timestamp (mais novo) primeiro
        }

        // Critério 3: Autoridade da Fonte (Manual ganha de OCR se empatar em tudo)
        const isManualA = a.label?.toLowerCase().includes('manual') || a.label?.toLowerCase().includes('wizard');
        const isManualB = b.label?.toLowerCase().includes('manual') || b.label?.toLowerCase().includes('wizard');

        if (isManualA && !isManualB) return -1; 
        if (!isManualA && isManualB) return 1;  

        // Critério 4: Ordem de Inserção original do array (Fallback)
        return b.originalIndex - a.originalIndex;
    });
};

const buildContext = (
    sources: Source[], 
    profile?: UserProfile, 
    metrics?: Record<string, MetricPoint[]>
): string => {
  const today = new Date();
  const todayStr = today.toLocaleDateString('pt-BR');
  const todayTs = today.getTime(); 
  
  // Buffer de 24h para fusos
  const futureLimit = todayTs + 86400000; 

  let context = `DATA ATUAL DO SISTEMA: ${todayStr}\n`;
  context += "INSTRUÇÃO DE SISTEMA CRÍTICA (FITLM KERNEL):\n";
  context += "Você é o FitLM, uma IA de alta precisão para análise fisiológica.\n\n";
  context += "HIERARQUIA DE DADOS E REGRAS DE LISTAGEM:\n";
  context += "1. O valor JSON 'CURRENT_BIOMETRICS' é a Verdade Absoluta ATUAL (Snapshot).\n";
  context += "2. A seção 'HISTÓRICO COMPLETO DE EXAMES' contém TODOS os registros brutos do banco de dados.\n";
  context += "3. IMPORTANTE: Se o usuário pedir 'histórico completo' ou 'todos os valores', você DEVE listar todos os itens da seção 2, incluindo fontes OCR e Manuais, mesmo que haja redundância de datas.\n";
  context += "4. Para análise clínica (diagnóstico), priorize o mais recente. Para relatório histórico, liste tudo.\n\n";

  // Helper para obter o valor mais recente usando a nova lógica de ordenação
  const getLatestValue = (categoryKey: string, altKey?: string): string => {
      if (!metrics) return 'N/A';
      
      const list = metrics[categoryKey] || (altKey ? metrics[altKey] : []) || [];
      if (list.length === 0) return 'N/A';

      const sorted = sortMetrics(list, futureLimit);

      if (sorted.length === 0) return 'N/A';

      const latest = sorted[0]; // O primeiro da lista ordenada é o vencedor
      const dateVal = parseDate(latest.date);
      const isToday = new Date(dateVal).setHours(0,0,0,0) === new Date().setHours(0,0,0,0);
      
      // Marca visual para a IA
      const sourceLabel = isToday 
          ? `[DADO VIGENTE - CONFIRMADO HOJE via ${latest.label || 'Sistema'}]` 
          : `(Data: ${latest.date})`;
          
      return `${latest.value} ${latest.unit} ${sourceLabel}`;
  };

  const latestTesto = getLatestValue('Testosterone', 'Testosterona');
  const latestE2 = getLatestValue('Estradiol');
  const latestWeight = getLatestValue('Weight', 'Peso');
  const latestBF = getLatestValue('BodyFat', 'Gordura');

  if (profile) {
      const age = calculateAge(profile.birthDate);
      
      // Monta o JSON da Verdade
      const biometricsData = {
          status: "OFFICIAL_SNAPSHOT",
          patientName: profile.name,
          age: age,
          birthDate: profile.birthDate,
          gender: profile.gender,
          
          // Se tiver dado hoje no histórico, usa. Senão usa o perfil estático.
          weight_kg: latestWeight !== 'N/A' && latestWeight.includes('HOJE') ? latestWeight : profile.weight,
          bodyFat_percent: latestBF !== 'N/A' && latestBF.includes('HOJE') ? latestBF : (profile.bodyFat || 'N/A'),
          
          latest_hormones_panel: {
              testosterone_total: latestTesto,
              estradiol_e2: latestE2
          },
          
          measurements_cm: profile.measurements,
          clinical: {
              comorbidities: profile.comorbidities || 'None',
              medications: profile.medications || 'None'
          }
      };

      context += `=== 1. PERFIL BIOMÉTRICO ATUAL (SOURCE OF TRUTH) ===\n`;
      context += "```json\n";
      context += JSON.stringify({ CURRENT_BIOMETRICS: biometricsData }, null, 2);
      context += "\n```\n";
      context += `=======================================================\n\n`;
  }

  if (metrics && Object.keys(metrics).length > 0) {
      context += `=== 2. HISTÓRICO COMPLETO DE EXAMES (ORDEM CRONOLÓGICA) ===\n`;
      context += `NOTA: Esta lista contém TODOS os pontos de dados disponíveis, sem filtros. Use-a para construir linhas do tempo.\n`;
      
      for (const [category, points] of Object.entries(metrics)) {
          const sorted = sortMetrics(points, futureLimit);
          
          if (sorted.length > 0) {
              const latest = sorted[0];
              const refs = latest.refMin ? ` (Ref Lab: ${latest.refMin}-${latest.refMax})` : '';
              
              context += `\nCATEGORIA: ${category}\n`;
              context += `  -> MAIS RECENTE: ${latest.value} ${latest.unit}${refs} [DATA: ${latest.date}] [FONTE: ${latest.label || 'N/A'}]\n`;
              
              // LISTAGEM COMPLETA DO HISTÓRICO (SEM LIMITES DE SLICE)
              if (sorted.length > 1) {
                  const historyItems = sorted.slice(1).map(p => 
                      `Val: ${p.value} ${p.unit} (Data: ${p.date}) [Fonte: ${p.label || 'N/A'}]`
                  );
                  context += `  -> HISTÓRICO ANTERIOR: ${historyItems.join(' | ')}\n`;
              } else {
                  context += `  -> HISTÓRICO ANTERIOR: Nenhum registro adicional.\n`;
              }
          }
      }
      context += `======================================================\n\n`;
  }

  context += "=== 3. CONTEXTO DOCUMENTAL (ARQUIVOS OCR) ===\n";
  if (sources.length > 0) {
      sources.forEach(source => {
        // Se for uma foto de evolução, identifica como tal
        if (source.type === 'IMAGE' && source.specificType === 'PHYSIQUE_CHECK') {
            context += `[CHECK DE FÍSICO / EVOLUÇÃO VISUAL] (${source.date}):\n${source.content}\n\n`;
        } else {
            const prefix = source.type === 'USER_INPUT' ? '[REGISTRO MANUAL]' : `[DOC OCR: ${source.title}]`;
            const sourceDateTs = parseDate(source.date);
            
            let dateDisplay = source.date;
            if (sourceDateTs > futureLimit) dateDisplay = "DATA_INVALIDA (Ignorar)";

            let contentSnippet = source.summary || source.content;
            if (contentSnippet.length > 6000) contentSnippet = contentSnippet.substring(0, 6000) + "...";
            
            context += `${prefix} (${dateDisplay}):\n${contentSnippet}\n\n`;
        }
      });
  }
  
  return context;
};

const getCurrentUserId = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id;
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

function decodeAudioData(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// --- FUNÇÃO DE OCR (USA VITE_GEMINI_MODEL - FLASH LITE) ---
export const processDocument = async (file: File, defaultDate: string): Promise<{ extractedText: string, metrics: { category: string, data: MetricPoint }[], documentType?: string, detectedDate?: string }> => {
    if (!apiKey) throw new Error("API Key missing");

    try {
        console.log(`FitLM OCR: Iniciando leitura com ${OCR_MODEL}...`);
        const filePart = await fileToGenerativePart(file);
        
        const extractionPrompt = `
        VOCÊ É UM SISTEMA DE VISÃO COMPUTACIONAL E EXTRAÇÃO DE DADOS CLÍNICOS (GEMINI VISION).
        
        OBJETIVO: Converter este documento (Imagem/PDF) em dados estruturados para análise posterior.
        
        === TAREFA 1: TRANSCRIÇÃO VISUAL (MARKDOWN) ===
        - Leia o documento de cima a baixo.
        - Transcreva TODO o texto visível, mantendo a formatação de tabelas (se houver).
        
        === TAREFA 2: EXTRAÇÃO DE DADOS (JSON) ===
        No FINAL da resposta, adicione ESTRITAMENTE o separador "---END_OF_TEXT---" e um objeto JSON.
        
        REGRAS DE EXTRAÇÃO:
        1. DATA (CRÍTICO): Procure EXPLICITAMENTE por "Data de Coleta", "Data de Emissão", "Realizado em". Se encontrar, use o formato DD/MM/AAAA. Se não encontrar data IMPRESSA no documento, retorne null no JSON (o sistema usará metadados do arquivo).
        2. TIPO: Identifique se é "Hemograma", "Bioquímica", "Hormonal", "Treino", "Dieta", etc.
        3. MÉTRICAS E REFERÊNCIAS: 
           - Extraia resultados numéricos claros.
           - Extraia a FAIXA DE REFERÊNCIA (Min e Max).
           - Padronize nomes: "Testosterona Total" -> "Testosterona".
        
        JSON Schema Obrigatório:
        { 
          "documentType": "string", 
          "detectedDate": "DD/MM/AAAA" | null, 
          "metrics": [
             { "category": "Nome Padronizado", "value": 0.0, "unit": "unidade", "refMin": 0.0 | null, "refMax": 0.0 | null }
          ] 
        }
        `;

        // CHAMADA DIRETA PARA O MODELO OCR (SEM FALLBACK COMPLEXO PARA NÃO MISTURAR LOGICA)
        const result = await ai.models.generateContent({
            model: OCR_MODEL,
            contents: { parts: [filePart, { text: extractionPrompt }] },
        });

        const fullText = result.text || "";
        
        const parts = fullText.split('---END_OF_TEXT---');
        let visibleContent = parts[0].trim();
        let jsonContent = parts.length > 1 ? parts[1].trim() : "{}";

        // Limpeza robusta do JSON
        jsonContent = jsonContent.replace(/```json/g, '').replace(/```/g, '').trim();

        let parsed: any = {};
        try {
            parsed = JSON.parse(jsonContent);
        } catch (e) {
            console.warn("Falha ao parsear JSON de métricas (mantendo texto OCR):", e);
            try {
                const cleanJson = jsonContent.replace(/[\u0000-\u0019]+/g,""); 
                parsed = JSON.parse(cleanJson);
            } catch (e2) {
                 return {
                    extractedText: visibleContent,
                    metrics: [],
                    documentType: 'Documento (OCR)',
                    detectedDate: defaultDate
                };
            }
        }

        // LÓGICA DE DATA: Se o OCR achou data, usa ela. Se não, usa a data do metadado do arquivo (defaultDate)
        // Isso impede que exames antigos upados hoje fiquem com data de hoje se tiverem data impressa.
        const finalDate = parsed.detectedDate || defaultDate;
        
        const finalMetrics = (parsed.metrics || []).map((m: any) => ({
            category: m.category,
            data: {
                date: finalDate,
                value: typeof m.value === 'number' ? m.value : parseFloat(m.value),
                unit: m.unit || '',
                label: 'OCR',
                refMin: typeof m.refMin === 'number' ? m.refMin : undefined,
                refMax: typeof m.refMax === 'number' ? m.refMax : undefined
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
        return { extractedText: `[Erro OCR: Falha crítica na leitura com modelo ${OCR_MODEL}. Verifique a imagem ou tente novamente.]`, metrics: [] };
    }
};

// --- NOVA FUNÇÃO: ANÁLISE DE FÍSICO (VISUAL) ---
export const analyzePhysique = async (files: File[], comparisonMode: boolean = false): Promise<string> => {
    if (!apiKey) return "Erro: API Key ausente.";

    try {
        console.log(`FitLM Vision: Iniciando análise visual com ${VISION_MODEL}...`);
        
        const fileParts = await Promise.all(files.map(f => fileToGenerativePart(f)));
        
        let prompt = "";
        if (comparisonMode && files.length >= 2) {
            prompt = `
            ATUE COMO UM TREINADOR DE FISICULTURISMO E ESPECIALISTA EM BIOMECÂNICA (FitLM Coach).
            
            TAREFA: Compare estas imagens de físico (Antes/Depois ou Evolução).
            
            ANÁLISE COMPARATIVA OBRIGATÓRIA:
            1. **Volume Muscular:** Onde houve ganho visível? (Braços, Ombros, Pernas, Dorsal).
            2. **Definição (BF%):** A gordura diminuiu? Houve melhora na vascularização ou cortes?
            3. **Pontos Fortes vs Fracos:** O que melhorou e o que ainda precisa de atenção?
            4. **Postura:** Alguma mudança postural notável?
            
            Seja direto, técnico e motivador. Use terminologia de musculação correta.
            `;
        } else {
            prompt = `
            ATUE COMO UM TREINADOR DE FISICULTURISMO E ESPECIALISTA EM BIOMECÂNICA (FitLM Coach).
            
            TAREFA: Analise esta imagem de físico (Check de Shape).
            
            FORNEÇA:
            1. **Estimativa de BF%:** (Visual aproximado).
            2. **Análise de Simetria:** Desbalanços visíveis (Ex: ombro esquerdo mais alto, quadríceps dominante).
            3. **Pontos Fortes:** Grupos musculares bem desenvolvidos.
            4. **Pontos de Melhoria:** Onde focar o treino.
            
            NOTA DE SEGURANÇA: Esta é uma análise técnica de fitness/esporte para monitoramento de progresso atlético.
            `;
        }

        const result = await ai.models.generateContent({
            model: VISION_MODEL,
            contents: { parts: [...fileParts, { text: prompt }] },
        });

        const userId = await getCurrentUserId();
        if (userId && result.usageMetadata) {
            // Log de custo específico para Imagem
            await dataService.logUsage(
                userId, 
                undefined, 
                comparisonMode ? 'PHYSIQUE_COMPARE' : 'PHYSIQUE_ANALYSIS', 
                result.usageMetadata.promptTokenCount || 0, 
                result.usageMetadata.candidatesTokenCount || 0,
                VISION_MODEL 
            );
        }

        return result.text || "Não foi possível analisar a imagem.";

    } catch (error) {
        console.error("Physique Analysis Error:", error);
        return "Erro ao processar análise visual. Tente novamente.";
    }
};

// --- FUNÇÃO DE SÍNTESE DE VOZ (TTS) ---
export const generateSpeech = async (text: string): Promise<ArrayBuffer | null> => {
    if (!apiKey) return null;

    try {
        console.log(`FitLM TTS: Sintetizando voz com ${TTS_MODEL}...`);
        
        // Limita o texto para evitar tokens excessivos ou falhas
        const safeText = text.length > 3000 ? text.substring(0, 3000) + "..." : text;

        const response = await ai.models.generateContent({
            model: TTS_MODEL,
            contents: {
                parts: [{ text: safeText }]
            },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' } // 'Kore' é uma voz feminina geralmente clara
                    }
                }
            }
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        
        if (base64Audio) {
            return decodeAudioData(base64Audio);
        }
        
        return null;

    } catch (error) {
        console.error("TTS Error:", error);
        return null;
    }
};

// --- FUNÇÃO DE ANÁLISE CLÍNICA (USA VITE_GEMINI_MODEL_MEDICAL - PRO/MED) ---
export const generateAIResponse = async (
  message: string,
  sources: Source[],
  history: ChatMessage[],
  profile?: UserProfile,
  metrics?: Record<string, MetricPoint[]>
): Promise<string> => {
  if (!apiKey) return "Erro: Chave de API ausente.";

  try {
    console.log(`FitLM Brain: Iniciando análise clínica com ${MEDICAL_MODEL}...`);
    const systemInstruction = buildContext(sources, profile, metrics);
    const safeHistory = history.slice(-4).map(h => ({ role: h.role, parts: [{ text: h.text }] }));

    // Tentativa principal com modelo Médico/Pro
    try {
        const response = await ai.models.generateContent({
            model: MEDICAL_MODEL,
            contents: [
                { role: 'user', parts: [{ text: systemInstruction }] }, 
                ...safeHistory,
                { role: 'user', parts: [{ text: `(Responda com base ESTRITAMENTE no JSON 'CURRENT_BIOMETRICS'. Dados de hoje (${new Date().toLocaleDateString()}) têm precedência total sobre o histórico.): ${message}` }] }
            ],
            config: { temperature: 0.3 } // Temperatura mais baixa para precisão médica
        });

        const userId = await getCurrentUserId();
        if (userId && response.usageMetadata) {
            // LOG DE CUSTO PRECISO: Passa o MEDICAL_MODEL
            await dataService.logUsage(
                userId, 
                undefined, 
                'CHAT', 
                response.usageMetadata.promptTokenCount || 0, 
                response.usageMetadata.candidatesTokenCount || 0,
                MEDICAL_MODEL // Modelo Pro (Custo alto)
            );
        }

        return response.text || "Sem resposta.";

    } catch (primaryError: any) {
        console.warn(`FitLM: Modelo Médico (${MEDICAL_MODEL}) falhou. Tentando fallback para Flash...`);
        const responseFallback = await ai.models.generateContent({
            model: OCR_MODEL, 
            contents: [
                { role: 'user', parts: [{ text: systemInstruction + "\n[NOTA: MODO DE FALLBACK ATIVADO]" }] },
                { role: 'user', parts: [{ text: message }] }
            ]
        });
        
        // Log do fallback (custo baixo)
        const userId = await getCurrentUserId();
        if (userId && responseFallback.usageMetadata) {
             await dataService.logUsage(
                userId, 
                undefined, 
                'CHAT_FALLBACK', 
                responseFallback.usageMetadata.promptTokenCount || 0, 
                responseFallback.usageMetadata.candidatesTokenCount || 0,
                OCR_MODEL // Modelo Flash (Custo baixo)
            );
        }

        return responseFallback.text || "Sem resposta (Fallback).";
    }

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
    
    // Prontuário sempre usa o modelo médico robusto
    const systemInstruction = buildContext(sources, profile, metrics);
    const prompt = `${systemInstruction}\nTarefa: Emitir PRONTUÁRIO MÉDICO-ESPORTIVO COMPLETO.\nInclua análise detalhada de TODOS os exames disponíveis no histórico (Série Vermelha, Branca, Bioquímica, Hormonal).`;
 
     try {
       console.log(`FitLM Prontuário: Gerando com ${MEDICAL_MODEL}...`);
       const response = await ai.models.generateContent({
           model: MEDICAL_MODEL,
           contents: prompt 
       });
       
       const userId = await getCurrentUserId();
       if (userId && response.usageMetadata) {
           // LOG DE CUSTO PRECISO: Passa o MEDICAL_MODEL
           await dataService.logUsage(
               userId, 
               undefined, 
               'PRONTUARIO', 
               response.usageMetadata.promptTokenCount || 0, 
               response.usageMetadata.candidatesTokenCount || 0,
               MEDICAL_MODEL // Modelo Pro (Custo alto)
            );
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
    console.warn("Embedding Error (Ignored):", error);
    return null;
  }
};
