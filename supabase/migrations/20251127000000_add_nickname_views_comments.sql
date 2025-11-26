-- ========================================
-- 1. profiles 테이블에 nickname 컬럼 추가
-- ========================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS nickname TEXT UNIQUE;

-- 닉네임 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_profiles_nickname ON public.profiles(nickname);

-- ========================================
-- 2. 랜덤 닉네임 생성 함수 (중복 방지)
-- ========================================
CREATE OR REPLACE FUNCTION public.generate_unique_nickname()
RETURNS TEXT AS $$
DECLARE
  adjectives TEXT[] := ARRAY['쩝쩝', '냠냠', '맛있는', '배고픈', '요리하는', '먹보', '미식가', '행복한', '즐거운', '신나는'];
  nouns TEXT[] := ARRAY['박사', '선생', '대장', '왕', '요정', '천사', '마스터', '달인', '전문가', '애호가'];
  random_nickname TEXT;
  random_number INT;
  attempt INT := 0;
  max_attempts INT := 100;
BEGIN
  LOOP
    -- 랜덤 명사 + 숫자 조합 생성
    random_nickname := adjectives[1 + floor(random() * array_length(adjectives, 1))::int] ||
                       nouns[1 + floor(random() * array_length(nouns, 1))::int] ||
                       floor(random() * 1000)::text;

    -- 중복 체크
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE nickname = random_nickname) THEN
      RETURN random_nickname;
    END IF;

    attempt := attempt + 1;
    IF attempt >= max_attempts THEN
      -- 최대 시도 횟수 초과 시 UUID 일부 추가
      random_nickname := random_nickname || substr(gen_random_uuid()::text, 1, 4);
      RETURN random_nickname;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ========================================
-- 3. 신규 사용자 가입 시 닉네임 자동 생성 (기존 함수 수정)
-- ========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, allergies, dietary_preferences, nickname)
  VALUES (
    NEW.id,
    NEW.email,
    '{}',
    '{}',
    public.generate_unique_nickname()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 4. 기존 사용자에게 닉네임 부여 (마이그레이션)
-- ========================================
DO $$
DECLARE
  profile_record RECORD;
BEGIN
  FOR profile_record IN
    SELECT id FROM public.profiles WHERE nickname IS NULL
  LOOP
    UPDATE public.profiles
    SET nickname = public.generate_unique_nickname()
    WHERE id = profile_record.id;
  END LOOP;
END $$;

-- ========================================
-- 5. recipe_views 테이블 생성 (최근 본 레시피 추적)
-- ========================================
CREATE TABLE IF NOT EXISTS public.recipe_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES public.generated_recipes(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);

-- RLS 활성화
ALTER TABLE public.recipe_views ENABLE ROW LEVEL SECURITY;

-- 정책: 사용자는 자신의 조회 기록만 볼 수 있음
CREATE POLICY "Users can view own recipe views"
ON public.recipe_views FOR SELECT
USING (auth.uid() = user_id);

-- 정책: 사용자는 자신의 조회 기록만 추가 가능
CREATE POLICY "Users can insert own recipe views"
ON public.recipe_views FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 정책: 사용자는 자신의 조회 기록 업데이트 가능
CREATE POLICY "Users can update own recipe views"
ON public.recipe_views FOR UPDATE
USING (auth.uid() = user_id);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_recipe_views_user_id ON public.recipe_views(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_views_viewed_at ON public.recipe_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipe_views_user_viewed ON public.recipe_views(user_id, viewed_at DESC);

-- ========================================
-- 6. comments 테이블 생성 (레시피 댓글, 비회원도 가능)
-- ========================================
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.generated_recipes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nickname TEXT,  -- 비회원용 또는 캐시된 닉네임
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT content_not_empty CHECK (char_length(trim(content)) > 0)
);

-- RLS 활성화
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 정책: 모두 댓글 조회 가능
CREATE POLICY "Anyone can view comments"
ON public.comments FOR SELECT
USING (true);

-- 정책: 로그인한 사용자만 댓글 작성 가능
CREATE POLICY "Authenticated users can insert comments"
ON public.comments FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 정책: 본인 댓글만 수정 가능
CREATE POLICY "Users can update own comments"
ON public.comments FOR UPDATE
USING (auth.uid() = user_id);

-- 정책: 본인 댓글만 삭제 가능
CREATE POLICY "Users can delete own comments"
ON public.comments FOR DELETE
USING (auth.uid() = user_id);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_comments_recipe_id ON public.comments(recipe_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);

-- updated_at 트리거
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- 7. 레시피 조회 기록 추가/업데이트 RPC 함수
-- ========================================
CREATE OR REPLACE FUNCTION public.track_recipe_view(p_recipe_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.recipe_views (user_id, recipe_id, viewed_at)
  VALUES (auth.uid(), p_recipe_id, now())
  ON CONFLICT (user_id, recipe_id)
  DO UPDATE SET viewed_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 8. 최근 본 레시피 조회 RPC 함수
-- ========================================
CREATE OR REPLACE FUNCTION public.get_recent_recipe_view()
RETURNS TABLE (
  recipe_id UUID,
  viewed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT rv.recipe_id, rv.viewed_at
  FROM public.recipe_views rv
  WHERE rv.user_id = auth.uid()
  ORDER BY rv.viewed_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 9. 댓글 추가 RPC 함수 (닉네임 자동 포함)
-- ========================================
CREATE OR REPLACE FUNCTION public.add_comment(
  p_recipe_id UUID,
  p_content TEXT
)
RETURNS TABLE (
  id UUID,
  recipe_id UUID,
  user_id UUID,
  nickname TEXT,
  content TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
DECLARE
  v_user_id UUID;
  v_nickname TEXT;
BEGIN
  -- 현재 사용자 정보 가져오기
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '로그인이 필요합니다';
  END IF;

  -- 사용자 닉네임 조회
  SELECT p.nickname INTO v_nickname
  FROM public.profiles p
  WHERE p.id = v_user_id;

  -- 댓글 추가
  RETURN QUERY
  INSERT INTO public.comments (recipe_id, user_id, nickname, content)
  VALUES (p_recipe_id, v_user_id, v_nickname, trim(p_content))
  RETURNING
    comments.id,
    comments.recipe_id,
    comments.user_id,
    comments.nickname,
    comments.content,
    comments.created_at,
    comments.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 10. 레시피 댓글 목록 조회 RPC 함수
-- ========================================
CREATE OR REPLACE FUNCTION public.get_recipe_comments(p_recipe_id UUID)
RETURNS TABLE (
  id UUID,
  recipe_id UUID,
  user_id UUID,
  nickname TEXT,
  content TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_author BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.recipe_id,
    c.user_id,
    c.nickname,
    c.content,
    c.created_at,
    c.updated_at,
    (c.user_id = auth.uid()) as is_author
  FROM public.comments c
  WHERE c.recipe_id = p_recipe_id
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
