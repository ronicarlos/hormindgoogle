
-- Versão 1.6.82
-- FEATURE: Expansão massiva da Biblioteca Educacional (Enciclopédia Hormonal Completa + Guia de Correção).
INSERT INTO app_versions (version, description, created_at)
VALUES ('1.6.82', 'Education: Adição de estudo completo sobre hormônios (Sexual, Tireoide, Adrenal, Metabólico) e guia de manejo seguro.', NOW());

NOTIFY pgrst, 'reload config';
