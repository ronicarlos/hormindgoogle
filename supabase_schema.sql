
-- ... (Tabelas existentes mantidas, apenas adicionando a nova) ...

-- Tabela de Conhecimento Aprendido (Knowledge Enrichment)
CREATE TABLE IF NOT EXISTS learned_markers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marker_key TEXT UNIQUE NOT NULL, -- Chave normalizada (ex: homocisteina)
    label TEXT NOT NULL,
    unit TEXT NOT NULL,
    ref_min_male NUMERIC NOT NULL,
    ref_max_male NUMERIC NOT NULL,
    ref_min_female NUMERIC NOT NULL,
    ref_max_female NUMERIC NOT NULL,
    definition TEXT NOT NULL,
    source_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (opcional para leitura pública se quiser compartilhar conhecimento entre usuários, ou restrito)
-- Como queremos que o conhecimento seja GLOBAL (aprendeu para um, aprendeu para todos), podemos deixar leitura pública e escrita autenticada.
ALTER TABLE learned_markers ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ler o conhecimento global
CREATE POLICY "Public read learned markers" ON learned_markers
    FOR SELECT USING (true);

-- Política: Apenas usuários autenticados podem contribuir (via API)
CREATE POLICY "Auth insert learned markers" ON learned_markers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política: Apenas usuários autenticados podem atualizar
CREATE POLICY "Auth update learned markers" ON learned_markers
    FOR UPDATE USING (auth.role() = 'authenticated');
