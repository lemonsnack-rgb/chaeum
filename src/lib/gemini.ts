import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

// 환경 변수 디버깅
if (!apiKey) {
  console.error('❌ Gemini API 키가 설정되지 않았습니다!');
  console.error('VITE_GEMINI_API_KEY:', apiKey ? '✅ 설정됨' : '❌ 없음');
  console.error('');
  console.error('해결 방법:');
  console.error('1. .env 파일에 VITE_GEMINI_API_KEY가 있는지 확인');
  console.error('2. 개발 서버를 재시작 (npm run dev)');
}

export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function extractIngredientsFromImage(imageFile: File): Promise<string[]> {
  if (!genAI) {
    throw new Error('Gemini API key not configured');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const imageData = await fileToGenerativePart(imageFile);

  const prompt = `이 이미지를 분석하여 식재료 이름만 JSON 배열로 추출해주세요.

## 추출 규칙
1. **비식재료 제외**: '수세미', '세제', '칫솔', '비닐봉투', '휴지' 등 먹을 수 없는 모든 공산품이나 비식재료는 절대 포함하지 마세요.

2. **디저트/완제품 포함**: '콜라', '사이다', '수박바', '초콜릿', '아이스크림', '과자' 등 먹을 수 있는 디저트, 음료, 완제품은 추출 목록에 포함하세요.

3. **오타 보정**:
   - '신딸기' → '산딸기'
   - '시빵' → '식빵'
   - '깨끗히' → '깻잎'
   - 명백한 OCR 오타는 보정하여 정확한 식재료명으로 추출하세요.

4. **정확도 필터**: 식별 정확도가 매우 낮거나 불분명한 단어는 추출하지 마세요.

5. **식재료 표준화**: 가능한 한 일반적이고 표준화된 식재료명을 사용하세요.
   - '대파' (O), '파' (X)
   - '양파' (O), '양파1개' (X)

응답은 반드시 다음 형식의 JSON 배열만 반환하세요: ["재료1", "재료2", "재료3"]
설명이나 주석 없이 오직 JSON 배열만 반환하세요.`;

  const result = await model.generateContent([prompt, imageData]);
  const response = result.response;
  const text = response.text();

  console.log('Gemini OCR response:', text);

  const jsonMatch = text.match(/\[.*\]/s);
  if (jsonMatch) {
    const ingredients = JSON.parse(jsonMatch[0]);
    console.log('Parsed ingredients:', ingredients);
    return ingredients;
  }

  console.warn('No JSON array found in response');
  return [];
}

async function fileToGenerativePart(file: File) {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      const base64Content = base64data.split(',')[1];
      resolve({
        inlineData: {
          data: base64Content,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function classifyIngredient(ingredientName: string): Promise<string> {
  if (!genAI) {
    return '주재료';
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `다음 재료를 "주재료" 또는 "부재료" 중 하나로 분류하세요. 오직 한 단어만 응답하세요.

재료: ${ingredientName}

분류 기준:
- 주재료: 닭고기, 돼지고기, 소고기, 생선, 감자, 양파, 당근, 버섯, 두부, 계란, 쌀, 면, 파스타 등 요리의 주된 재료
- 부재료: 간장, 소금, 설탕, 후추, 기름, 식초, 고추장, 된장, 마늘, 생강, 소스, 양념류 등

응답: `;

    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();

    if (response.includes('부재료')) {
      return '부재료';
    }
    return '주재료';
  } catch (error) {
    console.error('Classification error:', error);
    return '주재료';
  }
}

export async function analyzeInventory(ingredients: string[]): Promise<any> {
  if (!genAI) {
    throw new Error('Gemini API key not configured');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `다음은 사용자의 냉장고에 있는 재료 목록입니다:
${ingredients.join(', ')}

이 재료들을 카테고리별로 분류하고, 부족한 재료를 추천해주세요.

## 분석 기준

### 카테고리 분류
- 육류: 소고기, 돼지고기, 닭고기, 양고기 등
- 채소: 모든 채소류 (당근, 양파, 감자, 배추, 상추, 대파, 쪽파 등)
  * 주의: "대파", "쪽파"는 채소이지만, "초코파이", "애플파이" 같은 디저트는 가공식품입니다
- 수산물: 생선, 오징어, 새우, 조개 등
- 양념: 소금, 간장, 고추장, 된장, 설탕, 식초, 참기름, 식용유, 마늘, 생강 등
- 가공식품: 라면, 통조림, 햄, 소시지, 치즈, 과자, 초코파이, 애플파이, 빵, 케이크 등 가공된 식품
- 기타: 쌀, 달걀, 우유, 두부 등 위 카테고리에 속하지 않는 재료

### 분류 주의사항
**중요**: 재료명을 전체적으로 판단하세요
- "초코파이", "애플파이" → 가공식품 (채소가 아님)
- "대파", "쪽파" → 채소 (파이가 아님)
- "콜라", "사이다", "음료수" → 가공식품
- 맥락을 고려하여 정확하게 분류하세요

### 상태 평가
- "sufficient": 해당 카테고리에 3개 이상의 재료가 있음
- "low": 1-2개의 재료만 있음
- "empty": 재료가 없음

### 추천 기준
- 없거나 부족한 카테고리에 대해서만 추천
- 영양 균형을 고려한 추천
- 한국 가정에서 자주 사용하는 재료 우선 추천
- 카테고리당 2-3개의 구체적인 재료 추천

## 응답 형식

다음 JSON 형식으로만 응답하세요. 설명이나 주석 없이 JSON만 반환하세요:

{
  "categories": [
    {
      "name": "육류",
      "icon": "📦",
      "items": ["소고기", "닭고기"],
      "status": "sufficient"
    },
    {
      "name": "채소",
      "icon": "🥬",
      "items": ["당근", "양파", "감자"],
      "status": "sufficient"
    },
    {
      "name": "수산물",
      "icon": "🐟",
      "items": [],
      "status": "empty"
    },
    {
      "name": "양념",
      "icon": "🧂",
      "items": ["소금", "간장"],
      "status": "low"
    },
    {
      "name": "가공식품",
      "icon": "🥫",
      "items": ["라면"],
      "status": "low"
    },
    {
      "name": "기타",
      "icon": "📌",
      "items": ["쌀", "달걀"],
      "status": "sufficient"
    }
  ],
  "suggestions": [
    {
      "category": "수산물",
      "items": ["생선", "오징어", "새우"],
      "reason": "단백질 균형을 위해"
    },
    {
      "category": "양념",
      "items": ["고추장", "된장", "참기름"],
      "reason": "다양한 요리를 위해"
    }
  ]
}

반드시 위 형식의 JSON만 반환하세요.`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  console.log('Gemini inventory analysis response:', text);

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const analysis = JSON.parse(jsonMatch[0]);
    console.log('Parsed inventory analysis:', analysis);
    return analysis;
  }

  throw new Error('Failed to parse inventory analysis response');
}
