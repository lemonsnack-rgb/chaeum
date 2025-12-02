import { Clock, Users, ChefHat, AlertCircle, ExternalLink, Heart, Search } from 'lucide-react';
import { Recipe } from '../lib/recipeService';
import { useState, useEffect } from 'react';
import { trackRecipeView } from '../lib/recipeViewService';
import { isRecipeBookmarked } from '../lib/authService';
import { CommentSection } from './CommentSection';

interface RecipeDetailProps {
  recipe: Recipe;
  onBack: () => void;
  userIngredients?: string[];
  similarRecipes?: Recipe[];
  companionRecipes?: Recipe[];
  balancedRecipes?: Recipe[];
  onSaveUserRecipe?: (recipe: Recipe) => Promise<void>;
  onQuickSave?: (recipe: Recipe) => Promise<void>;
  onUnsave?: (recipeId: string) => Promise<void>;
  isReadOnly?: boolean;
  isAuthenticated?: boolean;
  onShowAuthModal?: () => void;
  onSearchClick?: () => void;
  onRecipeClick?: (recipeId: string) => void;
}

export function RecipeDetail({ recipe, onBack, userIngredients = [], similarRecipes = [], companionRecipes = [], balancedRecipes = [], onSaveUserRecipe, onQuickSave, onUnsave, isReadOnly = false, isAuthenticated = false, onShowAuthModal, onSearchClick, onRecipeClick }: RecipeDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedRecipe, setEditedRecipe] = useState(recipe);
  const [safetyConsent, setSafetyConsent] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(true);

  // 레시피 조회 기록 추적
  useEffect(() => {
    if (recipe.id) {
      trackRecipeView(recipe.id);
    }
  }, [recipe.id]);

  // 북마크 상태 확인
  useEffect(() => {
    async function checkBookmarkStatus() {
      setIsBookmarkLoading(true);
      if (recipe.id && isAuthenticated) {
        const bookmarked = await isRecipeBookmarked(recipe.id);
        setIsBookmarked(bookmarked);
      } else {
        setIsBookmarked(false);
      }
      setIsBookmarkLoading(false);
    }
    checkBookmarkStatus();
  }, [recipe.id, isAuthenticated]);

  const totalNutrition = recipe.nutrition.calories || 0;
  const proteinPercent = totalNutrition > 0 ? (recipe.nutrition.protein * 4 / totalNutrition * 100) : 0;
  const fatPercent = totalNutrition > 0 ? (recipe.nutrition.fat * 9 / totalNutrition * 100) : 0;
  const carbPercent = totalNutrition > 0 ? (recipe.nutrition.carbohydrates * 4 / totalNutrition * 100) : 0;

  const userIngredientsLower = userIngredients.map(i => i.toLowerCase());
  const isMissingIngredient = (ingredientName: string) => {
    return !userIngredientsLower.includes(ingredientName.toLowerCase());
  };

  const handleQuickSave = async () => {
    if (!isAuthenticated) {
      if (onShowAuthModal) {
        onShowAuthModal();
      } else {
        alert('이 기능은 회원만 이용 가능합니다. 이메일로 가입해주세요!');
      }
      return;
    }

    try {
      setIsSaving(true);

      // 이미 저장된 레시피인 경우 저장 취소
      if (isBookmarked) {
        if (onUnsave && window.confirm('저장을 취소하시겠습니까?')) {
          await onUnsave(recipe.id);
          setIsBookmarked(false);
          alert('저장이 취소되었습니다.');
          onBack(); // 목록으로 돌아가기
        }
      } else {
        // 저장되지 않은 레시피인 경우 저장
        if (onQuickSave) {
          await onQuickSave(recipe);
          setIsBookmarked(true);
          alert('레시피가 내 레시피에 저장되었습니다!');
        }
      }
    } catch (error: any) {
      alert(error.message || '처리 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveClick = () => {
    if (!isAuthenticated) {
      if (onShowAuthModal) {
        onShowAuthModal();
      } else {
        alert('이 기능은 회원만 이용 가능합니다. 이메일로 가입해주세요!');
      }
      return;
    }

    if (isEditing) {
      setShowConsentModal(true);
    } else {
      setIsEditing(true);
    }
  };

  const handleConfirmSave = async () => {
    if (!safetyConsent || !onSaveUserRecipe) return;

    try {
      setIsSaving(true);
      await onSaveUserRecipe(editedRecipe);
      setShowConsentModal(false);
      setIsEditing(false);
      alert('\ub808\uc2dc\ud53c\uac00 \uc800\uc7a5\ub418\uc5c8\uc2b5\ub2c8\ub2e4!');
    } catch (error: any) {
      alert(error.message || '\uc800\uc7a5 \uc911 \uc624\ub958\uac00 \ubc1c\uc0dd\ud588\uc2b5\ub2c8\ub2e4.');
    } finally {
      setIsSaving(false);
    }
  };

  const displayRecipe = isEditing ? editedRecipe : recipe;

  return (
    <div className="max-w-md mx-auto px-4 py-6 pb-20">
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden mb-6">
          {/* 레시피 이미지 */}
          {displayRecipe.image_url && (
            <div className="relative h-64 w-full overflow-hidden">
              <img
                src={displayRecipe.image_url}
                alt={`${displayRecipe.title} 요리 사진`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {/* 사진작가 크레딧 */}
              {displayRecipe.image_photographer && (
                <div className="absolute bottom-0 right-0 bg-black/60 text-white text-xs px-2 py-1 rounded-tl-lg">
                  Photo by {displayRecipe.image_photographer}
                </div>
              )}
              {/* 그라데이션 오버레이 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
            </div>
          )}

          <div className="bg-gradient-to-br from-primary to-primary-dark p-6">
            {isEditing ? (
              <input
                type="text"
                value={editedRecipe.title}
                onChange={(e) => setEditedRecipe({...editedRecipe, title: e.target.value})}
                className="text-2xl font-bold text-gray-900 mb-3 w-full px-3 py-2 rounded-lg"
              />
            ) : (
              <h2 className="text-2xl font-bold text-white mb-3">{displayRecipe.title}</h2>
            )}
            <div className="flex flex-wrap gap-2">
              {displayRecipe.theme_tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-white/20 text-white text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* 요리 소개 */}
            {displayRecipe.description && (
              <section className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-2 h-6 bg-primary rounded-full"></span>
                  요리 소개
                </h3>
                <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-primary rounded-xl">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {displayRecipe.description}
                  </p>
                </div>
              </section>
            )}

            <div className="flex gap-4 mb-6">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-sm">{displayRecipe.cooking_time}분</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-sm">{displayRecipe.servings}인분</span>
              </div>
            </div>

            {displayRecipe.deep_info.substitutions && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-900 mb-2">대체 재료 안내</h4>
                    <p className="text-sm text-yellow-800 leading-relaxed whitespace-pre-line">
                      {displayRecipe.deep_info.substitutions}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <section className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-6 bg-primary rounded-full"></span>
                재료
              </h3>

              {(() => {
                const mainIngredients = displayRecipe.ingredients_detail.filter(ing => ing.main_or_sub === '주재료');
                const subIngredients = displayRecipe.ingredients_detail.filter(ing => ing.main_or_sub === '부재료');
                const uncategorized = displayRecipe.ingredients_detail.filter(ing => !ing.main_or_sub);

                return (
                  <>
                    {mainIngredients.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 px-1">주재료</h4>
                        <div className="space-y-2">
                          {mainIngredients.map((ingredient, index) => {
                            const isMissing = isMissingIngredient(ingredient.name);
                            return (
                              <div
                                key={index}
                                className="flex justify-between items-center p-3 bg-orange-50 border border-orange-100 rounded-xl"
                              >
                                <div className="flex items-center gap-2 flex-1">
                                  <span className={`font-medium ${isMissing ? 'text-red-600' : 'text-gray-800'}`}>
                                    {ingredient.name}
                                  </span>
                                  {ingredient.category && (
                                    <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">
                                      {ingredient.category}
                                    </span>
                                  )}
                                  {isMissing && (
                                    <a
                                      href={`https://www.coupang.com/np/search?q=${encodeURIComponent(ingredient.name)}&channel=user&component=&eventCategory=SRP&trcid=AF8562976&sorter=scoreDesc`}
                                      target="_blank"
                                      rel="noopener noreferrer nofollow"
                                      className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      구매
                                    </a>
                                  )}
                                </div>
                                <span className="text-gray-700 font-medium">{ingredient.amount}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {subIngredients.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 px-1">부재료 (양념/소스)</h4>
                        <div className="space-y-2">
                          {subIngredients.map((ingredient, index) => {
                            const isMissing = isMissingIngredient(ingredient.name);
                            return (
                              <div
                                key={index}
                                className="flex justify-between items-center p-3 bg-gray-50 rounded-xl"
                              >
                                <div className="flex items-center gap-2 flex-1">
                                  <span className={`font-medium ${isMissing ? 'text-red-600' : 'text-gray-600'}`}>
                                    {ingredient.name}
                                  </span>
                                  {ingredient.category && (
                                    <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">
                                      {ingredient.category}
                                    </span>
                                  )}
                                  {isMissing && (
                                    <a
                                      href={`https://www.coupang.com/np/search?q=${encodeURIComponent(ingredient.name)}&channel=user&component=&eventCategory=SRP&trcid=AF8562976&sorter=scoreDesc`}
                                      target="_blank"
                                      rel="noopener noreferrer nofollow"
                                      className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      구매
                                    </a>
                                  )}
                                </div>
                                <span className="text-gray-600">{ingredient.amount}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {uncategorized.length > 0 && (
                      <div>
                        <div className="space-y-2">
                          {uncategorized.map((ingredient, index) => {
                            const isMissing = isMissingIngredient(ingredient.name);
                            return (
                              <div
                                key={index}
                                className="flex justify-between items-center p-3 bg-gray-50 rounded-xl"
                              >
                                <div className="flex items-center gap-2 flex-1">
                                  <span className={`font-medium ${isMissing ? 'text-red-600' : 'text-gray-800'}`}>
                                    {ingredient.name}
                                  </span>
                                  {isMissing && (
                                    <a
                                      href={`https://www.coupang.com/np/search?q=${encodeURIComponent(ingredient.name)}&channel=user&component=&eventCategory=SRP&trcid=AF8562976&sorter=scoreDesc`}
                                      target="_blank"
                                      rel="noopener noreferrer nofollow"
                                      className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      구매
                                    </a>
                                  )}
                                </div>
                                <span className="text-gray-600">{ingredient.amount}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-6 bg-primary rounded-full"></span>
                조리 순서
              </h3>
              <div className="space-y-4">
                {displayRecipe.instructions.map((step, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-gray-700 leading-relaxed pt-1">{step}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 쿠팡 파트너스 배너 */}
            <section className="mb-6">
              <div className="flex justify-center">
                <a
                  href="https://link.coupang.com/a/c9Wiys"
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="block"
                >
                  <img
                    src="https://ads-partners.coupang.com/banners/947280?subId=&traceId=V0-301-371ae01f4226dec2-I947280&w=320&h=100"
                    alt="쿠팡에서 신선한 식재료와 조리 도구 구매하기 - 요리 재료 빠른 배송"
                    className="w-full max-w-[320px] h-auto rounded-xl shadow-sm"
                  />
                </a>
              </div>
              <p className="text-xs text-gray-400 text-center mt-2">
                이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-6 bg-primary rounded-full"></span>
                영양 정보 (1인분)
              </h3>

              {/* 칼로리 */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 shadow-md border-2 border-orange-200 mb-5">
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary">
                    {displayRecipe.nutrition.calories} <span className="text-3xl">kcal</span>
                  </div>
                </div>
              </div>

              {/* 영양소 */}
              <div className="bg-white rounded-2xl p-5 shadow-md border-2 border-gray-200 mb-5">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {displayRecipe.nutrition.protein}g
                    </div>
                    <div className="text-xs text-gray-600">단백질</div>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-red-600 mb-1">
                      {displayRecipe.nutrition.fat}g
                    </div>
                    <div className="text-xs text-gray-600">지방</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {displayRecipe.nutrition.carbohydrates}g
                    </div>
                    <div className="text-xs text-gray-600">탄수화물</div>
                  </div>
                </div>
              </div>

              {/* 영양소 비율 */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-5 shadow-md border-2 border-purple-200">
                <div className="text-base font-bold text-gray-800 mb-4 text-center">영양소 비율</div>
                <div className="flex h-5 rounded-full overflow-hidden mb-3 shadow-inner">
                  <div
                    className="bg-blue-500"
                    style={{ width: `${proteinPercent}%` }}
                    title={`단백질 ${proteinPercent.toFixed(1)}%`}
                  ></div>
                  <div
                    className="bg-red-500"
                    style={{ width: `${fatPercent}%` }}
                    title={`지방 ${fatPercent.toFixed(1)}%`}
                  ></div>
                  <div
                    className="bg-green-500"
                    style={{ width: `${carbPercent}%` }}
                    title={`탄수화물 ${carbPercent.toFixed(1)}%`}
                  ></div>
                </div>
                <div className="flex justify-between text-sm font-medium text-gray-700">
                  <span>단백질 {proteinPercent.toFixed(0)}%</span>
                  <span>지방 {fatPercent.toFixed(0)}%</span>
                  <span>탄수화물 {carbPercent.toFixed(0)}%</span>
                </div>
              </div>
            </section>

            {displayRecipe.deep_info.tips && displayRecipe.deep_info.tips.length > 0 && (
              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-2 h-6 bg-primary rounded-full"></span>
                  조리 팁
                </h3>
                <div className="space-y-2">
                  {displayRecipe.deep_info.tips.map((tip, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <span className="text-primary mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

      {/* 댓글 섹션 */}
      {recipe.id && (
        <CommentSection
          recipeId={recipe.id}
          isAuthenticated={isAuthenticated}
          onLoginRequired={() => onShowAuthModal?.()}
        />
      )}

      {/* ⭐ 관련 레시피 추천 섹션 (3개 카테고리, SEO 내부 링크 전략) */}
      {(similarRecipes.length > 0 || companionRecipes.length > 0 || balancedRecipes.length > 0) && (
        <div className="max-w-md mx-auto px-4 py-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-primary" />
            추천 레시피
          </h3>

          {/* 1️⃣ 재료가 비슷한 요리 (파란색 테마) */}
          {similarRecipes.length > 0 && (
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 border-2 border-blue-200 shadow-md mb-4">
              <h4 className="text-md font-bold text-blue-800 mb-2 flex items-center gap-2">
                📌 재료가 비슷한 요리
              </h4>
              <p className="text-xs text-blue-700 mb-4">같은 재료를 활용한 다양한 레시피</p>

              <div className="space-y-3">
                {similarRecipes.map((recipeItem) => (
                  <div
                    key={recipeItem.id}
                    onClick={() => {
                      if (onRecipeClick) {
                        onRecipeClick(recipeItem.id);
                      } else {
                        window.location.href = `/recipe/${recipeItem.id}`;
                      }
                    }}
                    className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border border-blue-200 hover:border-blue-400 flex items-center gap-3"
                  >
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-900 text-sm mb-2">
                        {recipeItem.title}
                      </h5>
                      <p className="text-xs text-gray-500">
                        {recipeItem.main_ingredients?.slice(0, 3).join(', ')}
                      </p>
                    </div>
                    <div className="text-right text-xs text-gray-600 flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{recipeItem.cooking_time || 30}분</span>
                      </div>
                      <span className="font-medium text-primary">
                        {recipeItem.nutrition?.calories || 0}kcal
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2️⃣ 같이 먹으면 좋은 짝꿍 요리 (초록색 테마) */}
          {companionRecipes.length > 0 && (
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-5 border-2 border-green-200 shadow-md mb-4">
              <h4 className="text-md font-bold text-green-800 mb-2 flex items-center gap-2">
                💕 같이 먹으면 좋은 짝꿍 요리
              </h4>
              <p className="text-xs text-green-700 mb-4">곁들이면 맛과 영양이 배가되는 조합</p>

              <div className="space-y-3">
                {companionRecipes.map((recipeItem) => (
                  <div
                    key={recipeItem.id}
                    onClick={() => {
                      if (onRecipeClick) {
                        onRecipeClick(recipeItem.id);
                      } else {
                        window.location.href = `/recipe/${recipeItem.id}`;
                      }
                    }}
                    className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border border-green-200 hover:border-green-400 flex items-center gap-3"
                  >
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-900 text-sm mb-2">
                        {recipeItem.title}
                      </h5>
                      <p className="text-xs text-gray-500">
                        {recipeItem.main_ingredients?.slice(0, 3).join(', ')}
                      </p>
                    </div>
                    <div className="text-right text-xs text-gray-600 flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{recipeItem.cooking_time || 30}분</span>
                      </div>
                      <span className="font-medium text-primary">
                        {recipeItem.nutrition?.calories || 0}kcal
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3️⃣ 영양 균형을 맞춘 요리 (보라색 테마) */}
          {balancedRecipes.length > 0 && (
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-5 border-2 border-purple-200 shadow-md mb-4">
              <h4 className="text-md font-bold text-purple-800 mb-2 flex items-center gap-2">
                ⚖️ 영양 균형을 맞춘 요리
              </h4>
              <p className="text-xs text-purple-700 mb-4">단백질·탄수화물·지방 균형이 좋은 레시피</p>

              <div className="space-y-3">
                {balancedRecipes.map((recipeItem) => (
                  <div
                    key={recipeItem.id}
                    onClick={() => {
                      if (onRecipeClick) {
                        onRecipeClick(recipeItem.id);
                      } else {
                        window.location.href = `/recipe/${recipeItem.id}`;
                      }
                    }}
                    className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border border-purple-200 hover:border-purple-400 flex items-center gap-3"
                  >
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-900 text-sm mb-2">
                        {recipeItem.title}
                      </h5>
                      <p className="text-xs text-gray-500">
                        {recipeItem.main_ingredients?.slice(0, 3).join(', ')}
                      </p>
                    </div>
                    <div className="text-right text-xs text-gray-600 flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{recipeItem.cooking_time || 30}분</span>
                      </div>
                      <span className="font-medium text-primary">
                        {recipeItem.nutrition?.calories || 0}kcal
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 더 많은 레시피 보기 버튼 */}
          {onSearchClick && (
            <button
              onClick={onSearchClick}
              className="w-full py-3 bg-gradient-to-r from-primary to-orange-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              더 많은 레시피 보기
            </button>
          )}
        </div>
      )}

      {/* Floating 저장 버튼 */}
      {onQuickSave && (
        <button
          onClick={handleQuickSave}
          disabled={isSaving}
          className={`fixed bottom-20 right-4 md:right-auto md:left-[calc(50%+220px)] flex items-center gap-2 px-6 py-3 rounded-full shadow-lg transition-all disabled:opacity-50 z-50 ${
            isBookmarked
              ? 'bg-red-500 text-white hover:bg-red-600 hover:shadow-xl'
              : 'bg-white text-red-500 border-2 border-red-500 hover:bg-red-50 hover:shadow-xl'
          }`}
          aria-label={isBookmarked ? '저장됨' : '저장'}
        >
          <Heart className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
          <span className="font-semibold">{isBookmarked ? '저장됨' : '저장'}</span>
        </button>
      )}

      {showConsentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">안전 책임 동의</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-yellow-900 leading-relaxed">
                레시피를 수정하여 저장하는 경우, 해당 내용에 대한 안전 및 법적 책임은 사용자에게 있습니다.
                부적절하거나 유해한 내용이 포함된 경우 계정이 제한될 수 있습니다.
              </p>
            </div>
            <label className="flex items-start gap-3 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={safetyConsent}
                onChange={(e) => setSafetyConsent(e.target.checked)}
                className="mt-1 w-5 h-5 text-primary"
              />
              <span className="text-sm text-gray-700">
                위 내용을 확인했으며, 레시피 내용에 대한 책임이 본인에게 있음을 동의합니다.
              </span>
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConsentModal(false);
                  setSafetyConsent(false);
                }}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                disabled={isSaving}
              >
                취소
              </button>
              <button
                onClick={handleConfirmSave}
                disabled={!safetyConsent || isSaving}
                className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? '저장 중...' : '동의 및 저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
