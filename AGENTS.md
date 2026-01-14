# AGENTS.md

이 프로젝트에서 AI/사람이 작업할 때 지켜야 할 기준을 정리합니다.

## 프로젝트 목적
- Decap CMS를 통해 웹에서 글을 관리하고, 정적 사이트로 배포
- GitHub 저장소가 데이터 원본 (Markdown 파일)
- 화면 구성(Astro)은 유연하게 교체 가능

## 확정된 결정사항 (Plan E)
- 현재 플랜: **Plan E** (Self-Hosted OAuth)
- 메인 호스팅: GitHub Pages (정적 사이트)
- OAuth API: Vercel Functions (자체 구현)
- 자동화: GitHub Actions (빌드/배포)
- 데이터 저장: GitHub 저장소 (Markdown 파일)
- 콘텐츠 입력: Decap CMS (`/admin`)
- 인증: GitHub OAuth (자체 OAuth Proxy)

## 아키텍처 개요
```
GitHub 저장소 (yoojasalon_blog)
├── src/content/posts/*.md   → 콘텐츠 (Markdown)
├── public/admin/            → Decap CMS
└── api/                     → OAuth Functions (Vercel 배포)

GitHub Actions → 빌드 → GitHub Pages (메인 사이트)
Vercel → OAuth API 전용 (/api/auth, /api/callback)
```

## 작업 흐름
1) `/admin`에서 Decap CMS로 글 작성/수정
2) GitHub OAuth로 인증 (Vercel OAuth Proxy 경유)
3) 저장 시 GitHub 저장소에 자동 커밋
4) GitHub Actions가 빌드 트리거
5) GitHub Pages로 배포

## 데이터 원본 규칙
- **GitHub 저장소가 원본** (src/content/posts/*.md)
- GitHub Pages는 빌드 시점 스냅샷
- Supabase는 사용하지 않음 (Plan C에서 폐기)

## 비밀 관리
- OAuth 키는 **Vercel 환경변수**에만 저장
- 레포에 키/토큰을 커밋하지 않음
- `.env`는 로컬 개발용 (gitignore 처리됨)

### Vercel 환경변수 목록
```
OAUTH_CLIENT_ID      - GitHub OAuth App Client ID
OAUTH_CLIENT_SECRET  - GitHub OAuth App Client Secret
OAUTH_STATE_SECRET   - state 서명용 비밀 키
ALLOWED_ORIGINS      - 허용된 오리진 (예: https://gogodevelop2.github.io)
SITE_URL             - Vercel 배포 URL
OAUTH_SCOPE          - GitHub OAuth scope (기본: public_repo)
```

## 개발 명령어
- `npm run dev` - 로컬 개발 서버
- `npm run build` - 프로덕션 빌드
- `npm run preview` - 빌드 결과 미리보기

## 주요 문서 위치
- Plan E 설계: `docs/PLAN_E_SELF_HOSTED_OAUTH.md`
- 구현 기록: `docs/DEVLOG-05-2026-01-14-plan-e-implementation.md`
- 마이그레이션 계획: `docs/마이그레이션-계획.md`

## 코드 구조
```
src/
├── utils/paths.js       - 경로 유틸리티 (withBase 등)
├── content/config.ts    - Content Collections 스키마
├── layouts/             - 레이아웃 컴포넌트
├── components/          - 재사용 컴포넌트
└── pages/               - 페이지 라우트

api/
├── _utils.js            - OAuth 공통 유틸리티
├── auth.js              - OAuth 시작점
└── callback.js          - OAuth 콜백

public/admin/
├── index.html           - Decap CMS 진입점
└── config.yml           - Decap CMS 설정
```

## 히스토리
- Plan A~C: Supabase 기반 설계 (폐기)
- Plan D: 외부 OAuth Proxy 의존 (폐기)
- **Plan E**: 자체 OAuth 구현 (현재)
