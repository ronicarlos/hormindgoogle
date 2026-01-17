
-- Versão 1.6.58
-- Implementação do Sistema de Auditoria (Logs de Ações)

-- 1. Criação da tabela audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
    entity TEXT NOT NULL, -- 'PROFILE', 'METRIC', 'PROJECT', 'SOURCE'
    details JSONB, -- Dados do evento (diff, valores)
    source TEXT, -- 'WIZARD', 'PROFILE_VIEW', 'UPLOAD', etc
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. Política: Usuários só veem seus próprios logs
CREATE POLICY "Users can view own audit logs"
ON public.audit_logs
FOR SELECT
USING (auth.uid() = user_id);

-- 4. Política: Usuários só inserem logs para si mesmos
CREATE POLICY "Users can insert own audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 5. Atualizar versão do app
INSERT INTO app_versions (version, description, created_at)
VALUES ('1.6.58', 'FEATURE: Sistema de Auditoria de Dados. Adicionada tabela de logs para rastreabilidade de alterações no perfil e métricas.', NOW());

NOTIFY pgrst, 'reload config';
