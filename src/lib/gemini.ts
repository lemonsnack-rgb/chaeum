import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

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
    return '기타';
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `다음 재료를 가장 적합한 카테고리로 분류하세요. 다음 중 하나만 정확히 응답하세요: 육류, 채소, 어패류, 곡류, 유제품, 양념, 과일, 기타

재료: ${ingredientName}

분류 기준:
- 육류: 소고기, 돼지고기, 닭고기, 양고기, 오리고기, 베이컨, 햄, 소시지 등
- 채소: 양파, 당근, 감자, 배추, 무, 파, 마늘, 생강, 버섯, 고추, 토마토, 호박, 가지, 브로콜리 등
- 어패류: 생선, 새우, 오징어, 조개, 게, 참치, 연어, 고등어 등
- 곡류: 쌀, 밀가루, 빵, 면, 파스타, 시리얼, 떡 등
- 유제품: 우유, 치즈, 버터, 요구르트, 크림 등
- 양념: 간장, 소금, 설탕, 후추, 기름, 식초, 고추장, 된장, 참기름, 소스류, 향신료 등
- 과일: 사과, 배, 바나나, 딸기, 포도, 수박, 오렌지 등
- 기타: 위 카테고리에 속하지 않는 식재료

응답 (카테고리명만): `;

    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();

    const validCategories = ['육류', '채소', '어패류', '곡류', '유제품', '양념', '과일', '기타'];
    for (const category of validCategories) {
      if (response.includes(category)) {
        return category;
      }
    }
    return '기타';
  } catch (error) {
    console.error('Classification error:', error);
    return '기타';
  }
}
