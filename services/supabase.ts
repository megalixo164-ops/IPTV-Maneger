import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://owunairwwmtzuipribkm.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_EQ6-wMXbk_2VfQq1Y75nSA_UNPoA-eB';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);