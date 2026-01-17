
-- Versão 1.6.57
-- Correção crítica no Wizard (travamento na data de nascimento)
INSERT INTO app_versions (version, description, created_at)
VALUES ('1.6.57', 'FIX: Resolvido problema que impedia avanço no Wizard ao editar data de nascimento. Melhorada validação e tratamento de erros no formulário inicial.', NOW());

NOTIFY pgrst, 'reload config';
