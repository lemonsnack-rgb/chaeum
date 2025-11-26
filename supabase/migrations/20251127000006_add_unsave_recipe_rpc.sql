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
