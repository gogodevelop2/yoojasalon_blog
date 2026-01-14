# 2026-01-14 (05) - Plan E 구현 기록 (시행착오 포함)

## 요약
- Plan E(Self-Hosted OAuth) 흐름을 실제 코드/배포로 완성.
- Vercel(OAuth 전용) + GitHub Pages(메인) 구조로 확정.
- 루트 구조 정리, 문서 이동, 이미지 경로 이슈 해결.
- GitHub Actions 배포 및 OAuth 인증 흐름 정상 동작 확인.

---

## 최종 구조 (확정)
- 메인 호스팅: GitHub Pages
- OAuth 처리: Vercel Functions
- 관리자: Decap CMS (`/admin`)
- 리포: `gogodevelop2/yoojasalon_blog`
- 프로젝트 루트: **레포 루트**

---

## 주요 작업 흐름

### 1) 리포/폴더 구조 정리
- `yoojasalon/` 내부에 있던 앱 파일을 **레포 루트로 이동**
  - `src/`, `public/`, `package.json`, `astro.config.mjs` 등 루트 위치로 정리
- 문서 파일은 `docs/`로 이동
  - `AGENTS.md`의 문서 경로도 `docs/` 기준으로 수정
- 백업 폴더는 `.gitignore` 처리

### 2) Plan E OAuth 코드 적용
- Vercel Functions 추가:
  - `api/auth.js` (OAuth 시작)
  - `api/callback.js` (OAuth 콜백)
- 보안 추가:
  - `state` 서명/만료 검증
  - 허용 오리진 체크
- `vercel.json` 생성

### 3) Decap CMS 설정
- `public/admin/config.yml`에 repo 및 Vercel URL 반영
  - `repo: gogodevelop2/yoojasalon_blog`
  - `base_url: https://yoojasalon-blog.vercel.app`
- `public_folder`는 GitHub Pages 경로 반영

### 4) GitHub Pages 배포 자동화
- `.github/workflows/deploy.yml` 추가 (Actions 배포)
- `astro.config.mjs`에 `site`, `base` 추가
  - `site: https://gogodevelop2.github.io`
  - `base: /yoojasalon_blog`
- GitHub Pages 설정에서 **Source = GitHub Actions**로 변경

---

## 시행착오 및 해결

### A. Vercel OAuth Proxy 링크 문제
- 기존 Plan D 링크가 삭제되어 대체 방식 필요
→ Plan E로 전환하여 **자체 OAuth 코드**로 해결

### B. GitHub Actions 푸시 권한 부족
- `.github/workflows` 푸시가 차단됨
→ `gh auth refresh -s workflow`로 **workflow scope 추가** 후 해결

### C. 콘텐츠 스키마 오류 (slug 필드)
문제:
- Astro Content Collections에서 `slug`를 필수 필드로 두었더니 빌드 실패

해결:
- `slug` 필드를 스키마에서 제거하고
- 라우팅은 `post.slug` (파일명 기반) 사용
- CMS에서도 슬러그 입력 필드 제거

### D. GitHub Pages 이미지 경로 깨짐
문제:
- `/images/...` 같은 절대경로가 Pages에서 깨짐
→ `/yoojasalon_blog/images/...`로 접근해야 함

해결:
- `import.meta.env.BASE_URL`을 사용해 모든 경로에 base를 붙임
- 추가로 `BASE_URL` 끝에 `/` 보정 로직 추가
  - `/yoojasalon_blogimages/...` 문제 해결

### E. 로그인 팝업 흰 화면
원인:
- `ALLOWED_ORIGINS`에 실제 접속 도메인이 포함되지 않아 메시지 전달 실패

해결:
- `ALLOWED_ORIGINS`에 GitHub Pages 도메인 추가
  - `https://gogodevelop2.github.io`

---

## 최종 동작 확인

### GitHub Pages
- 메인 페이지 정상 표시
- 이미지 정상 로딩

### Decap CMS
- `/admin` 접속 후 GitHub 로그인 정상
- 글 작성/수정 가능

---

## 최종 체크리스트 (운영용)

- GitHub OAuth App
  - Homepage URL: `https://gogodevelop2.github.io/yoojasalon_blog`
  - Callback URL: `https://yoojasalon-blog.vercel.app/api/callback`

- Vercel 환경 변수
  - `OAUTH_CLIENT_ID`
  - `OAUTH_CLIENT_SECRET`
  - `OAUTH_STATE_SECRET`
  - `ALLOWED_ORIGINS=https://gogodevelop2.github.io`
  - `SITE_URL=https://yoojasalon-blog.vercel.app`
  - `OAUTH_SCOPE=public_repo`

---

## 남은 작업
- 마이그레이션 스크립트 실행
- 기존 백업 글/이미지 대량 이관
