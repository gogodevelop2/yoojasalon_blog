# 2026-01-14 (06) - 코드 리뷰 및 리팩토링

## 요약
- Plan E 구현 후 전체 코드 리뷰 수행
- 중복 코드 제거, 문서 정리, 보안/설정 개선
- 빌드 테스트 통과 후 배포 완료

---

## 발견된 문제점 및 해결

### 1. 중복 코드

#### 문제: `withBase` 함수 5개 파일에서 중복 정의
- `src/pages/index.astro`
- `src/pages/blog/index.astro`
- `src/pages/category/[category].astro`
- `src/layouts/BaseLayout.astro`
- `src/components/Navigation.astro`

#### 해결: 공통 유틸리티로 추출
```
신규 파일: src/utils/paths.js
├── getBasePath() - BASE_URL 정규화
└── withBase(path) - 경로에 BASE_URL 붙이기
```

각 파일에서 `import { withBase } from "../utils/paths.js";`로 변경

---

#### 문제: `getAllowedOrigins` 함수 2개 파일에서 중복
- `api/auth.js`
- `api/callback.js`

#### 해결: OAuth 공통 모듈로 추출
```
신규 파일: api/_utils.js
├── getAllowedOrigins() - 환경변수에서 허용 오리진 파싱
├── pickOrigin() - 요청 오리진 선택
├── toBase64Url() - base64url 인코딩
├── sign() - HMAC-SHA256 서명
├── verify() - 서명 검증 (타이밍 공격 방지)
└── getFirstQueryValue() - 쿼리 파라미터 추출
```

NOTE: 파일명이 `_`로 시작하면 Vercel이 API 엔드포인트로 노출하지 않음

---

### 2. 문서 불일치

#### 문제: AGENTS.md가 Plan C(Supabase) 기준
현재는 Plan E(Self-Hosted OAuth)로 전환됨

#### 해결: AGENTS.md 전면 재작성
- Plan E 아키텍처 반영
- Vercel 환경변수 목록 추가
- 코드 구조 설명 추가
- 히스토리 섹션 추가

---

#### 문제: MASTERPLAN.md도 Plan C 기준
#### 해결: 상단에 ARCHIVED 안내 추가
```markdown
> ⚠️ **ARCHIVED** - 이 문서는 Plan C (Supabase 기반) 설계로, 현재는 사용되지 않습니다.
> 현재 플랜: Plan E (Self-Hosted OAuth)
```

---

### 3. 불필요한 설정

#### 문제: `.env`에 Supabase 키 남아 있음
Plan E에서는 Supabase를 사용하지 않음

#### 해결: `.env` 내용 정리
- Supabase 키 삭제
- 로컬 OAuth 테스트용 안내 주석으로 교체

---

### 4. 보안/안정성

#### 문제: Decap CMS 버전 범위 지정 (`^3.0.0`)
예기치 않은 breaking change 위험

#### 해결: 특정 버전 고정 (`3.3.3`)
```html
<script src="https://unpkg.com/decap-cms@3.3.3/dist/decap-cms.js"></script>
```

NOTE: 업데이트 시 https://github.com/decaporg/decap-cms/releases 확인

---

### 5. 성능

#### 문제: `category/[category].astro`에서 `getCollection` 이중 호출
- `getStaticPaths()`에서 한 번
- 컴포넌트 본문에서 또 한 번

#### 해결: props로 데이터 전달
```javascript
export async function getStaticPaths() {
  const allPosts = await getCollection("posts");
  // ...
  return categories.map((category) => ({
    params: { category },
    props: {
      category,
      allCategories: categories,      // 미리 계산
      categoryPosts: filteredPosts,   // 미리 필터링
    },
  }));
}

const { category, allCategories, categoryPosts } = Astro.props;
```

---

### 6. UI 버그 수정

#### 문제: admin 페이지 상단에 불필요한 공백 발생
로딩 UI CSS가 Decap CMS 레이아웃과 충돌

#### 해결: 로딩 UI CSS 제거
버전 고정 주석만 유지

---

## 커밋 내역

```
e0c3fce Refactor: extract shared utilities and update docs for Plan E
6f9e09a Fix admin page layout by removing conflicting CSS
```

---

## 변경 파일 목록

### 신규 파일
- `src/utils/paths.js` - 경로 유틸리티
- `api/_utils.js` - OAuth 공통 유틸리티

### 수정 파일
- `AGENTS.md` - Plan E 기준으로 재작성
- `docs/MASTERPLAN.md` - ARCHIVED 안내 추가
- `api/auth.js` - 공통 모듈 import로 변경
- `api/callback.js` - 공통 모듈 import로 변경
- `public/admin/index.html` - 버전 고정, CSS 제거
- `src/pages/index.astro` - withBase import
- `src/pages/blog/index.astro` - withBase import
- `src/pages/category/[category].astro` - withBase import + 이중 조회 개선
- `src/layouts/BaseLayout.astro` - withBase import
- `src/components/Navigation.astro` - withBase import
- `.env` - Supabase 키 제거

---

## 기억할 포인트

1. **새 유틸리티 추가 시**: `src/utils/`에 추가하고 JSDoc 주석 작성
2. **API 헬퍼 추가 시**: `api/_utils.js`에 추가 (언더스코어로 시작해야 노출 안 됨)
3. **Decap CMS 업데이트 시**: 버전 고정이므로 수동으로 버전 변경 필요
4. **Plan 변경 히스토리**: AGENTS.md 하단 "히스토리" 섹션에 기록

---

## 남은 작업
- 마이그레이션 스크립트 실행
- 기존 백업 글/이미지 대량 이관
