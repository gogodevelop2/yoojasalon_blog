# 2026-01-12 (04) - Plan D OAuth Proxy 링크 문제와 대안

## 요약
- Plan D 문서에 적힌 Vercel OAuth Proxy 저장소 링크가 현재 접근 불가.
- Decap CMS 로그인을 위해 새로운 OAuth Proxy 저장소로 대체 필요.
- 대안 리포: `allizjp/decap-cms-oauth-provider` (Vercel Functions 기반).

## 문제 상황
- 기존 링크: `robinpokorny/netlify-cms-github-oauth-provider-vercel`
- 현재 GitHub에서 "페이지 없음" 오류 발생 (삭제/비공개 추정).
- 이 링크를 기준으로는 OAuth Proxy 배포가 진행되지 않음.

## 대안
### 1) Vercel Functions 기반 (추천)
- 리포: `https://github.com/allizjp/decap-cms-oauth-provider`
- 특징: Vercel에서 바로 배포 가능, Decap CMS GitHub OAuth용.
- 필요한 환경 변수:
  - `OAUTH_CLIENT_ID` (GitHub OAuth App Client ID)
  - `OAUTH_CLIENT_SECRET` (GitHub OAuth App Client Secret)
  - `OAUTH_PROVIDER=github`
  - `ORIGIN=https://gogodevelop2.github.io`
  - `COMPLETE_URL=https://<vercel-앱>.vercel.app/api/complete`
- GitHub OAuth App 콜백 URL:
  - `https://<vercel-앱>.vercel.app/api/complete`

### 2) 기타 대안 (예비)
- Cloudflare Worker 기반 OAuth Provider
- AWS Lambda 기반 OAuth Provider
- GitHub 웹에서 직접 파일 편집 (CMS 없이 운영)

## 영향 범위
- `/admin` 로그인 기능이 OAuth Proxy 없이는 동작하지 않음.
- 관리자 UI(Decap CMS) 도입은 유지 가능하나, 인증 경로 변경 필요.

## 다음 단계
1) GitHub OAuth App 생성 (Client ID/Secret 확보).
2) `allizjp/decap-cms-oauth-provider` Fork → Vercel 배포.
3) Vercel 환경 변수 설정 후 배포 완료.
4) `public/admin/config.yml`의 `base_url` 업데이트.
