# 간단한 관리 화면 (Plan C)

## 목표
- 완전한 CMS 없이 최소한의 글쓰기/수정 UI 제공
- GitHub Pages(정적 호스팅)에서 동작
- Supabase Auth + RLS로 쓰기 권한 보안 유지

## 제약
- GitHub Pages에는 서버 런타임이 없음
- 브라우저에 비밀키를 넣지 않음
- 모든 쓰기 작업은 Supabase RLS 규칙으로 허용되어야 함

## 구조
- 페이지: `/admin` (Astro 페이지 + 클라이언트 Supabase SDK)
- 인증: Supabase Auth (이메일/비밀번호 또는 매직 링크)
- DB: Supabase Postgres
- 스토리지: Supabase Storage (이미지/첨부파일)

## 데이터 모델 (posts)
- `title`, `slug`, `body_md`
- `category_id`, `tags` (text 배열)
- `status` (draft/published), `published_at`
- `thumbnail_url`, `attachments` (json 배열)
- `legacy_id`, `legacy_url` (내부용)

## 인증 + RLS (최소 구성)
테이블
- `profiles`에 `user_id`, `role`

RLS 정책 개념
- `posts`에 insert/update 허용 조건:
  - `auth.uid()`가 `profiles`에 존재
  - `profiles.role = 'editor'`

## 보안/스팸 방지 핵심
- `/admin`은 누구나 열 수 있지만, 쓰기는 **로그인 + RLS 통과**가 필수
- **외부에서 API를 직접 호출해도** RLS가 거부하도록 설계
- 공개 읽기는 `status = 'published'`만 허용
- Storage 업로드도 `editor/admin`만 허용
- Supabase Auth는 **invite-only + 이메일 인증** 권장

## 권한 분배(공동관리자)
역할 예시
- `admin`: 글 작성/수정/삭제 + 카테고리 관리
- `editor`: 글 작성/수정 (삭제는 불가)
- `viewer`: 읽기만 가능

관리 방법
- 초기에는 Supabase Studio에서 `profiles.role`을 직접 변경
- 필요 시 `/admin`에 사용자 관리 화면 추가 가능

## RLS 정책 초안(역할 기반, 설명용)
읽기 정책
- 공개 읽기: `status = 'published'`인 글만 허용

쓰기 정책
- 글 생성/수정: `admin` 또는 `editor`만 허용
- 글 삭제: `admin`만 허용

카테고리 정책(선택)
- 카테고리 생성/수정/삭제: `admin`만 허용

스토리지 정책(이미지/첨부)
- 업로드: `admin` 또는 `editor`만 허용
- 다운로드: 공개 읽기 허용 또는 `published` 글에서만 링크 제공

## UI 흐름
1) 로그인 화면 (Supabase Auth)
2) 글 목록 (상태별 필터)
3) 편집 화면 (제목/카테고리/태그/본문 Markdown)
4) 이미지/파일 업로드 (Storage)
5) 임시저장 또는 발행

## 빌드 트리거 (Plan C)
- 기본: GitHub Actions 수동 실행
- 보조: 일정 시간마다 자동 빌드 (예: 하루 1회)
- 옵션: `build_requests` 테이블을 두고 발행 시 플래그 설정,
  Actions가 이를 확인해 빌드 수행

## 구현 단계
1) Astro에 `/admin` 페이지 추가
2) 클라이언트 스크립트에 `@supabase/supabase-js` 사용
3) `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` 사용
4) Supabase에서 RLS 정책 적용
5) 로그인/작성/수정/업로드 테스트

## 메모
- `legacy_id`, `legacy_url`은 공개 페이지에서 사용하지 않음
- Markdown 미리보기는 클라이언트에서만 처리
