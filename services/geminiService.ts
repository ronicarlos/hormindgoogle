
import { GoogleGenAI } from "@google/genai";
import { Source, ChatMessage, UserProfile, MetricPoint } from '../types';

// Initialize Gemini Client
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const MODEL_ID = 'gemini-3-flash-preview';
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
      context += `Antropometria: Altura ${profile.height}cm | Peso ${profile.weight}kg | BF Estimado: ${profile.bodyFat}%\n`;
      context += `Medidas: Braço ${profile.measurements.arm}cm, Cintura ${profile.measurements.waist}cm, Perna ${profile.measurements.thigh}cm\n`;
      context += `Histórico Médico/Comorbidades: ${profile.comorbidities || 'Nenhuma relatada'}\n`;
      context += `Uso de Medicamentos: ${profile.medications || 'Nenhum relatado'}\n`;
      context += `====================================\n\n`;
  } else {
      context += `[AVISO: Perfil biométrico do usuário não preenchido. Solicite esses dados para uma análise precisa.]\n\n`;
  }

  // 2. DADOS ESTRUTURADOS (CLEAN READ)
  // Isso garante que a IA veja os números exatos extraídos do banco, não apenas o texto OCR.
  if (metrics && Object.keys(metrics).length > 0) {
      context += `=== HISTÓRICO DE MÉTRICAS ESTRUTURADAS (FONTE CONFIÁVEL) ===\n`;
      context += `Estes valores foram extraídos, validados e estruturados no banco de dados. Use-os como a verdade absoluta para análises de evolução.\n`;
      
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
  context += `Regras de Comportamento:
1. Responda SEMPRE em Português do Brasil (pt-BR).
2. CONTEXTO BIOMÉTRICO: Use SEMPRE os dados da Ficha Biométrica acima para calcular TMB, riscos cardiovasculares e dosagens.
3. ANÁLISE CRUZADA: Se o usuário listou drogas, cruze com as comorbidades. Use o HISTÓRICO DE MÉTRICAS para identificar tendências (ex: "Sua Testosterona subiu de X para Y").
4. SEGURANÇA: Se identificar doses supra-fisiológicas combinadas com marcadores de saúde alterados, emita alertas.
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
    const fullPrompt = `${systemInstruction}\nHistórico Recente: ${history.slice(-3).map(h => h.text).join('\n')}\n\nPergunta Atual: ${message}`;

    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: fullPrompt,
      config: {
        thinkingConfig: { thinkingBudget: 1024 }, 
      }
    });

    return response.text || "Analisei seus dados, mas não consegui gerar uma resposta em texto.";

  } catch (error) {
    console.error("Gemini API Error:", error);
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
    1. Identificação e Antropometria (Use os dados da Ficha Biométrica).
    2. Análise da Evolução das Métricas (Use a seção de Histórico Estruturado).
    3. Análise do Protocolo Farmacológico vs Comorbidades.
    4. Análise dos Exames (Cruze com o histórico médico).
    5. Conclusão e Prognóstico.
    `;
 
     try {
       const response = await ai.models.generateContent({
         model: MODEL_ID,
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
      content: text,
    });
    return result.embedding.values;
  } catch (error) {
    console.error("Embedding Error:", error);
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
            model: MODEL_ID,
            contents: prompt
        });
        return response.text || "Não foi possível gerar resumo.";
    } catch (err) {
        return "Erro ao gerar resumo.";
    }
};

/**
 * Simulates the "Multimodal OCR" process.
 * In a real scenario with Gemini 1.5 Flash Vision, we would send the image bytes.
 * Here we mock it or handle text files.
 */
export const processDocument = async (file: File, dateStr: string): Promise<{ extractedText: string, metrics: any[] }> => {
    // This function assumes specific implementation for OCR extraction
    // Keeping it simple as per existing code structure
    return {
        extractedText: `[Conteúdo simulado do arquivo ${file.name}]`,
        metrics: []
    }
};
