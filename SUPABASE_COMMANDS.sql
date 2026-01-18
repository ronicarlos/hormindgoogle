
-- Versão 1.6.63
-- FIX: Restaurada lista completa de histórico de versões na tela de Perfil.
INSERT INTO app_versions (version, description, created_at)
VALUES ('1.6.63', 'FIX: Restaurada lista completa de histórico de versões (Changelog) na tela de Perfil.', NOW());

NOTIFY pgrst, 'reload config';
