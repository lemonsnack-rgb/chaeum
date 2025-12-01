import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { randomUUID } from 'crypto';
import { selectRandomIngredient, INGREDIENT_DATABASE } from './ingredient-database';
import { generateRecipePrompt } from '../src/ai/recipe_generation_prompt';

// 환경 변수 체크
if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY || !process.env.VITE_GEMINI_API_KEY) {
  console.error('❌ 필수 환경 변수가 설정되지 않았습니다:');
  console.error('  - VITE_SUPABASE_URL');
  console.error('  - VITE_SUPABASE_ANON_KEY');
  console.error('  - VITE_GEMINI_API_KEY');
  process.exit(1);
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY!);

// 기존 코드와 동일한 인터페이스
interface Recipe {
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
}

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
}

interface RecipeMeta {
  difficulty?: string;
  cooking_time_min?: number;
  calories_per_serving?: number;
  protein?: number;
  fat?: number;
  carbohydrates?: number;
  calorie_signal?: string;
}

interface IngredientDetail {
  name: string;
  amount: string;
  category?: string;
  main_or_sub?: string;
}

interface NutritionInfo {
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
}

interface DeepInfo {
  substitutions?: string;
  tips?: string[];
  difficulty?: string;
  chef_kick?: string;
  storage?: string;
}

// Recipe를 DatabaseRecipe로 변환 (기존 코드와 동일)
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
  };
}

async function generateRecipe() {
  console.log('🤖 레시피 자동 생성 시작... [' + new Date().toLocaleString('ko-KR') + ']');

  try {
    // Step 1: 최근 생성된 재료 조회 (중복 방지)
    const { data: recentRecipes } = await supabase
      .from('generated_recipes')
      .select('main_ingredients')
      .order('created_at', { ascending: false })
      .limit(30);

    const recentIngredients: string[] = [];
    if (recentRecipes) {
      recentRecipes.forEach((r: any) => {
        if (Array.isArray(r.main_ingredients)) {
          recentIngredients.push(...r.main_ingredients);
        }
      });
    }

    // 중복 제거
    const uniqueRecent = [...new Set(recentIngredients)];
    console.log(`📋 최근 30개 레시피에서 사용된 재료: ${uniqueRecent.slice(0, 10).join(', ')}... (총 ${uniqueRecent.length}개)`);

    // Step 2: 재료 선택 (우선순위 기반 가중치 랜덤)
    const mainIngredient = selectRandomIngredient(uniqueRecent);
    console.log(`📦 선택된 메인 재료: ${mainIngredient.name} (우선순위: ${mainIngredient.priority}, 카테고리: ${mainIngredient.category})`);

    // Step 3: 레시피 생성 (기존 generateBatchRecipes 로직과 동일)
    const sortedIngredients = [mainIngredient.name];
    const servings = 2;
    const themePreference = '';
    const allergies: string[] = [];
    const dietaryPreferences: string[] = [];
    const recipesToGenerate = 1; // 한 번에 1개씩 생성

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = generateRecipePrompt({
      sortedIngredients,
      servings,
      themePreference,
      allergies,
      dietaryPreferences,
      recipesToGenerate
    });

    console.log('📨 Gemini API 호출 중...');
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    console.log('📥 Gemini API 응답 받음 (길이:', text.length, 'bytes)');

    // JSON 파싱
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('❌ JSON 배열을 찾을 수 없습니다');
      throw new Error('Invalid response from Gemini - no JSON array found');
    }

    let recipesData: any[];
    try {
      recipesData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('❌ JSON 파싱 실패:', parseError);
      throw new Error('Failed to parse recipe JSON from API');
    }

    if (!recipesData || recipesData.length === 0) {
      throw new Error('No recipes generated from API');
    }

    console.log(`✅ ${recipesData.length}개의 레시피 파싱 완료`);

    // Step 4: Recipe 객체 생성 (기존 로직과 동일)
    const recipeData = recipesData[0]; // 첫 번째 레시피만 사용

    if (!recipeData.title || !recipeData.main_ingredients) {
      throw new Error('Recipe missing required fields');
    }

    const newRecipe: Recipe = {
      id: randomUUID(),
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

    console.log(`📝 생성된 레시피: "${newRecipe.title}"`);
    console.log(`   - 재료: ${newRecipe.ingredients_detail.length}개`);
    console.log(`   - 조리 단계: ${newRecipe.instructions.length}단계`);
    console.log(`   - 조리 시간: ${newRecipe.cooking_time}분`);
    console.log(`   - 칼로리: ${newRecipe.nutrition.calories}kcal/인분`);

    // Step 5: 중복 체크
    const { data: existingRecipe } = await supabase
      .from('generated_recipes')
      .select('id')
      .eq('title', newRecipe.title)
      .maybeSingle();

    if (existingRecipe) {
      console.log('⏭️  동일한 제목의 레시피가 이미 존재합니다. 건너뜁니다.');
      // 로그에만 기록하고 에러는 발생시키지 않음
      await supabase.from('generation_logs').insert({
        ingredient: mainIngredient.name,
        dish_name: newRecipe.title,
        status: 'skipped',
        error_message: 'Duplicate recipe title',
        created_at: new Date().toISOString(),
      });
      return;
    }

    // Step 6: DB 저장 (RPC 함수 사용, 기존 로직과 동일)
    const dbRecipe = recipeToDatabase(newRecipe);

    console.log('💾 데이터베이스에 저장 중...');
    const { data: recipeId, error: insertError } = await supabase
      .rpc('insert_recipe', { recipe_data: dbRecipe });

    if (insertError) {
      console.error('❌ DB 저장 실패:', insertError);
      throw new Error('Failed to save recipe to database: ' + insertError.message);
    }

    console.log(`✅ 레시피 저장 완료! ID: ${recipeId}`);

    // Step 7: 성공 로그 저장
    await supabase.from('generation_logs').insert({
      ingredient: mainIngredient.name,
      dish_name: newRecipe.title,
      status: 'success',
      created_at: new Date().toISOString(),
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 레시피 자동 생성 완료!');
    console.log(`📌 제목: ${newRecipe.title}`);
    console.log(`📌 메인 재료: ${mainIngredient.name}`);
    console.log(`📌 ID: ${recipeId}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error: any) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ 레시피 생성 실패');
    console.error('오류:', error.message || error);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 실패 로그
    try {
      await supabase.from('generation_logs').insert({
        ingredient: 'unknown',
        status: 'failed',
        error_message: error.message || String(error),
        created_at: new Date().toISOString(),
      });
    } catch (logError) {
      console.error('로그 저장 실패:', logError);
    }

    throw error;
  }
}

// 실행
generateRecipe()
  .then(() => {
    console.log('✅ 스크립트 종료');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 스크립트 실행 실패:', error);
    process.exit(1);
  });
