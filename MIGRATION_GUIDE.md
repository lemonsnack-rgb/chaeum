# Next.js 마이그레이션 가이드

## 개요
Vite + React에서 Next.js App Router로 마이그레이션하여 SSR(Server-Side Rendering)을 적용했습니다. 이를 통해 구글 봇이 JavaScript 실행 없이도 페이지 내용을 즉시 인덱싱할 수 있습니다.

## 주요 변경 사항

### 1. 프로젝트 구조
```
프로젝트 루트/
├── src/
│   ├── app/                    # Next.js App Router (새로 추가)
│   │   ├── layout.tsx         # 루트 레이아웃 (메타 태그)
│   │   ├── page.tsx           # 홈페이지
│   │   └── recipe/
│   │       └── [recipeId]/
│   │           ├── page.tsx           # 레시피 상세 (SSR)
│   │           ├── RecipeDetailClient.tsx  # 클라이언트 컴포넌트
│   │           └── not-found.tsx      # 404 페이지
│   ├── components/            # 기존 컴포넌트 (재사용)
│   ├── lib/                   # 기존 서비스 로직 (재사용)
│   └── pages/                 # 기존 페이지 (참고용 유지)
├── next.config.mjs            # Next.js 설정
└── package.json               # 업데이트된 스크립트
```

### 2. 설치된 패키지
- `next@latest` (v16.1.0) - Next.js 프레임워크
- `lucide-react@latest` (v0.562.0) - React 19 호환 버전으로 업데이트

### 3. npm 스크립트 변경
```json
{
  "dev": "next dev",           // 개발 서버 (http://localhost:3000)
  "build": "tsx scripts/generate-sitemap.ts && next build",
  "start": "next start",       // 프로덕션 서버
  "lint": "next lint"
}
```

## SSR 구현 상세

### 1. 레시피 상세 페이지 SSR
**파일**: `src/app/recipe/[recipeId]/page.tsx`

#### 핵심 기능
✅ **서버에서 레시피 데이터 미리 가져오기**
```typescript
async function getRecipe(recipeId: string): Promise<Recipe | null> {
  const { data } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', recipeId)
    .single();

  return transformToRecipe(data);
}
```

✅ **동적 메타 태그 생성 (generateMetadata)**
```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const recipe = await getRecipe(recipeId);

  return {
    title: `${recipe.title} - 오늘의냉장고`,
    description: generateEnhancedDescription(recipe),
    keywords: generateSEOKeywords(recipe),
    openGraph: { ... },
    twitter: { ... }
  };
}
```

✅ **구조화된 데이터 (Schema.org)**
- Recipe Schema: 조리 시간, 재료, 영양 정보, 평점
- FAQ Schema: 자주 묻는 질문 (Featured Snippet 대응)
- Breadcrumb Schema: 사이트 구조

#### SEO 최적화 전략
1. **메타 Description**: 120-155자, 주요 재료 + 조리 시간 + 칼로리 포함
2. **키워드**: `재료명 + 요리`, `테마태그 + 요리`, 기본 키워드 조합
3. **Canonical URL**: 중복 콘텐츠 방지
4. **Open Graph & Twitter Cards**: 소셜 미디어 최적화

### 2. 홈페이지
**파일**: `src/app/page.tsx`

- 클라이언트 컴포넌트로 구현 (`'use client'`)
- 기존 `App.tsx` 재사용
- 향후 필요 시 서버 컴포넌트로 전환 가능

### 3. 루트 레이아웃
**파일**: `src/app/layout.tsx`

- 모든 페이지 공통 메타 태그
- Google AdSense 스크립트 포함
- Tailwind CSS import

## 개발 환경 설정

### 1. 환경 변수
`.env.local` 파일 생성 (Git에 커밋하지 마세요!)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=your_unsplash_key
NEXT_PUBLIC_GA_MEASUREMENT_ID=your_ga_id
```

### 2. 개발 서버 실행
```bash
npm run dev
```
- 로컬: http://localhost:3000
- 네트워크: http://[Your-IP]:3000

### 3. 프로덕션 빌드
```bash
npm run build
npm run start
```

## Vercel 배포 설정

### 1. vercel.json
```json
{
  "buildCommand": "npm run build",
  "framework": "nextjs"
}
```

### 2. 환경 변수 설정
Vercel 대시보드 → Settings → Environment Variables에서 다음 변수 추가:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_GEMINI_API_KEY`
- `NEXT_PUBLIC_UNSPLASH_ACCESS_KEY`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`

### 3. 배포
```bash
git add .
git commit -m "Migrate to Next.js for SSR"
git push origin main
```
Vercel이 자동으로 Next.js를 감지하고 배포합니다.

## SEO 검증 방법

### 1. 메타 태그 확인
브라우저에서 페이지 소스 보기 (Ctrl+U 또는 Cmd+U)
- `<title>` 태그에 레시피 제목 포함 확인
- `<meta name="description">` 내용 확인
- `<script type="application/ld+json">` Schema 확인

### 2. Google 리치 결과 테스트
https://search.google.com/test/rich-results
- 레시피 URL 입력
- Recipe Schema 감지 확인

### 3. Google Search Console
- URL 검사 도구로 크롤링 요청
- 색인 상태 확인

## 트러블슈팅

### 문제: "pages and app directories should be under the same folder"
**해결**: `app` 디렉토리를 `src/app`으로 이동

### 문제: Import 경로 오류
**해결**: 상대 경로 수정
```typescript
// 잘못된 예
import { Recipe } from '../../../src/lib/recipeService';

// 올바른 예
import { Recipe } from '../../../lib/recipeService';
```

### 문제: React 버전 충돌
**해결**: `--legacy-peer-deps` 플래그 사용
```bash
npm install next --legacy-peer-deps
```

## 기존 Vite 프로젝트 유지 (옵션)
레거시 스크립트를 통해 기존 Vite 빌드도 사용 가능:
```bash
npm run legacy:dev      # Vite 개발 서버
npm run legacy:build    # Vite 빌드
npm run legacy:preview  # Vite 프리뷰
```

## 다음 단계 (권장)

1. ✅ **구글 봇 크롤링 확인**: Search Console에서 URL 검사
2. ✅ **sitemap.xml 재생성**: 레시피 추가 시 자동 업데이트
3. 🔄 **이미지 최적화**: Next.js `<Image>` 컴포넌트로 교체 (선택)
4. 🔄 **ISR(Incremental Static Regeneration)**: 자주 변경되지 않는 페이지에 적용 (선택)

## 참고 자료
- [Next.js 공식 문서](https://nextjs.org/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Google Search - Recipe Schema](https://developers.google.com/search/docs/appearance/structured-data/recipe)
