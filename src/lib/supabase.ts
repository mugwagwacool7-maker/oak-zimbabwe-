import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase =
  url && key && url.startsWith('http')
    ? createClient(url, key)
    : createClient('https://placeholder.supabase.co', 'placeholder');
