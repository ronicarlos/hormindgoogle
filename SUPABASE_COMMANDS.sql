
-- Versão 1.6.92
-- FIX: Knowledge Enrichment Architecture. Adição de tabela para armazenar referências pesquisadas via Gemini Search Grounding.
INSERT INTO app_versions (version, description, created_at)
VALUES ('1.6.92', 'FEATURE: Agente de Pesquisa Autônomo. O sistema agora aprende faixas de referência de exames desconhecidos via Google Search e salva no banco.', NOW());

-- CRIAÇÃO DA TABELA DE CONHECIMENTO
CREATE TABLE IF NOT EXISTS learned_markers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marker_key TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    unit TEXT NOT NULL,
    ref_min_male NUMERIC DEFAULT 0,
    ref_max_male NUMERIC DEFAULT 0,
    ref_min_female NUMERIC DEFAULT 0,
    ref_max_female NUMERIC DEFAULT 0,
    definition TEXT NOT NULL,
    source_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Políticas de segurança
ALTER TABLE learned_markers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read learned markers" ON learned_markers;
CREATE POLICY "Public read learned markers" ON learned_markers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth insert learned markers" ON learned_markers;
CREATE POLICY "Auth insert learned markers" ON learned_markers FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth update learned markers" ON learned_markers;
CREATE POLICY "Auth update learned markers" ON learned_markers FOR UPDATE USING (auth.role() = 'authenticated');

NOTIFY pgrst, 'reload config';
