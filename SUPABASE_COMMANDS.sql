
-- RODE ESTE COMANDO NO SQL EDITOR DO SUPABASE PARA CORRIGIR O ERRO --

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS diet_calories text;

-- Registra a nova versão do aplicativo (v1.6.3)
INSERT INTO app_versions (version, description, created_at)
VALUES ('1.6.3', 'Correção crítica de layout (PWA/Mobile): Menu superior desaparecendo nas telas de Treino e Pharma.', NOW());

-- Garante que o cache de schema do PostgREST seja atualizado
NOTIFY pgrst, 'reload config';
