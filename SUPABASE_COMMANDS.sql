
-- RODE ESTE COMANDO NO SQL EDITOR DO SUPABASE PARA CORRIGIR O ERRO --

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS diet_calories text;

-- Registra a nova versão do aplicativo (v1.6.9)
INSERT INTO app_versions (version, description, created_at)
VALUES ('1.6.9', 'Fix: OCR PDF Erro 400 (Revertido para modelo Stable Flash).', NOW());

-- Garante que o cache de schema do PostgREST seja atualizado
NOTIFY pgrst, 'reload config';
