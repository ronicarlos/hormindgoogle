
-- Versão 1.6.67
-- UX: Ajuste de prioridade de métricas (Manual > Exame) e alertas de dados desatualizados.
INSERT INTO app_versions (version, description, created_at)
VALUES ('1.6.67', 'Lógica de Prioridade: Dados manuais agora têm precedência visual sobre exames (histórico), com alertas de atualização.', NOW());

NOTIFY pgrst, 'reload config';
