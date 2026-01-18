
-- Versão 1.6.69
-- UX/FIX: Força bruta na prioridade de dados manuais e exibição explícita de Referências (Min/Max) em todos os detalhes.
INSERT INTO app_versions (version, description, created_at)
VALUES ('1.6.69', 'Correção Crítica: Valor Manual agora tem prioridade absoluta sobre exames. Referências adicionadas aos painéis de detalhe.', NOW());

NOTIFY pgrst, 'reload config';
