
import { GoogleGenAI } from "@google/genai";
import { Source, ChatMessage, UserProfile, MetricPoint } from '../types';

// Initialize Gemini Client
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const MODEL_ID = 'gemini-3-flash-preview';

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
         contents: prompt,
         config: {
            thinkingConfig: { thinkingBudget: 2048 }, 
         }
       });
       return response.text || "Falha ao gerar prontuário.";
     } catch (e) {
       return "Erro ao gerar o documento.";
     }
 };

/**
 * Gera um resumo específico para um documento (Single Source Deep Dive)
 */
export const generateDocumentSummary = async (content: string, type: string): Promise<string> => {
    if (!apiKey) return "Chave ausente.";

    const prompt = `
    Aja como um médico do esporte especialista em bioquímica.
    Analise APENAS este documento abaixo (Tipo: ${type}).
    
    DOCUMENTO (Texto extraído/OCR):
    ${content.substring(0, 30000)}

    TAREFA:
    Gere um resumo estruturado em Markdown com:
    1. **Resumo Executivo**: O que é este documento em 1 frase.
    2. **Insights Críticos**: Liste valores alterados ou pontos de atenção (Use emojis ⚠️ para alertas).
    3. **Interpretação**: O que isso significa para a performance/saúde do atleta?
    4. **Recomendação Rápida**: Ação sugerida baseada neste dado.

    Se for um Exame de Sangue, foque em marcadores.
    Se for Treino, foque em volume/intensidade.
    Se for Foto, analise a composição corporal descrita.
    Se for Bioimpedância, foque em Peso, Gordura e Massa Muscular.
    `;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_ID,
            contents: prompt,
            config: {
               thinkingConfig: { thinkingBudget: 512 }, 
            }
        });
        return response.text || "Não foi possível resumir.";
    } catch (e) {
        console.error(e);
        return "Erro ao gerar resumo da fonte.";
    }
};

/**
 * Helper to convert file to Base64 with proper MIME handling
 */
export const fileToGenerativePart = (file: File): Promise<{inlineData: {data: string, mimeType: string}}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Extract pure base64 part
      const base64Data = base64String.includes(',') ? base64String.split(',')[1] : base64String;
      
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type || 'application/pdf' // Fallback for safety
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

interface ProcessedDocument {
    extractedText: string;
    metrics: { category: string; data: MetricPoint }[];
}

/**
 * PROCESSAMENTO PODEROSO E UNIVERSAL:
 * Aceita Bioimpedância, Exames, Fotos de Físico, Planilhas, Textos.
 * Usa o modelo Gemini 2.0 Flash Exp para OCR de alta fidelidade.
 */
export const processDocument = async (file: File, defaultDate: string): Promise<ProcessedDocument> => {
    if (!apiKey) return { extractedText: "", metrics: [] };

    const prompt = `
    VOCÊ É UM SISTEMA DE OCR AVANÇADO (Optical Character Recognition).
    Sua missão é extrair TODO o texto legível deste documento (PDF ou Imagem) e estruturar os dados principais.

    TAREFA 1: TRANSCRIÇÃO COMPLETA (Campo 'transcription')
    - Transcreva o conteúdo do documento em Markdown. 
    - Se for exame de sangue: Liste NOME DO EXAME, VALOR, UNIDADE e VALOR DE REFERÊNCIA.
    - Se for tabela: Mantenha a estrutura visual.
    - Se for texto corrido: Resuma os parágrafos.

    TAREFA 2: EXTRAÇÃO DE MÉTRICAS (Campo 'metrics')
    Procure por VALORES NUMÉRICOS EXATOS e mapeie para estas categorias (apenas se encontrar):
    
    -- EXAMES SANGUE (Valores Numéricos) --
    - 'Testosterone' (Testosterona Total)
    - 'HDL' (Colesterol HDL)
    - 'LDL' (Colesterol LDL)
    - 'Triglycerides' (Triglicérides)
    - 'Glucose' (Glicose / Glicemia)
    - 'AST' (TGO)
    - 'ALT' (TGP)
    - 'Estradiol' (E2)
    - 'Prolactin' (Prolactina)
    - 'Creatinine' (Creatinina)
    - 'CPK' (CPK / CK)
    - 'Hematocrit' (Hematócrito - apenas o número %)

    -- CORPORAL --
    - 'BodyWeight' (Peso em kg)
    - 'BodyFat' (Gordura em %)
    - 'MuscleMass' (Massa Muscular em kg)

    SAÍDA OBRIGATÓRIA (JSON):
    {
       "transcription": "Texto completo extraído do exame...",
       "metrics": [
          { "category": "Testosterone", "value": 500, "unit": "ng/dL", "date": "DD/MM/YYYY" }
       ]
    }
    
    IMPORTANTE: Se não encontrar a data no documento, use "${defaultDate}".
    NÃO INVENTE VALORES. Se o documento estiver ilegível, coloque isso na transcrição.
    `;

    try {
        const filePart = await fileToGenerativePart(file);

        // Usando modelo 2.0 Flash Experimental para melhor performance de OCR/Visão
        // Configurado com responseMimeType JSON para forçar estrutura
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp', 
            contents: {
                parts: [
                    filePart,
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: "application/json",
                maxOutputTokens: 8192 // Permitir respostas longas para OCR completo
            }
        });

        const text = response.text || "";
        
        // Limpeza agressiva para garantir JSON válido
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        let result;
        try {
            result = JSON.parse(jsonStr);
        } catch (jsonError) {
            console.warn("Falha no JSON.parse, usando fallback de texto bruto.", jsonError);
            // FALLBACK CRÍTICO: Se o JSON falhar, ainda retornamos o texto para o RAG funcionar.
            return {
                extractedText: `[OCR RAW - Falha na estruturação automática]\n${text}`, 
                metrics: []
            };
        }

        const metrics = Array.isArray(result.metrics) ? result.metrics.map((m: any) => ({
             category: m.category,
             data: {
                 date: m.date || defaultDate,
                 value: typeof m.value === 'string' ? parseFloat(m.value.replace(',', '.')) : m.value, 
                 unit: m.unit || '',
                 label: 'Auto-OCR'
             }
         })) : [];

        // Filtra métricas que não são números válidos
        const validMetrics = metrics.filter((m: any) => 
            m.data.value !== undefined && m.data.value !== null && !isNaN(Number(m.data.value))
        );

        return {
            extractedText: result.transcription || text, // Prioriza transcrição limpa, senão usa tudo
            metrics: validMetrics
        };

    } catch (e) {
        console.error("Erro CRÍTICO no processamento:", e);
        // Mesmo no erro fatal, tenta retornar algo amigável se possível, ou vazio
        return { 
            extractedText: `Erro sistêmico ao ler o arquivo ${file.name}. Verifique se é um PDF ou Imagem válida. Detalhes: ${e}`, 
            metrics: [] 
        };
    }
}

export const extractMetricsFromContent = async (content: string, defaultDate: string): Promise<{ category: string; data: MetricPoint }[]> => {
    return []; 
}
