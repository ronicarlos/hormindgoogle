
-- Versão 1.6.90
-- FIX: Refatoração estrutural "Holy Grail Layout" para impedir desaparecimento de UI em Training, Pharma e Profile.
INSERT INTO app_versions (version, description, created_at)
VALUES ('1.6.90', 'FIX: Refatoração estrutural (Flexbox Rígido) em Treino, Pharma e Perfil. Elimina bug de desaparecimento de cabeçalhos e carrosseis.', NOW());

NOTIFY pgrst, 'reload config';
