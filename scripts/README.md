# 🤖 레시피 자동 생성 시스템

SEO를 위한 레시피 자동 생성 및 DB 저장 시스템입니다.

## 📋 시스템 개요

- **목적**: 다양한 재료 기반 레시피를 자동 생성하여 SEO 트래픽 증대
- **방식**: GitHub Actions + Gemini AI + Supabase
- **주기**: 10분마다 1개씩 자동 생성 (설정 가능)
- **재료 DB**: 100여 개의 인기 재료 (우선순위 기반 가중치 랜덤 선택)

## 🛠️ 설정 방법

### 1. 의존성 설치

```bash
npm install tsx --save-dev
```

### 2. Supabase 테이블 생성

Supabase SQL Editor에서 다음 파일을 실행하세요:

```bash
scripts/setup-generation-logs.sql
```

**중요**: `generation_logs` 테이블의 INSERT 정책을 수정해야 합니다.
SQL 파일의 주석을 참고하여 `anon` 키로 삽입 가능하도록 설정하세요.

```sql
-- 기존 정책 삭제
DROP POLICY "Service role can insert generation logs" ON generation_logs;

-- anon 키로 삽입 허용 (자동 생성용)
CREATE POLICY "Anyone can insert generation logs"
  ON generation_logs
  FOR INSERT
  WITH CHECK (true);
```

### 3. GitHub Secrets 설정

GitHub Repository → Settings → Secrets and variables → Actions

다음 3개의 Secret을 등록하세요:

| Secret Name | Value |
|-------------|-------|
| `VITE_GEMINI_API_KEY` | Gemini API 키 |
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon 키 |

### 4. GitHub Actions 활성화

- 이미 `.github/workflows/auto-generate-recipe.yml` 파일이 생성되어 있습니다
- 코드를 푸시하면 자동으로 워크플로우가 활성화됩니다
- 10분마다 레시피 1개씩 자동 생성됩니다

## 🧪 로컬 테스트

### 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 테스트 실행

```bash
npm run generate-recipe
```

성공 시 출력 예시:
```
🤖 레시피 자동 생성 시작... [2025-12-01 17:00:00]
📋 최근 30개 레시피에서 사용된 재료: 삼겹살, 소고기, 감자...
📦 선택된 메인 재료: 닭가슴살 (우선순위: 10, 카테고리: meat)
📨 Gemini API 호출 중...
📥 Gemini API 응답 받음
✅ 1개의 레시피 파싱 완료
📝 생성된 레시피: "닭가슴살 스테이크"
   - 재료: 8개
   - 조리 단계: 5단계
   - 조리 시간: 25분
   - 칼로리: 320kcal/인분
💾 데이터베이스에 저장 중...
✅ 레시피 저장 완료! ID: abc-123-def
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 레시피 자동 생성 완료!
📌 제목: 닭가슴살 스테이크
📌 메인 재료: 닭가슴살
📌 ID: abc-123-def
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 📊 모니터링

### GitHub Actions 로그

- GitHub Repository → Actions → "Auto Generate Recipe" 워크플로우
- 각 실행 기록과 로그 확인 가능
- 실패 시 자동으로 알림 (이슈 생성 가능하도록 설정 가능)

### Supabase 로그

```sql
-- 최근 생성 로그 조회
SELECT * FROM generation_logs
ORDER BY created_at DESC
LIMIT 20;

-- 최근 30일 통계
SELECT * FROM recent_generation_stats;

-- 성공률 조회
SELECT
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM generation_logs
GROUP BY status;
```

### 생성된 레시피 조회

```sql
-- 최근 생성된 레시피
SELECT id, title, main_ingredients, created_at
FROM generated_recipes
ORDER BY created_at DESC
LIMIT 20;

-- 재료별 레시피 수
SELECT
  unnest(main_ingredients) as ingredient,
  COUNT(*) as recipe_count
FROM generated_recipes
GROUP BY ingredient
ORDER BY recipe_count DESC;
```

## ⚙️ 설정 변경

### 생성 주기 변경

`.github/workflows/auto-generate-recipe.yml` 파일의 `cron` 설정을 수정하세요:

```yaml
schedule:
  # 2분마다 (하루 720개 생성)
  - cron: '*/2 * * * *'

  # 5분마다 (하루 288개 생성)
  - cron: '*/5 * * * *'

  # 1시간마다 (하루 24개 생성)
  - cron: '0 * * * *'

  # 하루 1번 (오전 9시)
  - cron: '0 9 * * *'
```

### 재료 추가/수정

`scripts/ingredient-database.ts` 파일을 수정하세요:

```typescript
export const INGREDIENT_DATABASE: Ingredient[] = [
  // 새로운 재료 추가
  { name: '새로운재료', category: 'meat', searchVolume: 'high', priority: 10 },
  // ...
];
```

## 💰 예상 비용

### Gemini API (Flash 모델)

- 레시피당 2회 호출 (요리명 생성 + 레시피 생성)
- 입력 토큰: ~1,000 tokens/회
- 출력 토큰: ~2,000 tokens/회

**월간 예상 비용 (10분 간격 기준)**:
- 하루 144개 × 30일 = 4,320개 레시피
- API 호출: 8,640회
- **예상 비용: $5-15/월**

**하루 720개 생성 시 (2분 간격)**:
- **예상 비용: $25-75/월**

### GitHub Actions

- **무료** (월 2,000분까지 무료, 충분함)

### Supabase

- **무료 티어** (500MB DB, 충분함)

## 🔒 보안 고려사항

### API 키 보호

- ✅ GitHub Secrets 사용 (환경 변수로 주입)
- ✅ `.env` 파일은 `.gitignore`에 포함
- ❌ 코드에 직접 API 키 하드코딩 금지

### RLS (Row Level Security)

- `generation_logs`: anon 키로 INSERT 가능 (자동 생성용)
- `generated_recipes`: 기존 RPC 함수 사용

## ⚠️ 주의사항

### Google SEO 정책

- 자동 생성 콘텐츠는 Google이 저평가할 수 있음
- **권장**: 생성 후 사람이 검토/편집하는 프로세스 추가
- 초기에는 `status: 'draft'`로 저장하고, 리뷰 후 `published`로 변경

### 레시피 정확성

- AI가 잘못된 레시피를 생성할 수 있음
- 주기적으로 생성된 레시피 품질 확인 필요

### DB 용량 관리

- 레시피가 계속 쌓이므로 주기적으로 관리 필요
- 월별 생성 개수 제한 권장 (예: 월 3,000-5,000개)

## 📈 확장 가능성

### 다음 단계

1. **이미지 생성**: DALL-E 또는 Stable Diffusion으로 요리 이미지 자동 생성
2. **SEO 최적화**: 구조화된 데이터 추가, 사이트맵 자동 생성
3. **품질 필터**: 생성 후 자동 품질 검증 로직 추가
4. **다양화**: 계절별, 테마별 레시피 생성
5. **A/B 테스팅**: 인기 레시피 분석 후 유사 레시피 추가 생성

## 🐛 문제 해결

### 1. 레시피가 생성되지 않음

```bash
# 로컬 테스트 실행
npm run generate-recipe

# 에러 메시지 확인
# - API 키 확인
# - Supabase 연결 확인
# - generation_logs INSERT 정책 확인
```

### 2. 중복 레시피 생성

- 자동으로 제목 중복 체크하여 스킵됨
- `generation_logs`에 `status: 'skipped'`로 기록됨

### 3. GitHub Actions 실패

- Actions 탭에서 로그 확인
- Secrets 설정 확인
- 워크플로우 파일 문법 확인

## 📞 지원

문제가 발생하면:
1. `generation_logs` 테이블 확인
2. GitHub Actions 로그 확인
3. Gemini API 할당량 확인
