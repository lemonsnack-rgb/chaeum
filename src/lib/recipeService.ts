import { supabase } from './supabase';
import { genAI } from './gemini';
import { generateRecipePrompt } from '../ai/recipe_generation_prompt';

// FAQ 인터페이스
export interface FAQ {
  question: string;
  answer: string;
}

// 보관 정보 인터페이스
export interface StorageInfo {
  refrigerator_days?: number; // 냉장 보관 일수
  freezer_days?: number; // 냉동 보관 일수
  reheating_tip?: string; // 재가열 팁
}

// 코드에서 사용하는 Recipe 인터페이스 (기존 유지)
export interface Recipe {
  id: string;
  title: string;
  description?: string;
  main_ingredients: string[];
  theme_tags: string[];
  ingredients_detail: IngredientDetail[];
  instructions: string[];
  meta?: RecipeMeta;
  nutrition: NutritionInfo;
  deep_info: DeepInfo;
  cooking_time: number;
  servings: number;
  created_at: string;
  image_url?: string; // Unsplash 이미지 URL
  image_photographer?: string; // 사진작가 이름 (크레딧)

  // ===== 블로그 스타일 필드 (NEW) =====
  chef_tips?: string[]; // 셰프의 시크릿 팁
  faq?: FAQ[]; // 자주 묻는 질문
  storage_info?: StorageInfo; // 보관 및 재가열 정보
  pairing_suggestions?: string; // 함께 먹으면 좋은 음식
}

// 실제 DB에 저장되는 구조
interface DatabaseRecipe {
  id: string;
  user_id?: string;
  title: string;
  content: {
    description?: string;
    ingredients_detail: IngredientDetail[];
    instructions: string[];
    nutrition: NutritionInfo;
    deep_info: DeepInfo;
    servings: number;
  };
  difficulty: string;
  cooking_time_min: number;
  cooking_time: string;
  calories_per_serving: number;
  calorie_signal: string;
  theme_tags: string[];
  main_ingredients: string[];
  created_at: string;
  image_url?: string; // Unsplash 이미지 URL
  image_photographer?: string; // 사진작가 이름

  // 블로그 스타일 필드
  chef_tips?: string[];
  faq?: FAQ[];
  storage_info?: StorageInfo;
  pairing_suggestions?: string;
}

export interface RecipeMeta {
  difficulty?: string;
  cooking_time_min?: number;
  calories_per_serving?: number;
  protein?: number;
  fat?: number;
  carbohydrates?: number;
  calorie_signal?: string;
}

export interface IngredientDetail {
  name: string;
  amount: string;
  category?: string;
  main_or_sub?: string;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
}

export interface DeepInfo {
  substitutions?: string;
  tips?: string[];
  difficulty?: string;
  chef_kick?: string;
  storage?: string;
}

// Recipe를 DatabaseRecipe로 변환
function recipeToDatabase(recipe: Recipe): DatabaseRecipe {
  return {
    id: recipe.id,
    title: recipe.title,
    content: {
      description: recipe.description,
      ingredients_detail: recipe.ingredients_detail,
      instructions: recipe.instructions,
      nutrition: recipe.nutrition,
      deep_info: recipe.deep_info,
      servings: recipe.servings,
    },
    difficulty: recipe.meta?.difficulty || '중급',
    cooking_time_min: recipe.meta?.cooking_time_min || recipe.cooking_time || 30,
    cooking_time: `${recipe.meta?.cooking_time_min || recipe.cooking_time || 30}분`,
    calories_per_serving: recipe.meta?.calories_per_serving || recipe.nutrition?.calories || 0,
    calorie_signal: recipe.meta?.calorie_signal || '🟢',
    theme_tags: recipe.theme_tags,
    main_ingredients: recipe.main_ingredients,
    created_at: recipe.created_at,
    image_url: recipe.image_url,
    image_photographer: recipe.image_photographer,
    chef_tips: recipe.chef_tips,
    faq: recipe.faq,
    storage_info: recipe.storage_info,
    pairing_suggestions: recipe.pairing_suggestions,
  };
}

// DatabaseRecipe를 Recipe로 변환
export function databaseToRecipe(dbRecipe: any): Recipe {
  return {
    id: dbRecipe.id,
    title: dbRecipe.title,
    description: dbRecipe.content?.description || '',
    main_ingredients: dbRecipe.main_ingredients || [],
    theme_tags: dbRecipe.theme_tags || [],
    ingredients_detail: dbRecipe.content?.ingredients_detail || [],
    instructions: dbRecipe.content?.instructions || [],
    meta: {
      difficulty: dbRecipe.difficulty,
      cooking_time_min: dbRecipe.cooking_time_min,
      calories_per_serving: dbRecipe.calories_per_serving,
      protein: dbRecipe.content?.nutrition?.protein || 0,
      fat: dbRecipe.content?.nutrition?.fat || 0,
      carbohydrates: dbRecipe.content?.nutrition?.carbohydrates || 0,
      calorie_signal: dbRecipe.calorie_signal,
    },
    nutrition: dbRecipe.content?.nutrition || {
      calories: dbRecipe.calories_per_serving || 0,
      protein: 0,
      fat: 0,
      carbohydrates: 0,
    },
    deep_info: dbRecipe.content?.deep_info || {},
    cooking_time: dbRecipe.cooking_time_min || 30,
    servings: dbRecipe.content?.servings || 2,
    created_at: dbRecipe.created_at,
    image_url: dbRecipe.image_url,
    image_photographer: dbRecipe.image_photographer,
    chef_tips: dbRecipe.chef_tips,
    faq: dbRecipe.faq,
    storage_info: dbRecipe.storage_info,
    pairing_suggestions: dbRecipe.pairing_suggestions,
  };
}

export async function generateBatchRecipes(
  ingredientNames: string[],
  servings: number = 2,
  themePreference: string = ''
): Promise<Recipe[]> {
  if (!genAI) {
    throw new Error('Gemini API not configured');
  }

  const sortedIngredients = [...ingredientNames].sort();
  const cachedRecipes: Recipe[] = [];

  // 캐시된 레시피 확인
  if (supabase) {
    const { data: cached, error: cacheError } = await supabase
      .from('generated_recipes')
      .select('*')
      .contains('main_ingredients', sortedIngredients)
      .order('created_at', { ascending: false })
      .limit(3);

    if (cacheError) {
      console.error('Cache lookup error:', cacheError);
    }

    if (cached && cached.length > 0) {
      cachedRecipes.push(...cached.map(databaseToRecipe));
    }
  }

  if (cachedRecipes.length >= 3) {
    return cachedRecipes.slice(0, 3);
  }

  // 사용자 프로필 정보 가져오기 (알레르기, 식단 선호)
  const allergies: string[] = [];
  const dietaryPreferences: string[] = [];

  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('allergies, dietary_preferences')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) {
          console.warn('Profile fetch error (continuing without user preferences):', profileError);
          // profiles 테이블이 없거나 오류가 발생해도 레시피 생성은 계속 진행
        } else if (profile) {
          allergies.push(...(profile.allergies || []));
          dietaryPreferences.push(...(profile.dietary_preferences || []));
        }
      }
    } catch (error) {
      console.error('Unexpected error fetching user profile (continuing):', error);
      // 오류 발생해도 레시피 생성은 계속 진행
    }
  }

  const recipesToGenerate = 3 - cachedRecipes.length;
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = generateRecipePrompt({
    sortedIngredients,
    servings,
    themePreference,
    allergies,
    dietaryPreferences,
    recipesToGenerate
  });

  console.log('=== Recipe Generation Debug ===');
  console.log('Prompt sent to Gemini:', prompt.substring(0, 200) + '...');

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  console.log('Raw API Response:', text);

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.error('No JSON array found in response. Full text:', text);
    throw new Error('Invalid response from Gemini - no JSON array found');
  }

  console.log('Extracted JSON:', jsonMatch[0]);

  let recipesData: any[];
  try {
    recipesData = JSON.parse(jsonMatch[0]);
    console.log('Parsed recipes data:', JSON.stringify(recipesData, null, 2));
  } catch (parseError) {
    console.error('JSON Parse Error:', parseError);
    console.error('Failed to parse:', jsonMatch[0]);
    throw new Error('Failed to parse recipe JSON from API');
  }

  if (!recipesData || recipesData.length === 0) {
    console.error('No recipes in parsed data');
    throw new Error('No recipes generated from API');
  }

  console.log(`Successfully parsed ${recipesData.length} recipes`);

  const newRecipes: Recipe[] = [];

  for (let i = 0; i < recipesData.length; i++) {
    const recipeData = recipesData[i];
    console.log(`Processing recipe ${i + 1}:`, JSON.stringify(recipeData, null, 2));

    if (!recipeData.title || !recipeData.main_ingredients) {
      console.warn(`Skipping recipe ${i + 1} - missing required fields:`, {
        hasTitle: !!recipeData.title,
        hasMainIngredients: !!recipeData.main_ingredients,
        recipeData
      });
      continue;
    }

    const recipe: Recipe = {
      id: crypto.randomUUID(),
      title: recipeData.title || 'Untitled Recipe',
      description: recipeData.description || '',
      main_ingredients: Array.isArray(recipeData.main_ingredients)
        ? recipeData.main_ingredients
        : sortedIngredients,
      theme_tags: Array.isArray(recipeData.theme_tags) ? recipeData.theme_tags : [],
      ingredients_detail: Array.isArray(recipeData.ingredients)
        ? recipeData.ingredients
        : [],
      instructions: Array.isArray(recipeData.steps)
        ? recipeData.steps.map((s: any) =>
            `${s.step_no}. ${s.action}${s.tip ? ' (팁: ' + s.tip + ')' : ''}`
          )
        : [],
      meta: recipeData.meta || {},
      nutrition: {
        calories: recipeData.meta?.calories_per_serving || 0,
        protein: recipeData.meta?.protein || 0,
        fat: recipeData.meta?.fat || 0,
        carbohydrates: recipeData.meta?.carbohydrates || 0,
      },
      deep_info: recipeData.deep_info || {},
      cooking_time: recipeData.meta?.cooking_time_min || 30,
      servings: servings,
      created_at: new Date().toISOString(),
    };

    console.log(`Successfully created recipe object ${i + 1}:`, {
      id: recipe.id,
      title: recipe.title,
      main_ingredients: recipe.main_ingredients,
      instructions_count: recipe.instructions.length
    });

    newRecipes.push(recipe);
  }

  console.log(`Total recipes created: ${newRecipes.length}`);

  if (newRecipes.length === 0) {
    console.error('No valid recipes created from API response');
    throw new Error('Failed to parse any valid recipes from API response');
  }

  // 데이터베이스에 저장 (RPC 함수 사용하여 PostgREST 스키마 캐시 문제 우회)
  if (supabase) {
    console.log('Attempting to save recipes to database using RPC...');

    // 현재 로그인한 유저 정보 가져오기 (비회원이면 user는 null)
    const { data: { user } } = await supabase.auth.getUser();

    // Recipe를 DatabaseRecipe 형식으로 변환하고 user_id 추가
    const dbRecipes = newRecipes.map(recipe => ({
      ...recipeToDatabase(recipe),
      user_id: user?.id || null
    }));

    console.log('Recipes to insert via RPC:', JSON.stringify(dbRecipes, null, 2));

    // RPC 함수를 사용하여 각 레시피 삽입
    const insertedIds: string[] = [];
    for (const dbRecipe of dbRecipes) {
      const { data: recipeId, error: insertError } = await supabase
        .rpc('insert_recipe', { recipe_data: dbRecipe });

      if (insertError) {
        console.error('Database insert error (RPC):', insertError);
        console.error('Error details:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        });
        throw new Error('레시피를 데이터베이스에 저장하는 중 오류가 발생했습니다: ' + insertError.message);
      }

      if (recipeId) {
        insertedIds.push(recipeId);
      }
    }

    if (insertedIds.length > 0) {
      console.log(`✅ Successfully saved ${insertedIds.length} recipes to database via RPC`);
      console.log('Inserted recipe IDs:', insertedIds);
    }
  }

  const allRecipes = [...cachedRecipes, ...newRecipes];
  return allRecipes.slice(0, 3);
}

export async function generateRecipeWithCaching(
  ingredientNames: string[],
  servings: number = 2,
  themePreference: string = ''
): Promise<Recipe> {
  if (!genAI) {
    throw new Error('Gemini API not configured');
  }

  const sortedIngredients = [...ingredientNames].sort();

  // 캐시 확인
  if (supabase) {
    const { data: cachedRecipe, error: cacheError } = await supabase
      .from('generated_recipes')
      .select('*')
      .contains('main_ingredients', sortedIngredients)
      .maybeSingle();

    if (cacheError) {
      console.error('Cache lookup error:', cacheError);
    }

    if (cachedRecipe) {
      return databaseToRecipe(cachedRecipe);
    }
  }

  const allergies: string[] = [];
  const dietaryPreferences: string[] = [];

  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('allergies, dietary_preferences')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) {
          console.warn('Profile fetch error (continuing without user preferences):', profileError);
        } else if (profile) {
          allergies.push(...(profile.allergies || []));
          dietaryPreferences.push(...(profile.dietary_preferences || []));
        }
      }
    } catch (error) {
      console.error('Unexpected error fetching user profile (continuing):', error);
    }
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `## 역할 및 목표
당신은 사용자의 냉장고 재료를 기반으로 안전하고 영양가 있으며, SEO에 최적화된 레시피를 생성하는 전문 셰프 AI입니다. 응답은 반드시 지정된 JSON 스키마를 **절대적으로 준수**해야 합니다. 다른 텍스트 설명 없이 **오직 JSON 객체만** 반환하십시오.

**레시피 명칭 규칙: 모든 레시피 제목과 설명은 반드시 한국어로만 작성하십시오. 영어 명칭이나 영어 번역을 절대 포함하지 마십시오. (예: "김치볶음밥 (Kimchi Fried Rice)" ✗, "김치볶음밥" ✓)**

## 🚨 최우선 안전 규칙 (위반 절대 금지)
${allergies.length > 0 ? `**[필수 안전 조건] 다음 재료는 사용자의 알레르기 정보로 레시피에 절대 포함할 수 없습니다: ${allergies.join(', ')}**
- 이 재료들이 냉장고에 있더라도 **절대 사용하지 마십시오.**
- 레시피의 모든 재료(주재료, 부재료, 양념, 소스 등)를 생성 후 반드시 이 리스트와 대조하십시오.
- 만약 정식 레시피에 이 재료가 필요하다면, **반드시 안전한 대체 재료**를 사용하고 deep_info.substitutions에 대체 이유를 명시하십시오.
- 예시: 견과류 알레르기 시 "호두 대신 해바라기씨 사용 (견과류 알레르기 대응)"
` : ''}
${dietaryPreferences.length > 0 ? `**[식단 선호] 가능한 다음 재료는 최소화하거나 피해주세요: ${dietaryPreferences.join(', ')}**
- 부득이하게 사용할 경우 대체 방안을 제시하세요.
` : ''}

## 입력 재료 및 조건
1. 사용자 보유 재료 (필수 사용): ${sortedIngredients.join(', ')}
2. 인분 기준: ${servings}인분
3. 레시피 모드: 가성비 모드
${themePreference ? `4. 테마 선호: ${themePreference}` : ''}

## 출력 상세 요구사항
3. 생성된 레시피는 ${servings}인분에 맞춰 모든 재료 양이 정확하게 스케일링되어야 합니다.
4. 요리 완료 후, 1인분 기준 칼로리, 단백질, 지방, 탄수화물 정보를 분석하여 JSON에 포함하십시오.
5. 레시피 메타 데이터로 '테마 태그'(예: [해장, 비오는날, 한식])를 3개 이상 반드시 부여하십시오.${themePreference ? ` 사용자가 선호한 테마(${themePreference})를 반드시 반영하세요.` : ''}

## 중요: 디저트/완제품 처리 규칙
- **디저트/완제품 제외**: 추출된 재료 목록에 '수박바', '초콜릿', '콜라', '사이다', '아이스크림', '과자' 등 디저트나 완제품이 포함되어 있을 경우, 이를 레시피의 **주재료로 사용하지 마십시오**. 순수한 식재료 및 양념류에만 집중하세요.
- **재료 분류**: 모든 재료를 '주재료' 또는 '부재료(양념, 소스, 시즈닝 등 포함)'로 명확히 분류하십시오.
  - '드레싱', '샐러드 소스', '간장', '고추장', '설탕', '소금' 등은 '부재료'로 분류하세요.
  - '닭고기', '돼지고기', '감자', '양파', '버섯' 등 주된 조리 대상은 '주재료'로 분류하세요.

## 출력 JSON 스키마 (절대 준수)
{
  "title": "레시피 제목 (한국어로만 작성, 영어 명칭 절대 불가)",
  "description": "한 줄 요약 (한국어로만 작성)",
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
}

JSON 외에 다른 텍스트는 절대 포함하지 마십시오.`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid response from Gemini');
  }

  const recipeData = JSON.parse(jsonMatch[0]);

  const newRecipe: Recipe = {
    id: crypto.randomUUID(),
    title: recipeData.title,
    description: recipeData.description,
    main_ingredients: recipeData.main_ingredients || sortedIngredients,
    theme_tags: recipeData.theme_tags || [],
    ingredients_detail: recipeData.ingredients || [],
    instructions: recipeData.steps?.map((s: any) => `${s.step_no}. ${s.action}${s.tip ? ' (팁: ' + s.tip + ')' : ''}`) || [],
    meta: recipeData.meta,
    nutrition: {
      calories: recipeData.meta?.calories_per_serving || 0,
      protein: recipeData.meta?.protein || 0,
      fat: recipeData.meta?.fat || 0,
      carbohydrates: recipeData.meta?.carbohydrates || 0,
    },
    deep_info: recipeData.deep_info || {},
    cooking_time: recipeData.meta?.cooking_time_min || 30,
    servings: servings,
    created_at: new Date().toISOString(),
  };

  return newRecipe;
}

export async function getUserRecipes(): Promise<Recipe[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('generated_recipes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching recipes:', error);
    return [];
  }

  return (data || []).map(databaseToRecipe);
}

export async function deleteRecipe(recipeId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase
    .from('generated_recipes')
    .delete()
    .eq('id', recipeId);

  if (error) {
    throw error;
  }
}

export async function checkContentSafety(text: string): Promise<boolean> {
  if (!genAI) {
    throw new Error('Gemini API not configured');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `## 역할 및 목표
당신은 생성된 레시피 내용에 유해하거나 비도덕적인 내용이 포함되어 있는지 검토하는 안전 필터 AI입니다. 응답은 반드시 'SAFE' 또는 'UNSAFE' 둘 중 하나여야 합니다.

## 입력
${text}

## 출력 (단일 단어만 반환)
안전할 경우: 'SAFE'
부적절할 경우: 'UNSAFE'`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const responseText = response.text().trim();

    return responseText === 'SAFE';
  } catch (error) {
    console.error('Safety check error:', error);
    return false;
  }
}

export async function saveUserRecipe(recipe: Recipe): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  if (!genAI) {
    throw new Error('Gemini API not configured');
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('User must be logged in');
  }

  // 중복 저장 확인
  const { data: existingRecipe } = await supabase
    .from('user_recipes')
    .select('id')
    .eq('user_id', session.user.id)
    .eq('original_recipe_id', recipe.id)
    .maybeSingle();

  if (existingRecipe) {
    throw new Error('이미 저장된 레시피입니다.');
  }

  const contentToCheck = `
    Title: ${recipe.title}
    Instructions: ${recipe.instructions.join(' ')}
    Tips: ${recipe.deep_info.tips?.join(' ') || ''}
  `;

  const isSafe = await checkContentSafety(contentToCheck);

  if (!isSafe) {
    throw new Error('레시피 내용이 안전 기준을 통과하지 못했습니다. 부적절한 내용이 포함되어 있을 수 있습니다.');
  }

  const { error } = await supabase
    .from('user_recipes')
    .insert([{
      user_id: session.user.id,
      original_recipe_id: recipe.id,
      title: recipe.title,
      main_ingredients: recipe.main_ingredients,
      theme_tags: recipe.theme_tags,
      ingredients_detail: recipe.ingredients_detail,
      instructions: recipe.instructions,
      nutrition: recipe.nutrition,
      deep_info: recipe.deep_info,
      cooking_time: recipe.cooking_time,
      servings: recipe.servings,
      safety_consent: true,
      safety_check_passed: true,
    }]);

  if (error) {
    throw error;
  }
}

export async function unsaveUserRecipe(recipeId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('User must be logged in');
  }

  console.log('[unsaveUserRecipe] 삭제 시도:', recipeId);

  // RPC 함수 호출 (서버에서 id 또는 original_recipe_id로 삭제)
  const { data, error } = await supabase.rpc('unsave_recipe', {
    p_recipe_id: recipeId
  });

  console.log('[unsaveUserRecipe] RPC 결과:', { data, error });

  if (error) {
    console.error('[unsaveUserRecipe] 삭제 실패:', error);
    throw new Error(error.message || '레시피 저장 취소에 실패했습니다.');
  }

  if (!data) {
    console.warn('[unsaveUserRecipe] 삭제할 레시피를 찾지 못했습니다');
    // 이미 삭제되었거나 존재하지 않는 경우 - 에러 발생하지 않음
  }
}

export async function searchPublicRecipes(searchQuery: string): Promise<Recipe[]> {
  if (!supabase) {
    return [];
  }

  const query = searchQuery.toLowerCase().trim();

  if (!query) {
    const { data, error } = await supabase
      .from('generated_recipes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Fetch error:', error);
      return [];
    }

    return (data || []).map(databaseToRecipe);
  }

  const { data, error } = await supabase
    .from('generated_recipes')
    .select('*')
    .or(`title.ilike.%${query}%,main_ingredients.cs.{${query}},theme_tags.cs.{${query}}`)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Search error:', error);
    return [];
  }

  return (data || []).map(databaseToRecipe);
}

/**
 * 페이지네이션을 지원하는 레시피 검색 함수 (무한 스크롤용)
 * @param searchQuery 검색어
 * @param page 페이지 번호 (0부터 시작)
 * @param pageSize 페이지당 항목 수
 */
export async function searchPublicRecipesPaginated(
  searchQuery: string,
  page: number = 0,
  pageSize: number = 20
): Promise<Recipe[]> {
  if (!supabase) {
    return [];
  }

  const query = searchQuery.toLowerCase().trim();
  const from = page * pageSize;
  const to = from + pageSize - 1;

  if (!query) {
    const { data, error } = await supabase
      .from('generated_recipes')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Fetch error:', error);
      return [];
    }

    return (data || []).map(databaseToRecipe);
  }

  const { data, error } = await supabase
    .from('generated_recipes')
    .select('*')
    .or(`title.ilike.%${query}%,main_ingredients.cs.{${query}},theme_tags.cs.{${query}}`)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Search error:', error);
    return [];
  }

  return (data || []).map(databaseToRecipe);
}

export async function searchRecipes(searchQuery: string): Promise<Recipe[]> {
  if (!supabase) {
    return [];
  }

  if (!searchQuery.trim()) {
    return getUserRecipes();
  }

  const query = searchQuery.toLowerCase();

  const { data, error } = await supabase
    .from('user_recipes')
    .select('*')
    .or(`title.ilike.%${query}%,main_ingredients.cs.{${query}},theme_tags.cs.{${query}}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Search error:', error);
    return [];
  }

  return (data || []).map(databaseToRecipe);
}
/**
 * ID로 레시피 조회 (최근 본 레시피 기능용)
 * generated_recipes와 user_recipes 테이블 모두 확인
 */
export async function getRecipeById(recipeId: string): Promise<Recipe | null> {
  if (!supabase) {
    return null;
  }

  // 먼저 generated_recipes 테이블 확인
  const { data: generatedData, error: generatedError } = await supabase
    .from('generated_recipes')
    .select('*')
    .eq('id', recipeId)
    .maybeSingle();

  if (generatedError) {
    console.error('Error fetching from generated_recipes:', generatedError);
  }

  if (generatedData) {
    return databaseToRecipe(generatedData);
  }

  // generated_recipes에 없으면 user_recipes 테이블 확인
  const { data: userData, error: userError } = await supabase
    .from('user_recipes')
    .select('*')
    .eq('id', recipeId)
    .maybeSingle();

  if (userError) {
    console.error('Error fetching from user_recipes:', userError);
    return null;
  }

  // user_recipes의 데이터 구조가 다르므로 변환
  if (userData) {
    return {
      id: userData.id,
      title: userData.title,
      description: userData.description || '',
      main_ingredients: userData.main_ingredients || [],
      theme_tags: userData.theme_tags || [],
      ingredients_detail: userData.ingredients_detail || [],
      instructions: userData.instructions || [],
      meta: {
        difficulty: userData.difficulty,
        cooking_time_min: userData.cooking_time_min,
        calories_per_serving: userData.calories_per_serving,
      },
      nutrition: userData.nutrition || {
        calories: userData.calories_per_serving || 0,
        protein: 0,
        fat: 0,
        carbohydrates: 0,
      },
      deep_info: userData.deep_info || {},
      cooking_time: userData.cooking_time_min || userData.cooking_time || 30,
      servings: userData.servings || 2,
      created_at: userData.created_at,
    };
  }

  return null;
}

/**
 * 1. 재료가 비슷한 요리 추천 (같은 main_ingredients 기반)
 * @param currentRecipe 현재 레시피
 * @param limit 반환할 레시피 수 (기본값: 5)
 */
export async function getSimilarIngredientRecipes(
  currentRecipe: Recipe,
  limit: number = 5
): Promise<Recipe[]> {
  if (!supabase || !currentRecipe) {
    return [];
  }

  try {
    const mainIngredients = currentRecipe.main_ingredients || [];
    const themeTags = currentRecipe.theme_tags || [];

    if (mainIngredients.length === 0) {
      return [];
    }

    // 같은 재료를 사용하는 레시피 찾기
    const { data, error } = await supabase
      .from('generated_recipes')
      .select('*')
      .neq('id', currentRecipe.id)
      .or(`main_ingredients.ov.{${mainIngredients.join(',')}}`)
      .order('created_at', { ascending: false })
      .limit(limit * 2);

    if (error) {
      console.error('Error fetching similar ingredient recipes:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // 관련도 점수 계산 (재료 중심)
    const recipesWithScore = data.map((dbRecipe) => {
      const recipe = databaseToRecipe(dbRecipe);
      let score = 0;

      // 같은 재료 개수만큼 점수 추가 (가중치 높음)
      const commonIngredients = (recipe.main_ingredients || []).filter(ing =>
        mainIngredients.includes(ing)
      );
      score += commonIngredients.length * 5;

      // 같은 테마 태그는 보너스 점수
      const commonTags = (recipe.theme_tags || []).filter(tag =>
        themeTags.includes(tag)
      );
      score += commonTags.length * 1;

      return { recipe, score };
    });

    return recipesWithScore
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.recipe);

  } catch (error) {
    console.error('Error in getSimilarIngredientRecipes:', error);
    return [];
  }
}

/**
 * 2. 같이 먹으면 좋은 짝꿍 요리 추천
 * @param currentRecipe 현재 레시피
 * @param limit 반환할 레시피 수 (기본값: 4)
 */
export async function getCompanionRecipes(
  currentRecipe: Recipe,
  limit: number = 4
): Promise<Recipe[]> {
  if (!supabase || !currentRecipe) {
    return [];
  }

  try {
    const themeTags = currentRecipe.theme_tags || [];

    // 현재 레시피 타입 판별
    const sideDishTags = ['반찬', '국', '찌개', '전', '조림', '무침', '볶음', '김치'];
    const mainDishTags = ['메인', '구이', '찜', '덮밥', '볶음밥', '비빔밥'];

    const isMainDish = themeTags.some(tag => mainDishTags.includes(tag));
    const isSideDish = themeTags.some(tag => sideDishTags.includes(tag));

    let targetTags: string[];

    if (isMainDish) {
      // 메인 요리면 사이드 디시 추천
      targetTags = sideDishTags;
    } else if (isSideDish) {
      // 사이드 디시면 메인 요리 추천
      targetTags = mainDishTags;
    } else {
      // 판별 안 되면 사이드 디시 추천 (범용)
      targetTags = sideDishTags;
    }

    // 짝꿍 요리 검색
    const { data, error } = await supabase
      .from('generated_recipes')
      .select('*')
      .neq('id', currentRecipe.id)
      .or(targetTags.map(tag => `theme_tags.cs.{${tag}}`).join(','))
      .order('created_at', { ascending: false })
      .limit(limit * 2);

    if (error) {
      console.error('Error fetching companion recipes:', error);
      return [];
    }

    if (!data || data.length === 0) {
      // 짝꿍 요리가 없으면 랜덤 레시피 반환
      const { data: fallbackData } = await supabase
        .from('generated_recipes')
        .select('*')
        .neq('id', currentRecipe.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      return (fallbackData || []).map(databaseToRecipe);
    }

    return data
      .map(databaseToRecipe)
      .slice(0, limit);

  } catch (error) {
    console.error('Error in getCompanionRecipes:', error);
    return [];
  }
}

/**
 * 3. 영양 균형을 맞춘 요리 추천
 * @param currentRecipe 현재 레시피
 * @param limit 반환할 레시피 수 (기본값: 4)
 */
export async function getBalancedNutritionRecipes(
  currentRecipe: Recipe,
  limit: number = 4
): Promise<Recipe[]> {
  if (!supabase || !currentRecipe) {
    return [];
  }

  try {
    // 모든 레시피 중 영양 정보가 있는 것만 가져오기
    const { data, error } = await supabase
      .from('generated_recipes')
      .select('*')
      .neq('id', currentRecipe.id)
      .order('created_at', { ascending: false })
      .limit(50); // 50개 가져와서 필터링

    if (error) {
      console.error('Error fetching balanced nutrition recipes:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // 영양 균형 점수 계산
    const recipesWithScore = data
      .map(databaseToRecipe)
      .filter(recipe => {
        const nutrition = recipe.nutrition;
        return nutrition && nutrition.calories > 0;
      })
      .map(recipe => {
        const nutrition = recipe.nutrition!;
        const totalCalories = nutrition.calories;

        if (totalCalories === 0) {
          return { recipe, score: 0 };
        }

        // 영양소별 칼로리 계산 (단백질 4kcal/g, 지방 9kcal/g, 탄수화물 4kcal/g)
        const proteinCal = nutrition.protein * 4;
        const fatCal = nutrition.fat * 9;
        const carbsCal = nutrition.carbohydrates * 4;
        const totalMacroCalories = proteinCal + fatCal + carbsCal;

        if (totalMacroCalories === 0) {
          return { recipe, score: 0 };
        }

        // 영양소 비율 계산
        const proteinRatio = proteinCal / totalMacroCalories;
        const fatRatio = fatCal / totalMacroCalories;
        const carbsRatio = carbsCal / totalMacroCalories;

        // 균형잡힌 영양소 비율 기준
        // 이상적: 단백질 25-35%, 탄수화물 40-50%, 지방 20-30%
        let score = 0;

        // 단백질 점수 (25-35% 이상적)
        if (proteinRatio >= 0.25 && proteinRatio <= 0.35) {
          score += 10;
        } else if (proteinRatio >= 0.20 && proteinRatio < 0.25) {
          score += 7;
        } else if (proteinRatio > 0.35 && proteinRatio <= 0.40) {
          score += 7;
        }

        // 탄수화물 점수 (40-50% 이상적)
        if (carbsRatio >= 0.40 && carbsRatio <= 0.50) {
          score += 10;
        } else if (carbsRatio >= 0.35 && carbsRatio < 0.40) {
          score += 7;
        } else if (carbsRatio > 0.50 && carbsRatio <= 0.55) {
          score += 7;
        }

        // 지방 점수 (20-30% 이상적)
        if (fatRatio >= 0.20 && fatRatio <= 0.30) {
          score += 10;
        } else if (fatRatio >= 0.15 && fatRatio < 0.20) {
          score += 7;
        } else if (fatRatio > 0.30 && fatRatio <= 0.35) {
          score += 7;
        }

        // 칼로리 적정성 보너스 (200-500kcal)
        if (totalCalories >= 200 && totalCalories <= 500) {
          score += 5;
        }

        return { recipe, score };
      });

    // 점수 순으로 정렬하고 상위 레시피 반환
    return recipesWithScore
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.recipe);

  } catch (error) {
    console.error('Error in getBalancedNutritionRecipes:', error);
    return [];
  }
}

/**
 * [Deprecated] 기존 관련 레시피 함수 (하위 호환용, 내부적으로 getSimilarIngredientRecipes 사용)
 */
export async function getRelatedRecipes(
  currentRecipe: Recipe,
  limit: number = 6
): Promise<Recipe[]> {
  return getSimilarIngredientRecipes(currentRecipe, limit);
}

/**
 * 랜덤 레시피 가져오기 (HomePage용)
 * 최신 100개에서 랜덤 선택
 */
export async function getRandomRecipes(limit: number = 12): Promise<Recipe[]> {
  try {
    const { data, error } = await supabase
      .from('generated_recipes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100); // 최신 100개에서 선택

    if (error) {
      console.error('Supabase error in getRandomRecipes:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ No recipes found in database');
      return [];
    }

    console.log(`✅ Loaded ${data.length} recipes from database`);

    // 클라이언트 측에서 랜덤 셔플
    const shuffled = [...data].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, limit);

    // Recipe 형식으로 변환
    return selected.map(dbRecipe => databaseToRecipe(dbRecipe));
  } catch (error) {
    console.error('Failed to get random recipes:', error);
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);
    return [];
  }
}

/**
 * 레시피 설명 추출 (HomePage 카드용)
 * content 필드에서 HTML 태그 제거 후 앞부분 추출
 */
export function extractRecipeDescription(
  recipe: Recipe,
  maxLength: number = 100
): string {
  // content가 없으면 description 사용
  const rawText = recipe.description || '';

  if (!rawText) return '맛있는 요리를 만들어보세요!';

  // HTML 태그 제거 및 정리
  const cleanText = rawText
    .replace(/<[^>]*>/g, '') // HTML 태그 제거
    .replace(/&nbsp;/g, ' ') // &nbsp; 제거
    .replace(/\n+/g, ' ') // 줄바꿈을 공백으로
    .replace(/\s+/g, ' ') // 연속 공백 제거
    .trim();

  if (cleanText.length <= maxLength) {
    return cleanText;
  }

  // maxLength까지 자르고 마지막 온전한 단어까지만 포함
  const truncated = cleanText.slice(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');

  if (lastSpaceIndex > maxLength * 0.8) {
    // 80% 이상 위치에 공백이 있으면 그곳에서 자르기
    return truncated.slice(0, lastSpaceIndex) + '...';
  }

  return truncated + '...';
}
