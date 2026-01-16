
-- Versão 1.6.51
-- Tema Zero Flash e Refinamento de Scroll
INSERT INTO app_versions (version, description, created_at)
VALUES ('1.6.51', 'THEME FIX: Implementação de script bloqueante para eliminar flash branco ao carregar tema escuro. MOBILE FIX: Refinamento de propriedades touch-action no modal de métricas para scroll nativo no iOS.', NOW());

NOTIFY pgrst, 'reload config';
