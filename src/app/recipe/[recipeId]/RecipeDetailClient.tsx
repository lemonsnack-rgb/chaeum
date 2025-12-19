'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RecipeDetail } from '../../../components/RecipeDetail';
import { Layout } from '../../../components/Layout';
import { Recipe, getSimilarIngredientRecipes, getCompanionRecipes, getBalancedNutritionRecipes, saveUserRecipe, unsaveUserRecipe } from '../../../lib/recipeService';
import { getCurrentUser } from '../../../lib/authService';
import { getRecentRecipeView } from '../../../lib/recipeViewService';
import { trackRecipeView as trackRecipeViewGA } from '../../../lib/analytics';

interface RecipeDetailClientProps {
  recipe: Recipe;
}

export default function RecipeDetailClient({ recipe }: RecipeDetailClientProps) {
  const router = useRouter();
  const [similarRecipes, setSimilarRecipes] = useState<Recipe[]>([]);
  const [companionRecipes, setCompanionRecipes] = useState<Recipe[]>([]);
  const [balancedRecipes, setBalancedRecipes] = useState<Recipe[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
    loadRelatedRecipes();

    // GA4 레시피 조회 이벤트 추적
    trackRecipeViewGA(recipe.id, recipe.title);
  }, [recipe.id]);

  async function checkAuth() {
    const user = await getCurrentUser();
    setIsAuthenticated(!!user);
  }

  async function loadRelatedRecipes() {
    try {
      const [similar, companion, balanced] = await Promise.all([
        getSimilarIngredientRecipes(recipe, 5),
        getCompanionRecipes(recipe, 4),
        getBalancedNutritionRecipes(recipe, 4)
      ]);

      setSimilarRecipes(similar);
      setCompanionRecipes(companion);
      setBalancedRecipes(balanced);
    } catch (error) {
      console.error('Failed to load related recipes:', error);
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
      router.push('/');
    } catch (error) {
      console.error('Failed to unsave recipe:', error);
      alert('레시피 저장 취소에 실패했습니다.');
    }
  }

  async function handleViewRecentRecipe() {
    try {
      const recentRecipeId = await getRecentRecipeView();
      if (!recentRecipeId) {
        if (window.confirm('최근 본 레시피가 없습니다.\n레시피 검색 페이지로 이동하시겠습니까?')) {
          router.push('/?tab=search');
        }
        return;
      }

      router.push(`/recipe/${recentRecipeId}`);
    } catch (error) {
      console.error('Failed to load recent recipe:', error);
      alert('레시피를 불러오는 중 오류가 발생했습니다.');
    }
  }

  return (
    <Layout
      onSearchClick={() => router.push('/?tab=search')}
      onRecentRecipeClick={handleViewRecentRecipe}
      onLogoClick={() => router.push('/')}
      showBottomNav={true}
      activeTab="fridge"
      onTabChange={(tab) => router.push(`/?tab=${tab}`)}
    >
      <RecipeDetail
        recipe={recipe}
        onBack={() => router.push('/')}
        userIngredients={[]}
        similarRecipes={similarRecipes}
        companionRecipes={companionRecipes}
        balancedRecipes={balancedRecipes}
        onSaveUserRecipe={handleSave}
        onQuickSave={handleSave}
        onUnsave={handleUnsave}
        isAuthenticated={isAuthenticated}
        onShowAuthModal={() => {}}
        onSearchClick={() => router.push('/?tab=search')}
        onRecipeClick={(recipeId) => router.push(`/recipe/${recipeId}`)}
      />
    </Layout>
  );
}
