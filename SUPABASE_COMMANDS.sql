
-- Versão 1.6.62
-- FIX: Restauração da área de Sistema e melhorias de visibilidade no PWA.
INSERT INTO app_versions (version, description, created_at)
VALUES ('1.6.62', 'FIX: Restauração da área de Sistema/Versão e correção de visibilidade da Galeria no PWA.', NOW());

NOTIFY pgrst, 'reload config';
