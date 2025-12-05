-- ====================================================================
-- DB 마이그레이션: 블로그 스타일 콘텐츠 필드 추가
-- 작성일: 2025-12-05
-- 설명: 미슐랭 셰프 스타일의 친근한 블로그 콘텐츠 필드 추가
-- ====================================================================

-- generated_recipes 테이블에 블로그 스타일 필드 추가
ALTER TABLE generated_recipes
ADD COLUMN IF NOT EXISTS chef_tips JSONB,
ADD COLUMN IF NOT EXISTS faq JSONB,
ADD COLUMN IF NOT EXISTS storage_info JSONB,
ADD COLUMN IF NOT EXISTS pairing_suggestions TEXT;

-- 컬럼 코멘트 추가
COMMENT ON COLUMN generated_recipes.chef_tips IS '셰프의 비법 팁 배열 (해요체, 3개 이상)';
COMMENT ON COLUMN generated_recipes.faq IS 'FAQ 배열 [{question: string, answer: string}] (해요체, 2개 이상)';
COMMENT ON COLUMN generated_recipes.storage_info IS '보관 정보 {refrigerator_days: number, freezer_days: number, reheating_tip: string}';
COMMENT ON COLUMN generated_recipes.pairing_suggestions IS '페어링 추천 (해요체)';

-- 인덱스 추가 (선택사항 - 블로그 필드가 있는 레시피 검색용)
CREATE INDEX IF NOT EXISTS idx_generated_recipes_has_blog_content
ON generated_recipes(id)
WHERE chef_tips IS NOT NULL AND faq IS NOT NULL;

-- 확인 쿼리 (주석 해제하여 실행 가능)
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'generated_recipes'
-- AND column_name IN ('chef_tips', 'faq', 'storage_info', 'pairing_suggestions');
