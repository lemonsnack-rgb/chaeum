# Google Analytics 4 (GA4) 설정 가이드

## 📋 개요

오늘의냉장고에 Google Analytics 4가 통합되어 방문자 수, 페이지뷰, 사용자 행동 등을 추적할 수 있습니다.

---

## 🚀 1단계: Google Analytics 4 계정 생성

### 1.1 Google Analytics 계정 만들기

1. https://analytics.google.com/ 접속
2. "측정 시작" 클릭
3. 계정 이름 입력 (예: `오늘의냉장고`)
4. 속성 이름 입력 (예: `오늘의냉장고 웹사이트`)
5. 업종 카테고리 선택: `음식 및 음료`
6. 비즈니스 규모: `소규모`
7. "만들기" 클릭

### 1.2 데이터 스트림 설정

1. "웹" 선택
2. 웹사이트 URL: `https://www.oneulfridge.com`
3. 스트림 이름: `오늘의냉장고 웹`
4. "스트림 만들기" 클릭

### 1.3 측정 ID 복사

- 생성된 측정 ID가 표시됩니다 (형식: `G-XXXXXXXXXX`)
- 이 ID를 복사해두세요!

---

## ⚙️ 2단계: 환경 변수 설정

### 로컬 개발 환경 (`.env.local`)

프로젝트 루트 디렉토리에 `.env.local` 파일을 생성하고 다음을 추가:

```env
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**주의**: `.env.local` 파일은 Git에 커밋하지 마세요!

### Vercel 배포 환경

1. Vercel 대시보드 접속: https://vercel.com/
2. 프로젝트 선택
3. **Settings** → **Environment Variables** 이동
4. 새 환경 변수 추가:
   - **Name**: `VITE_GA_MEASUREMENT_ID`
   - **Value**: `G-XXXXXXXXXX` (복사한 측정 ID)
   - **Environment**: Production, Preview, Development 모두 선택
5. **Save** 클릭
6. 재배포 (Deployments → 최신 배포 → Redeploy)

---

## 📊 3단계: 추적 확인

### 실시간 데이터 확인

1. Google Analytics 대시보드 접속
2. 왼쪽 메뉴에서 **보고서** → **실시간** 선택
3. 웹사이트 접속 시 실시간 방문자 수 표시 확인

### 추적되는 이벤트

#### 자동 추적

- **페이지뷰**: 모든 페이지 방문 자동 추적
- **세션**: 사용자 세션 자동 추적
- **사용자 참여도**: 스크롤, 클릭 등 기본 상호작용

#### 커스텀 이벤트 (현재 구현됨)

- **레시피 조회** (`view_item`):
  - 레시피 상세 페이지 방문 시
  - 파라미터: `item_id`, `item_name`, `item_category`

#### 추가 구현 가능한 이벤트 (코드 추가 필요)

```typescript
// 레시피 검색
import { trackRecipeSearch } from './lib/analytics';
trackRecipeSearch(searchQuery, resultCount);

// 레시피 저장
import { trackRecipeSave } from './lib/analytics';
trackRecipeSave(recipeId, recipeTitle);

// 재료 추가
import { trackIngredientAdd } from './lib/analytics';
trackIngredientAdd(ingredientName, category);

// 로그인
import { trackLogin } from './lib/analytics';
trackLogin('email');

// 회원가입
import { trackSignup } from './lib/analytics';
trackSignup('email');

// 쿠팡 파트너스 클릭
import { trackCoupangClick } from './lib/analytics';
trackCoupangClick(ingredientName, 'search');
```

---

## 📈 4단계: 주요 지표 확인 방법

### 방문자 수

- **보고서** → **실시간**: 현재 활성 사용자
- **보고서** → **수명 주기** → **획득** → **사용자 확보**: 총 방문자 수

### 페이지뷰

- **보고서** → **참여** → **페이지 및 화면**: 페이지별 조회수

### 인기 페이지

- **보고서** → **참여** → **페이지 및 화면**
- 가장 많이 조회된 레시피 확인 가능

### 유입 경로

- **보고서** → **수명 주기** → **획득** → **사용자 확보**
- Google 검색, 직접 방문, 소셜 미디어 등 유입 경로 확인

### 사용자 행동 흐름

- **보고서** → **탐색** → 새 탐색 만들기
- 사용자가 어떤 경로로 이동하는지 확인

---

## 🔍 5단계: 고급 분석 (선택사항)

### Google Search Console 연동

1. Google Search Console (https://search.google.com/search-console/) 접속
2. 사이트 추가: `https://www.oneulfridge.com`
3. GA4와 연동:
   - GA4 → **관리** → **Search Console 링크**
   - 연동하면 검색 키워드 데이터 확인 가능

### 맞춤 보고서 만들기

1. GA4 → **탐색** → **빈 템플릿**
2. 원하는 측정기준과 측정항목 추가:
   - 측정기준: 페이지 경로, 이벤트 이름, 기기 카테고리
   - 측정항목: 이벤트 수, 사용자 수, 세션 수
3. 필터 추가하여 특정 조건 데이터만 확인

---

## 🛠️ 트러블슈팅

### GA4 데이터가 표시되지 않을 때

1. **환경 변수 확인**
   ```bash
   # .env.local 파일 확인
   cat .env.local
   ```

2. **브라우저 콘솔 확인**
   - F12 → Console 탭
   - `✅ GA4 초기화 완료` 메시지 확인
   - `📊 GA4 페이지뷰` 메시지 확인

3. **광고 차단기 비활성화**
   - uBlock Origin, Adblock Plus 등 차단기가 GA를 막을 수 있음
   - 테스트 시 비활성화

4. **Vercel 환경 변수 확인**
   - Settings → Environment Variables
   - `VITE_GA_MEASUREMENT_ID` 존재 여부 확인
   - 재배포 필요

### 특정 이벤트가 추적되지 않을 때

1. **코드 확인**
   ```typescript
   // 예: 레시피 조회 이벤트
   import { trackRecipeView } from './lib/analytics';

   // 레시피 로드 후 호출
   trackRecipeView(recipeId, recipeTitle);
   ```

2. **DebugView 사용**
   - GA4 → **관리** → **DebugView**
   - 실시간으로 이벤트 디버깅 가능

---

## 📚 추가 리소스

- [GA4 공식 문서](https://support.google.com/analytics/answer/10089681)
- [GA4 이벤트 참조](https://developers.google.com/analytics/devguides/collection/ga4/reference/events)
- [react-ga4 문서](https://github.com/codler/react-ga4)

---

## ✅ 체크리스트

- [ ] Google Analytics 4 계정 생성
- [ ] 측정 ID (`G-XXXXXXXXXX`) 발급
- [ ] `.env.local` 파일에 `VITE_GA_MEASUREMENT_ID` 추가 (로컬)
- [ ] Vercel 환경 변수에 `VITE_GA_MEASUREMENT_ID` 추가 (배포)
- [ ] Vercel 재배포
- [ ] 실시간 데이터 확인
- [ ] 주요 이벤트 추적 확인 (레시피 조회 등)
- [ ] (선택) Google Search Console 연동

---

## 💡 팁

- 데이터 수집은 24-48시간 후부터 안정화됩니다.
- 초기에는 실시간 보고서로 확인하세요.
- 주간/월간 보고서는 7일 후부터 확인 가능합니다.
- 프라이버시 정책에 GA4 사용 명시를 권장합니다.
