
-- Adiciona colunas de META (Target) na tabela user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS target_weight numeric;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS target_body_fat numeric;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS target_measurements jsonb;

-- Registra a nova versão do aplicativo (v1.6.34)
INSERT INTO app_versions (version, description, created_at)
VALUES ('1.6.34', 'UX Feature: Filtro de busca (Localizar) adicionado ao Dashboard de Métricas.', NOW());

-- Garante que o cache de schema do PostgREST seja atualizado
NOTIFY pgrst, 'reload config';
