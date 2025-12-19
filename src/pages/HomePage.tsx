import { useState, useEffect } from 'react';
import { Sparkles, Target, Leaf, Loader2, ArrowRight } from 'lucide-react';
import { HeroSection } from '../components/HeroSection';
import { RecipeCardWithImage } from '../components/RecipeCardWithImage';
import { Recipe, getRandomRecipes } from '../lib/recipeService';

interface HomePageProps {
  onNavigateToFridge: () => void;
  onNavigateToSearch: (keyword?: string) => void;
  onRecipeClick: (recipe: Recipe) => void;
}

// 간소화된 인기 키워드 (6개)
const POPULAR_KEYWORDS = [
  { label: '간편식', emoji: '🔥', searchTerm: '간편식' },
  { label: '다이어트', emoji: '💪', searchTerm: '다이어트' },
  { label: '빠른요리', emoji: '⚡', searchTerm: '10분' },
  { label: '채식', emoji: '🥗', searchTerm: '채식' },
  { label: '술안주', emoji: '🍺', searchTerm: '술안주' },
  { label: '야식', emoji: '🌙', searchTerm: '야식' },
];

export function HomePage({
  onNavigateToFridge,
  onNavigateToSearch,
  onRecipeClick,
}: HomePageProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRandomRecipes();
  }, []);

  async function loadRandomRecipes() {
    try {
      const randomRecipes = await getRandomRecipes(12);
      setRecipes(randomRecipes);
    } catch (error) {
      console.error('Failed to load recipes:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleKeywordClick = (searchTerm: string) => {
    onNavigateToSearch(searchTerm);
  };

  const handleSeeAllRecipes = () => {
    onNavigateToSearch('');
  };

  return (
    <>
      {/* Hero Section */}
      <HeroSection
        onCameraClick={onNavigateToFridge}
        onManualInputClick={onNavigateToFridge}
      />

      {/* 메인 콘텐츠 영역 */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* 서비스 프로세스 Section */}
        <section className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
            복잡한 고민 없이, 3초 만에 메뉴 결정
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            AI가 당신의 냉장고를 분석하여 최적의 레시피를 찾아드립니다
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Process 1 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                스마트한 재료 인식
              </h3>
              <p className="text-gray-600 leading-relaxed">
                영수증이나 냉장고 안을 사진으로 찍기만 하세요. AI가 자동으로 식재료 목록을 정리하고 유통기한까지 관리해 줍니다.
              </p>
            </div>

            {/* Process 2 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Target className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                맞춤형 AI 레시피 매칭
              </h3>
              <p className="text-gray-600 leading-relaxed">
                내가 가진 재료와 집에 있는 기본 양념만으로 만들 수 있는 현실적인 요리를 추천합니다.
              </p>
            </div>

            {/* Process 3 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Leaf className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                지속 가능한 식생활
              </h3>
              <p className="text-gray-600 leading-relaxed">
                냉장고 파먹기를 통해 음식물 쓰레기를 줄이고 식비도 아낄 수 있습니다.
              </p>
            </div>
          </div>
        </section>

        {/* 인기 키워드 Section */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-8">
            인기 키워드로 빠르게 찾기
          </h2>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 max-w-3xl mx-auto">
            {POPULAR_KEYWORDS.map((keyword) => (
              <button
                key={keyword.searchTerm}
                onClick={() => handleKeywordClick(keyword.searchTerm)}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100 hover:border-primary hover:shadow-md transition-all active:scale-95"
              >
                <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center text-2xl">
                  {keyword.emoji}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {keyword.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* 레시피 큐레이션 Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              오늘의 추천 레시피
            </h2>
            <button
              onClick={handleSeeAllRecipes}
              className="text-primary font-semibold flex items-center gap-2 hover:gap-3 transition-all"
            >
              <span>전체보기</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
          ) : recipes.length > 0 ? (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipes.map((recipe) => (
                  <RecipeCardWithImage
                    key={recipe.id}
                    recipe={recipe}
                    onClick={onRecipeClick}
                  />
                ))}
              </div>

              {/* 더보기 버튼 */}
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleSeeAllRecipes}
                  className="px-8 py-4 bg-primary hover:bg-primary-dark text-white rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95"
                >
                  모든 레시피 보러 가기
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl">
              <p className="text-gray-500">레시피를 불러오는 중 오류가 발생했습니다.</p>
            </div>
          )}
        </section>

        {/* FAQ Section */}
        <section className="bg-gray-50 rounded-3xl p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-10">
            자주 묻는 질문
          </h2>

          <div className="space-y-8 max-w-3xl mx-auto">
            {/* Q1 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                냉장고 파먹기(냉털)가 왜 필요할까요?
              </h3>
              <p className="text-gray-600 leading-relaxed">
                최근 고물가 시대에 식비 절약은 필수입니다. 오늘의냉장고는 식재료를 제때 소진하지 못해 버려지는 음식물 쓰레기 문제를 해결하고, 건강한 식단을 제안합니다.
              </p>
            </div>

            {/* Q2 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                요리 초보도 따라 할 수 있나요?
              </h3>
              <p className="text-gray-600 leading-relaxed">
                재료 손질부터 조리 순서, 불 조절 팁, 대체 재료까지 상세하게 안내합니다. 자취생이나 요리 초보자도 실패 없이 맛있는 한 끼를 완성할 수 있습니다.
              </p>
            </div>

            {/* Q3 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                AI 레시피 추천 원리는?
              </h3>
              <p className="text-gray-600 leading-relaxed">
                수만 건의 요리 데이터와 식재료 조합 알고리즘을 학습한 AI가 사용자의 보유 재료를 분석하여, 최적의 맛 조합을 찾아냅니다.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
