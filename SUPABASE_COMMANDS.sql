
-- Adiciona colunas de META (Target) na tabela user_profiles (Caso não tenha rodado)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS target_weight numeric;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS target_body_fat numeric;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS target_measurements jsonb;

-- Adiciona colunas para armazenar referências dinâmicas extraídas via OCR
ALTER TABLE metrics ADD COLUMN IF NOT EXISTS ref_min numeric;
ALTER TABLE metrics ADD COLUMN IF NOT EXISTS ref_max numeric;

-- Registra a nova versão do aplicativo (v1.6.39)
INSERT INTO app_versions (version, description, created_at)
VALUES ('1.6.39', 'Intelligence Update: Extração dinâmica de valores de referência (OCR) e Alertas baseados em exame.', NOW());

-- Garante que o cache de schema do PostgREST seja atualizado
NOTIFY pgrst, 'reload config';
