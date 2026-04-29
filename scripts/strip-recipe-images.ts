import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const recipeDetailPath = resolve(process.cwd(), 'src/components/RecipeDetail.tsx');
const source = readFileSync(recipeDetailPath, 'utf-8');

const recipeDetailImageBlockPattern = /\n\s*\{\/\* 레시피 이미지 \*\/\}\n\s*\{displayRecipe\.image_url && \(\n[\s\S]*?\n\s*\{\/\* 그라데이션 오버레이 \*\/\}\n\s*<div className="absolute inset-0 bg-gradient-to-t from-black\/50 via-transparent to-transparent"><\/div>\n\s*<\/div>\n\s*\)\}\n/;

if (!recipeDetailImageBlockPattern.test(source)) {
  console.log('[strip-recipe-images] Recipe detail image block not found. Skipping.');
  process.exit(0);
}

const nextSource = source.replace(recipeDetailImageBlockPattern, '\n');
writeFileSync(recipeDetailPath, nextSource);
console.log('[strip-recipe-images] Removed recipe detail food image block before build.');
