import { ChefHat, Clock, Users } from 'lucide-react';
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
      className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 transition-all cursor-pointer group overflow-hidden"
    >
      <div className="h-2 bg-gradient-to-r from-primary via-orange-400 to-amber-300"></div>

      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-primary">
            <ChefHat className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-1 rounded-full bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
            <Clock className="h-3.5 w-3.5" />
            <span>{recipe.cooking_time}분</span>
          </div>
        </div>

        <h3 className="font-bold text-lg text-gray-900 line-clamp-1 group-hover:text-primary transition-colors mb-2">
          {recipe.title}
        </h3>

        <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 mb-4">
          {description}
        </p>

        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-2 flex-1 min-w-0">
            {recipe.theme_tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-orange-50 text-primary text-xs rounded-full font-medium truncate"
              >
                {tag}
              </span>
            ))}
          </div>

          <span className="text-xs text-gray-500 flex-shrink-0 inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {recipe.servings}인분
          </span>
        </div>
      </div>
    </div>
  );
}
