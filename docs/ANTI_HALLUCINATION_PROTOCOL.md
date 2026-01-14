
# Protocolo de Correção de Alucinações de Dados (FitLM)

**Data da Implementação:** 14/01/2026 (Refletido no Sistema)
**Componente Afetado:** `services/geminiService.ts` (Brain/Context Builder)

## 1. O Problema (Incidente "87 Anos")

A IA estava apresentando um comportamento de "alucinação persistente" onde:
1.  Ignorava os dados biométricos atuais do usuário (ex: 30 anos, braço 38cm).
2.  Resgatava ou inventava dados antigos/falsos do histórico de conversas (ex: "87 anos", "braço 55cm", datas em 2026).
3.  Misturava o contexto do prompt atual com fragmentos de conversas anteriores, priorizando o texto conversacional em detrimento dos dados estruturados.

Isso ocorria porque LLMs tendem a tratar todo o token stream (Prompt do Sistema + Histórico do Chat + Pergunta Atual) com peso similar, e muitas vezes a repetição de uma informação no histórico (mesmo que errada) reforça a "verdade" para o modelo.

## 2. A Solução: Arquitetura "Source of Truth" (Fonte da Verdade)

Para corrigir isso, implementamos uma hierarquia rígida de dados no prompt do sistema (`buildContext`), forçando o modelo a seguir uma ordem de prioridade explícita.

### 2.1 Injeção de JSON Estruturado
Em vez de passar os dados do perfil como texto corrido (Markdown), agora passamos como um bloco JSON (`CURRENT_BIOMETRICS`).

**Por que?**
Modelos como Gemini são treinados para respeitar estruturas de dados. Quando a IA vê um bloco de código JSON, ela entende aquilo como "Dados Fatos" ou "Configuração", separando mentalmente do "Texto Conversacional" (Histórico).

```typescript
// Exemplo de Injeção
context += "```json\n";
context += JSON.stringify({ CURRENT_BIOMETRICS: biometricsData }, null, 2);
context += "\n```\n";
```

### 2.2 Ancoragem Temporal (System Date)
A IA estava confusa com datas futuras. Injetamos a data do sistema na primeira linha do prompt.

```typescript
const today = new Date().toLocaleDateString('pt-BR');
let context = `DATA DO SISTEMA: ${today}\n`;
```

### 2.3 Instrução de Sobrescrita (Override Rule)
Adicionamos uma instrução explícita para que o modelo *ignore* contradições no histórico.

> "REGRA DE OURO (ANTI-ALUCINAÇÃO): O histórico de chat pode conter dados antigos... IGNORE COMPLETAMENTE... se diferirem dos DADOS VITAIS abaixo."

## 3. Diretrizes para Manutenção Futura

Se este problema voltar a ocorrer (ex: após atualização do modelo da IA), siga estes passos:

1.  **Verifique o Formato dos Dados:** Certifique-se de que nenhum campo do JSON está indo como `undefined` ou `null` sem tratamento (agora usamos `'N/A'` como fallback).
2.  **Limpeza do Histórico:** No `generateAIResponse`, reduzimos o histórico enviado para apenas as últimas 4 mensagens (`history.slice(-4)`). Se a alucinação persistir, considere reduzir para 2 ou limpar o histórico ao mudar de contexto crítico.
3.  **Reforço de Prompt:** Adicione exemplos "Few-Shot" no prompt mostrando como lidar com conflitos (ex: "Usuário diz X, Dados dizem Y -> Resposta: Os dados indicam Y...").

## 4. Testes de Validação

Para validar que o fix está funcionando:
1.  Atualize o perfil com dados reais (ex: Idade 30).
2.  Vá ao chat e pergunte: "Qual minha idade e medida de braço?".
3.  A resposta DEVE bater com o Perfil, ignorando qualquer coisa dita anteriormente no chat.
