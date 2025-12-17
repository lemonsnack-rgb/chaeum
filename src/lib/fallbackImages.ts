/**
 * 레시피 카테고리별 폴백 이미지
 * Unsplash의 고정 이미지 URL 사용
 */

interface FallbackImageMap {
  keywords: string[];
  imageUrl: string;
  alt: string;
}

// 카테고리별 폴백 이미지 (Unsplash 고정 URL)
const FALLBACK_IMAGES: FallbackImageMap[] = [
  // 찌개류
  {
    keywords: ['찌개', '김치찌개', '된장찌개', '순두부', '부대찌개', '청국장'],
    imageUrl: 'https://images.unsplash.com/photo-1583032015627-fa5ab8e8ad94?w=800&q=80',
    alt: '한국 찌개'
  },
  // 볶음/구이
  {
    keywords: ['불고기', '제육', '볶음', '구이', '삼겹살', '닭갈비', '오징어볶음'],
    imageUrl: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800&q=80',
    alt: '한국 볶음요리'
  },
  // 밥/덮밥류
  {
    keywords: ['비빔밥', '볶음밥', '덮밥', '김밥', '주먹밥', '쌈밥'],
    imageUrl: 'https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=800&q=80',
    alt: '한국 밥요리'
  },
  // 국/탕류
  {
    keywords: ['국', '탕', '미역국', '육개장', '갈비탕', '삼계탕', '곰탕'],
    imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&q=80',
    alt: '한국 국물요리'
  },
  // 면류
  {
    keywords: ['라면', '국수', '냉면', '잡채', '칼국수', '비빔국수'],
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
    alt: '한국 면요리'
  },
  // 전/튀김
  {
    keywords: ['전', '파전', '김치전', '튀김', '부침개', '도토리묵'],
    imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&q=80',
    alt: '한국 전요리'
  },
  // 찜/조림
  {
    keywords: ['찜', '조림', '갈비찜', '계란찜', '생선조림', '두부조림'],
    imageUrl: 'https://images.unsplash.com/photo-1580554530778-ca36943938b2?w=800&q=80',
    alt: '한국 찜요리'
  },
  // 떡/떡볶이
  {
    keywords: ['떡', '떡볶이', '떡국', '떡찜'],
    imageUrl: 'https://images.unsplash.com/photo-1590528072213-1e85465e9acc?w=800&q=80',
    alt: '떡요리'
  },
  // 치킨/닭요리
  {
    keywords: ['치킨', '닭', '양념치킨', '후라이드', '닭강정'],
    imageUrl: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&q=80',
    alt: '닭요리'
  },
  // 파스타/양식
  {
    keywords: ['파스타', '스파게티', '크림', '까르보나라', '토마토'],
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80',
    alt: '파스타'
  },
  // 샐러드
  {
    keywords: ['샐러드', '채소', '야채', '과일'],
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    alt: '샐러드'
  },
  // 스테이크/고기
  {
    keywords: ['스테이크', '소고기', '등심', '안심'],
    imageUrl: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80',
    alt: '스테이크'
  },
  // 해산물
  {
    keywords: ['연어', '새우', '생선', '해산물', '조개', '오징어'],
    imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80',
    alt: '해산물요리'
  }
];

// 기본 폴백 이미지 (매칭 실패 시)
const DEFAULT_FALLBACK = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80';

/**
 * 레시피 제목으로 적절한 폴백 이미지 찾기
 */
export function getFallbackImageForRecipe(recipeTitle: string): string {
  const lowerTitle = recipeTitle.toLowerCase();

  // 키워드 매칭
  for (const category of FALLBACK_IMAGES) {
    for (const keyword of category.keywords) {
      if (lowerTitle.includes(keyword)) {
        return category.imageUrl;
      }
    }
  }

  // 매칭 실패 시 기본 이미지
  return DEFAULT_FALLBACK;
}

/**
 * 이미지 URL이 유효한지 확인 (빠른 체크)
 */
export function isValidImageUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  if (url.trim() === '') return false;

  // Unsplash, Supabase Storage 등 신뢰할 수 있는 도메인
  const trustedDomains = [
    'images.unsplash.com',
    'unsplash.com',
    'supabase.co',
    'cloudinary.com'
  ];

  try {
    const urlObj = new URL(url);
    return trustedDomains.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
}

/**
 * 레시피 이미지 URL 검증 및 폴백
 */
export function getRecipeImageUrl(
  recipe: { image_url?: string; title: string }
): string {
  // 1. DB의 이미지 URL이 유효하면 사용
  if (isValidImageUrl(recipe.image_url)) {
    return recipe.image_url!;
  }

  // 2. 제목 기반 폴백 이미지
  return getFallbackImageForRecipe(recipe.title);
}
