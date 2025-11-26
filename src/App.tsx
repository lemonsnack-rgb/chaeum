import { useState, useEffect } from 'react';
import { RefrigeratorIcon, Search, ShieldCheck, ChefHat, User, Loader2, LogOut, AlertCircle, Utensils, Clock } from 'lucide-react';
import { useIngredients } from './hooks/useIngredients';
import { CameraButton } from './components/CameraButton';
import { IngredientInput } from './components/IngredientInput';
import { IngredientList } from './components/IngredientList';
import { RecipeList } from './components/RecipeList';
import { RecipeDetail } from './components/RecipeDetail';
import { RecipeSearchWithInfiniteScroll } from './components/RecipeSearchWithInfiniteScroll';
import { AuthModal } from './components/AuthModal';
import { RecipeOptionsModal } from './components/RecipeOptionsModal';
import { LoadingModal } from './components/LoadingModal';
import { AllergyManager } from './components/AllergyManager';
import { Footer } from './components/Footer';
import { AboutModal } from './components/AboutModal';
import { ServiceBanner } from './components/ServiceBanner';
import { generateBatchRecipes, saveUserRecipe, unsaveUserRecipe, Recipe, getRecipeById } from './lib/recipeService';
import { signOut, getCurrentUser, getMyBookmarkedRecipes } from './lib/authService';
import { supabase } from './lib/supabase';
import { getRecentRecipeView } from './lib/recipeViewService';
import {
  getUserAllergies,
  addAllergy,
  removeAllergy,
  getUserDietaryPreferences,
  addDietaryPreference,
  removeDietaryPreference,
  ensureUserProfile,
  getUserProfile
} from './lib/profileService';

type Tab = 'fridge' | 'search' | 'my-recipes' | 'profile';
type MyRecipesSubTab = 'recommended' | 'saved';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('fridge');
  const [myRecipesSubTab, setMyRecipesSubTab] = useState<MyRecipesSubTab>('recommended');
  const [recommendedRecipes, setRecommendedRecipes] = useState<Recipe[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [generatingRecipe, setGeneratingRecipe] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userNickname, setUserNickname] = useState<string | null>(null);
  const [showRecipeOptions, setShowRecipeOptions] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
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
    if (activeTab === 'my-recipes') {
      loadRecipesBySubTab();
    }
  }, [activeTab, myRecipesSubTab]);

  async function loadRecipesBySubTab() {
    if (myRecipesSubTab === 'saved') {
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

  // 프로필 탭 활성화 시 최신 데이터 로드
  useEffect(() => {
    if (activeTab === 'profile' && isAuthenticated) {
      loadUserProfile();
    }
  }, [activeTab, isAuthenticated]);

  async function checkAuth() {
    if (!supabase) return;
    const user = await getCurrentUser();
    setIsAuthenticated(!!user);
    setUserEmail(user?.email || null);

    if (user) {
      await loadUserProfile();
    }
  }

  async function loadUserProfile() {
    try {
      await ensureUserProfile();
      const profile = await getUserProfile();
      const userAllergies = await getUserAllergies();
      const userPrefs = await getUserDietaryPreferences();
      setUserNickname(profile?.nickname || null);
      setAllergies(userAllergies);
      setDietaryPreferences(userPrefs);
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  }


  async function handleQuickSave(recipe: Recipe) {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      throw new Error('로그인이 필요합니다.');
    }
    await saveUserRecipe(recipe);
  }

  async function handleUnsaveRecipe(recipeId: string) {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      throw new Error('로그인이 필요합니다.');
    }
    await unsaveUserRecipe(recipeId);
    // 저장된 레시피 목록에서 즉시 제거 (더 나은 UX)
    setSavedRecipes((prev: Recipe[]) => prev.filter((r: Recipe) => r.id !== recipeId));
  }

  async function handleSignOut() {
    try {
      await signOut();
      setIsAuthenticated(false);
      setUserEmail(null);
      setAllergies([]);
      setDietaryPreferences([]);
      setActiveTab('fridge');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }

  async function handleAddAllergy(allergyName: string) {
    console.log('[App] handleAddAllergy 호출됨:', allergyName);
    try {
      console.log('[App] addAllergy 호출 전');
      const updatedAllergies = await addAllergy(allergyName);
      console.log('[App] addAllergy 성공, 반환된 allergies:', updatedAllergies);
      // DB 재조회 없이 직접 상태 업데이트
      setAllergies(updatedAllergies);
      console.log('[App] 상태 업데이트 완료');
    } catch (error: any) {
      console.error('[App] Failed to add allergy:', error);
      throw error; // AllergyManager에서 에러 메시지 표시
    }
  }

  async function handleRemoveAllergy(allergyName: string) {
    try {
      const updatedAllergies = await removeAllergy(allergyName);
      setAllergies(updatedAllergies);
    } catch (error: any) {
      console.error('Failed to remove allergy:', error);
      throw error;
    }
  }

  async function handleAddDietaryPreference(prefName: string) {
    try {
      const updatedPrefs = await addDietaryPreference(prefName);
      setDietaryPreferences(updatedPrefs);
    } catch (error: any) {
      console.error('Failed to add dietary preference:', error);
      throw error;
    }
  }

  async function handleRemoveDietaryPreference(prefName: string) {
    try {
      const updatedPrefs = await removeDietaryPreference(prefName);
      setDietaryPreferences(updatedPrefs);
    } catch (error: any) {
      console.error('Failed to remove dietary preference:', error);
      throw error;
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

      // 최소 2초간 로딩 모달 표시 (사용자 경험 개선)
      const [generatedRecipes] = await Promise.all([
        generateBatchRecipes(ingredientNames, servings, theme),
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);

      setRecommendedRecipes(generatedRecipes);
      setActiveTab('my-recipes');
      setMyRecipesSubTab('recommended');
    } catch (error) {
      console.error('Failed to generate recipe:', error);
      alert('레시피 찾는 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setGeneratingRecipe(false);
    }
  }

  async function handleViewRecentRecipe() {
    try {
      const recentRecipeId = await getRecentRecipeView();
      if (!recentRecipeId) {
        if (window.confirm('최근 본 레시피가 없습니다.\n레시피 검색 페이지로 이동하시겠습니까?')) {
          setActiveTab('search');
        }
        return;
      }

      const recipe = await getRecipeById(recentRecipeId);
      if (recipe) {
        setSelectedRecipe(recipe);
      } else {
        alert('레시피를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('Failed to load recent recipe:', error);
      alert('레시피를 불러오는 중 오류가 발생했습니다.');
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
        onUnsave={handleUnsaveRecipe}
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
          <button
            onClick={() => setActiveTab('fridge')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <ChefHat className="w-7 h-7 text-primary" />
            <h1 className="text-xl font-bold text-gray-900">
              <span className="text-primary">오</span>늘의<span className="text-primary">냉</span>장고
            </h1>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleViewRecentRecipe}
              className="flex items-center gap-1 px-3 py-1 bg-orange-100 hover:bg-orange-200 rounded-full transition-colors"
            >
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-primary">
                최근 본 레시피
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {activeTab === 'fridge' && (
          <>
            {/* 서비스 소개 배너 */}
            <ServiceBanner onShowMore={() => setShowAboutModal(true)} />

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
                      레시피 추천 중...
                    </>
                  ) : (
                    <>
                      <ChefHat className="w-6 h-6" />
                      레시피 추천 받기
                    </>
                  )}
                </button>
              </section>
            )}
          </>
        )}

        {activeTab === 'search' && (
          <RecipeSearchWithInfiniteScroll
            onRecipeClick={setSelectedRecipe}
            userIngredients={ingredients.map((ing) => ing.name)}
          />
        )}

        {activeTab === 'my-recipes' && (
          <>
            {/* 서브탭 네비게이션 */}
            <section className="mb-6">
              <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setMyRecipesSubTab('recommended')}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
                    myRecipesSubTab === 'recommended'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  AI 추천
                  {recommendedRecipes.length > 0 && (
                    <span className="ml-1 text-xs bg-primary text-white rounded-full px-2 py-0.5">
                      {recommendedRecipes.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setMyRecipesSubTab('saved')}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
                    myRecipesSubTab === 'saved'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  저장 레시피
                </button>
              </div>
            </section>

            {/* AI 추천 레시피 탭 */}
            {myRecipesSubTab === 'recommended' && (
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

            {/* 저장한 레시피 탭 */}
            {myRecipesSubTab === 'saved' && (
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
                  />
                ) : (
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
                    <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">저장한 레시피가 없습니다.</p>
                    <button
                      onClick={() => setActiveTab('search')}
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
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            {isAuthenticated ? (
              <div>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 text-center mb-1">내 정보</h3>
                <p className="text-xs text-gray-600 text-center mb-2">
                  {userEmail}
                </p>
                {userNickname && (
                  <div className="text-sm text-center mb-6">
                    <p className="text-gray-700 font-medium">
                      환영합니다.
                    </p>
                    <p className="text-gray-700 font-medium">
                      닉네임: <span className="text-primary font-semibold">{userNickname}</span>님
                    </p>
                  </div>
                )}

                <div className="space-y-6">
                  {/* 저장된 재료 정보 */}
                  <div className="bg-orange-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">저장된 재료</span>
                      <span className="text-lg font-bold text-primary">{ingredients.length}개</span>
                    </div>
                  </div>

                  {/* 알레르기 정보 */}
                  <AllergyManager
                    items={allergies}
                    onAdd={handleAddAllergy}
                    onRemove={handleRemoveAllergy}
                    title="알레르기 정보"
                    placeholder="예: 땅콩, 우유, 계란"
                    commonItems={['땅콩', '갑각류', '우유', '계란', '밀가루', '대두', '생선', '견과류']}
                    icon={<AlertCircle className="w-4 h-4 text-red-500" />}
                  />

                  {/* 편식 정보 */}
                  <AllergyManager
                    items={dietaryPreferences}
                    onAdd={handleAddDietaryPreference}
                    onRemove={handleRemoveDietaryPreference}
                    title="편식 정보"
                    placeholder="예: 파, 고수, 셀러리"
                    commonItems={['파', '고수', '셀러리', '피망', '가지', '버섯']}
                    icon={<Utensils className="w-4 h-4 text-amber-500" />}
                  />

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
        <div className="max-w-md mx-auto px-4 py-2.5">
          <div className="flex items-center justify-around">
            <button
              onClick={() => setActiveTab('fridge')}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-2 transition-colors ${
                activeTab === 'fridge' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <RefrigeratorIcon className="w-5 h-5" />
              <span className="text-xs font-medium">냉장고</span>
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-2 transition-colors ${
                activeTab === 'search' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Search className="w-5 h-5" />
              <span className="text-xs font-medium">레시피 검색</span>
            </button>
            <button
              onClick={() => setActiveTab('my-recipes')}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-2 transition-colors ${
                activeTab === 'my-recipes' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <ChefHat className="w-5 h-5" />
              <span className="text-xs font-medium">내 레시피</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-2 transition-colors ${
                activeTab === 'profile' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="text-xs font-medium">내 정보</span>
            </button>
          </div>
        </div>
      </nav>

      {/* 푸터 */}
      <Footer onShowAbout={() => setShowAboutModal(true)} />

      {/* 모달들 */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showRecipeOptions && (
        <RecipeOptionsModal
          onClose={() => setShowRecipeOptions(false)}
          onGenerate={handleGenerateWithOptions}
        />
      )}
      {showAboutModal && (
        <AboutModal
          isOpen={showAboutModal}
          onClose={() => setShowAboutModal(false)}
        />
      )}
      <LoadingModal isOpen={generatingRecipe} message="AI가 레시피를 찾고 있습니다..." />
    </div>
  );
}

export default App;
