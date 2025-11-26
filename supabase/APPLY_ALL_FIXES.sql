-- ========================================
-- 통합 마이그레이션 스크립트
-- 이 SQL을 Supabase 대시보드의 SQL Editor에서 실행하세요
-- ========================================

-- ========================================
-- 1. RPC 함수 오버로딩 문제 해결
-- ========================================

-- 모든 기존 댓글 함수 버전 삭제
DROP FUNCTION IF EXISTS public.add_comment(UUID, TEXT);
DROP FUNCTION IF EXISTS public.add_comment(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.add_comment(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.update_comment(UUID, TEXT);
DROP FUNCTION IF EXISTS public.update_comment(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.delete_comment(UUID);
DROP FUNCTION IF EXISTS public.delete_comment(UUID, TEXT);

-- add_comment 함수 재생성
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

-- update_comment 함수 재생성
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

  IF v_is_guest THEN
    IF p_password IS NULL OR p_password != v_stored_password THEN
      RAISE EXCEPTION '비밀번호가 일치하지 않습니다';
    END IF;
  ELSE
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

-- delete_comment 함수 재생성
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

  IF v_is_guest THEN
    IF p_password IS NULL OR p_password != v_stored_password THEN
      RAISE EXCEPTION '비밀번호가 일치하지 않습니다';
    END IF;
  ELSE
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

-- ========================================
-- 2. 랜덤 닉네임 기능 추가
-- ========================================

-- profiles 테이블에 nickname 컬럼 추가 (이미 있으면 무시)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS nickname TEXT;

-- 랜덤 닉네임 생성 함수
CREATE OR REPLACE FUNCTION public.generate_random_nickname()
RETURNS TEXT AS $$
DECLARE
  prefixes TEXT[] := ARRAY['냠냠', '맛있는', '요리하는', '먹보', '꿀맛', '든든한', '신나는', '행복한', '즐거운', '건강한'];
  suffixes TEXT[] := ARRAY['요정', '천사', '마법사', '셰프', '왕자', '공주', '달인', '고수', '장인', '대장'];
  random_number TEXT;
  result TEXT;
BEGIN
  random_number := lpad((floor(random() * 10000)::int)::text, 4, '0');
  result := prefixes[1 + floor(random() * array_length(prefixes, 1))] ||
            suffixes[1 + floor(random() * array_length(suffixes, 1))] ||
            random_number;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 기존 profiles 중 닉네임이 없는 사용자에게 랜덤 닉네임 부여
UPDATE public.profiles
SET nickname = generate_random_nickname()
WHERE nickname IS NULL OR nickname = '';

-- 신규 가입 시 자동으로 닉네임 생성하는 트리거 함수
CREATE OR REPLACE FUNCTION public.auto_generate_nickname()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.nickname IS NULL OR NEW.nickname = '' THEN
    NEW.nickname := generate_random_nickname();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_auto_generate_nickname ON public.profiles;
CREATE TRIGGER trigger_auto_generate_nickname
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_nickname();

-- ========================================
-- 3. recipe_views 외래키 제약조건 제거
-- ========================================

-- generated_recipes에만 연결된 외래키를 제거하여
-- user_recipes의 레시피도 조회 추적 가능하도록 수정
ALTER TABLE public.recipe_views
DROP CONSTRAINT IF EXISTS recipe_views_recipe_id_fkey;

-- ========================================
-- 4. comments 외래키 제약조건 제거
-- ========================================

-- generated_recipes에만 연결된 외래키를 제거하여
-- user_recipes의 레시피에도 댓글 작성 가능하도록 수정
ALTER TABLE public.comments
DROP CONSTRAINT IF EXISTS comments_recipe_id_fkey;

-- ========================================
-- 5. 레시피 저장 취소 RPC 함수
-- ========================================

-- RPC 함수: 레시피 저장 취소
-- user_recipes.id 또는 original_recipe_id로 삭제 가능
CREATE OR REPLACE FUNCTION public.unsave_recipe(p_recipe_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_deleted_count INT;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '로그인이 필요합니다';
  END IF;

  -- user_recipes에서 삭제 (id 또는 original_recipe_id 매칭)
  DELETE FROM public.user_recipes
  WHERE user_id = v_user_id
    AND (id = p_recipe_id OR original_recipe_id = p_recipe_id);

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 완료!
-- ========================================
-- 이 SQL 실행 후 애플리케이션을 새로고침하면
-- 모든 기능이 정상적으로 작동합니다.
-- ========================================
