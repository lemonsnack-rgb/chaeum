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
  "main_ingredients": ["정렬된 주요 재료명 리스트 (캠싱 키로 사용)"]
}`;
