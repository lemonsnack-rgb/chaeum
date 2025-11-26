import { supabase } from './supabase';

/**
 * 레시피 조회 기록 추가/업데이트
 */
export async function trackRecipeView(recipeId: string): Promise<void> {
  if (!supabase) {
    return;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return; // 비로그인 사용자는 추적하지 않음
  }

  const { error } = await supabase.rpc('track_recipe_view', {
    p_recipe_id: recipeId
  });

  if (error) {
    console.error('[trackRecipeView] RPC 에러:', error);
  }
}

/**
 * 최근 본 레시피 ID 조회
 */
export async function getRecentRecipeView(): Promise<string | null> {
  if (!supabase) {
    return null;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return null;
  }

  const { data, error } = await supabase.rpc('get_recent_recipe_view');

  if (error) {
    console.error('[getRecentRecipeView] RPC 에러:', error);
    return null;
  }

  return data?.[0]?.recipe_id || null;
}
