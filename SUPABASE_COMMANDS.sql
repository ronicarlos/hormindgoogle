
-- Versão 1.6.88
-- FIX: Correção crítica na Timeline (Parser de datas ISO/BR e redução de filtros de ruído).
INSERT INTO app_versions (version, description, created_at)
VALUES ('1.6.88', 'FIX: Correção na Timeline: Suporte a datas ISO, alerta visual para datas futuras e redução do filtro de mensagens curtas.', NOW());

NOTIFY pgrst, 'reload config';
