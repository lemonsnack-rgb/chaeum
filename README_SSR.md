# 오늘의냉장고 - SSR 업그레이드 완료 ✅

## 🎯 업그레이드 내용

### ✅ 완료된 작업

#### 1. **SSR (Server-Side Rendering) 적용**
- ❌ **기존 문제**: CSR(클라이언트 사이드 렌더링)으로 인해 구글 봇이 JavaScript 실행 전 빈 HTML만 수신
- ✅ **해결 방법**: Next.js App Router로 마이그레이션
- ✅ **효과**: 서버에서 완전히 렌더링된 HTML을 구글 봇에게 제공하여 즉시 색인 가능

#### 2. **동적 메타 태그 생성**
- ✅ 레시피별 고유한 `<title>` 태그 자동 생성
  - 예: `"된장찌개 - 오늘의냉장고"`
- ✅ SEO 최적화된 `<meta name="description">` 생성
  - 예: `"된장찌개 레시피 완벽 가이드! 된장 요리, 두부 음식으로 30분 만에 완성. 다이어트 요리에 딱! 350kcal 건강식 조리법."`
- ✅ 주요 재료와 테마 태그 기반 키워드 자동 생성

#### 3. **구조화된 데이터 (Schema.org)**
레시피 페이지마다 다음 Schema가 서버에서 생성됩니다:

**Recipe Schema** (구글 리치 결과용)
```json
{
  "@type": "Recipe",
  "name": "레시피 제목",
  "totalTime": "PT30M",
  "recipeIngredient": ["재료1", "재료2"],
  "nutrition": { "calories": "350 calories" },
  "aggregateRating": { "ratingValue": "4.5" }
}
```

**FAQ Schema** (Featured Snippet용)
- 조리 시간은 얼마나 걸리나요?
- 칼로리는 얼마인가요?
- 필요한 재료는 무엇인가요?

**Breadcrumb Schema** (사이트 구조)
- 홈 > 레시피 > [레시피명]

## 🚀 개발 및 배포

### 개발 환경 실행
```bash
npm install
npm run dev
```
→ http://localhost:3000

### 프로덕션 빌드
```bash
npm run build
npm run start
```

### Vercel 자동 배포
```bash
git add .
git commit -m "Apply Next.js SSR for SEO"
git push origin main
```

## 📊 SEO 효과 확인 방법

### 1. 페이지 소스 확인
브라우저에서 `Ctrl+U` (또는 `Cmd+U`) → 페이지 소스 보기

**확인 사항**:
```html
<title>된장찌개 - 오늘의냉장고</title>
<meta name="description" content="된장찌개 레시피 완벽 가이드! ...">
<script type="application/ld+json">
  {"@type": "Recipe", "name": "된장찌개", ...}
</script>
```

### 2. 구글 리치 결과 테스트
1. https://search.google.com/test/rich-results 방문
2. 레시피 페이지 URL 입력
3. "Recipe" 구조화 데이터 감지 확인

### 3. Google Search Console
1. URL 검사 도구에서 레시피 URL 입력
2. "크롤링 요청" 클릭
3. 1-2일 후 색인 상태 확인

## 🔍 기술 스택 변경

| 항목 | 기존 (CSR) | 변경 후 (SSR) |
|------|-----------|-------------|
| 프레임워크 | Vite + React | Next.js 16 App Router |
| 렌더링 | 클라이언트 사이드 | 서버 사이드 (레시피 페이지) |
| 메타 태그 | react-helmet-async (런타임) | generateMetadata (빌드타임) |
| 라우팅 | React Router | Next.js App Router |
| SEO | ❌ 구글 봇이 빈 HTML 수신 | ✅ 구글 봇이 완전한 HTML 수신 |

## 📁 주요 파일 구조

```
src/
├── app/                            # Next.js App Router
│   ├── layout.tsx                 # 루트 레이아웃 (공통 메타)
│   ├── page.tsx                   # 홈페이지
│   └── recipe/[recipeId]/
│       ├── page.tsx               # ⭐ 레시피 상세 (SSR)
│       ├── RecipeDetailClient.tsx # 클라이언트 인터랙션
│       └── not-found.tsx          # 404 페이지
├── components/                    # 재사용 컴포넌트
├── lib/                           # 서비스 로직 (Supabase, Gemini)
└── pages/                         # 기존 페이지 (참고용)
```

## 🎁 추가 개선 사항

### SEO 최적화
- ✅ Canonical URL 설정 (중복 콘텐츠 방지)
- ✅ Open Graph & Twitter Cards (소셜 미디어)
- ✅ 자동 sitemap.xml 생성

### 성능 최적화
- ✅ 서버에서 데이터 미리 fetch
- ✅ Next.js 자동 코드 분할
- ✅ Turbopack 기반 빠른 빌드

## 📖 자세한 내용
[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)를 참고하세요.

## 🐛 문제 해결

### 개발 서버가 시작되지 않는 경우
```bash
rm -rf .next node_modules
npm install
npm run dev
```

### 환경 변수 오류
`.env.local` 파일 생성 후 다음 변수 추가:
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_GEMINI_API_KEY=...
```

---

**업그레이드 완료일**: 2025-12-19
**Next.js 버전**: 16.1.0
**SEO 상태**: ✅ 구글 봇 크롤링 가능
