export interface Ingredient {
  name: string;
  category: 'meat' | 'seafood' | 'vegetable' | 'seasoning' | 'other';
  searchVolume: 'high' | 'medium' | 'low';
  priority: number; // 1-10, 높을수록 우선
}

export const INGREDIENT_DATABASE: Ingredient[] = [
  // === 육류 (고검색량) ===
  { name: '삼겹살', category: 'meat', searchVolume: 'high', priority: 10 },
  { name: '소고기', category: 'meat', searchVolume: 'high', priority: 10 },
  { name: '닭가슴살', category: 'meat', searchVolume: 'high', priority: 10 },
  { name: '목살', category: 'meat', searchVolume: 'high', priority: 9 },
  { name: '닭다리', category: 'meat', searchVolume: 'high', priority: 9 },
  { name: '소고기 등심', category: 'meat', searchVolume: 'high', priority: 9 },
  { name: '돼지고기', category: 'meat', searchVolume: 'high', priority: 9 },
  { name: '닭고기', category: 'meat', searchVolume: 'high', priority: 9 },
  { name: '안심', category: 'meat', searchVolume: 'medium', priority: 8 },
  { name: '갈비', category: 'meat', searchVolume: 'high', priority: 9 },
  { name: '양고기', category: 'meat', searchVolume: 'medium', priority: 6 },
  { name: '오리고기', category: 'meat', searchVolume: 'medium', priority: 7 },

  // === 수산물 (고검색량) ===
  { name: '고등어', category: 'seafood', searchVolume: 'high', priority: 10 },
  { name: '연어', category: 'seafood', searchVolume: 'high', priority: 10 },
  { name: '새우', category: 'seafood', searchVolume: 'high', priority: 10 },
  { name: '오징어', category: 'seafood', searchVolume: 'high', priority: 9 },
  { name: '조기', category: 'seafood', searchVolume: 'high', priority: 9 },
  { name: '갈치', category: 'seafood', searchVolume: 'high', priority: 9 },
  { name: '참치', category: 'seafood', searchVolume: 'high', priority: 9 },
  { name: '명태', category: 'seafood', searchVolume: 'high', priority: 8 },
  { name: '게맛살', category: 'seafood', searchVolume: 'medium', priority: 7 },
  { name: '바지락', category: 'seafood', searchVolume: 'high', priority: 8 },
  { name: '꽃게', category: 'seafood', searchVolume: 'high', priority: 8 },
  { name: '낙지', category: 'seafood', searchVolume: 'high', priority: 8 },
  { name: '문어', category: 'seafood', searchVolume: 'high', priority: 8 },
  { name: '광어', category: 'seafood', searchVolume: 'medium', priority: 7 },
  { name: '삼치', category: 'seafood', searchVolume: 'high', priority: 8 },

  // === 채소 (고검색량) ===
  { name: '감자', category: 'vegetable', searchVolume: 'high', priority: 10 },
  { name: '양파', category: 'vegetable', searchVolume: 'high', priority: 10 },
  { name: '당근', category: 'vegetable', searchVolume: 'high', priority: 10 },
  { name: '배추', category: 'vegetable', searchVolume: 'high', priority: 10 },
  { name: '시금치', category: 'vegetable', searchVolume: 'high', priority: 9 },
  { name: '무', category: 'vegetable', searchVolume: 'high', priority: 9 },
  { name: '대파', category: 'vegetable', searchVolume: 'high', priority: 9 },
  { name: '브로콜리', category: 'vegetable', searchVolume: 'high', priority: 9 },
  { name: '파프리카', category: 'vegetable', searchVolume: 'medium', priority: 8 },
  { name: '가지', category: 'vegetable', searchVolume: 'high', priority: 8 },
  { name: '애호박', category: 'vegetable', searchVolume: 'high', priority: 9 },
  { name: '버섯', category: 'vegetable', searchVolume: 'high', priority: 9 },
  { name: '표고버섯', category: 'vegetable', searchVolume: 'high', priority: 8 },
  { name: '팽이버섯', category: 'vegetable', searchVolume: 'medium', priority: 7 },
  { name: '양송이버섯', category: 'vegetable', searchVolume: 'medium', priority: 7 },
  { name: '청경채', category: 'vegetable', searchVolume: 'medium', priority: 7 },
  { name: '상추', category: 'vegetable', searchVolume: 'high', priority: 8 },
  { name: '배', category: 'vegetable', searchVolume: 'high', priority: 8 },
  { name: '사과', category: 'vegetable', searchVolume: 'high', priority: 8 },
  { name: '고구마', category: 'vegetable', searchVolume: 'high', priority: 9 },
  { name: '단호박', category: 'vegetable', searchVolume: 'high', priority: 8 },
  { name: '옥수수', category: 'vegetable', searchVolume: 'high', priority: 8 },
  { name: '숙주', category: 'vegetable', searchVolume: 'high', priority: 8 },
  { name: '콩나물', category: 'vegetable', searchVolume: 'high', priority: 9 },
  { name: '미나리', category: 'vegetable', searchVolume: 'high', priority: 8 },
  { name: '쪽파', category: 'vegetable', searchVolume: 'medium', priority: 7 },
  { name: '깻잎', category: 'vegetable', searchVolume: 'high', priority: 8 },
  { name: '마늘', category: 'seasoning', searchVolume: 'high', priority: 9 },
  { name: '생강', category: 'seasoning', searchVolume: 'high', priority: 8 },
  { name: '청양고추', category: 'vegetable', searchVolume: 'high', priority: 8 },
  { name: '피망', category: 'vegetable', searchVolume: 'medium', priority: 7 },

  // === 양념/조미료 ===
  { name: '간장', category: 'seasoning', searchVolume: 'high', priority: 9 },
  { name: '고추장', category: 'seasoning', searchVolume: 'high', priority: 9 },
  { name: '된장', category: 'seasoning', searchVolume: 'high', priority: 9 },
  { name: '참기름', category: 'seasoning', searchVolume: 'high', priority: 8 },
  { name: '식용유', category: 'seasoning', searchVolume: 'high', priority: 8 },
  { name: '소금', category: 'seasoning', searchVolume: 'high', priority: 8 },
  { name: '설탕', category: 'seasoning', searchVolume: 'high', priority: 8 },
  { name: '식초', category: 'seasoning', searchVolume: 'high', priority: 8 },
  { name: '후추', category: 'seasoning', searchVolume: 'high', priority: 7 },
  { name: '올리브유', category: 'seasoning', searchVolume: 'medium', priority: 7 },

  // === 기타 (고검색량) ===
  { name: '두부', category: 'other', searchVolume: 'high', priority: 10 },
  { name: '달걀', category: 'other', searchVolume: 'high', priority: 10 },
  { name: '김치', category: 'other', searchVolume: 'high', priority: 10 },
  { name: '떡', category: 'other', searchVolume: 'high', priority: 9 },
  { name: '쌀', category: 'other', searchVolume: 'high', priority: 9 },
  { name: '우유', category: 'other', searchVolume: 'high', priority: 9 },
  { name: '치즈', category: 'other', searchVolume: 'high', priority: 8 },
  { name: '베이컨', category: 'meat', searchVolume: 'high', priority: 8 },
  { name: '햄', category: 'meat', searchVolume: 'high', priority: 8 },
  { name: '소시지', category: 'meat', searchVolume: 'high', priority: 7 },
  { name: '어묵', category: 'other', searchVolume: 'high', priority: 8 },
  { name: '순두부', category: 'other', searchVolume: 'high', priority: 8 },
  { name: '면', category: 'other', searchVolume: 'high', priority: 8 },
  { name: '당면', category: 'other', searchVolume: 'high', priority: 8 },
  { name: '국수', category: 'other', searchVolume: 'high', priority: 8 },
  { name: '스파게티면', category: 'other', searchVolume: 'medium', priority: 7 },
  { name: '만두', category: 'other', searchVolume: 'high', priority: 8 },

  // === 추가 재료 ===
  { name: '토마토', category: 'vegetable', searchVolume: 'high', priority: 9 },
  { name: '오이', category: 'vegetable', searchVolume: 'high', priority: 8 },
  { name: '고춧가루', category: 'seasoning', searchVolume: 'high', priority: 8 },
  { name: '굴소스', category: 'seasoning', searchVolume: 'medium', priority: 7 },
  { name: '춘장', category: 'seasoning', searchVolume: 'medium', priority: 7 },
  { name: '카레가루', category: 'seasoning', searchVolume: 'high', priority: 8 },
  { name: '물엿', category: 'seasoning', searchVolume: 'medium', priority: 7 },
  { name: '맛술', category: 'seasoning', searchVolume: 'medium', priority: 7 },
  { name: '미림', category: 'seasoning', searchVolume: 'medium', priority: 7 },
  { name: '청주', category: 'seasoning', searchVolume: 'medium', priority: 7 },
  { name: '통깨', category: 'seasoning', searchVolume: 'medium', priority: 6 },
  { name: '참깨', category: 'seasoning', searchVolume: 'medium', priority: 6 },
  { name: '들기름', category: 'seasoning', searchVolume: 'medium', priority: 7 },
  { name: '고추기름', category: 'seasoning', searchVolume: 'low', priority: 6 },
  { name: '레몬', category: 'vegetable', searchVolume: 'medium', priority: 7 },
  { name: '라임', category: 'vegetable', searchVolume: 'low', priority: 5 },
  { name: '바질', category: 'seasoning', searchVolume: 'low', priority: 5 },
  { name: '로즈마리', category: 'seasoning', searchVolume: 'low', priority: 5 },
  { name: '파슬리', category: 'seasoning', searchVolume: 'low', priority: 5 },
];

// 우선순위 기반 가중치 랜덤 선택
export function selectRandomIngredient(
  excludeRecent: string[] = []
): Ingredient {
  const available = INGREDIENT_DATABASE.filter(
    ing => !excludeRecent.includes(ing.name)
  );

  if (available.length === 0) {
    // 모든 재료가 제외된 경우, 전체 목록에서 랜덤 선택
    const randomIndex = Math.floor(Math.random() * INGREDIENT_DATABASE.length);
    return INGREDIENT_DATABASE[randomIndex];
  }

  // 우선순위를 가중치로 사용
  const totalWeight = available.reduce((sum, ing) => sum + ing.priority, 0);
  let random = Math.random() * totalWeight;

  for (const ingredient of available) {
    random -= ingredient.priority;
    if (random <= 0) {
      return ingredient;
    }
  }

  return available[0];
}

// 통계 출력
console.log(`📊 재료 데이터베이스 통계:`);
console.log(`- 전체 재료 수: ${INGREDIENT_DATABASE.length}개`);
console.log(`- 육류: ${INGREDIENT_DATABASE.filter(i => i.category === 'meat').length}개`);
console.log(`- 수산물: ${INGREDIENT_DATABASE.filter(i => i.category === 'seafood').length}개`);
console.log(`- 채소: ${INGREDIENT_DATABASE.filter(i => i.category === 'vegetable').length}개`);
console.log(`- 양념: ${INGREDIENT_DATABASE.filter(i => i.category === 'seasoning').length}개`);
console.log(`- 기타: ${INGREDIENT_DATABASE.filter(i => i.category === 'other').length}개`);
