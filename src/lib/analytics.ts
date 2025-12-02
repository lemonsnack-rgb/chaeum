import ReactGA from 'react-ga4';

// GA4 초기화 여부 플래그
let isInitialized = false;

/**
 * Google Analytics 4 초기화
 * 환경 변수에서 측정 ID를 가져와 GA4를 초기화합니다.
 */
export function initGA() {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

  if (!measurementId) {
    console.warn('⚠️ GA4 Measurement ID가 설정되지 않았습니다. 분석 기능이 비활성화됩니다.');
    return;
  }

  if (isInitialized) {
    console.log('✅ GA4 이미 초기화됨');
    return;
  }

  try {
    ReactGA.initialize(measurementId, {
      gtagOptions: {
        send_page_view: false, // 수동으로 페이지뷰 추적
      },
    });
    isInitialized = true;
    console.log('✅ GA4 초기화 완료:', measurementId);
  } catch (error) {
    console.error('❌ GA4 초기화 실패:', error);
  }
}

/**
 * 페이지뷰 추적
 * @param path - 페이지 경로 (예: /recipe/123)
 * @param title - 페이지 제목
 */
export function trackPageView(path: string, title?: string) {
  if (!isInitialized) {
    console.warn('GA4가 초기화되지 않았습니다.');
    return;
  }

  try {
    ReactGA.send({
      hitType: 'pageview',
      page: path,
      title: title || document.title,
    });
    console.log('📊 GA4 페이지뷰:', path, title);
  } catch (error) {
    console.error('❌ GA4 페이지뷰 추적 실패:', error);
  }
}

/**
 * 커스텀 이벤트 추적
 * @param category - 이벤트 카테고리 (예: 'Recipe', 'Search', 'User')
 * @param action - 이벤트 액션 (예: 'view', 'search', 'save')
 * @param label - 이벤트 라벨 (선택사항)
 * @param value - 이벤트 값 (선택사항, 숫자)
 */
export function trackEvent(
  category: string,
  action: string,
  label?: string,
  value?: number
) {
  if (!isInitialized) {
    console.warn('GA4가 초기화되지 않았습니다.');
    return;
  }

  try {
    ReactGA.event({
      category,
      action,
      label,
      value,
    });
    console.log('📊 GA4 이벤트:', { category, action, label, value });
  } catch (error) {
    console.error('❌ GA4 이벤트 추적 실패:', error);
  }
}

// ===== 레시피 관련 이벤트 =====

/**
 * 레시피 조회 이벤트
 */
export function trackRecipeView(recipeId: string, recipeTitle: string) {
  trackEvent('Recipe', 'view', recipeTitle, undefined);

  // GA4 권장 이벤트 형식
  ReactGA.event('view_item', {
    item_id: recipeId,
    item_name: recipeTitle,
    item_category: 'Recipe',
  });
}

/**
 * 레시피 검색 이벤트
 */
export function trackRecipeSearch(searchQuery: string, resultCount: number) {
  trackEvent('Search', 'recipe_search', searchQuery, resultCount);

  // GA4 권장 이벤트 형식
  ReactGA.event('search', {
    search_term: searchQuery,
    result_count: resultCount,
  });
}

/**
 * 레시피 저장 이벤트
 */
export function trackRecipeSave(recipeId: string, recipeTitle: string) {
  trackEvent('Recipe', 'save', recipeTitle, undefined);

  // GA4 권장 이벤트 형식
  ReactGA.event('add_to_favorites', {
    item_id: recipeId,
    item_name: recipeTitle,
  });
}

/**
 * 레시피 저장 취소 이벤트
 */
export function trackRecipeUnsave(recipeId: string, recipeTitle: string) {
  trackEvent('Recipe', 'unsave', recipeTitle, undefined);

  // GA4 권장 이벤트 형식
  ReactGA.event('remove_from_favorites', {
    item_id: recipeId,
    item_name: recipeTitle,
  });
}

// ===== 재료 관련 이벤트 =====

/**
 * 재료 추가 이벤트
 */
export function trackIngredientAdd(ingredientName: string, category?: string) {
  trackEvent('Ingredient', 'add', ingredientName, undefined);

  ReactGA.event('add_ingredient', {
    ingredient_name: ingredientName,
    category: category || 'unknown',
  });
}

/**
 * 재료 삭제 이벤트
 */
export function trackIngredientRemove(ingredientName: string) {
  trackEvent('Ingredient', 'remove', ingredientName, undefined);

  ReactGA.event('remove_ingredient', {
    ingredient_name: ingredientName,
  });
}

// ===== 사용자 행동 이벤트 =====

/**
 * 로그인 이벤트
 */
export function trackLogin(method: string = 'email') {
  trackEvent('User', 'login', method, undefined);

  ReactGA.event('login', {
    method: method,
  });
}

/**
 * 회원가입 이벤트
 */
export function trackSignup(method: string = 'email') {
  trackEvent('User', 'signup', method, undefined);

  ReactGA.event('sign_up', {
    method: method,
  });
}

/**
 * 쿠팡 파트너스 클릭 이벤트
 */
export function trackCoupangClick(ingredientName: string, linkType: 'search' | 'banner') {
  trackEvent('Affiliate', 'coupang_click', `${linkType}:${ingredientName}`, undefined);

  ReactGA.event('select_promotion', {
    promotion_name: 'Coupang Partners',
    creative_name: linkType,
    creative_slot: ingredientName,
  });
}

/**
 * 댓글 작성 이벤트
 */
export function trackCommentPost(recipeId: string) {
  trackEvent('Engagement', 'comment_post', recipeId, undefined);

  ReactGA.event('comment', {
    content_type: 'recipe',
    item_id: recipeId,
  });
}

/**
 * 공유 버튼 클릭 이벤트
 */
export function trackShare(recipeId: string, method: string) {
  trackEvent('Engagement', 'share', `${method}:${recipeId}`, undefined);

  ReactGA.event('share', {
    method: method,
    content_type: 'recipe',
    item_id: recipeId,
  });
}
