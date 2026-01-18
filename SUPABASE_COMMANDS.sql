
-- Versão 1.6.74
-- FIX: Ajuste de severidade visual (High = Vermelho) e fixação da prioridade de exibição (Manual > Exame).
INSERT INTO app_versions (version, description, created_at)
VALUES ('1.6.74', 'UI: Status High agora é vermelho. Prioridade absoluta para Input Manual nos cards.', NOW());

NOTIFY pgrst, 'reload config';
