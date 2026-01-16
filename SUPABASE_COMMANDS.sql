
-- RODE ESTE COMANDO NO SQL EDITOR DO SUPABASE PARA CORRIGIR O ERRO --

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS diet_calories text;

-- Registra a nova versão do aplicativo (v1.6.15)
INSERT INTO app_versions (version, description, created_at)
VALUES ('1.6.15', 'Hotfix: Atualização do modelo OCR para Gemini 2.0 Flash (Experimental) com fallback para 1.5, visando corrigir erros 404.', NOW());

-- Garante que o cache de schema do PostgREST seja atualizado
NOTIFY pgrst, 'reload config';
