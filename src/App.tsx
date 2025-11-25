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
import { LoadingModal } from './components/LoadingModal';
import { generateBatchRecipes, getUserRecipes, deleteRecipe, searchRecipes, searchPublicRecipes, saveUserRecipe, Recipe } from './lib/recipeService';
import { signOut, getCurrentUser, getUserProfile, getMyBookmarkedRecipes } from './lib/authService';
import { supabase } from './lib/supabase';

type Tab = 'fridge' | 'recipe' | 'profile';
type RecipeSubTab = 'search' | 'recommended' | 'saved';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('fridge');
  const [recipeSubTab, setRecipeSubTab] = useState<RecipeSubTab>('search');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recommendedRecipes, setRecommendedRecipes] = useState<Recipe[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [generatingRecipe, setGeneratingRecipe] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRecipeOptions, setShowRecipeOptions] = useState(false);
  const {
    ingredients,
    loading,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    addMultipleIngredients,
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
    if (recipeSubTab === 'search') {
      handleSearch('');
    } else if (recipeSubTab === 'saved') {
      await loadSavedRecipes();
    }
  }

  async function loadSavedRecipes() {
    if (!isAuthenticated) {
      setSavedRecipes([]);
      return;
    }
    try {
      const bookmarked = await getMyBookmarkedRecipes();
      setSavedRecipes(bookmarked);
    } catch (error) {
      console.error('Failed to load saved recipes:', error);
      setSavedRecipes([]);
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
      const searchResults = await searchPublicRecipes(query);
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
      setActiveTab('recipe');
      setRecipeSubTab('recommended');
    } catch (error) {
      console.error('Failed to generate recipe:', error);
      alert('레시피 찾는 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setGeneratingRecipe(false);
    }
  }

  async function handleDeleteRecipe(recipeId: string) {
    if (!confirm('\uc774 \ub808\uc2dc\ud53c\ub97c \uc0ad\uc81c\ud558\uc2dc\uaca0\uc2b5\ub2c8\uae4c?')) {
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
      alert('\ub808\uc2dc\ud53c \uc0ad\uc81c \uc911 \uc624\ub958\uac00 \ubc1c\uc0dd\ud588\uc2b5\ub2c8\ub2e4.');
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
            <h1 className="text-xl font-bold text-gray-900">
              <span className="text-primary">오</span>늘의<span className="text-primary">냉</span>장고
            </h1>
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
                  <span className="text-sm text-gray-500">
                    총 {ingredients.length}개
                  </span>
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
            {/* 서브탭 네비게이션 */}
            <section className="mb-6">
              <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setRecipeSubTab('search')}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
                    recipeSubTab === 'search'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  레시피 검색
                </button>
                <button
                  onClick={() => setRecipeSubTab('recommended')}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
                    recipeSubTab === 'recommended'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  추천 레시피
                  {recommendedRecipes.length > 0 && (
                    <span className="ml-1 text-xs bg-primary text-white rounded-full px-2 py-0.5">
                      {recommendedRecipes.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setRecipeSubTab('saved')}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
                    recipeSubTab === 'saved'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  저장 레시피
                </button>
              </div>
            </section>

            {/* DB 검색 탭 */}
            {recipeSubTab === 'search' && (
              <>
                <section className="mb-6">
                  <RecipeSearch onSearch={handleSearch} />
                </section>

                <section className="mb-6">
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      {searchQuery ? '검색 결과' : '전체 레시피'}
                    </h3>
                    {recipes.length > 0 && (
                      <span className="text-sm text-gray-500">
                        총 {recipes.length}개
                      </span>
                    )}
                  </div>
                  <RecipeList
                    recipes={recipes}
                    onSelectRecipe={setSelectedRecipe}
                    onDeleteRecipe={handleDeleteRecipe}
                    hideDelete={true}
                  />
                </section>
              </>
            )}

            {/* 추천 레시피 탭 */}
            {recipeSubTab === 'recommended' && (
              <section className="mb-6">
                <div className="flex items-center justify-between mb-4 px-1">
                  <h3 className="text-lg font-bold text-gray-900">AI 추천 레시피</h3>
                  {recommendedRecipes.length > 0 && (
                    <span className="text-sm text-gray-500">
                      총 {recommendedRecipes.length}개
                    </span>
                  )}
                </div>
                {recommendedRecipes.length > 0 ? (
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
                ) : (
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
                    <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">아직 추천받은 레시피가 없습니다.</p>
                    <button
                      onClick={() => setActiveTab('fridge')}
                      className="px-6 py-2 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-all"
                    >
                      냉장고에서 레시피 찾기
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* 내 저장 레시피 탭 */}
            {recipeSubTab === 'saved' && (
              <section className="mb-6">
                <div className="flex items-center justify-between mb-4 px-1">
                  <h3 className="text-lg font-bold text-gray-900">저장한 레시피</h3>
                  {savedRecipes.length > 0 && (
                    <span className="text-sm text-gray-500">
                      총 {savedRecipes.length}개
                    </span>
                  )}
                </div>
                {!isAuthenticated ? (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 text-center">
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShieldCheck className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">로그인이 필요합니다</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      레시피를 저장하려면 로그인해주세요.
                    </p>
                    <button
                      onClick={() => setShowAuthModal(true)}
                      className="px-6 py-2 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-all"
                    >
                      로그인하기
                    </button>
                  </div>
                ) : savedRecipes.length > 0 ? (
                  <RecipeList
                    recipes={savedRecipes}
                    onSelectRecipe={setSelectedRecipe}
                    onDeleteRecipe={handleDeleteRecipe}
                  />
                ) : (
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
                    <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">저장한 레시피가 없습니다.</p>
                    <button
                      onClick={() => setRecipeSubTab('search')}
                      className="px-6 py-2 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-all"
                    >
                      레시피 둘러보기
                    </button>
                  </div>
                )}
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
      <LoadingModal isOpen={generatingRecipe} message="AI가 레시피를 찾고 있습니다..." />
    </div>
  );
}

export default App;
