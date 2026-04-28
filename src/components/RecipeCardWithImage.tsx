import { Recipe, extractRecipeDescription } from '../lib/recipeService';

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

  return (
    <div
      onClick={() => onClick(recipe)}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
    >
      {/* 텍스트 영역 */}
      <div className="p-4">
        {/* 제목 및 조리 시간 */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-bold text-lg text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">
            {recipe.title}
          </h3>
          <span className="text-xs text-gray-500 flex-shrink-0 mt-1">
            ⏱️ {recipe.cooking_time}분
          </span>
        </div>

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
