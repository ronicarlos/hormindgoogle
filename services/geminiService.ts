import { GoogleGenAI } from "@google/genai";
import { Source, ChatMessage } from '../types';

// Initialize Gemini Client
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const MODEL_ID = 'gemini-3-flash-preview';

/**
 * Constructs a context-aware prompt based on selected sources.
 * In a real app, this would use embeddings/RAG. Here we simulate by injecting text.
 */
const buildContext = (sources: Source[]): string => {
  if (sources.length === 0) return "";
  
  let context = "Você é o FitLM, um analista de fitness avançado com IA. Sua principal função é realizar uma ANÁLISE HOLÍSTICA cruzando Treino, Dieta, Protocolo (Drogas/Peptídeos) e Exames Médicos.\n\n--- INÍCIO DAS FONTES DE DADOS ---\n";
  
  sources.forEach(source => {
    // Treat USER_INPUT sources with high priority for current context
    const prefix = source.type === 'USER_INPUT' ? '[DADOS ATUAIS DO USUÁRIO]' : `[Fonte: ${source.title} (${source.date})]`;
    context += `${prefix}\n${source.content}\n\n`;
  });
  
  context += "--- FIM DAS FONTES ---\n\n";
  context += `Regras de Comportamento:
1. Responda SEMPRE em Português do Brasil (pt-BR).
2. ANÁLISE CRUZADA: Se o usuário listou drogas (ex: testosterona), cruze imediatamente com os exames (ex: hematócrito, colesterol, enzimas hepáticas) e a dieta (ex: calorias suficientes para o anabolismo?).
3. SEGURANÇA: Se identificar doses supra-fisiológicas combinadas com marcadores de saúde alterados (ex: LDL alto), emita alertas claros de risco, mas sem julgamento moral. Sempre recomende acompanhamento médico.
4. PERFORMANCE: Analise se o treino e a dieta condizem com o objetivo (ex: Bulking requer superávit calórico).
5. PRONTUÁRIO: Se solicitado um prontuário, estruture cronologicamente e resuma todos os pilares (Saúde, Estética, Performance).
6. FORMATO: Use Markdown, listas e negrito para clareza.
`;
  
  return context;
};

export const generateAIResponse = async (
  message: string,
  sources: Source[],
  history: ChatMessage[]
): Promise<string> => {
  if (!apiKey) {
    return "Erro: Chave de API ausente. Verifique a configuração do ambiente.";
  }

  try {
    const systemInstruction = buildContext(sources);
    const fullPrompt = `${systemInstruction}\nPergunta/Ação do Usuário: ${message}`;

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

export const generateWeeklyReport = async (sources: Source[]): Promise<string> => {
   if (!apiKey) return "Chave de API ausente.";

   const systemInstruction = buildContext(sources);
   const prompt = `${systemInstruction}\nTarefa: Gere um Relatório de Progresso Semanal Holístico. Analise se a dieta (${sources.find(s => s.content.includes('Calorias')) ? 'dados presentes' : 'dados ausentes'}) e o protocolo estão alinhados com os exames recentes.`;

    try {
      const response = await ai.models.generateContent({
        model: MODEL_ID,
        contents: prompt,
      });
      return response.text || "Nenhum relatório gerado.";
    } catch (e) {
      return "Falha ao gerar o relatório.";
    }
};

export const generateProntuario = async (sources: Source[]): Promise<string> => {
    if (!apiKey) return "Chave de API ausente.";
 
    const systemInstruction = buildContext(sources);
    const prompt = `${systemInstruction}\nTarefa: Emitir PRONTUÁRIO COMPLETO DO ATLETA.
    Estruture como um documento médico-esportivo formal.
    Seções Obrigatórias:
    1. Resumo do Perfil e Objetivos.
    2. Análise do Protocolo Farmacológico Atual (Drogas/Peptídeos) vs Riscos.
    3. Análise dos Últimos Exames (Destaque o que está fora do padrão).
    4. Avaliação Nutricional e de Treinamento.
    5. Plano de Ação Sugerido (Correções necessárias).
    6. Conclusão e Prognóstico.
    `;
 
     try {
       const response = await ai.models.generateContent({
         model: MODEL_ID,
         contents: prompt,
         config: {
            thinkingConfig: { thinkingBudget: 2048 }, // Higher budget for comprehensive report
         }
       });
       return response.text || "Falha ao gerar prontuário.";
     } catch (e) {
       return "Erro ao gerar o documento.";
     }
 };