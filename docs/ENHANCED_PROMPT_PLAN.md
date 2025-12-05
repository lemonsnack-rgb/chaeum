# 향상된 레시피 프롬프트 적용 계획

## 🎯 목표
미슐랭 셰프 스타일의 친근한 블로그 콘텐츠를 포함한 레시피 생성

## 📋 구현 단계

### Phase 1: 데이터 구조 확장 ✅ 즉시 가능

#### 1.1 Recipe 인터페이스 확장
```typescript
// src/lib/recipeService.ts
export interface Recipe {
  // ... 기존 필드들

  // ===== 새로 추가되는 필드들 =====
  blog_content?: string;        // 마크다운 블로그 전문
  chef_tips?: string[];         // 셰프의 시크릿 팁 배열
  faq?: FAQ[];                  // 자주 묻는 질문
  storage_info?: StorageInfo;   // 보관 정보
  pairing_suggestions?: string; // 페어링 추천
}

interface FAQ {
  question: string;
  answer: string;
}

interface StorageInfo {
  refrigerator_days?: number;   // 냉장 보관 일수
  freezer_days?: number;         // 냉동 보관 일수
  reheating_tip?: string;        // 재가열 팁
}
```

#### 1.2 DB 마이그레이션
```sql
-- Supabase SQL
ALTER TABLE generated_recipes
ADD COLUMN IF NOT EXISTS blog_content TEXT,
ADD COLUMN IF NOT EXISTS chef_tips JSONB,
ADD COLUMN IF NOT EXISTS faq JSONB,
ADD COLUMN IF NOT EXISTS storage_info JSONB,
ADD COLUMN IF NOT EXISTS pairing_suggestions TEXT;

COMMENT ON COLUMN generated_recipes.blog_content IS '마크다운 형식의 블로그 콘텐츠';
COMMENT ON COLUMN generated_recipes.chef_tips IS '셰프 팁 배열';
COMMENT ON COLUMN generated_recipes.faq IS 'FAQ 배열 {question, answer}';
COMMENT ON COLUMN generated_recipes.storage_info IS '보관 정보 {refrigerator_days, freezer_days, reheating_tip}';
```

---

### Phase 2: 프롬프트 통합 🔧 30분 소요

#### 2.1 프롬프트 파일 생성
`src/ai/blog_style_prompt.ts` (NEW)

```typescript
export const BLOG_STYLE_TEMPLATE = `
당신은 미슐랭 셰프이자 친절한 요리 블로거입니다.
아래 레시피 정보를 바탕으로 **친근하고 따뜻한 블로그 콘텐츠**를 작성해주세요.

## 작성 규칙
1. **해요체** 사용 (예: ~해요, ~이에요, ~세요)
2. 이모지 적절히 활용 (📋 🔥 💡 등)
3. 중요 단어는 **굵게** 표시
4. 독자에게 말을 거는 듯한 어조
5. 구체적이고 실용적인 정보 제공

## 필수 포함 내용
- 재료 대체 가이드 (구체적인 이유와 함께)
- 셰프의 시크릿 팁 (3개 이상)
- 자주 묻는 질문 2개 이상
- 보관 및 재가열 팁
`;
```

#### 2.2 JSON Schema 확장
`src/ai/recipe_schema.ts` 수정

```typescript
export const RECIPE_JSON_SCHEMA_TEMPLATE = `{
  "title": "김치찌개",
  "description": "김치와 돼지고기를 얼큰하게 끓인 한국의 대표 찌개예요...",

  // ... 기존 필드들

  "chef_tips": [
    "멸치를 미리 볶으면 비린내가 사라집니다",
    "마지막에 참기름 한 방울이 고소함을 더해줍니다",
    "묵은지를 사용하면 더 깊은 맛이 나요"
  ],

  "faq": [
    {
      "question": "아이들이 먹기에는 맵지 않나요?",
      "answer": "고춧가루 양을 절반으로 줄이거나, 간장 베이스로 변경하시면 아이들도 맛있게 먹을 수 있어요. 대신 다진 마늘을 조금 더 넣어 풍미를 살려주세요."
    },
    {
      "question": "돼지고기 대신 다른 고기를 써도 되나요?",
      "answer": "소고기나 참치 통조림으로 대체 가능합니다. 소고기는 양지 부위가 좋고, 참치는 기름을 빼지 말고 함께 넣으면 감칠맛이 배가됩니다."
    }
  ],

  "storage_info": {
    "refrigerator_days": 3,
    "freezer_days": 14,
    "reheating_tip": "전자레인지보다는 냄비에 물을 조금 붓고 약불에 데우면 국물이 더 신선해져요. 두부는 재가열 시 부서질 수 있으니 새로 넣는 것을 추천합니다."
  },

  "pairing_suggestions": "공깃밥과 김, 계란말이와 함께 먹으면 환상 궁합입니다. 소주나 막걸리와도 잘 어울려요!"
}`;
```

---

### Phase 3: UI 컴포넌트 추가 🎨 1시간 소요

#### 3.1 RecipeDetail 컴포넌트 확장

**추가할 섹션들:**

1. **셰프의 팁** (chef_tips 표시)
```tsx
{recipe.chef_tips && recipe.chef_tips.length > 0 && (
  <section className="mb-6">
    <h3 className="text-lg font-bold text-gray-900 mb-4">
      💡 셰프의 시크릿 팁
    </h3>
    <div className="space-y-3">
      {recipe.chef_tips.map((tip, idx) => (
        <div key={idx} className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <p className="text-gray-700">
            <span className="font-bold">Tip {idx + 1}.</span> {tip}
          </p>
        </div>
      ))}
    </div>
  </section>
)}
```

2. **보관 및 재가열** (storage_info 표시)
```tsx
{recipe.storage_info && (
  <section className="mb-6">
    <h3 className="text-lg font-bold text-gray-900 mb-4">
      🥡 보관 및 맛있게 먹는 법
    </h3>
    <div className="bg-blue-50 p-4 rounded-xl">
      <ul className="space-y-2 text-gray-700">
        <li>
          <strong>보관 기간:</strong> 냉장 {recipe.storage_info.refrigerator_days}일,
          냉동 {recipe.storage_info.freezer_days}일
        </li>
        <li>
          <strong>재가열 팁:</strong> {recipe.storage_info.reheating_tip}
        </li>
      </ul>
    </div>
  </section>
)}
```

3. **FAQ** (faq 표시)
```tsx
{recipe.faq && recipe.faq.length > 0 && (
  <section className="mb-6">
    <h3 className="text-lg font-bold text-gray-900 mb-4">
      ❓ 자주 묻는 질문
    </h3>
    <div className="space-y-4">
      {recipe.faq.map((item, idx) => (
        <div key={idx} className="border-l-4 border-primary p-4 bg-gray-50 rounded">
          <p className="font-bold text-gray-900 mb-2">Q. {item.question}</p>
          <p className="text-gray-700">A. {item.answer}</p>
        </div>
      ))}
    </div>
  </section>
)}
```

4. **페어링 추천** (pairing_suggestions 표시)
```tsx
{recipe.pairing_suggestions && (
  <section className="mb-6">
    <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-xl border-2 border-pink-200">
      <h4 className="font-bold text-gray-900 mb-2">🍷 페어링 추천</h4>
      <p className="text-gray-700">{recipe.pairing_suggestions}</p>
    </div>
  </section>
)}
```

---

### Phase 4: 프롬프트 통합 실행 🚀 10분 소요

#### 4.1 recipe_generation_prompt.ts 수정

기존 프롬프트 끝에 추가:
```typescript
## 블로그 스타일 콘텐츠 생성 (추가 요구사항)

각 레시피에 대해 다음 필드를 **반드시** 추가하세요:

1. **chef_tips** (배열): 셰프의 비법 3개 이상
   - 예: ["멸치를 미리 볶으면 비린내가 사라집니다", "마지막에 참기름 한 방울"]

2. **faq** (배열): 자주 묻는 질문 2개 이상
   - 각 항목은 {question: string, answer: string} 형태
   - 실용적이고 구체적인 답변 제공

3. **storage_info** (객체):
   - refrigerator_days: 냉장 보관 일수 (숫자)
   - freezer_days: 냉동 보관 일수 (숫자)
   - reheating_tip: 재가열 방법 (문자열, 구체적으로)

4. **pairing_suggestions** (문자열):
   - 이 요리와 잘 어울리는 음식/음료 추천
   - 친근한 해요체로 작성

**어조 규칙:**
- 모든 텍스트는 **해요체** 사용 (~해요, ~이에요, ~세요)
- 친근하고 따뜻한 말투
- 독자에게 말을 거는 느낌

**예시:**
"묵은지를 사용하면 더 깊은 맛이 나요. 대파를 듬뿍 넣으면 칼칼한 맛이 일품이니 꼭 시도해보세요!"
```

---

## 🎯 즉시 실행 가능한 단계

### Step 1: DB 마이그레이션 (5분)
```sql
-- Supabase에서 실행
ALTER TABLE generated_recipes
ADD COLUMN IF NOT EXISTS chef_tips JSONB,
ADD COLUMN IF NOT EXISTS faq JSONB,
ADD COLUMN IF NOT EXISTS storage_info JSONB,
ADD COLUMN IF NOT EXISTS pairing_suggestions TEXT;
```

### Step 2: 타입 정의 수정 (5분)
`src/lib/recipeService.ts` 파일에 인터페이스 추가

### Step 3: 프롬프트 수정 (10분)
`src/ai/recipe_generation_prompt.ts` 파일에 블로그 스타일 지시사항 추가

### Step 4: UI 컴포넌트 추가 (30분)
`src/components/RecipeDetail.tsx`에 새로운 섹션 추가

### Step 5: 테스트 (10분)
```bash
npm run generate-recipe
```

---

## 📊 예상 효과

### 사용자 경험
- ✅ 더 풍부하고 친근한 콘텐츠
- ✅ 실용적인 팁과 FAQ로 요리 성공률 향상
- ✅ 보관/재가열 정보로 음식물 낭비 감소

### SEO
- ✅ 풍부한 텍스트 콘텐츠 (Google 선호)
- ✅ FAQ Schema 추가 가능 (Featured Snippet)
- ✅ 사용자 체류 시간 증가

### API 비용
- ⚠️ Gemini API 응답이 약 30% 증가 (더 긴 텍스트)
- ✅ 하지만 1회 호출로 모든 콘텐츠 생성 (추가 호출 없음)

---

## 🚨 주의사항

1. **JSON 파싱 안정성**
   - 더 긴 응답으로 파싱 실패 가능성 증가
   - 에러 핸들링 강화 필요

2. **DB 용량**
   - 레시피당 약 2-3KB 추가 데이터
   - 1000개 레시피 = 약 3MB (문제없음)

3. **기존 레시피**
   - 기존 레시피는 새 필드가 NULL
   - 점진적으로 업데이트 또는 재생성 필요

---

## ✅ 체크리스트

- [ ] Supabase DB 마이그레이션 실행
- [ ] Recipe 인터페이스 확장
- [ ] DatabaseRecipe 인터페이스 확장
- [ ] recipeToDatabase 함수 수정
- [ ] databaseToRecipe 함수 수정
- [ ] recipe_generation_prompt.ts 수정
- [ ] recipe_schema.ts 수정
- [ ] RecipeDetail.tsx UI 추가
- [ ] 테스트 레시피 생성
- [ ] 프로덕션 배포

---

## 🔄 롤백 계획

문제 발생 시:
1. 프롬프트를 이전 버전으로 되돌림
2. UI 컴포넌트에서 `?` 옵셔널 체크로 안전하게 처리
3. DB 컬럼은 NULL 허용이므로 삭제 불필요
