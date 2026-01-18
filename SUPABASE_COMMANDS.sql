
-- Versão 1.6.81
-- FIX: Separação visual estrita entre grupos Laranja (Atenção) e Amarelo (Alerta) no Dashboard.
INSERT INTO app_versions (version, description, created_at)
VALUES ('1.6.81', 'Dashboard: Reagrupamento de cards em 4 níveis (Crítico, Atenção, Alerta, Saudável) com emojis distintivos.', NOW());

NOTIFY pgrst, 'reload config';
