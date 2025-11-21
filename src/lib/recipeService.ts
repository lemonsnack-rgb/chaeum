import { supabase } from './supabase';
import { genAI } from './gemini';
import { generateRecipePrompt } from '../ai/recipe_generation_prompt';

export interface Recipe {
  id: string;
  user_id: string;
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
  updated_at: string;
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

  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      const { data: cached, error: cacheError } = await supabase
        .from('generated_recipes')
        .select('*')
        .eq('user_id', session.user.id)
        .contains('main_ingredients', sortedIngredients)
        .order('created_at', { ascending: false })
        .limit(3);

      if (cacheError) {
        console.error('Cache lookup error:', cacheError);
      }

      if (cached && cached.length > 0) {
        cachedRecipes.push(...(cached as Recipe[]));
      }
    }
  }

  if (cachedRecipes.length >= 3) {
    return cachedRecipes.slice(0, 3);
  }

  const allergies: string[] = [];
  const dietaryPreferences: string[] = [];

  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('allergies, dietary_preferences')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile) {
        allergies.push(...(profile.allergies || []));
        dietaryPreferences.push(...(profile.dietary_preferences || []));
      }
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

  let userId: string | null = null;
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      userId = session.user.id;
    }
  }

  // If user is not authenticated, generate a temporary UUID for anonymous users
  if (!userId) {
    userId = crypto.randomUUID();
    console.log('Using anonymous user ID:', userId);
  }

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
      user_id: userId,
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
      updated_at: new Date().toISOString(),
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

  if (supabase) {
    console.log('Attempting to save recipes to database...');
    console.log('Recipes to insert:', JSON.stringify(newRecipes, null, 2));

    const { data: insertedRecipes, error: insertError } = await supabase
      .from('generated_recipes')
      .insert(newRecipes)
      .select();

    if (insertError) {
      console.error('Database insert error:', insertError);
      console.error('Error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
      throw new Error('레시피를 데이터베이스에 저장하는 중 오류가 발생했습니다: ' + insertError.message);
    }

    if (insertedRecipes && insertedRecipes.length > 0) {
      console.log(`✅ Successfully saved ${insertedRecipes.length} recipes to database`);
      console.log('Inserted recipe IDs:', insertedRecipes.map(r => r.id));
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

  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      const { data: cachedRecipe, error: cacheError } = await supabase
        .from('generated_recipes')
        .select('*')
        .eq('user_id', session.user.id)
        .contains('main_ingredients', sortedIngredients)
        .maybeSingle();

      if (cacheError) {
        console.error('Cache lookup error:', cacheError);
      }

      if (cachedRecipe) {
        return cachedRecipe as Recipe;
      }
    }
  }

  const allergies: string[] = [];
  const dietaryPreferences: string[] = [];

  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('allergies, dietary_preferences')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile) {
        allergies.push(...(profile.allergies || []));
        dietaryPreferences.push(...(profile.dietary_preferences || []));
      }
    }
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `## 역할 및 목표
당신은 사용자의 냉장고 재료를 기반으로 안전하고 영양가 있으며, SEO에 최적화된 레시피를 생성하는 전문 셰프 AI입니다. 응답은 반드시 지정된 JSON 스키마를 **절대적으로 준수**해야 합니다. 다른 텍스트 설명 없이 **오직 JSON 객체만** 반환하십시오.

## 입력 재료 및 조건
1. 사용자 보유 재료 (필수 사용): ${sortedIngredients.join(', ')}
2. 인분 기준: ${servings}인분
3. 레시피 모드: 가성비 모드
${themePreference ? `4. 테마 선호: ${themePreference}` : ''}
${allergies.length > 0 ? `${themePreference ? '5' : '4'}. **[필수 안전 조건] 제외 재료 (알레르기 필터): ${allergies.join(', ')}**` : ''}
${dietaryPreferences.length > 0 ? `${(themePreference ? 1 : 0) + (allergies.length > 0 ? 1 : 0) + 4}. 식단 선호: ${dietaryPreferences.join(', ')}` : ''}

## 출력 상세 요구사항
1. **제외 재료(알레르기)가 포함된 요리는 절대 생성하지 마십시오.**
2. 제외 재료로 인해 레시피가 변경된 경우, 반드시 합리적인 대체 재료를 제안하고 그 이유를 명시하십시오.
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
  "title": "레시피 제목",
  "description": "한 줄 요약",
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
    user_id: 'anonymous',
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
    updated_at: new Date().toISOString(),
  };

  return newRecipe;
}

export async function getUserRecipes(): Promise<Recipe[]> {
  if (!supabase) {
    return [];
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return [];
  }

  const { data, error } = await supabase
    .from('generated_recipes')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching recipes:', error);
    return [];
  }

  return (data || []) as Recipe[];
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

    return (data || []) as Recipe[];
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

  return (data || []) as Recipe[];
}

export async function searchRecipes(searchQuery: string): Promise<Recipe[]> {
  if (!supabase) {
    return [];
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return [];
  }

  if (!searchQuery.trim()) {
    return getUserRecipes();
  }

  const query = searchQuery.toLowerCase();

  const { data, error } = await supabase
    .from('user_recipes')
    .select('*')
    .eq('user_id', session.user.id)
    .or(`title.ilike.%${query}%,main_ingredients.cs.{${query}},theme_tags.cs.{${query}}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Search error:', error);
    return [];
  }

  return (data || []) as Recipe[];
}
