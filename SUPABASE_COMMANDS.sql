
-- Versão 1.6.89
-- FIX: Refatoração completa dos Headers das bibliotecas e perfil para evitar sumiço em rotação de tela (remoção de sticky em containers scrolláveis). Adição de botão 'Restaurar Visual' no header global.
INSERT INTO app_versions (version, description, created_at)
VALUES ('1.6.89', 'FIX: Refatoração completa dos Headers (Protocolo/Treino/Perfil) para evitar desaparecimento ao rotacionar tela. Botão de Restaurar Layout adicionado.', NOW());

NOTIFY pgrst, 'reload config';
