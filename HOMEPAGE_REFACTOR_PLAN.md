# 메인 페이지 전면 개편 - 수정 범위 상세

## 📋 프로젝트 개요

**목적**: 구글 애드센스 승인을 위한 메인 페이지 전면 개편 및 SEO 최적화

**현재 문제점**:
- 루트 경로('/')가 '내 냉장고' 기능만 표시하여 콘텐츠 부족
- 애드센스 거절 원인

**목표**:
- 매거진형 랜딩 페이지 구현
- SEO 텍스트 밀도 향상
- 레시피 콘텐츠 쇼케이스 형태로 변경

---

## 🎯 확정된 요구사항

1. ✅ **Hero Section 배경**: Unsplash API 사용
2. ✅ **레시피 8개**: 랜덤 노출
3. ✅ **레시피 설명**: `content` 필드에서 앞부분 추출 (최대 100자)
4. ✅ **Footer**: 현재 있는 컴포넌트 그대로 사용

---

## 📂 수정/생성할 파일 목록

### ✨ 새로 생성할 파일 (4개)

#### 1. `src/pages/HomePage.tsx` ⭐ (핵심 파일)
**역할**: 새로운 메인 랜딩 페이지

**구성 요소**:
- Hero Section (Unsplash 배경 이미지)
- 서비스 프로세스 Section (SEO 텍스트)
- 레시피 큐레이션 Section (랜덤 8개)
- 검색바 (Enter 시 search 탭 이동)
- FAQ Section

**예상 코드 라인**: ~400줄

**주요 기능**:
```typescript
interface HomePageProps {
  onNavigateToFridge: () => void;
  onNavigateToSearch: (keyword: string) => void;
  onRecipeClick: (recipe: Recipe) => void;
  userIngredients: string[];
}
```

---

#### 2. `src/components/RecipeCardWithImage.tsx`
**역할**: 이미지 + 제목 + 설명(2줄 제한) 카드

**Props**:
```typescript
interface RecipeCardWithImageProps {
  recipe: Recipe;
  onClick: (recipe: Recipe) => void;
  maxDescriptionLength?: number; // 기본 100자
}
```

**기능**:
- `recipe.image_url` 있으면 사용, 없으면 Unsplash fallback
- `recipe.content` 앞부분 추출 (최대 100자)
- CSS: `line-clamp-2` (2줄 제한)

**예상 코드 라인**: ~80줄

**UI 구조**:
```tsx
<div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md">
  {/* 이미지 영역 */}
  <div className="aspect-video bg-gray-200">
    <img
      src={recipe.image_url || unsplashFallback}
      alt={recipe.title}
      className="w-full h-full object-cover"
    />
  </div>

  {/* 텍스트 영역 */}
  <div className="p-4">
    <h3 className="font-bold text-lg mb-2">{recipe.title}</h3>
    <p className="text-gray-600 text-sm line-clamp-2">
      {extractRecipeDescription(recipe, 100)}
    </p>
  </div>
</div>
```

---

#### 3. `src/components/HeroSection.tsx`
**역할**: Hero Section UI

**기능**:
- Unsplash에서 음식 관련 배경 이미지 fetch
- 2개 버튼 (촬영 / 직접 입력)
- 버튼 클릭 시 액션 prop으로 전달

**Props**:
```typescript
interface HeroSectionProps {
  onCameraClick: () => void;
  onManualInputClick: () => void;
}
```

**예상 코드 라인**: ~120줄

**콘텐츠**:
- H1: "냉장고 속 잠든 재료, 근사한 요리가 되다"
- 서브텍스트: "오늘의냉장고 AI가 당신이 가진 식재료만으로 만들 수 있는 최적의 황금 레시피를 찾아드립니다."
- 버튼 1: [영수증/냉장고 촬영] → 촬영 후 '/fridge' 탭으로 이동
- 버튼 2: [재료 직접 입력] → 입력 모달 후 '/fridge' 탭으로 이동

---

#### 4. `src/lib/unsplashService.ts`
**역할**: Unsplash 이미지 검색 API 래퍼

**함수**:
```typescript
/**
 * 랜덤 음식 배경 이미지 가져오기
 */
export async function getRandomFoodImage(): Promise<string>

/**
 * 키워드로 음식 이미지 검색
 */
export async function searchFoodImage(query: string): Promise<string>
```

**예상 코드 라인**: ~50줄

**환경 변수**:
```
VITE_UNSPLASH_ACCESS_KEY=xxxxx
```

---

### 🔧 수정할 파일 (5개)

#### 1. `src/App.tsx` ⭐ (중요)

**수정 범위 A: 상태 초기값 변경**
```typescript
// 기존
const [activeTab, setActiveTab] = useState<Tab>('fridge');

// 변경
const [activeTab, setActiveTab] = useState<Tab>('home'); // 기본 탭 변경
```

**수정 범위 B: 탭 렌더링 추가 (라인 472 이후)**
```typescript
{activeTab === 'home' && (
  <HomePage
    onNavigateToFridge={() => setActiveTab('fridge')}
    onNavigateToSearch={(keyword) => {
      setSearchQuery(keyword);
      setActiveTab('search');
    }}
    onRecipeClick={handleRecipeClick}
    userIngredients={ingredients.map(i => i.name)}
  />
)}
```

**수정 범위 C: SEO 메타태그 추가 (Helmet 내부)**
```typescript
{activeTab === 'home' && (
  <>
    <title>오늘의냉장고 - AI 레시피 추천 | 냉장고 파먹기</title>
    <meta name="description" content="냉장고 속 잠든 재료로 만드는 맞춤 레시피. 영수증 촬영만으로 재료 자동 인식, AI 맞춤 요리법 추천, 음식물 쓰레기 줄이기." />
  </>
)}
{activeTab === 'fridge' && (
  <>
    <title>내 냉장고 - 오늘의냉장고</title>
    <meta name="description" content="냉장고 재료를 관리하고 레시피를 추천받으세요." />
  </>
)}
// ... 나머지 탭들도 동일하게
```

**예상 수정 라인**: ~50줄 추가

---

#### 2. `src/components/BottomNav.tsx` ⭐ (중요)

**수정 범위 A: Tab 타입 변경**
```typescript
// 기존
export type Tab = 'fridge' | 'search' | 'my-recipes' | 'profile';

// 변경
export type Tab = 'home' | 'fridge' | 'my-recipes' | 'profile';
// 'search'는 숨겨진 탭으로만 사용 (BottomNav에서 제거)
```

**수정 범위 B: 탭 버튼 재배치**
```typescript
// [기존 순서]
냉장고 | 레시피 검색 | 내 레시피 | 내 정보

// [변경 순서]
홈 | 내 냉장고 | 찜한 레시피 | 내 정보
```

**수정 범위 C: import 및 아이콘 변경**
```typescript
// 추가
import { Home, RefrigeratorIcon, Heart, User } from 'lucide-react';

// home 탭 버튼 추가 (최우선)
<button
  onClick={() => onTabChange('home')}
  className={`flex flex-col items-center gap-0.5 py-1.5 px-2 transition-colors ${
    activeTab === 'home' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
  }`}
>
  <Home className="w-5 h-5" />
  <span className="text-xs font-medium">홈</span>
</button>

// fridge 탭 텍스트 변경
<span className="text-xs font-medium">내 냉장고</span>

// my-recipes 탭 아이콘 및 텍스트 변경
<Heart className="w-5 h-5" /> // 기존 ChefHat에서 변경
<span className="text-xs font-medium">찜한 레시피</span>

// search 탭 버튼 삭제
```

**예상 수정 라인**: ~30줄

---

#### 3. `src/lib/recipeService.ts`

**수정 범위 A: 랜덤 레시피 조회 함수 추가**
```typescript
/**
 * 랜덤 레시피 8개 조회 (HomePage용)
 * Supabase의 최신 레시피에서 랜덤 선택
 */
export async function getRandomRecipes(limit: number = 8): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('generated_recipes')
    .select('*')
    .order('created_at', { ascending: false }) // 최신 레시피 풀에서
    .limit(100); // 먼저 100개 가져오기

  if (error) throw error;

  // 클라이언트 측에서 랜덤 셔플
  const shuffled = data.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, limit);
}
```

**수정 범위 B: 레시피 설명 추출 유틸 함수 추가**
```typescript
/**
 * 레시피에서 설명 텍스트 추출
 * content 필드의 앞부분을 잘라서 반환
 */
export function extractRecipeDescription(
  recipe: Recipe,
  maxLength: number = 100
): string {
  // content가 HTML이면 태그 제거
  const text = recipe.content
    ?.replace(/<[^>]*>/g, '') // HTML 태그 제거
    .replace(/\n+/g, ' ') // 줄바꿈을 공백으로
    .trim() || '';

  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
```

**예상 수정 라인**: ~40줄 추가

---

#### 4. `src/components/RecipeSearchWithInfiniteScroll.tsx`

**수정 범위: URL 쿼리 파라미터 처리 추가**
```typescript
// 파일 상단에 추가
import { useSearchParams } from 'react-router-dom';

// 컴포넌트 내부
const [searchParams] = useSearchParams();

// useEffect 추가
useEffect(() => {
  const keyword = searchParams.get('keyword');
  if (keyword) {
    // 외부에서 전달된 검색어로 초기 검색 실행
    setPage(0);
    setRecipes([]);
    setHasMore(true);
    loadRecipes(0, keyword);
  }
}, [searchParams]);
```

**예상 수정 라인**: ~10줄

---

#### 5. `src/components/Layout.tsx` (확인 필요)

**수정 범위**: TBD (파일 구조 확인 후 결정)

**예상 수정 사항**:
- Home 탭일 때 헤더 숨김 또는 스타일 변경 가능성
- 검색바를 HomePage 내부로 이동하는 경우 Layout 수정 필요

**예상 수정 라인**: TBD

---

## 📊 전체 수정 범위 요약

| 구분 | 파일명 | 작업 | 예상 라인 |
|------|--------|------|----------|
| **신규** | `src/pages/HomePage.tsx` | 생성 | ~400줄 |
| **신규** | `src/components/RecipeCardWithImage.tsx` | 생성 | ~80줄 |
| **신규** | `src/components/HeroSection.tsx` | 생성 | ~120줄 |
| **신규** | `src/lib/unsplashService.ts` | 생성 | ~50줄 |
| **수정** | `src/App.tsx` | 탭 추가 + SEO | ~50줄 |
| **수정** | `src/components/BottomNav.tsx` | 탭 재배치 | ~30줄 |
| **수정** | `src/lib/recipeService.ts` | 유틸 함수 추가 | ~40줄 |
| **수정** | `src/components/RecipeSearchWithInfiniteScroll.tsx` | 쿼리 파라미터 | ~10줄 |
| **수정** | `src/components/Layout.tsx` | 조건부 스타일 | TBD |
| **총계** | **9개 파일** | **4개 생성 + 5개 수정** | **~780줄** |

---

## 🎨 HomePage 레이아웃 구조

```
┌─────────────────────────────────┐
│   Hero Section (전체 화면)       │
│   - 배경: Unsplash 이미지        │
│   - 어두운 오버레이 (opacity 0.6)│
│   - H1: 큰 제목                  │
│   - P: 서브텍스트                │
│   - [버튼1] [버튼2]              │
└─────────────────────────────────┘
│   서비스 프로세스 Section         │
│   - H2: "3초 만에 메뉴 결정"     │
│   - 3개 단락 (아이콘 + 텍스트)   │
│   Content 1: 스마트한 재료 인식  │
│   Content 2: 맞춤형 AI 레시피    │
│   Content 3: 지속 가능한 식생활  │
└─────────────────────────────────┘
│   레시피 큐레이션 (2열 그리드)   │
│   ┌────┐  ┌────┐                │
│   │ 🖼️ │  │ 🖼️ │                │
│   │제목│  │제목│                │
│   │설명│  │설명│                │
│   └────┘  └────┘                │
│   (8개 카드, 랜덤)               │
│   [모든 레시피 보러 가기 버튼]   │
└─────────────────────────────────┘
│   FAQ Section (회색 배경)        │
│   - Q1: 냉장고 파먹기 필요성     │
│   - A1: 고물가 시대 식비 절약... │
│   - Q2: 요리 초보 가능 여부      │
│   - A2: 상세 안내로 실패 없음... │
│   - Q3: AI 레시피 추천 원리      │
│   - A3: 수만 건 데이터 학습...   │
└─────────────────────────────────┘
│   Footer (기존 컴포넌트)         │
└─────────────────────────────────┘
```

---

## 📝 주요 콘텐츠 텍스트

### Hero Section
- **H1**: "냉장고 속 잠든 재료, 근사한 요리가 되다"
- **서브텍스트**: "오늘의냉장고 AI가 당신이 가진 식재료만으로 만들 수 있는 최적의 황금 레시피를 찾아드립니다."

### 서비스 프로세스 Section
- **Title (H2)**: "복잡한 고민 없이, 3초 만에 메뉴 결정"
- **Content 1**: "스마트한 재료 인식: 영수증이나 냉장고 안을 사진으로 찍기만 하세요. AI가 자동으로 식재료 목록을 정리하고 유통기한까지 관리해 줍니다."
- **Content 2**: "맞춤형 AI 레시피 매칭: 내가 가진 재료와 집에 있는 기본 양념만으로 만들 수 있는 현실적인 요리를 추천합니다."
- **Content 3**: "지속 가능한 식생활: 냉장고 파먹기를 통해 음식물 쓰레기를 줄이고 식비도 아낄 수 있습니다."

### FAQ Section
- **Q1 (H3)**: "냉장고 파먹기(냉털)가 왜 필요할까요?"
  - **A1 (P)**: "최근 고물가 시대에 식비 절약은 필수입니다. 오늘의냉장고는 식재료를 제때 소진하지 못해 버려지는 음식물 쓰레기 문제를 해결하고, 건강한 식단을 제안합니다."

- **Q2 (H3)**: "요리 초보도 따라 할 수 있나요?"
  - **A2 (P)**: "재료 손질부터 조리 순서, 불 조절 팁, 대체 재료까지 상세하게 안내합니다. 자취생이나 요리 초보자도 실패 없이 맛있는 한 끼를 완성할 수 있습니다."

- **Q3 (H3)**: "AI 레시피 추천 원리는?"
  - **A3 (P)**: "수만 건의 요리 데이터와 식재료 조합 알고리즘을 학습한 AI가 사용자의 보유 재료를 분석하여, 최적의 맛 조합을 찾아냅니다."

---

## 🔍 추가 확인 필요 사항

### 1. Unsplash Access Key 확인
```bash
# .env 파일에 키가 있는지 확인
VITE_UNSPLASH_ACCESS_KEY=xxxxx
```
- 이미 있다면 재사용
- 없다면 새로 발급 필요 (https://unsplash.com/developers)

### 2. Recipe 타입의 `content` 필드 구조
```typescript
// Recipe 인터페이스에 content 필드가 있는지 확인
interface Recipe {
  id: string;
  title: string;
  content?: string; // ← 이 필드의 형태 확인 (HTML? Plain text?)
  image_url?: string;
  // ...
}
```

### 3. Layout 컴포넌트 구조
- 검색바가 Layout에 있는지, App에 있는지 확인
- Home 탭에서 헤더를 숨기려면 Layout 수정 필요

---

## ⚠️ 주의사항

### 1. SEO 최적화
- 모든 주요 텍스트는 실제 HTML 요소로 렌더링 (`<h1>`, `<h2>`, `<p>`)
- 이미지의 `alt` 속성 필수
- `<Helmet>`으로 탭별 메타태그 동적 변경
- 이미지 텍스트 사용 금지

### 2. 성능 고려
- Unsplash API 호출 최소화 (캐싱 or localStorage)
- 랜덤 레시피 8개만 로드 (무한 스크롤 없음)
- 이미지 lazy loading 적용 (`loading="lazy"`)

### 3. 모바일 퍼스트
- Tailwind의 반응형 클래스 사용 (`sm:`, `md:`, `lg:`)
- 버튼 터치 영역 충분히 확보 (최소 44x44px)
- Hero Section은 모바일에서 `vh-screen`, 데스크톱에서 `min-h-[600px]`

### 4. 접근성 (Accessibility)
- 모든 버튼에 `aria-label` 추가
- 키보드 네비게이션 지원
- 색상 대비 4.5:1 이상 유지

---

## 🚀 구현 순서 (추천)

```
Phase 1: 기반 작업 (30분)
  1. unsplashService.ts 생성
  2. recipeService.ts에 유틸 함수 추가
  3. RecipeCardWithImage.tsx 생성

Phase 2: 페이지 구성 (1시간)
  4. HeroSection.tsx 생성
  5. HomePage.tsx 생성 (섹션 조립)

Phase 3: 통합 (30분)
  6. BottomNav.tsx 수정 (탭 재배치)
  7. App.tsx 수정 (home 탭 추가)
  8. Layout.tsx 확인 및 수정 (필요시)

Phase 4: 테스트 (30분)
  9. 각 버튼 동작 테스트
  10. 탭 전환 테스트
  11. SEO 메타태그 확인 (React DevTools)
  12. 모바일 반응형 테스트

Total: 약 2.5~3시간
```

---

## 📱 반응형 브레이크포인트

```css
/* Tailwind 기본 브레이크포인트 */
sm: 640px   /* 태블릿 세로 */
md: 768px   /* 태블릿 가로 */
lg: 1024px  /* 데스크톱 */
xl: 1280px  /* 와이드 데스크톱 */
```

**HomePage 반응형 전략**:
- **Mobile (< 640px)**: 1열 레이아웃
- **Tablet (640px ~ 1024px)**: 2열 그리드
- **Desktop (> 1024px)**: 최대 너비 제한 (max-w-6xl)

---

## 🎯 성공 지표 (KPI)

구현 완료 후 확인할 사항:
- [ ] Hero Section 배경 이미지 로드 성공
- [ ] 랜덤 레시피 8개 정상 표시
- [ ] 각 레시피 카드에 이미지 + 제목 + 설명 (2줄) 표시
- [ ] [모든 레시피 보러 가기] 버튼 → search 탭 이동
- [ ] 검색바 Enter → search 탭 + 검색어 전달
- [ ] SEO 메타태그 동적 변경 확인
- [ ] Google Lighthouse 점수 90+ (Performance, SEO)
- [ ] 모바일 반응형 정상 작동

---

## 📚 참고 자료

- [Unsplash API 문서](https://unsplash.com/documentation)
- [Tailwind CSS Line Clamp](https://tailwindcss.com/docs/line-clamp)
- [React Helmet Async](https://github.com/staylor/react-helmet-async)
- [Google Search Central - SEO](https://developers.google.com/search/docs)

---

## 🔗 관련 이슈/문서

- 구글 애드센스 거절 사유: 콘텐츠 부족
- 해결 방법: 랜딩 페이지에 풍부한 SEO 텍스트 + 레시피 쇼케이스

---

**작성일**: 2025-12-17
**작성자**: AI Assistant
**최종 검토**: 대기 중
