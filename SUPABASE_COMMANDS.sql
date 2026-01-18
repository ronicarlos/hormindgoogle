
-- Versão 1.6.68
-- UX: Refinamento UX: Valores de referência agora visíveis dentro dos painéis de detalhe e tooltips de gráfico.
INSERT INTO app_versions (version, description, created_at)
VALUES ('1.6.68', 'Refinamento UX: Valores de referência agora visíveis dentro dos painéis de detalhe e tooltips de gráfico.', NOW());

NOTIFY pgrst, 'reload config';
