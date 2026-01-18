
-- Versão 1.6.85
-- UX: Adição de feedback sonoro (Audio Cue) ao finalizar resposta da IA.
INSERT INTO app_versions (version, description, created_at)
VALUES ('1.6.85', 'UX: Feedback sonoro criativo ao concluir geração de resposta do chat.', NOW());

NOTIFY pgrst, 'reload config';
