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
  is_guest?: boolean;
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
 * 댓글 추가 (회원 또는 비회원)
 */
export async function addComment(
  recipeId: string,
  content: string,
  nickname?: string,
  password?: string
): Promise<Comment | null> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error('댓글 내용을 입력해주세요');
  }

  const { data: { session } } = await supabase.auth.getSession();

  // 비회원인 경우
  if (!session) {
    if (!nickname || !nickname.trim()) {
      throw new Error('닉네임을 입력해주세요');
    }
    if (!password || !password.trim()) {
      throw new Error('비밀번호를 입력해주세요');
    }

    const { data, error } = await supabase.rpc('add_comment', {
      p_recipe_id: recipeId,
      p_content: trimmed,
      p_nickname: nickname.trim(),
      p_password: password
    });

    if (error) {
      console.error('[addComment] RPC 에러:', error);
      throw new Error(error.message || '댓글 추가 중 오류가 발생했습니다');
    }

    return data?.[0] || null;
  }

  // 회원인 경우
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
 * 댓글 수정 (회원 또는 비회원)
 */
export async function updateComment(
  commentId: string,
  content: string,
  password?: string
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error('댓글 내용을 입력해주세요');
  }

  const { data, error } = await supabase.rpc('update_comment', {
    p_comment_id: commentId,
    p_content: trimmed,
    p_password: password || null
  });

  if (error) {
    console.error('[updateComment] RPC 에러:', error);
    throw new Error(error.message || '댓글 수정 중 오류가 발생했습니다');
  }
}

/**
 * 댓글 삭제 (회원 또는 비회원)
 */
export async function deleteComment(commentId: string, password?: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase.rpc('delete_comment', {
    p_comment_id: commentId,
    p_password: password || null
  });

  if (error) {
    console.error('[deleteComment] RPC 에러:', error);
    throw new Error(error.message || '댓글 삭제 중 오류가 발생했습니다');
  }
}
