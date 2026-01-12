
# Arquitetura de OCR e Análise de Documentos (FitLM)

Este documento detalha a implementação técnica da funcionalidade de upload, leitura (OCR) e extração estruturada de dados de arquivos (PDFs, Imagens de Exames, Treinos, etc.) no FitLM.

## 1. O Problema
Aplicações tradicionais de fitness exigem input manual de dados. O objetivo era permitir que o usuário fizesse upload de um exame de sangue (PDF/Foto) ou uma planilha de treino e o sistema automaticamente:
1. Transcrevesse o texto para que o Chatbot pudesse "ler".
2. Extraísse métricas numéricas (ex: Testosterona: 500 ng/dL) para plotar gráficos.
3. Armazenasse o arquivo original para download futuro.

## 2. A Solução: "Multimodal LLM as OCR"
Em vez de usar bibliotecas de OCR tradicionais (como Tesseract ou AWS Textract), que apenas retornam "sopa de letrinhas" sem contexto, utilizamos o **Google Gemini 2.0 Flash** (`gemini-2.0-flash-exp`).

O Gemini é **Multimodal**, o que significa que ele "vê" a imagem/PDF nativamente e entende a estrutura visual (tabelas, cabeçalhos, unidades de medida).

### Fluxo de Dados

1.  **Frontend (`App.tsx`)**:
    *   Usuário seleciona arquivo.
    *   Arquivo é enviado para o **Supabase Storage** (Bucket `project_files`) para persistência do original.
    *   Arquivo é convertido em Base64 no cliente.

2.  **Processamento (`geminiService.ts`)**:
    *   O Base64 é enviado para a API do Gemini.
    *   Utilizamos um **System Prompt** específico que instrui a IA a atuar em dois modos simultâneos:
        *   **Transcrição:** Copiar o texto visível (Markdown).
        *   **Extração:** Identificar biomarcadores específicos (Testosterona, HDL, Peso, etc.) e formatar em JSON.

3.  **Persistência (`dataService.ts`)**:
    *   O JSON retornado é parseado.
    *   O texto bruto (`extractedText`) é salvo na tabela `sources`.
    *   Os dados numéricos (`metrics`) são salvos na tabela `metrics` (criando o histórico para gráficos).

## 3. Detalhes da Implementação

### 3.1 O Prompt de Engenharia (`geminiService.ts`)

O segredo da precisão está no prompt enviado junto com a imagem. Forçamos o modelo a agir como um parser JSON estrito.

```typescript
const prompt = `
VOCÊ É UM SISTEMA DE OCR AVANÇADO.
TAREFA 1: TRANSCRIÇÃO COMPLETA (Markdown)
TAREFA 2: EXTRAÇÃO DE MÉTRICAS (JSON Estrito)

Procure por VALORES NUMÉRICOS EXATOS para estas categorias:
- 'Testosterone', 'HDL', 'LDL', 'Estradiol', etc.
- 'BodyWeight', 'BodyFat', 'MuscleMass'.

SAÍDA OBRIGATÓRIA (JSON):
{
   "transcription": "Texto completo...",
   "metrics": [
      { "category": "Testosterone", "value": 500, "unit": "ng/dL", "date": "DD/MM/YYYY" }
   ]
}
`;
```

### 3.2 Configuração do Modelo

Utilizamos configurações específicas para garantir que o output seja processável via código:

```typescript
const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp', // Modelo mais rápido e capaz de visão atualmente
    contents: {
        parts: [filePart, { text: prompt }]
    },
    config: {
        responseMimeType: "application/json", // Força resposta JSON válida
        maxOutputTokens: 8192 // Permite leitura de documentos longos
    }
});
```

### 3.3 Tratamento de Erros e Fallback

O sistema possui robustez para falhas de leitura:
1.  **JSON Parse Error:** Se a IA retornar um JSON inválido, o sistema captura o erro, descarta as métricas, mas **preserva o texto bruto** (`text`). Isso garante que o Chatbot ainda consiga ler o documento, mesmo que os gráficos não sejam atualizados.
2.  **Datas Ausentes:** Se o documento não tiver data, o sistema injeta a data atual (`defaultDate`) para não quebrar a ordenação temporal.

## 4. Estrutura de Banco de Dados Relacionada

*   **Tabela `sources`**:
    *   `content`: Armazena o resultado do OCR (Texto bruto). Usado pelo RAG (Retrieval Augmented Generation) do Chat.
    *   `file_path`: Caminho do arquivo original no Supabase Storage.
    *   `summary`: (Opcional) Resumo gerado posteriormente pela IA ("Deep Dive").

*   **Tabela `metrics`**:
    *   Armazena os dados extraídos do JSON (`value`, `unit`, `category`).
    *   Esta tabela alimenta exclusivamente o **MetricDashboard** (gráficos).

## 5. Vantagens desta Abordagem

1.  **Contexto Semântico:** Diferente de um OCR comum, o Gemini entende que "Testo Tot: 500" é o mesmo que "Testosterona Total 500,0". Ele normaliza os nomes das métricas automaticamente.
2.  **Custo/Benefício:** Usar um LLM multimodal evita a necessidade de manter múltiplos serviços (OCR + Regex Parser + Normalizer).
3.  **Flexibilidade:** Se quisermos extrair novos dados (ex: T3 Livre), basta adicionar a chave no Prompt, sem mudar a lógica de regex.
