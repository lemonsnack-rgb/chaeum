import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// 환경 변수 디버깅 (개발 환경에서만)
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅ 설정됨' : '❌ 없음');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ 설정됨' : '❌ 없음');
  console.error('');
  console.error('해결 방법:');
  console.error('1. .env 파일이 프로젝트 루트에 있는지 확인');
  console.error('2. .env 파일에 VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY가 있는지 확인');
  console.error('3. 개발 서버를 재시작 (npm run dev)');
  throw new Error('Supabase 환경 변수가 설정되지 않았습니다. .env 파일을 확인해주세요.');
}

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
