
# Arquitetura de Temas Zero-Flash (FitLM)

**Problema:** Aplicações React tradicionais (Single Page Apps) renderizam o HTML vazio e branco, carregam o JavaScript, e só então aplicam o tema escuro (via `useEffect`). Isso gera um "flash bang" branco em dispositivos configurados para modo escuro.

**Solução:** Injeção de Script Bloqueante (Critical Path CSS/JS).

## Implementação Técnica

A solução consiste em interceptar o processo de renderização do navegador **antes** que o primeiro pixel seja pintado na tela (First Paint).

### 1. Script de Inicialização (`index.html`)
Inserimos um bloco `<script>` síncrono no `<head>`. Navegadores pausam a renderização do HTML para executar scripts encontrados no head.

```javascript
(function() {
  // 1. Leitura Síncrona do LocalStorage (Bloqueante, mas extremamente rápida < 1ms)
  var localTheme = localStorage.getItem('fitlm-theme');
  
  // 2. Leitura da Preferência do Sistema Operacional
  var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // 3. Decisão de Tema (Prioridade: LocalStorage > Sistema)
  if (localTheme === 'dark' || (!localTheme && systemDark)) {
    // 4. Aplicação IMEDIATA da classe no elemento raiz <html>
    document.documentElement.classList.add('dark');
    
    // 5. Ajuste da Meta Tag "theme-color" (Barra de status do Mobile)
    // Isso previne que a barra do topo do iPhone fique branca enquanto o app é preto.
    var meta = document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: dark)"]');
    if (meta) meta.setAttribute('content', '#0f172a');
  } else {
    document.documentElement.classList.remove('dark');
  }
})();
```

### 2. Estilização Crítica
Para garantir que o fundo seja pintado corretamente mesmo se o Tailwind demorar a carregar, adicionamos um estilo CSS nativo no `<head>` que reage à classe `.dark`:

```css
<style>
  /* Cor base imediata */
  html { background-color: #f3f4f6; }
  /* Cor escura imediata */
  html.dark { background-color: #0f172a; }
</style>
```

### 3. Sincronização com React
O componente React (`App.tsx` ou `ProfileView.tsx`) lê o `localStorage` na hidratação inicial, garantindo que o estado interno do React (`useState`) nasça sincronizado com o que o script injetou no DOM.

---

## Solução de Scroll em Modais iOS

Para corrigir travamentos de scroll em modais no iOS (Safari Mobile):

1. **Body Locking:** Ao abrir o modal, aplicamos `overflow: hidden` no `body`.
2. **Touch Action:** 
   - No Overlay (fundo escuro): `touch-action: none` (previne que toques vazem para o fundo).
   - No Conteúdo (scroll): `touch-action: pan-y` (permite scroll vertical explícito).
3. **Webkit Overflow:** Forçamos `-webkit-overflow-scrolling: touch` para aceleração de hardware no scroll.
