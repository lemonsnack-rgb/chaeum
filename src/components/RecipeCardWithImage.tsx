import { Recipe, extractRecipeDescription } from '../lib/recipeService';
import { getRecipeImageUrl } from '../lib/fallbackImages';

interface RecipeCardWithImageProps {
  recipe: Recipe;
  onClick: (recipe: Recipe) => void;
  maxDescriptionLength?: number;
}

export function RecipeCardWithImage({
  recipe,
  onClick,
  maxDescriptionLength = 100
}: RecipeCardWithImageProps) {
  const description = extractRecipeDescription(recipe, maxDescriptionLength);

  // 카테고리 기반 폴백 이미지 시스템 사용
  const imageUrl = getRecipeImageUrl(recipe);

  // 디버깅: 어떤 이미지 URL이 사용되는지 확인
  console.log(`[RecipeCard] ${recipe.title} → ${imageUrl}`);

  return (
    <div
      onClick={() => onClick(recipe)}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
    >
      {/* 이미지 영역 */}
      <div className="relative aspect-video bg-gradient-to-br from-orange-100 to-orange-200 overflow-hidden">
        <img
          src={imageUrl}
          alt={recipe.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            // 이미지 로드 실패 시 기본 폴백 이미지로 대체
            e.currentTarget.src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80';
          }}
        />

        {/* 조리 시간 뱃지 */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-gray-700 shadow-sm">
          ⏱️ {recipe.cooking_time}분
        </div>
      </div>

      {/* 텍스트 영역 */}
      <div className="p-4">
        {/* 제목 */}
        <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1 group-hover:text-primary transition-colors">
          {recipe.title}
        </h3>

        {/* 설명 (2줄 제한) */}
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 mb-3">
          {description}
        </p>

        {/* 태그 및 정보 */}
        <div className="flex items-center justify-between">
          {/* 테마 태그 (최대 2개) */}
          <div className="flex gap-2 flex-1">
            {recipe.theme_tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-orange-50 text-primary text-xs rounded-full font-medium"
              >
                {tag}
            </span>
            ))}
          </div>

          {/* 인분 정보 */}
          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
            👥 {recipe.servings}인분
          </span>
        </div>
      </div>
    </div>
  );
}
