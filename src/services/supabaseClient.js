import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Thiếu VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Kiểm tra file .env (xem .env.example).',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const CLASS_PHOTOS_BUCKET = 'class-photos';
