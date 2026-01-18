
-- Versão 1.6.61
-- HOTFIX: Botão da Galeria de Evolução no Header para garantir visibilidade.
INSERT INTO app_versions (version, description, created_at)
VALUES ('1.6.61', 'HOTFIX: Adição de botão explícito para a Galeria de Evolução no cabeçalho do Perfil.', NOW());

NOTIFY pgrst, 'reload config';
