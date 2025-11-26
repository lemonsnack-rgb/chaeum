import { Clock, Users, ChefHat, ArrowLeft, AlertCircle, ExternalLink, Edit, Save, Heart } from 'lucide-react';
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
  isReadOnly?: boolean;
  isAuthenticated?: boolean;
  onShowAuthModal?: () => void;
}

export function RecipeDetail({ recipe, onBack, userIngredients = [], onSaveUserRecipe, onQuickSave, isReadOnly = false, isAuthenticated = false, onShowAuthModal }: RecipeDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedRecipe, setEditedRecipe] = useState(recipe);
  const [safetyConsent, setSafetyConsent] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // 레시피 조회 기록 추적
  useEffect(() => {
    if (recipe.id) {
      trackRecipeView(recipe.id);
    }
  }, [recipe.id]);

  // 북마크 상태 확인
  useEffect(() => {
    async function checkBookmarkStatus() {
      if (recipe.id && isAuthenticated) {
        const bookmarked = await isRecipeBookmarked(recipe.id);
        setIsBookmarked(bookmarked);
      } else {
        setIsBookmarked(false);
      }
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

    // 이미 저장된 레시피인 경우
    if (isBookmarked) {
      alert('이미 저장된 레시피입니다.');
      return;
    }

    if (!onQuickSave) return;

    try {
      setIsSaving(true);
      await onQuickSave(recipe);
      setIsBookmarked(true);
      alert('레시피가 내 레시피에 저장되었습니다!');
    } catch (error: any) {
      alert(error.message || '저장 중 오류가 발생했습니다.');
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
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white pb-8">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <ChefHat className="w-7 h-7 text-primary" />
            <h1 className="text-xl font-bold text-gray-900">레시피 상세</h1>
          </div>
          <div className="flex gap-2">
            {isReadOnly && onQuickSave && (
              <button
                onClick={handleQuickSave}
                disabled={isSaving}
                className={`flex items-center gap-1 px-4 py-2 rounded-full transition-colors disabled:opacity-50 ${
                  isBookmarked
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-white text-red-500 border-2 border-red-500 hover:bg-red-50'
                }`}
              >
                <Heart className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                <span className="text-sm font-semibold">{isBookmarked ? '저장됨' : '내 레시피로 저장'}</span>
              </button>
            )}
            {!isReadOnly && onQuickSave && !isEditing && (
              <button
                onClick={handleQuickSave}
                disabled={isSaving}
                className={`flex items-center gap-1 px-4 py-2 rounded-full transition-colors disabled:opacity-50 ${
                  isBookmarked
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-white text-red-500 border-2 border-red-500 hover:bg-red-50'
                }`}
              >
                <Heart className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                <span className="text-sm font-semibold">{isBookmarked ? '저장됨' : '저장'}</span>
              </button>
            )}
            {!isReadOnly && onSaveUserRecipe && (
              <button
                onClick={handleSaveClick}
                className="p-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors"
              >
                {isEditing ? <Save className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
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
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-5">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {displayRecipe.nutrition.calories}
                    </div>
                    <div className="text-sm text-gray-600">칼로리 (kcal)</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-1">
                      {displayRecipe.nutrition.protein}g
                    </div>
                    <div className="text-sm text-gray-600">단백질</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-red-600 mb-1">
                      {displayRecipe.nutrition.fat}g
                    </div>
                    <div className="text-sm text-gray-600">지방</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-green-600 mb-1">
                      {displayRecipe.nutrition.carbohydrates}g
                    </div>
                    <div className="text-sm text-gray-600">탄수화물</div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4">
                  <div className="text-sm text-gray-600 mb-2 text-center">영양소 비율</div>
                  <div className="flex h-4 rounded-full overflow-hidden">
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
                  <div className="flex justify-between mt-2 text-xs text-gray-600">
                    <span>단백질 {proteinPercent.toFixed(0)}%</span>
                    <span>지방 {fatPercent.toFixed(0)}%</span>
                    <span>탄수화물 {carbPercent.toFixed(0)}%</span>
                  </div>
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
      </main>

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
