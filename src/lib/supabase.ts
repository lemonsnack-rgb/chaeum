import { createClient } from '@supabase/supabase-js';

// 임시: 환경변수가 로드되지 않아 하드코딩 (나중에 환경변수로 되돌려야 함)
const supabaseUrl = 'https://ltcaxapujbhayubvaltd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0Y2F4YXB1amJoYXl1YnZhbHRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5Nzc3NzcsImV4cCI6MjA3OTU1Mzc3N30.su1arJ4JjC6MzapExatGwJFiBlAEN6rmnkhMPJsXwKg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Ingredient {
  id: string;
  user_id: string;
  name: string;
  quantity: string;
  category?: string;
  created_at: string;
  updated_at: string;
}
