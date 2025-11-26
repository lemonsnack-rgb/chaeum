-- Fix RPC function overloading by dropping all existing versions and recreating cleanly

-- Drop all existing versions of comment functions (with all possible signatures)
DROP FUNCTION IF EXISTS public.add_comment(UUID, TEXT);
DROP FUNCTION IF EXISTS public.add_comment(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.add_comment(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.update_comment(UUID, TEXT);
DROP FUNCTION IF EXISTS public.update_comment(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.delete_comment(UUID);
DROP FUNCTION IF EXISTS public.delete_comment(UUID, TEXT);

-- Recreate add_comment function with proper signature
CREATE FUNCTION public.add_comment(
  p_recipe_id UUID,
  p_content TEXT,
  p_nickname TEXT DEFAULT NULL,
  p_password TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  recipe_id UUID,
  user_id UUID,
  nickname TEXT,
  content TEXT,
  is_guest BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
DECLARE
  v_user_id UUID;
  v_nickname TEXT;
  v_is_guest BOOLEAN;
BEGIN
  v_user_id := auth.uid();

  -- Guest user
  IF v_user_id IS NULL THEN
    IF p_nickname IS NULL OR trim(p_nickname) = '' THEN
      RAISE EXCEPTION '닉네임을 입력해주세요';
    END IF;
    IF p_password IS NULL OR trim(p_password) = '' THEN
      RAISE EXCEPTION '비밀번호를 입력해주세요';
    END IF;

    v_nickname := trim(p_nickname);
    v_is_guest := TRUE;

    RETURN QUERY
    INSERT INTO public.comments (recipe_id, user_id, nickname, content, password, is_guest)
    VALUES (p_recipe_id, NULL, v_nickname, trim(p_content), p_password, TRUE)
    RETURNING comments.id, comments.recipe_id, comments.user_id,
              comments.nickname, comments.content, comments.is_guest,
              comments.created_at, comments.updated_at;
  ELSE
    -- Authenticated user
    SELECT p.nickname INTO v_nickname
    FROM public.profiles p
    WHERE p.id = v_user_id;

    v_is_guest := FALSE;

    RETURN QUERY
    INSERT INTO public.comments (recipe_id, user_id, nickname, content, is_guest)
    VALUES (p_recipe_id, v_user_id, v_nickname, trim(p_content), FALSE)
    RETURNING comments.id, comments.recipe_id, comments.user_id,
              comments.nickname, comments.content, comments.is_guest,
              comments.created_at, comments.updated_at;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate update_comment function with proper signature
CREATE FUNCTION public.update_comment(
  p_comment_id UUID,
  p_content TEXT,
  p_password TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  recipe_id UUID,
  user_id UUID,
  nickname TEXT,
  content TEXT,
  is_guest BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
DECLARE
  v_user_id UUID;
  v_is_guest BOOLEAN;
  v_stored_password TEXT;
BEGIN
  v_user_id := auth.uid();

  SELECT c.is_guest, c.password INTO v_is_guest, v_stored_password
  FROM public.comments c
  WHERE c.id = p_comment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION '댓글을 찾을 수 없습니다';
  END IF;

  -- Guest comment
  IF v_is_guest THEN
    IF p_password IS NULL OR p_password != v_stored_password THEN
      RAISE EXCEPTION '비밀번호가 일치하지 않습니다';
    END IF;
  ELSE
    -- Authenticated comment
    IF v_user_id IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.comments WHERE id = p_comment_id AND user_id = v_user_id
    ) THEN
      RAISE EXCEPTION '수정 권한이 없습니다';
    END IF;
  END IF;

  RETURN QUERY
  UPDATE public.comments
  SET content = trim(p_content), updated_at = now()
  WHERE comments.id = p_comment_id
  RETURNING comments.id, comments.recipe_id, comments.user_id,
            comments.nickname, comments.content, comments.is_guest,
            comments.created_at, comments.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate delete_comment function with proper signature
CREATE FUNCTION public.delete_comment(
  p_comment_id UUID,
  p_password TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_is_guest BOOLEAN;
  v_stored_password TEXT;
BEGIN
  v_user_id := auth.uid();

  SELECT c.is_guest, c.password INTO v_is_guest, v_stored_password
  FROM public.comments c
  WHERE c.id = p_comment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION '댓글을 찾을 수 없습니다';
  END IF;

  -- Guest comment
  IF v_is_guest THEN
    IF p_password IS NULL OR p_password != v_stored_password THEN
      RAISE EXCEPTION '비밀번호가 일치하지 않습니다';
    END IF;
  ELSE
    -- Authenticated comment
    IF v_user_id IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.comments WHERE id = p_comment_id AND user_id = v_user_id
    ) THEN
      RAISE EXCEPTION '삭제 권한이 없습니다';
    END IF;
  END IF;

  DELETE FROM public.comments WHERE id = p_comment_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
