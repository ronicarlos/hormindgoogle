
-- Versão 1.6.65
-- UX: Refatoração conceitual de cores (Vermelho apenas para Diagnóstico, Laranja/Amarelo para Preventivo).
INSERT INTO app_versions (version, description, created_at)
VALUES ('1.6.65', 'UX: Ajuste de cores para separar Risco Consumado (Vermelho) de Monitoramento Preventivo (Laranja/Amarelo).', NOW());

NOTIFY pgrst, 'reload config';
