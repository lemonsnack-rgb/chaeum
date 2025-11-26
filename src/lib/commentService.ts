import { supabase } from './supabase';

export interface Comment {
  id: string;
  recipe_id: string;
  user_id: string | null;
  nickname: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_author?: boolean;
}

/**
 * 레시피 댓글 목록 조회
 */
export async function getRecipeComments(recipeId: string): Promise<Comment[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase.rpc('get_recipe_comments', {
    p_recipe_id: recipeId
  });

  if (error) {
    console.error('[getRecipeComments] RPC 에러:', error);
    return [];
  }

  return data || [];
}

/**
 * 댓글 추가 (닉네임 자동 포함)
 */
export async function addComment(recipeId: string, content: string): Promise<Comment | null> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error('댓글 내용을 입력해주세요');
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('로그인이 필요합니다');
  }

  const { data, error } = await supabase.rpc('add_comment', {
    p_recipe_id: recipeId,
    p_content: trimmed
  });

  if (error) {
    console.error('[addComment] RPC 에러:', error);
    throw new Error(error.message || '댓글 추가 중 오류가 발생했습니다');
  }

  return data?.[0] || null;
}

/**
 * 댓글 수정
 */
export async function updateComment(commentId: string, content: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error('댓글 내용을 입력해주세요');
  }

  const { error } = await supabase
    .from('comments')
    .update({ content: trimmed })
    .eq('id', commentId);

  if (error) {
    console.error('[updateComment] 에러:', error);
    throw new Error('댓글 수정 중 오류가 발생했습니다');
  }
}

/**
 * 댓글 삭제
 */
export async function deleteComment(commentId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) {
    console.error('[deleteComment] 에러:', error);
    throw new Error('댓글 삭제 중 오류가 발생했습니다');
  }
}
