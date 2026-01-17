
-- Versão 1.6.56
-- Refinamento da Timeline (Rich Cards & Smart Filtering)
INSERT INTO app_versions (version, description, created_at)
VALUES ('1.6.56', 'UX UPGRADE: Timeline agora destaca resumos semanais, filtra conversas vazias e adiciona categorização visual automática aos insights.', NOW());

NOTIFY pgrst, 'reload config';
