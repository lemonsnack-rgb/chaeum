import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 환경 변수 체크
if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_GEMINI_API_KEY || !process.env.VITE_UNSPLASH_ACCESS_KEY) {
  console.error('❌ 필수 환경 변수가 설정되지 않았습니다:');
  console.error('  - VITE_SUPABASE_URL');
  console.error('  - VITE_GEMINI_API_KEY');
  console.error('  - VITE_UNSPLASH_ACCESS_KEY');
  process.exit(1);
}

// SERVICE_ROLE_KEY 또는 ANON_KEY 사용 (SERVICE_ROLE_KEY 우선)
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY 또는 VITE_SUPABASE_ANON_KEY 중 하나가 필요합니다.');
  process.exit(1);
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  supabaseKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY!);
const UNSPLASH_ACCESS_KEY = process.env.VITE_UNSPLASH_ACCESS_KEY!;

interface FAQ {
  question: string;
  answer: string;
}

interface StorageInfo {
  refrigerator_days?: number;
  freezer_days?: number;
  reheating_tip?: string;
}

interface BlogContent {
  chef_tips: string[];
  faq: FAQ[];
  storage_info: StorageInfo;
  pairing_suggestions: string;
}

// 블로그 콘텐츠 생성 프롬프트
function generateBlogContentPrompt(recipeTitle: string, mainIngredients: string[], description: string = ''): string {
  return `당신은 **미슐랭 3스타 셰프이자 전문 푸드 에디터**입니다.

## 레시피 정보
- 요리명: ${recipeTitle}
- 주재료: ${mainIngredients.join(', ')}
${description ? `- 설명: ${description}` : ''}

## 요청사항
위 레시피에 대해 블로그 스타일의 추가 콘텐츠를 생성해주세요.
**반드시 JSON 형식으로만 응답**하고, 다른 설명은 포함하지 마세요.

**🚨 중요**: 모든 텍스트는 **한글**로 작성하십시오. 영어 단어나 재료명 사용 금지.

## 필수 포함 내용

### 1. chef_tips (배열, 필수)
- 셰프의 비법 **3개 이상** 제공
- 친근한 **해요체** 사용 (~해요, ~이에요, ~세요)
- 구체적이고 실용적인 팁
- 예시: ["멸치를 미리 볶으면 비린내가 사라져요", "마지막에 참기름 한 방울이 고소함을 더해줘요"]

### 2. faq (배열, 필수)
- 자주 묻는 질문 **2개 이상**
- 각 항목은 {question: string, answer: string} 형태
- 실용적이고 구체적인 답변 제공
- **해요체** 사용
- 예시:
  - Q: "아이들이 먹기에는 맵지 않나요?"
  - A: "고춧가루 양을 절반으로 줄이거나, 간장 베이스로 변경하시면 아이들도 맛있게 먹을 수 있어요."

### 3. storage_info (객체, 필수)
- refrigerator_days: 냉장 보관 일수 (숫자)
- freezer_days: 냉동 보관 일수 (숫자)
- reheating_tip: 재가열 방법 (구체적으로, 해요체)

### 4. pairing_suggestions (문자열, 필수)
- 이 요리와 잘 어울리는 음식/음료 추천
- 친근한 **해요체** 사용
- 예시: "공깃밥과 김, 계란말이와 함께 먹으면 환상 궁합이에요. 소주나 막걸리와도 잘 어울려요!"

**어조 규칙:**
- 모든 텍스트는 **해요체** 필수 (~해요, ~이에요, ~세요)
- 친근하고 따뜻한 말투
- 독자에게 말을 거는 느낌

## 출력 JSON 형식 (절대 준수)
{
  "chef_tips": ["팁1", "팁2", "팁3"],
  "faq": [
    {"question": "질문1", "answer": "답변1"},
    {"question": "질문2", "answer": "답변2"}
  ],
  "storage_info": {
    "refrigerator_days": 3,
    "freezer_days": 14,
    "reheating_tip": "재가열 방법"
  },
  "pairing_suggestions": "페어링 추천"
}

**중요**: JSON 형식으로만 응답하고, 다른 텍스트는 포함하지 마세요.`;
}

// 블로그 콘텐츠 생성
async function generateBlogContent(recipeTitle: string, mainIngredients: string[], description: string = ''): Promise<BlogContent | null> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const prompt = generateBlogContentPrompt(recipeTitle, mainIngredients, description);

    console.log('   📨 Gemini API 호출 중...');
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    console.log('   📥 응답 받음 (길이:', text.length, 'bytes)');

    // JSON 파싱
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('   ❌ JSON을 찾을 수 없습니다');
      return null;
    }

    const blogContent: BlogContent = JSON.parse(jsonMatch[0]);

    // 유효성 검증
    if (!Array.isArray(blogContent.chef_tips) || blogContent.chef_tips.length < 3) {
      console.error('   ⚠️  chef_tips가 3개 미만입니다');
    }
    if (!Array.isArray(blogContent.faq) || blogContent.faq.length < 2) {
      console.error('   ⚠️  faq가 2개 미만입니다');
    }

    return blogContent;
  } catch (error: any) {
    console.error('   ❌ 블로그 콘텐츠 생성 실패:', error.message);
    return null;
  }
}

// 이미지 연관성 검증
async function verifyImageRelevance(
  recipeTitle: string,
  imageDescription: string,
  searchQuery: string
): Promise<boolean> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const prompt = `당신은 이미지 연관성 검증 전문가입니다.

**요리명:** ${recipeTitle}
**검색어:** ${searchQuery}
**이미지 설명:** ${imageDescription || '(설명 없음)'}

위 이미지가 요리와 연관성이 있는지 판단하세요.

**판단 기준:**
1. 이미지 설명에 요리 관련 키워드가 포함되어 있는가?
2. 음식/요리 사진인가? (재료만 있는 사진, 식당 외관, 사람 등은 제외)
3. 검색어와 이미지 설명의 의미가 일치하는가?

**이미지 설명이 없는 경우:** 검색어에 음식 키워드가 포함되어 있으면 허용

**출력:** "YES" 또는 "NO" (한 단어만)`;

    const result = await model.generateContent(prompt);
    const answer = result.response.text().trim().toUpperCase();

    return answer.includes('YES');
  } catch (error: any) {
    console.error(`   ⚠️  연관성 검증 실패: ${error.message}`);
    // 폴백: 이미지 설명이 없으면 허용 (Unsplash는 음식 사진이 많음)
    return !imageDescription || imageDescription.length < 10;
  }
}

// AI 기반 이미지 검색어 생성
async function generateImageSearchQuery(recipeTitle: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const prompt = `당신은 음식 사진 검색 전문가입니다.

요리명: "${recipeTitle}"

위 요리의 **정확한 영어 명칭**을 포함한 검색어를 생성하세요.

**핵심 규칙 (필수):**
1. **요리 명칭을 반드시 포함** - 요리의 핵심 명칭이 검색어에 들어가야 함
2. 한국 요리: 정확한 로마자 표기 + "korean" 필수 (예: kimchi jjigae korean, bulgogi korean bbq)
3. 서양 요리: 정확한 요리 명칭 + 특징 (예: carbonara pasta, grilled salmon)
4. 일본/중국 요리: 원어 로마자 + 국가명 (예: ramen japanese, mapo tofu chinese)
5. 3-5단어로 구성 (너무 길면 검색 정확도 하락)

**금지 사항:**
- 추상적인 단어만 사용 (예: "delicious food", "asian dish" 금지)
- 요리 명칭 없이 재료만 나열 (예: "chicken vegetables rice" 금지)

**출력 형식:** 검색어만 출력 (설명/기호 없이)

예시:
- "김치찌개" → kimchi jjigae stew korean
- "까르보나라 파스타" → carbonara pasta creamy
- "소고기 덮밥" → beef donburi rice bowl japanese
- "매운 닭발" → dakbal spicy chicken feet korean
- "연어 그릴" → grilled salmon fillet
- "토마토 파스타" → tomato pasta spaghetti italian
- "된장찌개" → doenjang jjigae korean stew`;

    const result = await model.generateContent(prompt);
    const searchQuery = result.response.text().trim().toLowerCase();

    // 불필요한 문장 제거 (설명이 포함된 경우)
    const cleanQuery = searchQuery.split('\n')[0].replace(/^(검색어:|출력:|query:)/i, '').trim();

    return cleanQuery;
  } catch (error: any) {
    console.error(`   ⚠️  AI 검색어 생성 실패: ${error.message}`);
    // 폴백: 기본 검색어 생성
    const words = recipeTitle.replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣]/g, '').split(/\s+/).slice(0, 2).join(' ');
    return `${words} food`;
  }
}

// Unsplash 이미지 검색
async function searchUnsplashImage(recipeTitle: string): Promise<{ url: string; photographer: string } | null> {
  try {
    // AI 기반 검색어 생성
    console.log(`   🤖 AI 검색어 생성 중...`);
    const searchQuery = await generateImageSearchQuery(recipeTitle);
    console.log(`   🔍 Unsplash 검색: "${searchQuery}"`);

    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=3&orientation=landscape`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      console.log(`   ⚠️  Unsplash API 오류: ${response.status}`);
      return null;
    }

    const data: any = await response.json();

    if (data.results && data.results.length > 0) {
      // 검색어와의 연관성 검증 (AI 활용)
      const photo = data.results[0];

      // AI로 이미지 설명과 레시피 제목의 연관성 검증
      const isRelevant = await verifyImageRelevance(
        recipeTitle,
        photo.alt_description || photo.description || '',
        searchQuery
      );

      if (!isRelevant) {
        console.log(`   ❌ 이미지 연관도 낮음 (건너뜀)`);
        return null;
      }

      if (photo.links?.download_location) {
        await fetch(photo.links.download_location, {
          headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` },
        });
      }

      console.log(`   ✅ 이미지 찾음 (연관도 확인됨): ${photo.user.name}`);
      return {
        url: photo.urls.regular,
        photographer: photo.user.name,
      };
    }

    console.log(`   ❌ 이미지를 찾을 수 없습니다.`);
    return null;
  } catch (error: any) {
    console.error(`   ❌ Unsplash 검색 실패:`, error.message);
    return null;
  }
}

// 메인 함수
async function updateExistingRecipes() {
  const BATCH_SIZE = parseInt(process.env.UPDATE_BATCH_SIZE || '20'); // 기본 20개 (rate limit 안전), 환경변수로 조정 가능

  console.log('🔄 기존 레시피 업데이트 시작...');
  console.log(`📊 배치 크기: ${BATCH_SIZE}개\n`);

  try {
    // Step 1: 블로그 콘텐츠나 이미지가 없는 레시피 조회
    console.log('📋 업데이트 대상 레시피 조회 중...');
    const { data: recipes, error: fetchError } = await supabase
      .from('generated_recipes')
      .select('id, title, main_ingredients, content, image_url, chef_tips, faq')
      .or('chef_tips.is.null,faq.is.null,image_url.is.null')
      .order('created_at', { ascending: true }) // 오래된 것부터
      .limit(BATCH_SIZE);

    if (fetchError) {
      throw new Error(`레시피 조회 실패: ${fetchError.message}`);
    }

    if (!recipes || recipes.length === 0) {
      console.log('✅ 업데이트할 레시피가 없습니다!');
      return;
    }

    console.log(`✅ ${recipes.length}개의 레시피를 찾았습니다.\n`);

    // Step 2: 각 레시피에 대해 블로그 콘텐츠 생성 및 업데이트
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < recipes.length; i++) {
      const recipe = recipes[i];
      console.log(`\n━━━ [${i + 1}/${recipes.length}] 레시피 업데이트 중 ━━━`);
      console.log(`📝 제목: ${recipe.title}`);
      console.log(`🆔 ID: ${recipe.id}`);

      const updateData: any = {};

      // 블로그 콘텐츠 생성 (chef_tips나 faq가 없는 경우)
      if (!recipe.chef_tips || !recipe.faq) {
        console.log(`   📝 블로그 콘텐츠 생성 중...`);
        const blogContent = await generateBlogContent(
          recipe.title,
          recipe.main_ingredients || [],
          recipe.content?.description || ''
        );

        if (blogContent) {
          updateData.chef_tips = blogContent.chef_tips;
          updateData.faq = blogContent.faq;
          updateData.storage_info = blogContent.storage_info;
          updateData.pairing_suggestions = blogContent.pairing_suggestions;
          console.log(`   ✅ 블로그 콘텐츠 생성 완료`);
        } else {
          console.log(`   ⚠️  블로그 콘텐츠 생성 실패`);
        }
      }

      // 이미지 검색 (image_url이 없는 경우)
      if (!recipe.image_url) {
        console.log(`   🖼️  이미지 검색 중...`);
        const imageData = await searchUnsplashImage(recipe.title);

        if (imageData) {
          updateData.image_url = imageData.url;
          updateData.image_photographer = imageData.photographer;
          console.log(`   ✅ 이미지 추가 완료`);
        } else {
          console.log(`   ⚠️  이미지 검색 실패`);
        }
      }

      // DB 업데이트
      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('generated_recipes')
          .update(updateData)
          .eq('id', recipe.id);

        if (updateError) {
          console.error(`   ❌ [${i + 1}] DB 업데이트 실패:`, updateError.message);
          failedCount++;
          continue;
        }

        console.log(`   ✅ [${i + 1}] 업데이트 완료!`);
        if (updateData.chef_tips) console.log(`   - 셰프 팁: ${updateData.chef_tips.length}개`);
        if (updateData.faq) console.log(`   - FAQ: ${updateData.faq.length}개`);
        if (updateData.image_url) console.log(`   - 이미지: ${updateData.image_photographer}`);
        successCount++;
      } else {
        console.log(`   ℹ️  업데이트할 항목 없음`);
        successCount++;
      }

      // API 요청 제한 방지를 위한 딜레이 (3초 - rate limit 안전)
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // 전체 통계
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 레시피 업데이트 완료!');
    console.log(`\n📊 전체 통계:`);
    console.log(`   총 처리: ${recipes.length}개`);
    console.log(`   ✅ 성공: ${successCount}개`);
    console.log(`   ❌ 실패: ${failedCount}개`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error: any) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ 레시피 업데이트 실패');
    console.error('오류:', error.message || error);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    throw error;
  }
}

// 실행
updateExistingRecipes()
  .then(() => {
    console.log('✅ 스크립트 종료');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 스크립트 실행 실패:', error);
    process.exit(1);
  });
