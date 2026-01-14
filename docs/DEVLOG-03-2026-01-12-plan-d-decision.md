# 2026-01-12 (03) - Plan D 전환 결정

## 요약
- Supabase 무료 플랜 제한으로 Plan C → Plan D 전환 결정
- Plan D 구현 계획 문서 작성 (`PLAN_D_GITHUB_ONLY.md`)
- OAuth 인증: Netlify → Vercel OAuth Proxy로 결정

## 배경

### 문제
- Supabase 무료 플랜: 동시에 2개 DB만 사용 가능
- 유자살롱 블로그를 위해 별도 DB 슬롯 사용이 부담

### 결정
- **Plan D 채택**: GitHub만 사용하는 완전 무료 정적 블로그
- 데이터베이스 없이 Markdown 파일로 콘텐츠 관리

## Plan D 핵심 구조

| 항목 | Plan C (이전) | Plan D (신규) |
|------|--------------|---------------|
| 데이터 저장 | Supabase Postgres | GitHub 저장소 (Markdown) |
| 관리자 UI | 자체 admin.astro | Decap CMS |
| 인증 | Supabase Auth | GitHub OAuth (Vercel 경유) |
| 비용 | Supabase 제한 | 완전 무료 |

## OAuth 인증 방식 결정

### 검토한 옵션
1. Netlify Identity + Git Gateway
2. Cloudflare Workers OAuth Proxy
3. Vercel OAuth Proxy
4. GitHub 직접 편집 (CMS 없음)

### 선택: Vercel OAuth Proxy
- Netlify 로그인 문제로 제외
- Vercel이 Cloudflare보다 GitHub 연동이 매끄러움
- npm 패키지로 간편 배포 가능

### Vercel OAuth 설정 흐름
```
1. GitHub OAuth App 생성
2. Vercel에 OAuth Proxy 배포 (Fork → Import)
3. Decap CMS config.yml에 base_url 설정
```

## 생성/수정된 파일

### 신규 생성
- `PLAN_D_GITHUB_ONLY.md` - Plan D 구현 계획서

### 수정
- `PLAN_D_GITHUB_ONLY.md` - Netlify → Vercel로 OAuth 설정 변경

## 구현 예정 단계

```
Part 1: Astro Content Collections 설정
Part 2: Decap CMS + Vercel OAuth Proxy 설정
Part 3: 페이지 템플릿 수정 (Supabase → Markdown)
Part 4: GitHub Actions 배포 자동화
Part 5: 기존 콘텐츠 마이그레이션
```

## 다음 단계
- Part 1부터 순차적으로 구현 시작
- 먼저 Vercel OAuth Proxy 배포 테스트 권장

## 참고
- Plan D 상세: `PLAN_D_GITHUB_ONLY.md`
- Vercel OAuth Proxy: https://github.com/robinpokorny/netlify-cms-github-oauth-provider-vercel
