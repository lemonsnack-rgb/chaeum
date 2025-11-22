import { useState, useEffect } from 'react';
import { RefrigeratorIcon, Search, ShieldCheck, ChefHat, User, Loader2, LogOut } from 'lucide-react';
import { useIngredients } from './hooks/useIngredients';
import { CameraButton } from './components/CameraButton';
import { IngredientInput } from './components/IngredientInput';
import { IngredientList } from './components/IngredientList';
import { RecipeList } from './components/RecipeList';
import { RecipeDetail } from './components/RecipeDetail';
import { RecipeSearch } from './components/RecipeSearch';
import { AuthModal } from './components/AuthModal';
import { RecipeOptionsModal } from './components/RecipeOptionsModal';
import { generateBatchRecipes, getUserRecipes, getUserSavedRecipes, deleteRecipe, searchRecipes, searchPublicRecipes, saveUserRecipe, Recipe } from './lib/recipeService';
import { signOut, getCurrentUser, getUserProfile } from './lib/authService';
import { supabase } from './lib/supabase';

type Tab = 'fridge' | 'recipe' | 'profile';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('fridge');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recommendedRecipes, setRecommendedRecipes] = useState<Recipe[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [generatingRecipe, setGeneratingRecipe] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRecipeOptions, setShowRecipeOptions] = useState(false);
  const [recipeSubTab, setRecipeSubTab] = useState<'ai' | 'my' | 'search'>('ai');
  const {
    ingredients,
    loading,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    addMultipleIngredients,
    clearAllIngredients,
  } = useIngredients();

  const handleIngredientsExtracted = async (names: string[]) => {
    console.log('Extracted ingredients:', names);
    if (names.length > 0) {
      try {
        await addMultipleIngredients(names);
        alert(`${names.length}개의 식재료가 추가되었습니다!\n추가된 재료: ${names.join(', ')}`);
      } catch (error) {
        console.error('Failed to add ingredients:', error);
        alert('재료 추가 중 오류가 발생했습니다.');
      }
    } else {
      alert('식재료를 찾지 못했습니다. 다시 시도해주세요.');
    }
  };

  const handleAddIngredient = async (name: string, quantity: string) => {
    try {
      await addIngredient(name, quantity);
    } catch (error) {
      alert('식재료 추가 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    checkAuth();
    if (activeTab === 'recipe') {
      loadRecipesBySubTab();
    }
  }, [activeTab, recipeSubTab]);

  async function loadRecipesBySubTab() {
    if (recipeSubTab === 'ai' && showRecommendations) {
      // AI 추천 레시피는 이미 로드되어 있음
      return;
    } else if (recipeSubTab === 'my') {
      // 내 레시피 로드
      const myRecipes = await getUserSavedRecipes();
      setRecipes(myRecipes);
    } else if (recipeSubTab === 'search') {
      // 공개 레시피 검색
      const publicRecipes = await getUserRecipes();
      setRecipes(publicRecipes);
    }
  }

  useEffect(() => {
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setUserEmail(session?.user?.email || null);
      if (session) {
        setShowAuthModal(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkAuth() {
    if (!supabase) return;
    const user = await getCurrentUser();
    setIsAuthenticated(!!user);
    setUserEmail(user?.email || null);
  }

  async function loadRecipes() {
    try {
      if (searchQuery.trim()) {
        const searchResults = await searchRecipes(searchQuery);
        setRecipes(searchResults);
      } else {
        const userRecipes = await getUserRecipes();
        setRecipes(userRecipes);
      }
    } catch (error) {
      console.error('Failed to load recipes:', error);
    }
  }

  async function handleSearch(query: string) {
    setSearchQuery(query);
    try {
      let searchResults: Recipe[];
      if (recipeSubTab === 'my') {
        // 내 레시피 탭: user_recipes 테이블에서 검색
        searchResults = await searchRecipes(query);
      } else {
        // 레시피 검색 탭: generated_recipes 테이블에서 검색
        searchResults = await searchPublicRecipes(query);
      }
      setRecipes(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
    }
  }

  async function handleQuickSave(recipe: Recipe) {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      throw new Error('로그인이 필요합니다.');
    }
    await saveUserRecipe(recipe);
  }

  async function handleSignOut() {
    try {
      await signOut();
      setIsAuthenticated(false);
      setUserEmail(null);
      setActiveTab('fridge');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }

  async function handleSaveUserRecipe(recipe: Recipe) {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      throw new Error('로그인이 필요합니다.');
    }
    await saveUserRecipe(recipe);
  }

  async function handleGenerateRecipe() {
    if (ingredients.length === 0) {
      alert('냉장고에 재료를 먼저 추가해주세요!');
      return;
    }

    setShowRecipeOptions(true);
  }

  async function handleGenerateWithOptions(servings: number, theme: string) {
    try {
      setShowRecipeOptions(false);
      setGeneratingRecipe(true);
      const ingredientNames = ingredients.map(i => i.name);
      const generatedRecipes = await generateBatchRecipes(ingredientNames, servings, theme);
      setRecommendedRecipes(generatedRecipes);
      setShowRecommendations(true);
      setActiveTab('recipe');
    } catch (error) {
      console.error('Failed to generate recipe:', error);
      alert('레시피 찾는 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setGeneratingRecipe(false);
    }
  }

  async function handleDeleteRecipe(recipeId: string) {
    if (!confirm('이 레시피를 삭제하시겠습니까?')) {
      return;
    }

    try {
      await deleteRecipe(recipeId);
      await loadRecipes();
      if (selectedRecipe?.id === recipeId) {
        setSelectedRecipe(null);
      }
    } catch (error) {
      console.error('Failed to delete recipe:', error);
      alert('레시피 삭제 중 오류가 발생했습니다.');
    }
  }

  async function handleClearAllIngredients() {
    if (!confirm(`모든 재료(${ingredients.length}개)를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await clearAllIngredients();
    } catch (error) {
      console.error('Failed to clear ingredients:', error);
      alert('재료 삭제 중 오류가 발생했습니다.');
    }
  }

  if (selectedRecipe) {
    const isFromRecommendations = recommendedRecipes.some(r => r.id === selectedRecipe.id);
    return (
      <RecipeDetail
        recipe={selectedRecipe}
        onBack={() => setSelectedRecipe(null)}
        userIngredients={ingredients.map(i => i.name)}
        onSaveUserRecipe={handleSaveUserRecipe}
        onQuickSave={handleQuickSave}
        isReadOnly={isFromRecommendations}
        isAuthenticated={isAuthenticated}
        onShowAuthModal={() => setShowAuthModal(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="w-7 h-7 text-primary" />
            <h1 className="text-xl font-bold text-gray-900">냉장고지킴이</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-orange-100 rounded-full">
              <span className="text-xs font-semibold text-primary">
                {ingredients.length}개 재료
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {activeTab === 'fridge' && (
          <>
            <section className="mb-6">
              <CameraButton onIngredientsExtracted={handleIngredientsExtracted} />
            </section>

            <section className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 px-1">
                직접 입력하기
              </h3>
              <IngredientInput
                onAdd={handleAddIngredient}
                existingNames={ingredients.map(i => i.name)}
              />
            </section>

            <section>
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-lg font-bold text-gray-900">내 냉장고 재료</h3>
                {ingredients.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      총 {ingredients.length}개
                    </span>
                    <button
                      onClick={handleClearAllIngredients}
                      className="text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      전체 삭제
                    </button>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                  <div className="text-center py-8">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">불러오는 중...</p>
                  </div>
                </div>
              ) : (
                <IngredientList
                  ingredients={ingredients}
                  onUpdate={updateIngredient}
                  onDelete={deleteIngredient}
                />
              )}
            </section>

            {ingredients.length > 0 && (
              <section className="mt-6">
                <button
                  onClick={handleGenerateRecipe}
                  disabled={generatingRecipe || ingredients.length === 0}
                  className="w-full bg-primary hover:bg-primary-dark text-white rounded-2xl py-4 px-6 font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                >
                  {generatingRecipe ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      레시피 찾는 중...
                    </>
                  ) : (
                    <>
                      <ChefHat className="w-6 h-6" />
                      레시피 찾기
                    </>
                  )}
                </button>
              </section>
            )}
          </>
        )}

        {activeTab === 'recipe' && (
          <>
            {/* 서브 탭 버튼 */}
            <section className="mb-6">
              <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm">
                <button
                  onClick={() => {
                    setRecipeSubTab('ai');
                    setShowRecommendations(recommendedRecipes.length > 0);
                    setSearchQuery('');
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
                    recipeSubTab === 'ai'
                      ? 'bg-primary text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  AI 추천
                </button>
                <button
                  onClick={() => {
                    setRecipeSubTab('my');
                    setShowRecommendations(false);
                    setSearchQuery('');
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
                    recipeSubTab === 'my'
                      ? 'bg-primary text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  내 레시피
                </button>
                <button
                  onClick={() => {
                    setRecipeSubTab('search');
                    setShowRecommendations(false);
                    setSearchQuery('');
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
                    recipeSubTab === 'search'
                      ? 'bg-primary text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  레시피 검색
                </button>
              </div>
            </section>

            {/* 검색 바 - 내 레시피와 레시피 검색 탭에만 표시 */}
            {(recipeSubTab === 'my' || recipeSubTab === 'search') && !showRecommendations && (
              <section className="mb-6">
                <RecipeSearch onSearch={handleSearch} />
              </section>
            )}

            <section className="mb-6">
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-lg font-bold text-gray-900">
                  {recipeSubTab === 'ai' && showRecommendations ? 'AI 추천 레시피' :
                   recipeSubTab === 'ai' ? 'AI 레시피 찾기' :
                   recipeSubTab === 'my' ? '내가 저장한 레시피' :
                   searchQuery ? '검색 결과' : '모든 레시피'}
                </h3>
                {showRecommendations ? (
                  <button
                    onClick={() => {
                      setShowRecommendations(false);
                      setRecommendedRecipes([]);
                    }}
                    className="text-sm text-primary hover:text-primary-dark font-semibold"
                  >
                    닫기
                  </button>
                ) : (
                  recipes.length > 0 && (
                    <span className="text-sm text-gray-500">
                      총 {recipes.length}개
                    </span>
                  )
                )}
              </div>
              {recipeSubTab === 'ai' && showRecommendations ? (
                <>
                  <RecipeList
                    recipes={recommendedRecipes}
                    onSelectRecipe={setSelectedRecipe}
                    onDeleteRecipe={handleDeleteRecipe}
                    hideDelete={true}
                  />
                  <div className="mt-6">
                    <button
                      onClick={handleGenerateRecipe}
                      disabled={generatingRecipe || ingredients.length === 0}
                      className="w-full bg-gradient-to-r from-primary to-orange-600 text-white rounded-2xl py-4 px-6 font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {generatingRecipe ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" />
                          레시피 찾는 중...
                        </>
                      ) : (
                        <>
                          <ChefHat className="w-6 h-6" />
                          다른 레시피 추천받기
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : recipeSubTab === 'ai' ? (
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                  <div className="text-center py-8">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ChefHat className="w-10 h-10 text-primary" />
                    </div>
                    <p className="text-gray-700 mb-2 font-medium">냉장고 재료로 레시피를 찾아보세요</p>
                    <p className="text-sm text-gray-500 mb-6">냉장고 탭에서 재료를 추가하고<br/>레시피 찾기 버튼을 눌러주세요</p>
                    <button
                      onClick={() => setActiveTab('fridge')}
                      className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-all"
                    >
                      냉장고로 이동
                    </button>
                  </div>
                </div>
              ) : (
                <RecipeList
                  recipes={recipes}
                  onSelectRecipe={setSelectedRecipe}
                  onDeleteRecipe={handleDeleteRecipe}
                  hideDelete={recipeSubTab === 'search'}
                />
              )}
            </section>

            {!isAuthenticated && (
              <section>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">레시피 저장 안내</h4>
                      <p className="text-sm text-gray-600 leading-relaxed mb-3">
                        AI가 생성한 레시피를 저장하려면 로그인이 필요합니다.
                      </p>
                      <button
                        onClick={() => setShowAuthModal(true)}
                        className="w-full px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-all"
                      >
                        로그인하고 레시피 저장하기
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            {isAuthenticated ? (
              <div className="py-8">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 text-center mb-2">내 정보</h3>
                <p className="text-sm text-gray-600 text-center mb-6">
                  {userEmail}
                </p>

                <div className="space-y-3">
                  <div className="bg-orange-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">저장된 재료</span>
                      <span className="text-lg font-bold text-primary">{ingredients.length}개</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">생성된 레시피</span>
                      <span className="text-lg font-bold text-primary">{recipes.length}개</span>
                    </div>
                  </div>

                  <button
                    onClick={handleSignOut}
                    className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-5 h-5" />
                    로그아웃
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">내 정보</h3>
                <p className="text-sm text-gray-500 mb-6">
                  로그인하면 모든 기기에서 내 냉장고를 확인할 수 있어요
                </p>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="w-full px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-all"
                >
                  로그인
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-around">
            <button
              onClick={() => setActiveTab('fridge')}
              className={`flex flex-col items-center gap-1 py-2 px-4 transition-colors ${
                activeTab === 'fridge' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <RefrigeratorIcon className="w-6 h-6" />
              <span className="text-xs font-medium">냉장고</span>
            </button>
            <button
              onClick={() => setActiveTab('recipe')}
              className={`flex flex-col items-center gap-1 py-2 px-4 transition-colors ${
                activeTab === 'recipe' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <ChefHat className="w-6 h-6" />
              <span className="text-xs font-medium">레시피</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center gap-1 py-2 px-4 transition-colors ${
                activeTab === 'profile' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <User className="w-6 h-6" />
              <span className="text-xs font-medium">내 정보</span>
            </button>
          </div>
        </div>
      </nav>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showRecipeOptions && (
        <RecipeOptionsModal
          onClose={() => setShowRecipeOptions(false)}
          onGenerate={handleGenerateWithOptions}
        />
      )}
    </div>
  );
}

export default App;
