# Vercel 환경 변수 설정 가이드

## 🔧 Unsplash API 키 추가하기

### 1단계: Vercel 대시보드 접속
1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. **오늘의냉장고** 프로젝트 클릭

### 2단계: 환경 변수 설정
1. 좌측 메뉴에서 **Settings** 클릭
2. 좌측 사이드바에서 **Environment Variables** 클릭
3. **Add New** 버튼 클릭

### 3단계: 변수 추가
다음 정보 입력:

**Name (변수명):**
```
VITE_UNSPLASH_ACCESS_KEY
```

**Value (값):**
```
5UBypwwpaRatLDLT7uWkG1wJLlydpjkElMaqe7ejBj4
```

**Environments (환경 선택):**
- ✅ Production
- ✅ Preview
- ✅ Development

**Save** 버튼 클릭!

### 4단계: 재배포
1. 상단 메뉴에서 **Deployments** 클릭
2. 가장 최근 배포 찾기 (맨 위)
3. 우측 **...** (점 3개) 메뉴 클릭
4. **Redeploy** 선택
5. 팝업에서 **Redeploy** 버튼 다시 클릭

### 5단계: 배포 완료 대기
- 배포 진행 상황 확인 (약 2-3분 소요)
- 초록색 "Ready" 상태가 되면 완료!

### 6단계: 웹사이트에서 확인
1. [https://oneulfridge.com](https://oneulfridge.com) 접속
2. **레시피 검색** 탭 클릭
3. 아무 레시피나 클릭하여 상세 페이지 열기
4. **✅ 확인사항:**
   - 상단에 음식 이미지가 표시되는가?
   - 이미지 우측 하단에 "Photo by {이름}" 크레딧이 보이는가?

---

## 🎯 예상 결과

### 성공 시:
```
✅ 레시피 이미지 표시됨
✅ 사진작가 크레딧 표시됨 (예: "Photo by John Doe")
✅ 이미지 로딩 속도 정상
```

### 실패 시 (이미지 없음):
- **원인**: Supabase DB에 컬럼이 아직 추가되지 않음
- **해결**: 아래 SQL 실행 필요

---

## 🗄️ Supabase DB 마이그레이션 (필수!)

이미지가 표시되지 않는다면, Supabase에서 다음 SQL을 실행하세요:

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. **nipuqisuianmzzxwptkt** 프로젝트 선택
3. 좌측 메뉴 → **SQL Editor** 클릭
4. 아래 SQL 복사 & 붙여넣기:

```sql
-- generated_recipes 테이블에 이미지 컬럼 추가
ALTER TABLE generated_recipes
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS image_photographer TEXT;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_generated_recipes_has_image
ON generated_recipes(id)
WHERE image_url IS NOT NULL;

-- 코멘트 추가
COMMENT ON COLUMN generated_recipes.image_url IS 'Unsplash 이미지 URL (regular size, ~1080px)';
COMMENT ON COLUMN generated_recipes.image_photographer IS 'Unsplash 사진작가 이름 (크레딧 표시용)';
```

5. **RUN** 버튼 클릭
6. "Success. No rows returned" 메시지 확인

---

## 📝 참고사항

### 기존 레시피는 이미지가 없음 (정상)
- 기존에 생성된 레시피는 `image_url`이 NULL입니다.
- **새로 생성되는 레시피부터** 자동으로 이미지가 추가됩니다.

### 새 레시피 생성 방법
자동 레시피 생성 스크립트를 실행하면 이미지가 포함된 레시피가 생성됩니다:
```bash
npm run generate-recipe
```

또는 GitHub Actions가 자동으로 매일 실행됩니다 (설정되어 있다면).

---

## 🔍 문제 해결

### 문제 1: 환경 변수가 적용 안 됨
**증상**: 재배포했는데도 이미지 없음

**해결**:
1. Vercel Settings → Environment Variables에서 `VITE_UNSPLASH_ACCESS_KEY` 확인
2. "Production", "Preview", "Development" 모두 체크되어 있는지 확인
3. 브라우저 캐시 삭제 후 재접속 (Ctrl + Shift + R)

### 문제 2: DB 컬럼이 없음
**증상**: 콘솔에 "column image_url does not exist" 에러

**해결**:
- 위의 Supabase SQL 실행

### 문제 3: Unsplash API 한도 초과
**증상**: 이미지 검색 실패 로그

**해결**:
- Unsplash 무료 플랜: 월 5,000 requests
- 현재 사용량 확인: [Unsplash Dashboard](https://unsplash.com/developers)
- 충분한 사용량이 남아있는지 확인

---

## ✅ 완료 체크리스트

- [ ] Vercel 환경 변수 추가 완료
- [ ] Vercel 재배포 완료 (Ready 상태)
- [ ] Supabase SQL 마이그레이션 실행 완료
- [ ] 웹사이트에서 레시피 이미지 확인 완료
- [ ] 사진작가 크레딧 표시 확인 완료

모든 항목이 체크되면 설정 완료입니다! 🎉
