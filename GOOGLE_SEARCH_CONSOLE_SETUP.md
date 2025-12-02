# Google Search Console 설정 가이드

## 📋 개요

Google Search Console(GSC)은 Google 검색에서 웹사이트 성능을 모니터링하고 최적화하는 무료 도구입니다.
sitemap.xml과 robots.txt를 제출하여 검색 엔진이 사이트를 효율적으로 크롤링하고 색인할 수 있도록 합니다.

---

## 🚀 1단계: Google Search Console 등록

### 1.1 사이트 추가

1. https://search.google.com/search-console 접속
2. Google 계정으로 로그인
3. **속성 추가** 클릭
4. 속성 유형 선택:
   - **URL 접두어**: `https://www.oneulfridge.com` (권장)
   - 또는 **도메인**: `oneulfridge.com` (DNS 인증 필요)

### 1.2 소유권 확인 (URL 접두어 방식)

다음 중 한 가지 방법으로 소유권을 확인하세요:

#### 방법 1: HTML 파일 업로드 (가장 간단)

1. Google이 제공하는 HTML 파일 다운로드 (예: `google1234567890abcdef.html`)
2. 파일을 프로젝트의 `public/` 디렉토리에 복사
   ```bash
   cp google1234567890abcdef.html public/
   ```
3. Vercel에 배포:
   ```bash
   git add public/google1234567890abcdef.html
   git commit -m "Add Google Search Console verification file"
   git push
   ```
4. 배포 완료 후, Google Search Console에서 **확인** 클릭
5. 확인 URL: `https://www.oneulfridge.com/google1234567890abcdef.html`

#### 방법 2: HTML 태그 추가

1. Google이 제공하는 메타 태그 복사:
   ```html
   <meta name="google-site-verification" content="abcd1234..." />
   ```
2. `src/App.tsx` 또는 `index.html`의 `<head>` 섹션에 추가:
   ```tsx
   <Helmet>
     <meta name="google-site-verification" content="abcd1234..." />
   </Helmet>
   ```
3. 배포 후 **확인** 클릭

#### 방법 3: Google Analytics 연동

- 이미 GA4가 설정되어 있다면, Google Analytics 계정을 통해 자동 확인 가능
- **Google Analytics 계정 사용** 옵션 선택

#### 방법 4: Google 태그 관리자 연동

- GTM이 설정되어 있다면 GTM을 통해 확인 가능

---

## 📊 2단계: Sitemap 제출

### 2.1 sitemap.xml 생성

sitemap.xml은 자동으로 생성됩니다:

```bash
npm run generate-sitemap
```

이 명령은 Supabase에서 모든 레시피를 가져와 `public/sitemap.xml` 파일을 생성합니다.

### 2.2 sitemap.xml 확인

생성된 sitemap은 다음 URL에서 접근 가능합니다:
```
https://www.oneulfridge.com/sitemap.xml
```

브라우저에서 위 URL에 접속하여 올바르게 표시되는지 확인하세요.

### 2.3 Google Search Console에 sitemap 제출

1. Google Search Console → **색인 생성** → **Sitemaps** 클릭
2. **새 사이트맵 추가** 입력란에 `sitemap.xml` 입력
3. **제출** 클릭
4. 상태가 **성공**으로 표시될 때까지 대기 (수 분~수 시간 소요)

### 2.4 sitemap 상태 확인

- **성공**: sitemap이 정상적으로 처리됨
- **오류**: sitemap 형식 오류 또는 접근 불가
  - 오류 발생 시 sitemap.xml 파일 내용과 접근 가능 여부 확인
- **경고**: 일부 URL이 색인되지 않음 (정상적인 경우도 있음)

---

## 🔍 3단계: robots.txt 확인

### 3.1 robots.txt 접근 확인

다음 URL에서 robots.txt가 올바르게 표시되는지 확인하세요:
```
https://www.oneulfridge.com/robots.txt
```

### 3.2 robots.txt 테스트

1. Google Search Console → **설정** → **robots.txt 테스터** 클릭
2. robots.txt 내용이 표시됨
3. 특정 URL이 차단되지 않았는지 테스트 가능

---

## 📈 4단계: 색인 생성 요청

### 4.1 개별 URL 색인 요청

Google이 특정 페이지를 빠르게 크롤링하도록 요청할 수 있습니다:

1. Google Search Console → **URL 검사** 클릭
2. 색인을 요청할 URL 입력 (예: `https://www.oneulfridge.com/recipe/abc123`)
3. **색인 생성 요청** 클릭
4. Google이 해당 페이지를 우선적으로 크롤링

### 4.2 대량 색인 생성

- sitemap.xml을 제출하면 Google이 자동으로 모든 URL을 크롤링
- 일반적으로 수일~수주 소요

---

## 🛠️ 5단계: 성능 모니터링

### 5.1 검색 성과 보고서

Google Search Console → **실적** → **검색 결과**에서 다음 데이터를 확인할 수 있습니다:

- **총 클릭 수**: 검색 결과에서 사이트로 유입된 클릭 수
- **총 노출 수**: 검색 결과에 사이트가 표시된 횟수
- **평균 CTR**: 클릭률 (클릭 수 / 노출 수)
- **평균 게재 순위**: 검색 결과에서 평균 순위

### 5.2 검색어 분석

**검색어** 탭에서 다음 정보를 확인:
- 사용자가 어떤 키워드로 사이트를 찾았는지
- 각 키워드의 클릭 수, 노출 수, CTR, 게재 순위
- SEO 개선을 위한 키워드 인사이트

### 5.3 페이지별 성과

**페이지** 탭에서 다음 정보를 확인:
- 가장 많이 노출된 페이지
- 가장 많이 클릭된 페이지
- 개선이 필요한 페이지 식별

### 5.4 색인 적용 범위

Google Search Console → **색인 생성** → **페이지**에서 확인:
- **색인 생성됨**: Google에 정상적으로 색인된 페이지 수
- **색인 생성 안 됨**: 색인되지 않은 페이지 (오류 원인 확인 가능)
- **제외됨**: 의도적으로 색인에서 제외된 페이지

---

## 🔗 6단계: Google Analytics 4와 연동

### 6.1 GA4 연동 (선택사항)

Google Search Console과 Google Analytics를 연동하면 더 풍부한 데이터를 얻을 수 있습니다:

1. Google Analytics → **관리** → **Search Console 링크** 클릭
2. **링크** 클릭
3. Google Search Console 속성 선택
4. **확인** 및 **제출**

### 6.2 연동 후 이점

- GA4에서 검색어 데이터 확인 가능
- 검색 유입과 사용자 행동 데이터 통합 분석
- 이탈률, 전환율과 검색 성과 비교 가능

---

## 📚 7단계: 정기적인 유지보수

### 7.1 sitemap 업데이트

새 레시피가 추가될 때마다 sitemap을 업데이트하세요:

```bash
npm run generate-sitemap
git add public/sitemap.xml
git commit -m "Update sitemap.xml"
git push
```

자동화 방법 (선택사항):
- GitHub Actions를 사용하여 매일 자동으로 sitemap 생성 및 배포
- Vercel Build Hooks를 사용하여 배포 시 자동 생성

### 7.2 색인 상태 모니터링

최소 주 1회 Google Search Console에서 다음을 확인:
- 색인 생성된 페이지 수 증가 여부
- 오류 발생 여부
- 검색 노출 및 클릭 수 추이

### 7.3 검색 성과 개선

- 낮은 CTR을 보이는 페이지의 제목/설명 개선
- 게재 순위가 낮은 중요 페이지의 SEO 최적화
- 사용자가 검색하는 키워드를 콘텐츠에 반영

---

## 🛠️ 트러블슈팅

### sitemap 제출 실패

**문제**: sitemap 제출 시 "가져올 수 없음" 오류

**해결 방법**:
1. sitemap.xml URL이 정상적으로 접근 가능한지 확인
   ```bash
   curl -I https://www.oneulfridge.com/sitemap.xml
   ```
2. robots.txt에서 sitemap을 차단하지 않았는지 확인
3. XML 형식이 올바른지 확인 (온라인 XML 검증 도구 사용)

### 페이지가 색인되지 않음

**문제**: 특정 페이지가 색인 생성되지 않음

**해결 방법**:
1. **URL 검사** 도구로 해당 URL 확인
2. **색인 생성 요청** 클릭
3. robots.txt에서 해당 경로가 차단되지 않았는지 확인
4. 페이지에 `noindex` 메타 태그가 없는지 확인

### 검색 결과에 표시되지 않음

**문제**: sitemap 제출 후에도 검색 결과에 나타나지 않음

**해결 방법**:
- 색인 생성은 수일~수주 소요 (인내심 필요)
- 콘텐츠 품질이 낮으면 색인되어도 검색 결과에 나타나지 않을 수 있음
- Schema.org 마크업, 메타 태그, 콘텐츠 품질 개선 필요

---

## ✅ 체크리스트

- [ ] Google Search Console 속성 추가
- [ ] 소유권 확인 (HTML 파일 또는 메타 태그)
- [ ] sitemap.xml 생성 (`npm run generate-sitemap`)
- [ ] sitemap.xml 제출
- [ ] robots.txt 접근 확인
- [ ] 주요 레시피 페이지 색인 요청
- [ ] Google Analytics 4와 연동 (선택사항)
- [ ] 검색 성과 보고서 확인 (1주일 후)
- [ ] 정기적인 sitemap 업데이트 프로세스 구축

---

## 💡 팁

- **초기 색인**: 첫 sitemap 제출 후 색인 생성까지 1-2주 소요
- **검색 노출**: 색인 생성 후에도 검색 결과 노출까지 추가 시간 필요
- **콘텐츠 품질**: 고품질 콘텐츠일수록 빠르게 색인되고 높은 순위 획득
- **정기 업데이트**: 새 레시피 추가 시 sitemap을 즉시 업데이트하고 재제출
- **모바일 우선**: Google은 모바일 버전을 우선적으로 색인하므로 모바일 최적화 필수

---

## 📚 추가 리소스

- [Google Search Console 공식 문서](https://support.google.com/webmasters/)
- [sitemap.xml 형식 가이드](https://www.sitemaps.org/protocol.html)
- [robots.txt 사양](https://developers.google.com/search/docs/crawling-indexing/robots/intro)
- [Google 검색 센터](https://developers.google.com/search)
