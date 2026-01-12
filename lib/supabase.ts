
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase com as chaves fornecidas
const SUPABASE_URL = 'https://czqqjltnmcnlbokgwsth.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Wwqm6p1AEG35rSxB72Ejew_tFBmFO9L';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
