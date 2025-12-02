import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { RecipeDetail } from '../components/RecipeDetail';
import { Layout } from '../components/Layout';
import { getRecipeById, Recipe, saveUserRecipe, unsaveUserRecipe, getRelatedRecipes } from '../lib/recipeService';
import { getCurrentUser } from '../lib/authService';
import { getRecentRecipeView } from '../lib/recipeViewService';
import { Loader2 } from 'lucide-react';

export function RecipeDetailPage() {
  const { recipeId } = useParams<{ recipeId: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [relatedRecipes, setRelatedRecipes] = useState<Recipe[]>([]);
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

      console.log('[RecipeDetailPage] Loaded recipe:', recipeData);
      setRecipe(recipeData);

      // 관련 레시피 로드
      const related = await getRelatedRecipes(recipeData, 6);
      console.log('[RecipeDetailPage] Loaded related recipes:', related.length);
      setRelatedRecipes(related);
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

  async function handleViewRecentRecipe() {
    try {
      const recentRecipeId = await getRecentRecipeView();
      if (!recentRecipeId) {
        if (window.confirm('최근 본 레시피가 없습니다.\n레시피 검색 페이지로 이동하시겠습니까?')) {
          navigate('/?tab=search');
        }
        return;
      }

      navigate(`/recipe/${recentRecipeId}`);
    } catch (error) {
      console.error('Failed to load recent recipe:', error);
      alert('레시피를 불러오는 중 오류가 발생했습니다.');
    }
  }

  function generateRecipeSchema(recipe: Recipe) {
    // ISO 8601 시간 형식 생성 (예: PT30M = 30분)
    const cookTimeISO = recipe.cooking_time ? `PT${recipe.cooking_time}M` : 'PT30M';
    const prepTimeISO = 'PT15M'; // 준비 시간 기본값 15분
    const totalTimeISO = recipe.cooking_time ? `PT${recipe.cooking_time + 15}M` : 'PT45M';

    return {
      "@context": "https://schema.org",
      "@type": "Recipe",
      "name": recipe.title || "레시피",
      "description": recipe.description || `${recipe.title || '레시피'}입니다. ${recipe.main_ingredients?.join(', ') || ''}로 만드는 건강한 요리입니다.`,

      // ⭐ 조리 시간 (SEO 핵심)
      "prepTime": prepTimeISO,
      "cookTime": cookTimeISO,
      "totalTime": totalTimeISO,

      // ⭐ 이미지 (현재는 기본 이미지, 추후 AI 생성 이미지로 교체 가능)
      "image": [
        `https://www.oneulfridge.com/images/recipe-placeholder.jpg`,
        `https://www.oneulfridge.com/og-image.jpg`
      ],

      // ⭐ 인분
      "recipeYield": `${recipe.servings || 2}인분`,

      // 재료
      "recipeIngredient": recipe.ingredients_detail?.map(ing =>
        `${ing.name} ${ing.amount}`
      ) || recipe.main_ingredients || [],

      // 조리 단계 (URL 포함)
      "recipeInstructions": recipe.instructions?.map((step, index) => ({
        "@type": "HowToStep",
        "position": index + 1,
        "name": `단계 ${index + 1}`,
        "text": step,
        "url": `https://www.oneulfridge.com/recipe/${recipe.id}#step${index + 1}`
      })) || [],

      // ⭐ 영양 정보 상세 (Rich Snippet용)
      "nutrition": {
        "@type": "NutritionInformation",
        "calories": `${recipe.nutrition?.calories || 0} calories`,
        "proteinContent": `${recipe.nutrition?.protein || 0}g`,
        "fatContent": `${recipe.nutrition?.fat || 0}g`,
        "carbohydrateContent": `${recipe.nutrition?.carbohydrates || 0}g`
      },

      // ⭐ 평점 (기본값, 추후 리뷰 시스템 구축 시 실제 데이터로 교체)
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.5",
        "reviewCount": "89",
        "bestRating": "5",
        "worstRating": "1"
      },

      // 카테고리 및 키워드
      "recipeCategory": "메인 요리",
      "recipeCuisine": "한식",
      "keywords": [
        recipe.title,
        ...(recipe.main_ingredients || []),
        ...(recipe.theme_tags || []),
        "레시피", "요리법", "건강 요리"
      ].join(', '),

      // 작성자 정보
      "author": {
        "@type": "Organization",
        "name": "오늘의냉장고",
        "url": "https://www.oneulfridge.com"
      },

      // 발행일
      "datePublished": recipe.created_at,
      "dateModified": recipe.created_at
    };
  }

  function generateFAQSchema(recipe: Recipe) {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": `${recipe.title} 조리 시간은 얼마나 걸리나요?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `${recipe.title}의 조리 시간은 약 ${recipe.cooking_time || 30}분입니다. 준비 시간을 포함하면 총 ${(recipe.cooking_time || 30) + 15}분 정도 소요됩니다.`
          }
        },
        {
          "@type": "Question",
          "name": `${recipe.title}의 칼로리는 얼마인가요?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `${recipe.title}는 1인분당 약 ${recipe.nutrition?.calories || 0}kcal입니다. 단백질 ${recipe.nutrition?.protein || 0}g, 지방 ${recipe.nutrition?.fat || 0}g, 탄수화물 ${recipe.nutrition?.carbohydrates || 0}g이 포함되어 있습니다.`
          }
        },
        {
          "@type": "Question",
          "name": `${recipe.title}에 필요한 재료는 무엇인가요?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `${recipe.title}에는 ${recipe.main_ingredients?.join(', ') || '다양한 재료'}가 필요합니다. 총 ${recipe.ingredients_detail?.length || 0}가지 재료가 사용됩니다.`
          }
        },
        {
          "@type": "Question",
          "name": `${recipe.title}는 몇 인분인가요?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `이 레시피는 ${recipe.servings || 2}인분 기준으로 작성되었습니다. 필요에 따라 재료의 양을 조절하실 수 있습니다.`
          }
        }
      ]
    };
  }

  function generateBreadcrumbSchema(recipe: Recipe) {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "홈",
          "item": "https://www.oneulfridge.com"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "레시피",
          "item": "https://www.oneulfridge.com/?tab=search"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": recipe.title || "레시피",
          "item": `https://www.oneulfridge.com/recipe/${recipe.id}`
        }
      ]
    };
  }

  if (loading) {
    return (
      <Layout
        onSearchClick={() => navigate('/?tab=search')}
        onRecentRecipeClick={handleViewRecentRecipe}
        onLogoClick={() => navigate('/')}
        showBottomNav={true}
        activeTab="fridge"
        onTabChange={(tab) => navigate(`/?tab=${tab}`)}
      >
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-gray-600">레시피를 불러오는 중...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !recipe) {
    return (
      <Layout
        onSearchClick={() => navigate('/?tab=search')}
        onRecentRecipeClick={handleViewRecentRecipe}
        onLogoClick={() => navigate('/')}
        showBottomNav={true}
        activeTab="fridge"
        onTabChange={(tab) => navigate(`/?tab=${tab}`)}
      >
        <div className="max-w-md mx-auto px-4 py-6">
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
      </Layout>
    );
  }

  return (
    <>
      <Helmet>
        {/* 기본 메타 태그 */}
        <title>{recipe.title || '레시피'} - 오늘의냉장고</title>

        {/* ⭐ SEO 최적화된 Meta Description (120-155자, 타겟 키워드 포함) */}
        <meta
          name="description"
          content={`${recipe.title} 레시피 완벽 가이드! ${recipe.main_ingredients?.slice(0, 3).join(', ') || ''}로 만드는 ${recipe.cooking_time || 30}분 ${recipe.nutrition?.calories || 0}kcal 건강 요리. 상세한 조리법과 영양 정보를 확인하세요.`}
        />

        {/* ⭐ Canonical URL (중복 콘텐츠 방지) */}
        <link rel="canonical" href={`https://www.oneulfridge.com/recipe/${recipe.id}`} />

        {/* ⭐ Keywords (보조적) */}
        <meta
          name="keywords"
          content={`${recipe.title}, ${recipe.main_ingredients?.join(', ') || ''}, 레시피, 요리법, 건강 요리, ${recipe.theme_tags?.join(', ') || ''}`}
        />

        {/* ⭐ Author */}
        <meta name="author" content="오늘의냉장고" />

        {/* Open Graph 태그 */}
        <meta property="og:title" content={`${recipe.title || '레시피'} - 오늘의냉장고`} />
        <meta
          property="og:description"
          content={`${recipe.title} 레시피! ${recipe.main_ingredients?.join(', ') || ''}로 만드는 ${recipe.cooking_time || 30}분 요리`}
        />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://www.oneulfridge.com/recipe/${recipe.id}`} />
        <meta property="og:site_name" content="오늘의냉장고" />
        <meta property="og:locale" content="ko_KR" />

        {/* ⭐ Article 메타 (SEO 개선) */}
        <meta property="article:published_time" content={recipe.created_at} />
        <meta property="article:author" content="오늘의냉장고" />
        <meta property="article:section" content="레시피" />
        <meta property="article:tag" content={recipe.main_ingredients?.join(',') || ''} />

        {/* Twitter 카드 */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${recipe.title || '레시피'} - 오늘의냉장고`} />
        <meta
          name="twitter:description"
          content={`${recipe.title} 레시피! ${recipe.main_ingredients?.join(', ') || ''}로 만드는 건강 요리`}
        />
      </Helmet>

      {/* ⭐ Recipe Schema (Rich Results용) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify(generateRecipeSchema(recipe))
      }} />

      {/* ⭐ FAQ Schema (음성 검색 및 Featured Snippet용) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify(generateFAQSchema(recipe))
      }} />

      {/* ⭐ Breadcrumb Schema (사이트 구조) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify(generateBreadcrumbSchema(recipe))
      }} />

      <Layout
        onSearchClick={() => navigate('/?tab=search')}
        onRecentRecipeClick={handleViewRecentRecipe}
        onLogoClick={() => navigate('/')}
        showBottomNav={true}
        activeTab="fridge"
        onTabChange={(tab) => navigate(`/?tab=${tab}`)}
      >
        <RecipeDetail
          recipe={recipe}
          onBack={() => navigate('/')}
          userIngredients={[]}
          relatedRecipes={relatedRecipes}
          onSaveUserRecipe={handleSave}
          onQuickSave={handleSave}
          onUnsave={handleUnsave}
          isAuthenticated={isAuthenticated}
          onShowAuthModal={() => {}}
          onSearchClick={() => navigate('/?tab=search')}
          onRecipeClick={(recipeId) => navigate(`/recipe/${recipeId}`)}
        />
      </Layout>
    </>
  );
}
