
# 📚 Documentação da Stack Tecnológica - FitLM

O FitLM é uma **Progressive Web App (PWA)** focada em inteligência atlética, utilizando uma arquitetura *serverless* e *no-build* (via ESM imports) para o frontend, com forte dependência de IA generativa multimodal.

---

## 1. Frontend (Core & UI)

A aplicação roda diretamente no navegador utilizando módulos ES6 modernos via CDN (`esm.sh`), sem necessidade de *bundlers* complexos como Webpack no ambiente de desenvolvimento local.

*   **Framework:** `React 19 (RC/Beta)` (`^19.2.3`)
    *   Utilizado via importmap (`esm.sh`).
*   **Linguagem:** `TypeScript` (Interface e lógica tipada).
*   **Estilização:** `Tailwind CSS` (via CDN `cdn.tailwindcss.com`).
    *   Configuração dinâmica via script no `index.html`.
    *   Plugin: `@tailwindcss/typography` (para renderização de Markdown).
*   **Visualização de Dados:** `Recharts` (`^3.6.0`)
    *   Gráficos de linha e área para métricas de saúde e biomarcadores.
*   **Renderização de Conteúdo:** `react-markdown` (`^10.1.0`)
    *   Para renderizar as respostas da IA e prontuários médicos.
*   **Ícones:** Componentes SVG Customizados (`components/Icons.tsx`).
    *   Implementação leve sem bibliotecas de ícones externas para performance.
*   **Geração de PDF:** `html2pdf.js` (`0.10.1`)
    *   Para exportação de prontuários médicos diretamente do DOM.

---

## 2. Backend & Infraestrutura (Serverless)

Toda a persistência de dados, autenticação e armazenamento de arquivos é gerenciada pelo **Supabase**.

*   **Plataforma:** `Supabase` (Firebase alternative).
*   **Banco de Dados:** `PostgreSQL`.
    *   Tabelas principais: `projects`, `metrics`, `sources` (exames/arquivos), `messages` (chat), `user_profiles`, `usage_logs`, `app_versions`.
    *   **Vector Database:** Utiliza `pgvector` (implícito na função `match_messages`) para busca semântica (RAG).
*   **Autenticação:** `Supabase Auth`.
    *   Suporte a E-mail/Senha, Magic Link e OAuth (Google configurado no código).
*   **Storage (Arquivos):** `Supabase Storage`.
    *   Bucket: `project_files` (Armazena PDFs e imagens originais dos exames e avatares).
*   **Client SDK:** `@supabase/supabase-js` (`2.39.3`).

---

## 3. Inteligência Artificial (The Brain)

O núcleo do sistema utiliza a API do Google Gemini via SDK oficial.

*   **SDK:** `@google/genai` (`^1.35.0`).
*   **Modelos Utilizados:**
    1.  **OCR & Visão Rápida:** `gemini-2.0-flash-lite-preview-02-05`
        *   Função: Leitura de documentos (PDF/Imagens), extração de dados JSON e transcrição.
    2.  **Raciocínio Clínico:** `gemini-3-pro-preview`
        *   Função: Chat interativo, geração de prontuários, análise de correlações complexas e "Thinking Mode".
    3.  **Embeddings:** `text-embedding-004`
        *   Função: Vetorização de mensagens para memória de longo prazo (RAG).
*   **Arquitetura de IA:**
    *   **RAG (Retrieval-Augmented Generation):** O sistema injeta o contexto dos documentos processados e métricas no prompt do sistema.
    *   **Anti-Hallucination Protocol:** Implementação de hierarquia de dados rígida (JSON > Texto) no `geminiService.ts` para evitar invenção de dados.

---

## 4. Arquitetura & Padrões

*   **PWA (Progressive Web App):**
    *   Possui `manifest.json`.
    *   Meta tags para iOS (`apple-mobile-web-app-capable`).
    *   Lógica de instalação manual para iOS (`IOSInstallPrompt.tsx`).
*   **Zero-Flash Theme Architecture:**
    *   Script bloqueante no `<head>` do `index.html` para aplicar tema Escuro/Claro antes da renderização do React, evitando o "flash" branco.
*   **Data Services Pattern:**
    *   Separação clara entre lógica de banco (`services/dataService.ts`), lógica de IA (`services/geminiService.ts`) e componentes de UI.
*   **Human-in-the-Loop OCR:**
    *   Fluxo onde a IA sugere dados e datas, mas o usuário deve confirmar antes de persistir no banco (`DateConfirmationModal.tsx`).

---

## 5. Bibliotecas Utilitárias

*   **Data & Hora:** Manipulação nativa via objeto `Date` do JavaScript (sem Moment.js ou date-fns para leveza).
*   **Markdown Parsing:** `react-markdown`.

---

## 6. Resumo da Estrutura de Pastas

*   `components/`: Componentes React (UI).
*   `services/`: Lógica de negócios, chamadas API (Gemini, Supabase, Protocolos).
*   `lib/`: Configurações de clientes externos (Supabase client).
*   `types.ts`: Definições de tipos TypeScript globais.
*   `docs/`: Documentação interna de arquitetura (Markdown).
