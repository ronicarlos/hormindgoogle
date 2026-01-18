
-- Versão 1.6.79
-- FIX: Correção de referências nulas (Fallback inteligente) e reagrupamento de cards por criticidade real.
INSERT INTO app_versions (version, description, created_at)
VALUES ('1.6.79', 'Dashboard: Correção de referências nulas e separação estrita de grupos (Crítico vs Alerta vs Saudável).', NOW());

NOTIFY pgrst, 'reload config';
