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
  onSaveUserRecipe?: (recipe: Recipe) => Promise<void>;
  onQuickSave?: (recipe: Recipe) => Promise<void>;
  onUnsave?: (recipeId: string) => Promise<void>;
  isReadOnly?: boolean;
  isAuthenticated?: boolean;
  onShowAuthModal?: () => void;
  onSearchClick?: () => void;
}

export function RecipeDetail({ recipe, onBack, userIngredients = [], onSaveUserRecipe, onQuickSave, onUnsave, isReadOnly = false, isAuthenticated = false, onShowAuthModal, onSearchClick }: RecipeDetailProps) {
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
                                      href={`https://www.coupang.com/np/search?q=${encodeURIComponent(ingredient.name)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
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
                                      href={`https://www.coupang.com/np/search?q=${encodeURIComponent(ingredient.name)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
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
                                      href={`https://www.coupang.com/np/search?q=${encodeURIComponent(ingredient.name)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
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
