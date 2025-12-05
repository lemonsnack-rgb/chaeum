export interface RecipeJsonSchema {
  title: string;
  description: string;
  meta: {
    difficulty: string;
    cooking_time_min: number;
    calories_per_serving: number;
    protein: number;
    fat: number;
    carbohydrates: number;
    calorie_signal: string;
  };
  ingredients: Array<{
    name: string;
    amount: string;
    category: string;
    main_or_sub: string;
  }>;
  steps: Array<{
    step_no: number;
    action: string;
    tip: string;
  }>;
  deep_info: {
    chef_kick: string;
    storage: string;
    substitutions: string;
  };
  theme_tags: string[];
  main_ingredients: string[];

  // 블로그 스타일 필드 (NEW)
  chef_tips?: string[];
  faq?: Array<{
    question: string;
    answer: string;
  }>;
  storage_info?: {
    refrigerator_days?: number;
    freezer_days?: number;
    reheating_tip?: string;
  };
  pairing_suggestions?: string;
}

export const RECIPE_JSON_SCHEMA_TEMPLATE = `{
  "title": "레시피 제목",
  "description": "이 요리의 특징, 어울리는 상황, 맛의 매력을 4-5문장으로 작성 (구어체, 친근한 말투 사용)",
  "meta": {
    "difficulty": "초급/중급/고급",
    "cooking_time_min": 30,
    "calories_per_serving": 450,
    "protein": 25,
    "fat": 15,
    "carbohydrates": 50,
    "calorie_signal": "🟢/🟠/🔴"
  },
  "ingredients": [
    {"name": "재료명 (보정된 이름)", "amount": "100g", "category": "채소/육류/양념", "main_or_sub": "주재료/부재료"}
  ],
  "steps": [
    {"step_no": 1, "action": "조리 단계 설명", "tip": "중요한 팁"}
  ],
  "deep_info": {
    "chef_kick": "전문 셰프의 킥(추가 팁)",
    "storage": "보관 방법",
    "substitutions": "대체 재료 및 선택 이유 (알레르기 대응)"
  },
  "theme_tags": ["한식", "비오는날", "파티"],
  "main_ingredients": ["정렬된 주요 재료명 리스트 (캠싱 키로 사용)"],
  "chef_tips": [
    "멸치를 미리 볶으면 비린내가 사라져요",
    "마지막에 참기름 한 방울이 고소함을 더해줘요",
    "묵은지를 사용하면 더 깊은 맛이 나요"
  ],
  "faq": [
    {
      "question": "아이들이 먹기에는 맵지 않나요?",
      "answer": "고춧가루 양을 절반으로 줄이거나, 간장 베이스로 변경하시면 아이들도 맛있게 먹을 수 있어요. 대신 다진 마늘을 조금 더 넣어 풍미를 살려주세요."
    },
    {
      "question": "대체 재료로 무엇을 써도 되나요?",
      "answer": "돼지고기 대신 소고기나 참치 통조림으로 대체 가능해요. 소고기는 양지 부위가 좋고, 참치는 기름을 빼지 말고 함께 넣으면 감칠맛이 배가돼요."
    }
  ],
  "storage_info": {
    "refrigerator_days": 3,
    "freezer_days": 14,
    "reheating_tip": "전자레인지보다는 냄비에 물을 조금 붓고 약불에 데우면 국물이 더 신선해져요. 두부는 재가열 시 부서질 수 있으니 새로 넣는 것을 추천해요."
  },
  "pairing_suggestions": "공깃밥과 김, 계란말이와 함께 먹으면 환상 궁합이에요. 소주나 막걸리와도 잘 어울려요!"
}`;
