import { createClient } from '@supabase/supabase-js';

// Next.js 환경 변수 (NEXT_PUBLIC_*) 또는 Vite 환경 변수 (VITE_*) 지원
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  (typeof window !== 'undefined' ? '' : '') ||
  '';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  (typeof window !== 'undefined' ? '' : '') ||
  '';

// 환경 변수 디버깅 (개발 환경에서만)
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ 설정됨' : '❌ 없음');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ 설정됨' : '❌ 없음');
  console.error('');
  console.error('해결 방법:');
  console.error('1. .env.local 파일이 프로젝트 루트에 있는지 확인');
  console.error('2. .env.local 파일에 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY가 있는지 확인');
  console.error('3. 개발 서버를 재시작 (npm run dev)');
  throw new Error('Supabase 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요.');
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
