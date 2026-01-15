
-- RODE ESTE COMANDO NO SQL EDITOR DO SUPABASE PARA CORRIGIR O ERRO --

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS diet_calories text;

-- Garante que o cache de schema do PostgREST seja atualizado
NOTIFY pgrst, 'reload config';
