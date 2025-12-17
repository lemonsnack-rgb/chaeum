/**
 * 레시피 카테고리별 폴백 이미지
 * Unsplash의 고정 이미지 URL 사용
 */

interface FallbackImageMap {
  keywords: string[];
  imageUrl: string;
  alt: string;
}

// 카테고리별 폴백 이미지 (우선순위 순서로 정렬 - 구체적인 것부터)
const FALLBACK_IMAGES: FallbackImageMap[] = [
  // 잡채 (채소보다 훨씬 먼저)
  {
    keywords: ['잡채'],
    imageUrl: 'https://images.unsplash.com/photo-1620287341260-a6d1737b6c0e?w=800&q=80',
    alt: '잡채'
  },
  // 김밥/삼각김밥 (밥보다 먼저)
  {
    keywords: ['삼각김밥', '김밥', '유부초밥', '주먹밥'],
    imageUrl: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80',
    alt: '김밥'
  },
  // 타코/부리또/멕시칸
  {
    keywords: ['타코', '부리또', '나초', '퀘사디아', '멕시칸'],
    imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80',
    alt: '타코'
  },
  // 팟타이/태국음식
  {
    keywords: ['팟타이', '쌀국수', '월남쌈', '똠양꿍', '태국', '베트남'],
    imageUrl: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&q=80',
    alt: '팟타이'
  },
  // 라면/우동/소바 (돼지고기보다 먼저)
  {
    keywords: ['라면', '우동', '소바', '미소라멘', '돈코츠라멘', '컵라면', '신라면', '짜파게티', '불닭볶음면'],
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
    alt: '라면'
  },
  // 샌드위치/버거
  {
    keywords: ['샌드위치', '버거', '햄버거', '핫도그', '토스트'],
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
    alt: '샌드위치'
  },
  // 피자
  {
    keywords: ['피자'],
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
    alt: '피자'
  },
  // 찌개류 (구체적인 키워드)
  {
    keywords: ['김치찌개', '된장찌개', '순두부찌개', '부대찌개', '청국장', '찌개'],
    imageUrl: 'https://images.unsplash.com/photo-1583032015627-fa5ab8e8ad94?w=800&q=80',
    alt: '한국 찌개'
  },
  // 볶음/구이
  {
    keywords: ['불고기', '제육볶음', '닭갈비', '오징어볶음', '고추장불고기', '볶음', '구이'],
    imageUrl: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800&q=80',
    alt: '한국 볶음요리'
  },
  // 떡볶이 (밥/떡보다 먼저)
  {
    keywords: ['떡볶이', '즉석떡볶이', '치즈떡볶이'],
    imageUrl: 'https://images.unsplash.com/photo-1590528072213-1e85465e9acc?w=800&q=80',
    alt: '떡볶이'
  },
  // 비빔밥/덮밥 (밥보다 먼저)
  {
    keywords: ['비빔밥', '덮밥', '회덮밥', '돈부리', '규동', '오야코동'],
    imageUrl: 'https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=800&q=80',
    alt: '비빔밥'
  },
  // 볶음밥
  {
    keywords: ['볶음밥', '야채볶음밥', '김치볶음밥', '새우볶음밥'],
    imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80',
    alt: '볶음밥'
  },
  // 밥류 (가장 일반적 - 나중에)
  {
    keywords: ['밥', '쌈밥', '백반'],
    imageUrl: 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=800&q=80',
    alt: '한식 밥'
  },
  // 국/탕류
  {
    keywords: ['미역국', '육개장', '갈비탕', '삼계탕', '곰탕', '설렁탕', '국', '탕'],
    imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&q=80',
    alt: '한국 국물요리'
  },
  // 파스타/스파게티
  {
    keywords: ['파스타', '스파게티', '까르보나라', '알리오올리오', '봉골레', '크림파스타'],
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80',
    alt: '파스타'
  },
  // 국수/면류
  {
    keywords: ['국수', '냉면', '칼국수', '비빔국수', '잔치국수', '막국수'],
    imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&q=80',
    alt: '국수'
  },
  // 계란/달걀 요리 (치킨보다 먼저)
  {
    keywords: ['달걀말이', '계란말이', '계란후라이', '달걀후라이', '스크램블', '에그', '오믈렛', '계란찜'],
    imageUrl: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=800&q=80',
    alt: '계란요리'
  },
  // 치킨/닭요리
  {
    keywords: ['치킨', '양념치킨', '후라이드', '닭강정', '닭', '프라이드치킨'],
    imageUrl: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&q=80',
    alt: '치킨'
  },
  // 전/튀김
  {
    keywords: ['파전', '김치전', '해물파전', '전', '튀김', '부침개', '동그랑땡'],
    imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&q=80',
    alt: '전'
  },
  // 찜/조림 (계란찜 제외 - 위에서 처리)
  {
    keywords: ['갈비찜', '찜닭', '아귀찜', '생선조림', '두부조림', '장조림', '찜', '조림'],
    imageUrl: 'https://images.unsplash.com/photo-1580554530778-ca36943938b2?w=800&q=80',
    alt: '찜'
  },
  // 김치/반찬류
  {
    keywords: ['김치', '깍두기', '나물', '무침', '겉절이', '반찬'],
    imageUrl: 'https://images.unsplash.com/photo-1588569697853-44eabf5df76b?w=800&q=80',
    alt: '김치반찬'
  },
  // 만두/교자
  {
    keywords: ['만두', '물만두', '군만두', '교자', '왕만두'],
    imageUrl: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=800&q=80',
    alt: '만두'
  },
  // 죽/수프
  {
    keywords: ['죽', '전복죽', '호박죽', '잣죽', '수프', '스프'],
    imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
    alt: '죽'
  },
  // 떡/떡국
  {
    keywords: ['떡국', '떡', '가래떡'],
    imageUrl: 'https://images.unsplash.com/photo-1612874202374-ce4fb3522eff?w=800&q=80',
    alt: '떡'
  },
  // 스테이크/고기구이 (구체적)
  {
    keywords: ['스테이크', '등심', '안심', '티본'],
    imageUrl: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80',
    alt: '스테이크'
  },
  // 삼겹살/돼지고기
  {
    keywords: ['삼겹살', '목살', '항정살', '돼지고기구이'],
    imageUrl: 'https://images.unsplash.com/photo-1606851094291-6f8a1b5e8b6f?w=800&q=80',
    alt: '삼겹살'
  },
  // 소고기 (일반적)
  {
    keywords: ['소고기', '육회', '장조림'],
    imageUrl: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=800&q=80',
    alt: '소고기'
  },
  // 연어
  {
    keywords: ['연어', '연어스테이크', '연어초밥', '사케동'],
    imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80',
    alt: '연어'
  },
  // 새우요리 (구체적)
  {
    keywords: ['새우튀김', '칠리새우', '마늘새우', '새우구이'],
    imageUrl: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&q=80',
    alt: '새우요리'
  },
  // 해산물 (일반적 - 나중에)
  {
    keywords: ['새우', '생선', '해산물', '조개', '오징어', '문어', '꽃게'],
    imageUrl: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=800&q=80',
    alt: '해산물'
  },
  // 샐러드 (채소/야채를 제외하여 잡채 오매칭 방지)
  {
    keywords: ['샐러드', '시저샐러드', '채소샐러드'],
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    alt: '샐러드'
  },
  // 카레
  {
    keywords: ['카레', '커리'],
    imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
    alt: '카레'
  }
];

// 기본 폴백 이미지 (매칭 실패 시 - 일반적인 한식 상차림)
const DEFAULT_FALLBACK = 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&q=80';

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
