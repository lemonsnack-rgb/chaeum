-- RPC 함수: 현재 사용자의 프로필 조회 (캐싱 우회)
-- 서버 사이드에서 실행되므로 클라이언트 캐싱이 적용되지 않음
CREATE OR REPLACE FUNCTION get_current_user_profile()
RETURNS TABLE (
  id UUID,
  email TEXT,
  allergies TEXT[],
  dietary_preferences TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.email,
    p.allergies,
    p.dietary_preferences,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.id = auth.uid();
END;
$$;

-- RPC 함수: 알레르기 추가
CREATE OR REPLACE FUNCTION add_user_allergy(allergy_name TEXT)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_allergies TEXT[];
  updated_allergies TEXT[];
BEGIN
  -- 현재 알레르기 목록 조회
  SELECT allergies INTO current_allergies
  FROM public.profiles
  WHERE id = auth.uid();

  -- NULL이면 빈 배열로 초기화
  IF current_allergies IS NULL THEN
    current_allergies := ARRAY[]::TEXT[];
  END IF;

  -- 중복 체크
  IF allergy_name = ANY(current_allergies) THEN
    RAISE EXCEPTION '이미 등록된 알레르기입니다';
  END IF;

  -- 새 항목 추가
  updated_allergies := array_append(current_allergies, allergy_name);

  -- DB 업데이트
  UPDATE public.profiles
  SET
    allergies = updated_allergies,
    updated_at = now()
  WHERE id = auth.uid();

  RETURN updated_allergies;
END;
$$;

-- RPC 함수: 알레르기 제거
CREATE OR REPLACE FUNCTION remove_user_allergy(allergy_name TEXT)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_allergies TEXT[];
BEGIN
  -- 해당 항목 제거
  UPDATE public.profiles
  SET
    allergies = array_remove(allergies, allergy_name),
    updated_at = now()
  WHERE id = auth.uid()
  RETURNING allergies INTO updated_allergies;

  RETURN updated_allergies;
END;
$$;

-- RPC 함수: 편식 추가
CREATE OR REPLACE FUNCTION add_user_dietary_preference(pref_name TEXT)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_prefs TEXT[];
  updated_prefs TEXT[];
BEGIN
  -- 현재 편식 목록 조회
  SELECT dietary_preferences INTO current_prefs
  FROM public.profiles
  WHERE id = auth.uid();

  -- NULL이면 빈 배열로 초기화
  IF current_prefs IS NULL THEN
    current_prefs := ARRAY[]::TEXT[];
  END IF;

  -- 중복 체크
  IF pref_name = ANY(current_prefs) THEN
    RAISE EXCEPTION '이미 등록된 편식 정보입니다';
  END IF;

  -- 새 항목 추가
  updated_prefs := array_append(current_prefs, pref_name);

  -- DB 업데이트
  UPDATE public.profiles
  SET
    dietary_preferences = updated_prefs,
    updated_at = now()
  WHERE id = auth.uid();

  RETURN updated_prefs;
END;
$$;

-- RPC 함수: 편식 제거
CREATE OR REPLACE FUNCTION remove_user_dietary_preference(pref_name TEXT)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_prefs TEXT[];
BEGIN
  -- 해당 항목 제거
  UPDATE public.profiles
  SET
    dietary_preferences = array_remove(dietary_preferences, pref_name),
    updated_at = now()
  WHERE id = auth.uid()
  RETURNING dietary_preferences INTO updated_prefs;

  RETURN updated_prefs;
END;
$$;
