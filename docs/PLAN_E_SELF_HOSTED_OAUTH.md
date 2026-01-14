# Plan E - Self-Hosted OAuth (Yoojasalon)

## 개요

Plan D의 개선 버전. **외부 OAuth Proxy 저장소에 의존하지 않고**, OAuth 인증 코드를 직접 프로젝트에 포함한다.
이를 통해 외부 저장소가 삭제되거나 비공개로 전환되어도 영향을 받지 않는다.

## Plan D와의 차이점

| 항목 | Plan D | Plan E |
|------|--------|--------|
| OAuth Proxy | 외부 저장소 Fork | **자체 코드 (api/ 폴더)** |
| 외부 의존성 | 외부 저장소 필요 | **없음** |
| 유지보수 | 외부 저장소에 의존 | **완전한 통제** |
| 배포 | Vercel에 별도 배포 | **동일 프로젝트에 포함** |

## 운영 결정 (현재)

- Vercel 프로젝트 루트: **레포 루트**
- 메인 호스팅: GitHub Pages
- Vercel 역할: OAuth API 전용

## 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                  GitHub 저장소 (yoojasalon_blog)                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ src/content │  │   public/   │  │  api/                   │  │
│  │  /posts/    │  │   admin/    │  │  auth.js (OAuth 시작)   │  │
│  │  *.md       │  │   images/   │  │  callback.js (콜백)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
        │                   │                      │
        ▼                   ▼                      ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐
│  GitHub Actions │  │   Decap CMS     │  │  Vercel Functions   │
│  (빌드/배포)     │  │  (관리자 UI)     │  │  (OAuth 처리)        │
└─────────────────┘  └─────────────────┘  └─────────────────────┘
        │                                          │
        ▼                                          │
┌─────────────────┐                                │
│  GitHub Pages   │◄───────────────────────────────┘
│  (정적 호스팅)   │
└─────────────────┘
```

## 핵심 차별점: 자체 OAuth 구현

### 왜 자체 구현인가?

1. **외부 의존성 제거**: 외부 저장소가 삭제/비공개되어도 무관
2. **완전한 통제**: 코드가 내 저장소에 있으므로 수정/디버깅 자유
3. **단일 배포**: 별도 프로젝트 없이 하나의 Vercel 프로젝트로 관리
4. **코드 간결**: OAuth 로직은 실제로 50줄 미만의 단순한 코드

### OAuth 흐름 (보안 포함)

```
1. 사용자가 /admin 접속
2. "GitHub으로 로그인" 클릭
3. /api/auth에서 **state(임시 확인값)** 생성 → GitHub OAuth 페이지로 리다이렉트
4. 사용자가 GitHub에서 승인
5. GitHub → /api/callback (code + state 전달)
6. callback에서 **state 검증** 후 code → access_token 교환
7. Decap CMS에 토큰 전달 → 로그인 완료
```

## 보안 필수 체크 (간단 요약)

1) **state 검증**: 로그인 요청이 진짜인지 확인 (10분 내 만료)
2) **허용 오리진 제한**: 토큰을 보낼 수 있는 사이트를 제한
3) **권한 최소화**: 공개 리포면 `public_repo`만 요청

## 디렉토리 구조 (현재 프로젝트 기준)

```
repo-root/
├── api/                      # Vercel Serverless Functions
│   ├── auth.js               # OAuth 시작점
│   └── callback.js           # OAuth 콜백 처리
├── src/
│   └── content/
│       ├── config.ts
│       └── posts/
│           └── *.md
├── public/
│   ├── admin/
│   │   ├── index.html        # Decap CMS 진입점
│   │   └── config.yml        # Decap CMS 설정
│   └── images/
│       └── uploads/
├── astro.config.mjs
├── vercel.json               # Vercel 설정
└── package.json
```

## 구현 상세

### 1. api/auth.js (OAuth 시작)

```javascript
// GitHub OAuth 인증 시작점
// GET /api/auth → GitHub 로그인 페이지로 리다이렉트

import crypto from "crypto";

const toBase64Url = (value) => Buffer.from(value).toString("base64url");
const sign = (value, secret) =>
  crypto.createHmac("sha256", secret).update(value).digest("base64url");
const getAllowedOrigins = () =>
  (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

export default function handler(req, res) {
  const clientId = process.env.OAUTH_CLIENT_ID;
  const siteUrl = process.env.SITE_URL;
  const stateSecret = process.env.OAUTH_STATE_SECRET;
  const allowedOrigins = getAllowedOrigins();

  if (!clientId || !siteUrl || !stateSecret || allowedOrigins.length === 0) {
    res.status(500).send("OAuth 환경 변수가 필요합니다.");
    return;
  }

  const redirectUri = `${siteUrl}/api/callback`;
  const scope = process.env.OAUTH_SCOPE || "public_repo";
  const payload = {
    nonce: crypto.randomUUID(),
    ts: Date.now(),
    origin: allowedOrigins[0],
  };
  const encoded = toBase64Url(JSON.stringify(payload));
  const state = `${encoded}.${sign(encoded, stateSecret)}`;

  const authUrl =
    "https://github.com/login/oauth/authorize" +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=${encodeURIComponent(state)}`;

  res.redirect(302, authUrl);
}
```

### 2. api/callback.js (OAuth 콜백)

```javascript
// GitHub OAuth 콜백 처리
// GitHub에서 code를 받아 access_token으로 교환

import crypto from "crypto";

const verify = (value, secret, signature) => {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(value)
    .digest("base64url");
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
};
const getAllowedOrigins = () =>
  (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

export default async function handler(req, res) {
  const { code, state } = req.query;
  const stateSecret = process.env.OAUTH_STATE_SECRET;
  const allowedOrigins = getAllowedOrigins();

  if (!code || !state || !stateSecret || allowedOrigins.length === 0) {
    return res.status(400).send("Missing OAuth parameters");
  }

  try {
    const [encoded, signature] = String(state).split(".");
    if (!encoded || !signature || !verify(encoded, stateSecret, signature)) {
      return res.status(400).send("Invalid state");
    }

    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    const isExpired = Date.now() - payload.ts > 10 * 60 * 1000;
    if (isExpired) {
      return res.status(400).send("Expired state");
    }

    if (!allowedOrigins.includes(payload.origin)) {
      return res.status(400).send("Invalid origin");
    }

    // code → access_token 교환
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.OAUTH_CLIENT_ID,
        client_secret: process.env.OAUTH_CLIENT_SECRET,
        code,
      }),
    });

    const data = await tokenResponse.json();

    if (data.error) {
      return res.status(400).send(`Error: ${data.error_description}`);
    }

    // Decap CMS가 기대하는 형식으로 응답
    // postMessage를 통해 부모 창에 토큰 전달
    const origin = payload.origin;
    const messageObj = { token: data.access_token, provider: "github" };
    const script = `
      <script>
        (function() {
          const origin = ${JSON.stringify(origin)};
          const message = ${JSON.stringify(messageObj)};
          function receiveMessage(e) {
            if (e.origin !== origin) return;
            window.opener.postMessage(
              'authorization:github:success:' + JSON.stringify(message),
              origin
            );
            window.removeEventListener("message", receiveMessage, false);
          }
          window.addEventListener("message", receiveMessage, false);
          window.opener.postMessage("authorizing:github", origin);
        })();
      </script>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(script);

  } catch (error) {
    console.error('OAuth error:', error);
    res.status(500).send('OAuth failed');
  }
}
```

### 3. vercel.json

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "astro"
}
```
※ `vercel.json`과 `api/` 폴더는 레포 루트에 위치해야 함

### 4. public/admin/config.yml

```yaml
backend:
  name: github
  repo: gogodevelop2/yoojasalon_blog # 실제 저장소명
  branch: main
  base_url: https://<vercel-앱>.vercel.app # OAuth Functions가 있는 Vercel URL
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
      - { label: "슬러그", name: "slug", widget: "string" }
      - { label: "발행일", name: "pubDate", widget: "datetime" }
      - { label: "수정일", name: "updatedDate", widget: "datetime", required: false }
      - { label: "카테고리", name: "category", widget: "string", required: false }
      - { label: "태그", name: "tags", widget: "list", required: false }
      - { label: "대표 이미지", name: "thumbnail", widget: "image", required: false }
      - { label: "요약", name: "summary", widget: "text", required: false }
      - { label: "상태", name: "status", widget: "select", options: ["draft", "published"], default: "draft" }
      - { label: "본문", name: "body", widget: "markdown" }
```

### 5. public/admin/index.html

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

## 구현 단계

### Part 1. Astro Content Collections 설정
**상태**: ✅ 완료 (기존 작업)

- `src/content/config.ts` 스키마 정의
- `src/content/posts/` 디렉토리 구조
- Markdown 기반 콘텐츠 시스템

---

### Part 2. 자체 OAuth 구현
**목표**: 외부 의존성 없는 OAuth 인증 구축

**작업 내용**:
1. GitHub OAuth App 생성
2. `api/auth.js` 작성
3. `api/callback.js` 작성
4. `vercel.json` 설정
5. 환경 변수 설정
6. **state 서명/만료 검증** 및 **허용 오리진 제한** 추가

**필요한 환경 변수**:
```
OAUTH_CLIENT_ID=xxx            # GitHub OAuth App Client ID
OAUTH_CLIENT_SECRET=xxx        # GitHub OAuth App Client Secret
OAUTH_STATE_SECRET=랜덤_긴_문자열  # state 서명용 키 (예: 32자 이상)
ALLOWED_ORIGINS=https://gogodevelop2.github.io # 여러 개면 쉼표로 구분
SITE_URL=https://<vercel-앱>.vercel.app
OAUTH_SCOPE=public_repo        # (선택) 공개 리포면 public_repo 권장
```
※ 비공개 리포를 쓸 경우 `OAUTH_SCOPE=repo`로 변경
※ `SITE_URL`은 OAuth API가 동작하는 Vercel 도메인
※ `ALLOWED_ORIGINS`는 보통 1개(실제 공개 사이트 도메인)

**완료 조건**:
- `/api/auth` 접속 시 GitHub 로그인 페이지로 이동
- 로그인 후 `/api/callback`에서 토큰 발급
- state 검증 실패 시 로그인 거부

---

### Part 3. Decap CMS 설치
**목표**: 관리자 UI 구축

**작업 내용**:
1. `public/admin/index.html` 생성
2. `public/admin/config.yml` 설정
3. 콘텐츠 필드 정의

**완료 조건**:
- `/admin`에서 GitHub 로그인 후 글 작성/편집 가능

---

### Part 4. Vercel 배포 설정
**목표**: 정적 사이트 + Serverless Functions 배포

**작업 내용**:
1. Vercel 프로젝트 생성
2. GitHub 저장소 연결
3. **프로젝트 루트**를 레포 루트로 지정
4. 환경 변수 설정
5. 배포 테스트

**완료 조건**:
- Vercel에서 사이트 정상 동작
- `/admin` 로그인 정상 동작

---

### Part 5. GitHub Pages 연동 (선택)
**목표**: GitHub Pages를 메인 호스팅으로 사용

**작업 내용**:
1. GitHub Actions 워크플로우 작성
2. Vercel은 OAuth API 전용으로 유지
3. 또는 Vercel만으로 전체 호스팅
4. GitHub Pages 사용 시 `ALLOWED_ORIGINS`에 Pages 도메인 포함
5. `public/admin/config.yml`의 `base_url`은 **항상 Vercel URL**

**옵션 A**: Vercel 전체 호스팅
**옵션 B**: GitHub Pages(정적) + Vercel(OAuth API) ✅ 선택됨

---

### Part 6. 마이그레이션
**목표**: 기존 백업 콘텐츠를 Markdown으로 변환

**작업 내용**:
- 마이그레이션 스크립트 작성
- HTML → Markdown 변환
- 이미지 파일 정리

---

## GitHub OAuth App 설정 가이드

### 1단계: OAuth App 생성
1. GitHub > Settings > Developer settings > OAuth Apps
2. "New OAuth App" 클릭
3. 설정값 입력:
   - **Application name**: `Yoojasalon CMS`
   - **Homepage URL**: `https://gogodevelop2.github.io/yoojasalon_blog` (GitHub Pages 사용 시)
     - Vercel만 사용할 경우: `https://<vercel-앱>.vercel.app`
   - **Authorization callback URL**: `https://<vercel-앱>.vercel.app/api/callback`
4. "Register application" 클릭
5. **Client ID** 복사
6. "Generate a new client secret" → **Client Secret** 복사

### 2단계: Vercel 환경 변수 설정
Vercel 프로젝트 > Settings > Environment Variables:
```
OAUTH_CLIENT_ID = (복사한 Client ID)
OAUTH_CLIENT_SECRET = (복사한 Client Secret)
OAUTH_STATE_SECRET = (랜덤 긴 문자열)
ALLOWED_ORIGINS = https://gogodevelop2.github.io
SITE_URL = https://<vercel-앱>.vercel.app
OAUTH_SCOPE = public_repo
```

## 작업 순서

```
Part 1 (Content Collections) ✅ 완료
    ↓
Part 2 (자체 OAuth 구현) ← 다음 작업
    ↓
Part 3 (Decap CMS 설치)
    ↓
Part 4 (Vercel 배포)
    ↓
Part 5 (호스팅 결정)
    ↓
Part 6 (마이그레이션)
```

## 제약 사항

1. **실시간 반영 불가**: 글 저장 → 빌드 → 배포까지 1-2분 소요
2. **이미지 용량**: GitHub 저장소 용량 제한 (1GB 권장)
3. **동시 편집**: Git 충돌 가능성 (1인 운영 시 문제 없음)

## 비용

| 항목 | 비용 |
|------|------|
| GitHub 저장소 | 무료 |
| Vercel Hobby | 무료 |
| Decap CMS | 무료 (오픈소스) |
| **총 비용** | **$0** |

## 장점 요약

1. **외부 의존성 0%**: 모든 코드가 내 저장소에 있음
2. **완전한 통제**: OAuth 로직 수정/디버깅 자유
3. **단일 배포**: 하나의 Vercel 프로젝트로 모든 것 관리
4. **영속성**: GitHub, Vercel (대기업 서비스)만 의존
5. **비용 $0**: 모든 서비스 무료 티어 사용

## 참고 문서

- [Decap CMS 공식 문서](https://decapcms.org/docs/)
- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [GitHub OAuth 문서](https://docs.github.com/en/developers/apps/building-oauth-apps)
