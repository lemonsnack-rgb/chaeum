import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { randomUUID } from 'crypto';
import { selectRandomIngredient } from './ingredient-database';
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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function generateContentWithRetry(model: any, prompt: string) {
  const maxAttempts = 4;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await model.generateContent(prompt);
    } catch (error: any) {
      const status = error?.status;
      const retryable = status === 429 || status === 500 || status === 502 || status === 503 || status === 504;

      if (!retryable || attempt === maxAttempts) {
        throw error;
      }

      const delayMs = 15000 * attempt;
      console.warn(`⚠️ Gemini API 일시 오류(${status || 'unknown'}). ${delayMs / 1000}초 후 재시도합니다. (${attempt}/${maxAttempts})`);
      await sleep(delayMs);
    }
  }

  throw new Error('Gemini API retry loop exited unexpectedly');
}

// 블로그 스타일 필드 인터페이스
interface FAQ {
  question: string;
  answer: string;
}

interface StorageInfo {
  refrigerator_days?: number;
  freezer_days?: number;
  reheating_tip?: string;
}

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
  image_url?: string;
  image_photographer?: string;

  // ===== 블로그 스타일 필드 (NEW) =====
  chef_tips?: string[];
  faq?: FAQ[];
  storage_info?: StorageInfo;
  pairing_suggestions?: string;
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
  image_url?: string;
  image_photographer?: string;

  // 블로그 스타일 필드
  chef_tips?: string[];
  faq?: FAQ[];
  storage_info?: StorageInfo;
  pairing_suggestions?: string;
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
    image_url: recipe.image_url,
    image_photographer: recipe.image_photographer,

    // 블로그 스타일 필드
    chef_tips: recipe.chef_tips,
    faq: recipe.faq,
    storage_info: recipe.storage_info,
    pairing_suggestions: recipe.pairing_suggestions,
  };
}

async function generateRecipesForTheme(
  mainIngredient: { name: string; priority: number; category: string },
  theme: string,
  count: number
): Promise<GenerationResult> {
  const sortedIngredients = [mainIngredient.name];
  const servings = 2;
  const allergies: string[] = [];
  const dietaryPreferences: string[] = [];

  console.log(`\n🎯 테마: "${theme || '(테마 없음)'}" - ${count}개 생성 시작`);

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = generateRecipePrompt({
    sortedIngredients,
    servings,
    themePreference: theme,
    allergies,
    dietaryPreferences,
    recipesToGenerate: count
  });

  console.log('📨 Gemini API 호출 중...');
  const result = await generateContentWithRetry(model, prompt);
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

  // 모든 레시피 순회하며 저장
  let successCount = 0;
  let skipCount = 0;
  let failedCount = 0;

  for (let i = 0; i < recipesData.length; i++) {
    const recipeData = recipesData[i];
    console.log(`\n━━━ [${i + 1}/${recipesData.length}] 레시피 처리 중 ━━━`);

    if (!recipeData.title || !recipeData.main_ingredients) {
      console.warn(`⚠️  레시피 ${i + 1} 필수 필드 누락, 건너뛰기`);
      failedCount++;
      continue;
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

      // 블로그 스타일 필드 (NEW)
      chef_tips: Array.isArray(recipeData.chef_tips) ? recipeData.chef_tips : undefined,
      faq: Array.isArray(recipeData.faq) ? recipeData.faq : undefined,
      storage_info: recipeData.storage_info || undefined,
      pairing_suggestions: recipeData.pairing_suggestions || undefined,
    };

    console.log(`📝 [${i + 1}] "${newRecipe.title}"`);
    console.log(`   - 재료: ${newRecipe.ingredients_detail.length}개, 단계: ${newRecipe.instructions.length}단계`);
    console.log(`   - 조리 시간: ${newRecipe.cooking_time}분, 칼로리: ${newRecipe.nutrition.calories}kcal`);

    // 중복 체크
    const { data: existingRecipe } = await supabase
      .from('generated_recipes')
      .select('id')
      .eq('title', newRecipe.title)
      .maybeSingle();

    if (existingRecipe) {
      console.log(`⏭️  [${i + 1}] 중복된 제목, 건너뜀`);
      skipCount++;
      await supabase.from('generation_logs').insert({
        ingredient: mainIngredient.name,
        dish_name: newRecipe.title,
        status: 'skipped',
        error_message: 'Duplicate recipe title',
        created_at: new Date().toISOString(),
      });
      continue;
    }

    // DB 저장
    const dbRecipe = recipeToDatabase(newRecipe);
    const { data: recipeId, error: insertError } = await supabase
      .rpc('insert_recipe', { recipe_data: dbRecipe });

    if (insertError) {
      console.error(`❌ [${i + 1}] DB 저장 실패:`, insertError.message);
      failedCount++;
      await supabase.from('generation_logs').insert({
        ingredient: mainIngredient.name,
        dish_name: newRecipe.title,
        status: 'failed',
        error_message: insertError.message,
        created_at: new Date().toISOString(),
      });
      continue;
    }

    console.log(`✅ [${i + 1}] 저장 완료! ID: ${recipeId}`);
    successCount++;

    // 성공 로그
    await supabase.from('generation_logs').insert({
      ingredient: mainIngredient.name,
      dish_name: newRecipe.title,
      status: 'success',
      created_at: new Date().toISOString(),
    });
  }

  return {
    success: successCount,
    skipped: skipCount,
    failed: failedCount,
    total: recipesData.length
  };
}

async function generateRecipe() {
  console.log('🤖 레시피 자동 생성 시작... [' + new Date().toLocaleString('ko-KR') + ']');
  console.log('📊 목표: 다양한 레시피 1개 생성 (시간당 1개 자동화)\n');

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

    // Step 3: 자유 테마로 1개 생성 (시간당 1개 자동화)
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 다양한 레시피 생성 중... (1개)');
    console.log('   테마 제약 없이 AI가 자유롭게 다양한 레시피 생성');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const result = await generateRecipesForTheme(mainIngredient, '', 1);

    // 전체 통계
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 레시피 자동 생성 완료!');
    console.log(`📌 메인 재료: ${mainIngredient.name}`);
    console.log(`\n📊 전체 통계:`);
    console.log(`   총 생성: ${result.total}개`);
    console.log(`   ✅ 성공: ${result.success}개`);
    console.log(`   ⏭️  중복: ${result.skipped}개`);
    console.log(`   ❌ 실패: ${result.failed}개`);
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
