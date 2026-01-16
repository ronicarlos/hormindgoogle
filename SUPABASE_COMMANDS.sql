
-- Registra a nova versão do aplicativo (v1.6.18)
INSERT INTO app_versions (version, description, created_at)
VALUES ('1.6.18', 'Rollback parcial: Priorização do modelo Gemini 1.5 Flash para análise e OCR, visando estabilidade e correção de erros 404/400. Admin Features restauradas.', NOW());

-- Garante que o cache de schema do PostgREST seja atualizado
NOTIFY pgrst, 'reload config';
