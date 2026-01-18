
-- Versão 1.6.80
-- FEATURE: Adição do Guia Mestre de Endocrinologia (Conteúdo Educativo) na Biblioteca Pharma.
INSERT INTO app_versions (version, description, created_at)
VALUES ('1.6.80', 'Education: Implementação da Enciclopédia Hormonal interativa com análise por gênero e fase da vida.', NOW());

NOTIFY pgrst, 'reload config';
