# Unsplash API 설정 가이드

레시피 이미지 자동 검색 기능을 위한 Unsplash API 설정 방법입니다.

## 1. Unsplash API 키 발급

### 1.1 Unsplash 개발자 계정 생성
1. [Unsplash Developers](https://unsplash.com/developers) 접속
2. 우측 상단 **"Register as a developer"** 클릭
3. Unsplash 계정으로 로그인 (없으면 회원가입)

### 1.2 애플리케이션 생성
1. 개발자 대시보드에서 **"Your apps"** 메뉴 선택
2. **"New Application"** 버튼 클릭
3. 이용 약관 동의 체크
4. 애플리케이션 정보 입력:
   - **Application name**: `Oneul Fridge` (또는 원하는 이름)
   - **Description**: `AI-powered recipe recommendation service with automatic image search`
5. **"Create application"** 클릭

### 1.3 Access Key 복사
1. 생성된 애플리케이션 페이지에서 **"Keys"** 섹션 확인
2. **"Access Key"** 복사 (예: `abcd1234efgh5678...`)
   - ⚠️ **주의**: Secret Key는 **사용하지 않습니다**

## 2. 환경 변수 설정

### 2.1 `.env.local` 파일 수정
프로젝트 루트 디렉토리의 `.env.local` 파일에 다음 줄을 추가합니다:

```bash
# Unsplash API
VITE_UNSPLASH_ACCESS_KEY=your_access_key_here
```

**예시:**
```bash
VITE_UNSPLASH_ACCESS_KEY=abcd1234efgh5678ijkl9012mnop3456qrst7890uvwx
```

### 2.2 Vercel/배포 환경 설정
Vercel 대시보드에서 환경 변수 추가:

1. Vercel 프로젝트 → **Settings** → **Environment Variables**
2. 새 환경 변수 추가:
   - **Name**: `VITE_UNSPLASH_ACCESS_KEY`
   - **Value**: (복사한 Access Key)
   - **Environment**: Production, Preview, Development 모두 체크
3. **Save** 클릭
4. 재배포 필요 시 **Deployments** → 최신 배포 → **Redeploy**

## 3. 작동 확인

### 3.1 로컬 테스트
```bash
# 자동 레시피 생성 스크립트 실행
npm run generate-recipe
```

**성공 시 출력 예시:**
```
📝 [1] "김치찌개"
   - 재료: 8개, 단계: 5단계
   - 조리 시간: 25분, 칼로리: 320kcal
   🔍 Unsplash 검색: "kimchi jjigae korean stew"
   ✅ 이미지 찾음: John Doe
```

**API 키 없을 때 출력:**
```
⚠️  Unsplash API 키가 없습니다. 이미지 검색을 건너뜁니다.
```

### 3.2 웹사이트 확인
1. 레시피 상세 페이지 접속
2. 상단에 음식 이미지가 표시되는지 확인
3. 우측 하단에 사진작가 크레딧 표시 확인 (`Photo by {이름}`)

## 4. API 사용량 제한

### 무료 플랜 (Demo)
- **시간당**: 50 requests
- **월간**: 5,000 requests
- **충분한 이유**:
  - 레시피 생성: 하루 10개 × 30일 = 월 300개
  - 레시피 조회: 캐싱되므로 API 호출 없음

### 유료 플랜 (옵션)
더 많은 트래픽이 필요한 경우:
- **Production**: $199/월 (100,000 requests/월)
- [Unsplash+ 가격 안내](https://unsplash.com/pricing)

## 5. 이미지 라이선스

### Unsplash 라이선스 특징
- ✅ **상업적 이용 가능** (무료)
- ✅ **재배포 가능**
- ✅ **수정 가능**
- ❌ **사진작가 크레딧 권장** (필수 아님, 하지만 우리는 표시함)

### 자동 크레딧 표시
`RecipeDetail.tsx`에서 자동으로 사진작가 이름 표시:
```tsx
{recipe.image_photographer && (
  <div className="...">
    Photo by {recipe.image_photographer}
  </div>
)}
```

## 6. DB 마이그레이션

Supabase 대시보드에서 SQL 실행:

1. Supabase 프로젝트 → **SQL Editor**
2. `migrations/add_recipe_images.sql` 파일 내용 복사
3. 실행 (**Run**)

**SQL 내용:**
```sql
ALTER TABLE generated_recipes
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS image_photographer TEXT;

CREATE INDEX IF NOT EXISTS idx_generated_recipes_has_image
ON generated_recipes(id)
WHERE image_url IS NOT NULL;
```

## 7. 문제 해결

### 문제 1: "Access Key required"
**원인**: 환경 변수가 설정되지 않음

**해결**:
1. `.env.local` 파일 확인
2. 변수명 정확히 확인: `VITE_UNSPLASH_ACCESS_KEY`
3. 개발 서버 재시작: `npm run dev`

### 문제 2: "Rate limit exceeded"
**원인**: 시간당 50 requests 초과

**해결**:
1. 1시간 대기 또는
2. API 키 재생성 (새 앱 생성) 또는
3. 유료 플랜 업그레이드

### 문제 3: 이미지가 표시되지 않음
**원인**:
- DB에 `image_url` 컬럼이 없음
- 레시피가 이미지 없이 생성됨

**해결**:
1. DB 마이그레이션 실행 (위 6번 항목)
2. 레시피 재생성: `npm run generate-recipe`

### 문제 4: 한국 음식 이미지가 부정확함
**원인**: Unsplash에 한국 음식 사진이 제한적

**해결**:
`scripts/auto-recipe-generator.ts`의 `foodNameMap`에 매핑 추가:
```typescript
const foodNameMap: Record<string, string> = {
  '김치찌개': 'kimchi jjigae korean stew',
  '새로운음식': 'english search term',
  // 추가...
};
```

## 8. 참고 자료

- [Unsplash API 문서](https://unsplash.com/documentation)
- [Unsplash 라이선스](https://unsplash.com/license)
- [Unsplash 가이드라인](https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines)
