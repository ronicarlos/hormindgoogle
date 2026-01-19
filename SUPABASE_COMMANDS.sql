
-- Versão 1.6.87
-- FIX: Correção de layout (Viewport Dinâmico) para impedir que cabeçalhos sumam ao rotacionar a tela ou rolar.
INSERT INTO app_versions (version, description, created_at)
VALUES ('1.6.87', 'FIX: Estabilização dos cabeçalhos e botões de ação (Salvar/Filtros) em modo paisagem e portrait.', NOW());

NOTIFY pgrst, 'reload config';
