
# 🧠 Lógica de Prioridade de Dados e Resolução de Conflitos (FitLM)

**Data da Implementação:** Versão 1.6.74
**Componente Afetado:** `MetricDashboard.tsx`

## 1. O Problema Original
O sistema enfrentava um conflito de "Verdade" entre duas fontes de dados:
1.  **Input Manual:** Dados que o usuário digita no Perfil ou Wizard (ex: Testosterona definida manualmente como 3400 ng/dL).
2.  **Exames (OCR):** Dados extraídos automaticamente de PDFs (ex: Um exame antigo de 2286 ng/dL).

Anteriormente, o sistema priorizava estritamente a **DATA**. Se o exame fosse mais recente (ou se o sistema se confundisse com datas), ele sobrescrevia o valor manual no Card Principal, causando confusão para usuários em protocolos hormonais (Blast & Cruise) que sabem seu valor atual melhor que um exame antigo.

Além disso, valores "HIGH" (acima da referência) estavam sendo exibidos em Laranja (Alerta), diminuindo a percepção de risco crítico em casos de valores suprafisiológicos extremos.

## 2. A Solução: Prioridade Absoluta do Usuário ("User Authority")

Implementamos uma regra de negócio rígida onde a intenção declarada do usuário supera a evidência documental histórica na visualização principal.

### Regras de Negócio Implementadas:

1.  **Hierarquia de Exibição (Card Principal):**
    *   SE existir um `MetricPoint` com label "Manual Input", "Wizard", "Profile", etc...
    *   ENTÃO ele será **SEMPRE** o valor principal exibido no Card.
    *   INDEPENDENTE da data do exame (mesmo que o exame seja mais novo).

2.  **Detecção de Desatualização (Stale Data Warning):**
    *   Apesar do valor manual ter prioridade visual, o sistema verifica em segundo plano:
    *   `SE (Data do Exame Mais Recente > Data do Input Manual)`
    *   ENTÃO exibe um alerta visual: badge "Att Necessária" e borda laranja.
    *   OBJETIVO: Respeitar o dado do usuário, mas avisá-lo que a "realidade laboratorial" divergiu recentemente.

3.  **Semáforo de Severidade (Cores):**
    *   **Vermelho (Crítico):** Valores `HIGH` (Acima do teto de referência). Antes era laranja.
    *   **Azul (Atenção):** Valores `LOW` (Abaixo do piso).
    *   **Verde (Normal):** Dentro do range.
    *   **Laranja (Warning):** Reservado para inconsistência de dados (Stale Data) ou valores limítrofes (`BORDERLINE`).

## 3. Efeito Visual (UX)

*   **Cenário:** Usuário define Testosterona 3400 (Manual). Último exame é 900.
*   **Antes:** O sistema mostrava 900 (se a data do exame fosse > data do cadastro).
*   **Depois:** O sistema mostra **3400** (Vermelho/Crítico) com uma badge "Input Manual". No rodapé do card, mostra "Lab: 900" como referência secundária.

## 4. Trecho de Código Relevante

A lógica reside no `useMemo` do `MetricDashboard.tsx`:

```typescript
// MANUAL É O REI
if (manualPoints.length > 0) {
    primaryPoint = manualPoints[0]; // Força o manual como principal
    sourceType = 'Cadastro';
    
    // Comparação de data apenas para gerar o WARNING, não para trocar o valor
    if (examPoints.length > 0) {
        if (examDate > manualDate) staleWarning = true;
    }
}
```
