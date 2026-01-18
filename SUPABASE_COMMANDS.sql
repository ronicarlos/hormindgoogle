
-- Versão 1.6.64
-- UX: Legenda de cores nas métricas e clique único para abrir gráficos.
INSERT INTO app_versions (version, description, created_at)
VALUES ('1.6.64', 'UX: Adicionada legenda de riscos e interação de clique único nos gráficos.', NOW());

NOTIFY pgrst, 'reload config';
