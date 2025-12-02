-- Add image_url and image_photographer columns to generated_recipes table
-- Migration: 2025-01-XX - Add Unsplash image support

-- generated_recipes 테이블에 이미지 컬럼 추가
ALTER TABLE generated_recipes
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS image_photographer TEXT;

-- 인덱스 추가 (이미지가 있는 레시피 검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_generated_recipes_has_image
ON generated_recipes(id)
WHERE image_url IS NOT NULL;

-- 코멘트 추가
COMMENT ON COLUMN generated_recipes.image_url IS 'Unsplash 이미지 URL (regular size, ~1080px)';
COMMENT ON COLUMN generated_recipes.image_photographer IS 'Unsplash 사진작가 이름 (크레딧 표시용)';
