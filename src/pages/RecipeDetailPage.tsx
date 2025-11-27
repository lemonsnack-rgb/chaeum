import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { RecipeDetail } from '../components/RecipeDetail';
import { getRecipeById, Recipe, saveUserRecipe, unsaveUserRecipe } from '../lib/recipeService';
import { getCurrentUser } from '../lib/authService';
import { ArrowLeft, Loader2 } from 'lucide-react';

export function RecipeDetailPage() {
  const { recipeId } = useParams<{ recipeId: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
    loadRecipe();
  }, [recipeId]);

  async function checkAuth() {
    const user = await getCurrentUser();
    setIsAuthenticated(!!user);
  }

  async function loadRecipe() {
    if (!recipeId) {
      setError('레시피 ID가 없습니다.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const recipeData = await getRecipeById(recipeId);

      if (!recipeData) {
        setError('레시피를 찾을 수 없습니다.');
        return;
      }

      setRecipe(recipeData);
    } catch (err) {
      console.error('Failed to load recipe:', err);
      setError('레시피를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(recipeToSave: Recipe) {
    try {
      await saveUserRecipe(recipeToSave);
      alert('레시피가 저장되었습니다!');
    } catch (error) {
      console.error('Failed to save recipe:', error);
      alert('레시피 저장에 실패했습니다.');
    }
  }

  async function handleUnsave(recipeIdToUnsave: string) {
    try {
      await unsaveUserRecipe(recipeIdToUnsave);
      alert('레시피 저장이 취소되었습니다.');
      navigate('/');
    } catch (error) {
      console.error('Failed to unsave recipe:', error);
      alert('레시피 저장 취소에 실패했습니다.');
    }
  }

  function generateRecipeSchema(recipe: Recipe) {
    return {
      "@context": "https://schema.org",
      "@type": "Recipe",
      "name": recipe.name,
      "description": recipe.description || `${recipe.name} 레시피입니다.`,
      "recipeIngredient": recipe.ingredients || [],
      "recipeInstructions": recipe.instructions?.map((step, index) => ({
        "@type": "HowToStep",
        "position": index + 1,
        "text": step
      })) || [],
      "recipeCuisine": "한식",
      "keywords": recipe.ingredients?.join(', '),
      "author": {
        "@type": "Organization",
        "name": "오늘의냉장고"
      }
    };
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">레시피를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
        <div className="max-w-md mx-auto px-4 py-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>돌아가기</span>
          </button>
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
            <p className="text-red-600 mb-4">{error || '레시피를 찾을 수 없습니다.'}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-orange-600 transition-colors"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{recipe.name} - 오늘의냉장고</title>
        <meta name="description" content={recipe.description || `${recipe.name} 레시피입니다. ${recipe.ingredients?.join(', ')}로 만드는 요리입니다.`} />
        <meta property="og:title" content={`${recipe.name} - 오늘의냉장고`} />
        <meta property="og:description" content={recipe.description || `${recipe.name} 레시피`} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://www.oneulfridge.com/recipe/${recipe.id}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${recipe.name} - 오늘의냉장고`} />
        <meta name="twitter:description" content={recipe.description || `${recipe.name} 레시피`} />
      </Helmet>

      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify(generateRecipeSchema(recipe))
      }} />

      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
        <div className="max-w-md mx-auto px-4 py-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>돌아가기</span>
          </button>

          <RecipeDetail
            recipe={recipe}
            onBack={() => navigate('/')}
            userIngredients={[]}
            onSaveUserRecipe={handleSave}
            onQuickSave={handleSave}
            onUnsave={handleUnsave}
            isAuthenticated={isAuthenticated}
            onShowAuthModal={() => {}}
          />
        </div>
      </div>
    </>
  );
}
