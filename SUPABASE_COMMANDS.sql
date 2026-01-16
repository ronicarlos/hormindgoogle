
-- Versão 1.6.52
-- OCR Data Review (Revisão de Dados Extraídos)
INSERT INTO app_versions (version, description, created_at)
VALUES ('1.6.52', 'UX FEATURE: Adicionada tela de revisão de dados estruturados (biomarcadores) extraídos pelo OCR antes da confirmação final do documento.', NOW());

NOTIFY pgrst, 'reload config';
