import { createClient, type SupabaseClient } from '@supabase/supabase-js';
let instance: SupabaseClient | undefined;
export function supabase() {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url || !key) throw new Error('Falta configurar a conexión con Supabase.');
  instance ??= createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  return instance;
}
