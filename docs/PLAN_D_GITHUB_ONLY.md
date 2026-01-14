# Plan D - GitHub Only (Yoojasalon)

## 개요

Supabase 없이 **GitHub만 사용**하는 완전 무료 정적 블로그 시스템.
Decap CMS로 관리자 UI를 제공하고, Markdown 파일로 콘텐츠를 관리한다.

## Plan C와의 차이점

| 항목 | Plan C (현재) | Plan D (전환) |
|------|--------------|---------------|
| 데이터 저장 | Supabase Postgres | GitHub 저장소 (Markdown) |
| 관리자 UI | 자체 admin.astro | Decap CMS |
| 인증 | Supabase Auth | GitHub OAuth |
| 이미지 저장 | Supabase Storage | GitHub 저장소 / 외부 CDN |
| 비용 | Supabase 무료 티어 제한 | 완전 무료 |

## 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                        GitHub 저장소                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ src/content │  │   public/   │  │  public/admin/      │  │
│  │  /posts/    │  │   images/   │  │  index.html         │  │
│  │  *.md       │  │             │  │  config.yml         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
        │                                      │
        ▼                                      ▼
┌─────────────────┐                  ┌─────────────────────┐
│  GitHub Actions │                  │     Decap CMS       │
│  (빌드/배포)     │                  │  (관리자 UI)         │
└─────────────────┘                  └─────────────────────┘
        │                                      │
        ▼                                      ▼
┌─────────────────┐                  ┌─────────────────────┐
│  GitHub Pages   │                  │  Vercel OAuth Proxy │
│  (정적 호스팅)   │                  │  (GitHub 인증)       │
└─────────────────┘                  └─────────────────────┘
```

## 핵심 워크플로우

1. 관리자가 `/admin`에서 Decap CMS 접속
2. GitHub OAuth로 로그인 (Vercel OAuth Proxy 경유)
3. 글 작성/편집/삭제 → GitHub 저장소에 자동 커밋
4. GitHub Actions가 빌드 트리거
5. 정적 사이트가 GitHub Pages에 배포

## 콘텐츠 구조

### 디렉토리 구조
```
repo-root/
├── src/
│   └── content/
│       ├── config.ts          # Astro Content Collections 설정
│       └── posts/
│           ├── hello-world.md
│           ├── second-post.md
│           └── ...
├── public/
│   ├── admin/
│   │   ├── index.html         # Decap CMS 진입점
│   │   └── config.yml         # Decap CMS 설정
│   └── images/
│       └── uploads/           # 업로드된 이미지
└── astro.config.mjs
```

### Markdown 파일 형식 (Frontmatter)
```markdown
---
title: "글 제목"
pubDate: 2026-01-12
updatedDate: 2026-01-12
category: "카테고리명"
tags: ["태그1", "태그2"]
thumbnail: "/images/uploads/thumbnail.jpg"
summary: "글 요약"
status: "published"  # draft | published
---

본문 내용 (Markdown)
```

## 구현 단계

### Part 1. Astro Content Collections 설정
**목표**: Markdown 파일 기반 콘텐츠 시스템 구축

**작업 내용**:
- `src/content/config.ts` 스키마 정의
- 기존 Supabase 연동 코드 제거
- Content Collections API로 데이터 조회 변경

**산출물**:
- `src/content/config.ts`
- `src/content/posts/` 디렉토리

**완료 조건**:
- `npm run build` 시 Markdown 파일에서 페이지 생성됨

---

### Part 2. Decap CMS 설치 및 설정
**목표**: 관리자 UI 구축

**작업 내용**:
- `public/admin/index.html` 생성
- `public/admin/config.yml` 설정
- GitHub OAuth App 생성
- Vercel에 OAuth Proxy 배포
- 콘텐츠 필드 정의 (title, slug, body 등)

**산출물**:
- `public/admin/index.html`
- `public/admin/config.yml`
- Vercel OAuth Proxy 배포 완료
- GitHub OAuth App 설정 완료

**완료 조건**:
- `/admin`에서 GitHub 로그인 후 글 작성/편집 가능

---

### Part 3. 페이지 템플릿 수정
**목표**: Supabase → Content Collections 전환

**작업 내용**:
- `src/pages/index.astro` 수정
- `src/pages/blog/index.astro` 수정
- `src/pages/blog/[...slug].astro` 수정
- `src/pages/category/[category].astro` 수정
- 기존 `src/pages/admin.astro` 제거

**산출물**:
- 수정된 페이지 파일들

**완료 조건**:
- 모든 페이지가 Markdown 기반 데이터로 정상 렌더링

---

### Part 4. GitHub Actions 워크플로우
**목표**: 자동 빌드/배포 설정

**작업 내용**:
- `.github/workflows/deploy.yml` 생성
- push 이벤트 시 자동 빌드
- GitHub Pages 배포 설정

**산출물**:
- `.github/workflows/deploy.yml`

**완료 조건**:
- 커밋 시 자동으로 사이트 업데이트

---

### Part 5. 마이그레이션
**목표**: 기존 백업 콘텐츠를 Markdown으로 변환

**작업 내용**:
- 마이그레이션 스크립트 작성
- HTML → Markdown 변환
- 이미지 파일 정리
- 샘플 10개 이관 테스트

**산출물**:
- `scripts/migrate-to-md.js`
- 변환된 Markdown 파일들

**완료 조건**:
- 최소 10개 글이 새 시스템에서 정상 표시

---

## Decap CMS 상세 설정

### public/admin/index.html
```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>유자살롱 관리자</title>
</head>
<body>
  <script src="https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js"></script>
</body>
</html>
```

### public/admin/config.yml
```yaml
backend:
  name: github
  repo: [username]/[repo-name]  # GitHub 저장소
  branch: main
  base_url: https://[your-vercel-app].vercel.app  # Vercel OAuth 프록시
  auth_endpoint: /api/auth

media_folder: "public/images/uploads"
public_folder: "/images/uploads"

locale: "ko"

collections:
  - name: "posts"
    label: "글"
    folder: "src/content/posts"
    create: true
    slug: "{{slug}}"
    fields:
      - { label: "제목", name: "title", widget: "string" }
      - { label: "발행일", name: "pubDate", widget: "datetime" }
      - { label: "수정일", name: "updatedDate", widget: "datetime", required: false }
      - { label: "카테고리", name: "category", widget: "string", required: false }
      - { label: "태그", name: "tags", widget: "list", required: false }
      - { label: "대표 이미지", name: "thumbnail", widget: "image", required: false }
      - { label: "요약", name: "summary", widget: "text", required: false }
      - { label: "상태", name: "status", widget: "select", options: ["draft", "published"], default: "draft" }
      - { label: "본문", name: "body", widget: "markdown" }
```

## GitHub OAuth 설정 (Vercel OAuth Proxy)

Decap CMS가 GitHub에 접근하려면 OAuth 인증이 필요하다.
Vercel에 OAuth 프록시를 배포하여 이를 해결한다.

### 사전 준비
1. **Vercel 계정** (무료)
2. **GitHub OAuth App** 생성

### 설정 단계

#### 1단계: GitHub OAuth App 생성
1. GitHub > Settings > Developer settings > OAuth Apps > New OAuth App
2. 설정값:
   - Application name: `Yoojasalon CMS`
   - Homepage URL: `https://[username].github.io/yoojasalon`
   - Authorization callback URL: `https://[your-vercel-app].vercel.app/callback`
3. Client ID와 Client Secret 저장

#### 2단계: Vercel에 OAuth Proxy 배포
1. 아래 저장소를 Fork:
   ```
   https://github.com/robinpokorny/netlify-cms-github-oauth-provider-vercel
   ```
2. Vercel에서 Fork한 저장소 Import
3. Environment Variables 설정:
   - `OAUTH_CLIENT_ID`: GitHub OAuth App의 Client ID
   - `OAUTH_CLIENT_SECRET`: GitHub OAuth App의 Client Secret
4. Deploy

#### 3단계: Decap CMS config.yml 수정
```yaml
backend:
  name: github
  repo: [username]/yoojasalon
  branch: main
  base_url: https://[your-vercel-app].vercel.app
  auth_endpoint: /api/auth
```

### 참고 저장소
- [netlify-cms-github-oauth-provider-vercel](https://github.com/robinpokorny/netlify-cms-github-oauth-provider-vercel)
- [decap-cms-github-oauth-provider](https://github.com/sterlingwes/decap-cms-github-oauth-provider)

## 작업 순서

```
Part 1 (Content Collections)
    ↓
Part 2 (Decap CMS)
    ↓
Part 3 (페이지 수정)
    ↓
Part 4 (GitHub Actions)
    ↓
Part 5 (마이그레이션)
```

## 제약 사항

1. **실시간 반영 불가**: 글 저장 → 빌드 → 배포까지 1-2분 소요
2. **이미지 용량**: GitHub 저장소 용량 제한 (1GB 권장)
3. **동시 편집**: Git 충돌 가능성 (1인 운영 시 문제 없음)
4. **검색 기능**: 클라이언트 사이드 검색 또는 외부 서비스 필요

## 비용

| 항목 | 비용 |
|------|------|
| GitHub 저장소 | 무료 |
| GitHub Pages | 무료 |
| GitHub Actions | 무료 (월 2,000분) |
| Decap CMS | 무료 (오픈소스) |
| Vercel OAuth Proxy | 무료 (Hobby 플랜) |
| **총 비용** | **$0** |

## 기존 파일 정리

### 삭제 대상
- `src/pages/admin.astro` (Decap CMS로 대체)
- `.env` 내 Supabase 관련 변수

### 수정 대상
- `package.json` - @supabase/supabase-js 제거
- 모든 Supabase import 제거

## 참고 문서

- [Decap CMS 공식 문서](https://decapcms.org/docs/)
- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/)
- [GitHub Pages 배포](https://docs.astro.build/en/guides/deploy/github/)
- [Vercel OAuth Proxy 저장소](https://github.com/robinpokorny/netlify-cms-github-oauth-provider-vercel)
