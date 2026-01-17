
-- Versão 1.6.55
-- Smart Timeline Cards (Visualização de Métricas no Card)
INSERT INTO app_versions (version, description, created_at)
VALUES ('1.6.55', 'UX UPGRADE: Cards da Timeline agora exibem automaticamente as principais métricas extraídas dos exames (cross-match por data), destacam valores anormais e mantêm acesso rápido ao arquivo original.', NOW());

NOTIFY pgrst, 'reload config';
