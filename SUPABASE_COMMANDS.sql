
-- Versão 1.6.53
-- Melhoria UX: Data de Nascimento
INSERT INTO app_versions (version, description, created_at)
VALUES ('1.6.53', 'UX UPGRADE: Novo campo inteligente de Data de Nascimento. Substituição do calendário nativo por input de texto com máscara automática (DD/MM/AAAA) e validação em tempo real.', NOW());

NOTIFY pgrst, 'reload config';
