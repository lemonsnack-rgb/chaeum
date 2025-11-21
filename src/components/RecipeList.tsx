import { Clock, Users, ChefHat, Trash2 } from 'lucide-react';
import { Recipe } from '../lib/recipeService';

interface RecipeListProps {
  recipes: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (recipeId: string) => void;
  hideDelete?: boolean;
}

export function RecipeList({ recipes, onSelectRecipe, onDeleteRecipe, hideDelete = false }: RecipeListProps) {
  if (recipes.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChefHat className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">추천/저장된 레시피가 없어요</h3>
          <p className="text-sm text-gray-500">
            냉장고 재료로 레시피를 만들어보세요
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recipes.map((recipe) => (
        <div
          key={recipe.id}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all"
        >
          <div
            onClick={() => onSelectRecipe(recipe)}
            className="cursor-pointer"
          >
            <div className="bg-gradient-to-r from-primary/10 to-orange-100 p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{recipe.title}</h3>
              <div className="flex flex-wrap gap-2">
                {recipe.theme_tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-white text-primary text-xs rounded-full font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-4">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-sm">{recipe.cooking_time}분</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-sm">{recipe.servings}인분</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between bg-orange-50 rounded-xl p-3">
                <div className="flex-1 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-sm font-bold text-gray-900">
                      {recipe.nutrition.calories}
                    </div>
                    <div className="text-xs text-gray-600">칼로리</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-blue-600">
                      {recipe.nutrition.protein}g
                    </div>
                    <div className="text-xs text-gray-600">단백질</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-green-600">
                      {recipe.nutrition.carbohydrates}g
                    </div>
                    <div className="text-xs text-gray-600">탄수화물</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {!hideDelete && (
            <div className="px-4 pb-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('이 레시피를 삭제하시겠습니까?')) {
                    onDeleteRecipe(recipe.id);
                  }
                }}
                className="w-full py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                삭제
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
