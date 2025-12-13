import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

// Aviso en desarrollo si falta alguna variable
if (!supabaseUrl || !supabaseKey) {
  console.warn(
    'Supabase: faltan VITE_SUPABASE_URL o VITE_SUPABASE_KEY en import.meta.env. Se usarán placeholders y la conexión real no funcionará.'
  );
}

// Usa la ANON KEY en el frontend. NUNCA expongas la SERVICE_ROLE_KEY en código cliente.
const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder'
);

export default supabase;