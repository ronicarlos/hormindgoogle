
-- Registra a nova versão do aplicativo (v1.6.17)
INSERT INTO app_versions (version, description, created_at)
VALUES ('1.6.17', 'Restauração da administração avançada: Card de versões e botão de limpeza de cache PWA.', NOW());

-- Garante que o cache de schema do PostgREST seja atualizado
NOTIFY pgrst, 'reload config';
