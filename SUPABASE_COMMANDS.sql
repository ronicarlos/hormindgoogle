
-- Versão 1.6.66
-- UX: Melhorias na área de métricas (Agrupamento por status, referências visíveis, expandir/recolher).
INSERT INTO app_versions (version, description, created_at)
VALUES ('1.6.66', 'UX: Área de métricas reorganizada com agrupamento inteligente (Verde/Amarelo/Vermelho), referências nos cards e seções colapsáveis.', NOW());

NOTIFY pgrst, 'reload config';
