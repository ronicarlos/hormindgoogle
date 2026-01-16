
-- Adiciona colunas de META (Target) na tabela user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS target_weight numeric;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS target_body_fat numeric;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS target_measurements jsonb;

-- Registra a nova versão do aplicativo (v1.6.37)
INSERT INTO app_versions (version, description, created_at)
VALUES ('1.6.37', 'UX Fix: Restaurado duplo clique em gráficos e correção de detalhes do Estradiol.', NOW());

-- Garante que o cache de schema do PostgREST seja atualizado
NOTIFY pgrst, 'reload config';
