/**
 * Unsplash API 서비스
 * 무료 고품질 이미지 검색 및 다운로드
 *
 * API 키 발급: https://unsplash.com/developers
 * 무료 플랜: 50 requests/hour, 5000 requests/month
 */

const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
const UNSPLASH_API_BASE = 'https://api.unsplash.com';

export interface UnsplashImage {
  id: string;
  url: string;
  thumbnail: string;
  description: string | null;
  alt_description: string | null;
  photographer: string;
  photographer_url: string;
  download_url: string;
}

/**
 * 레시피 제목으로 적합한 이미지 검색
 * @param recipeTitle 레시피 제목 (예: "김치찌개")
 * @param mainIngredients 주재료 배열 (예: ["김치", "돼지고기"])
 * @returns Unsplash 이미지 정보 또는 null
 */
export async function searchRecipeImage(
  recipeTitle: string,
  mainIngredients: string[] = []
): Promise<UnsplashImage | null> {
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn('⚠️ UNSPLASH_ACCESS_KEY가 설정되지 않았습니다.');
    return null;
  }

  try {
    // 검색어 생성: 영어 + 한글 조합
    const searchQueries = generateSearchQueries(recipeTitle, mainIngredients);

    // 여러 검색어로 시도
    for (const query of searchQueries) {
      console.log(`🔍 Unsplash 검색: "${query}"`);

      const response = await fetch(
        `${UNSPLASH_API_BASE}/search/photos?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`,
        {
          headers: {
            'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          },
        }
      );

      if (!response.ok) {
        console.error(`Unsplash API 오류 (${query}):`, response.status);
        continue;
      }

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const photo = data.results[0]; // 첫 번째 결과 사용

        // 다운로드 트래킹 (Unsplash API 정책)
        trackDownload(photo.links.download_location);

        return {
          id: photo.id,
          url: photo.urls.regular, // 1080px 너비
          thumbnail: photo.urls.small, // 400px 너비
          description: photo.description,
          alt_description: photo.alt_description,
          photographer: photo.user.name,
          photographer_url: photo.user.links.html,
          download_url: photo.links.download_location,
        };
      }
    }

    console.log(`❌ "${recipeTitle}"에 대한 이미지를 찾을 수 없습니다.`);
    return null;
  } catch (error) {
    console.error('Unsplash 이미지 검색 실패:', error);
    return null;
  }
}

/**
 * 검색어 생성 전략
 * 1순위: 영어 음식명
 * 2순위: 주재료 영어명
 * 3순위: 일반 음식 검색어 (korean food 등)
 */
function generateSearchQueries(recipeTitle: string, mainIngredients: string[]): string[] {
  const queries: string[] = [];

  // 1. 영어 음식명 매핑 (일반적인 한국 음식)
  const foodNameMap: Record<string, string> = {
    '김치찌개': 'kimchi jjigae korean stew',
    '된장찌개': 'doenjang jjigae korean stew',
    '불고기': 'bulgogi korean bbq',
    '비빔밥': 'bibimbap korean rice bowl',
    '떡볶이': 'tteokbokki korean rice cake',
    '삼겹살': 'samgyeopsal korean pork belly',
    '김밥': 'kimbap korean roll',
    '잡채': 'japchae korean noodles',
    '닭갈비': 'dakgalbi korean chicken',
    '순두부찌개': 'sundubu jjigae korean tofu stew',
    '갈비찜': 'galbijjim korean braised ribs',
    '제육볶음': 'jeyuk bokkeum korean pork',
    '파전': 'pajeon korean pancake',
    '김치볶음밥': 'kimchi fried rice',
    '계란찜': 'korean steamed egg',
    '미역국': 'miyeok guk seaweed soup',
    '육개장': 'yukgaejang korean soup',
  };

  // 레시피 제목에서 핵심 음식명 추출
  const cleanTitle = recipeTitle.replace(/\s*(레시피|만들기|요리)\s*/g, '').trim();

  if (foodNameMap[cleanTitle]) {
    queries.push(foodNameMap[cleanTitle]);
  } else {
    // 매핑에 없으면 한글 + "korean food" 조합
    queries.push(`${cleanTitle} korean food`);
  }

  // 2. 주재료 영어명
  const ingredientMap: Record<string, string> = {
    '김치': 'kimchi',
    '돼지고기': 'pork',
    '소고기': 'beef',
    '닭고기': 'chicken',
    '두부': 'tofu',
    '계란': 'egg',
    '감자': 'potato',
    '양파': 'onion',
    '당근': 'carrot',
    '버섯': 'mushroom',
    '고추': 'chili pepper',
    '마늘': 'garlic',
    '파': 'green onion',
    '쌀': 'rice',
    '국수': 'noodles',
    '떡': 'rice cake',
    '어묵': 'fish cake',
    '새우': 'shrimp',
    '오징어': 'squid',
    '미역': 'seaweed',
  };

  // 주재료 영어명 + food
  if (mainIngredients.length > 0) {
    const engIngredient = ingredientMap[mainIngredients[0]];
    if (engIngredient) {
      queries.push(`${engIngredient} korean food dish`);
    }
  }

  // 3. 폴백: 일반 한식 이미지
  queries.push('korean food');
  queries.push('asian food dish');

  return queries;
}

/**
 * Unsplash 다운로드 트래킹 (API 정책 준수)
 */
async function trackDownload(downloadUrl: string): Promise<void> {
  if (!UNSPLASH_ACCESS_KEY || !downloadUrl) return;

  try {
    await fetch(downloadUrl, {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      },
    });
  } catch (error) {
    console.error('Unsplash 다운로드 트래킹 실패:', error);
  }
}

/**
 * 이미지 URL이 유효한지 확인
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}
