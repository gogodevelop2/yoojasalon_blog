# AGENTS.md

이 프로젝트에서 AI/사람이 작업할 때 지켜야 할 기준을 정리합니다.

## 프로젝트 목적
- Supabase Studio/간단한 관리 화면/CLI에서 글을 관리하고, 정적 사이트로 배포
- CLI로 조회/통계/정리 작업 수행
- 화면 구성(Astro)은 유연하게 교체 가능

## 확정된 결정사항 (Plan C)
- 현재 플랜: Plan C (GitHub Pages 중심)
- 호스팅: GitHub Pages (정적 사이트)
- 자동화: GitHub Actions (빌드/배포)
- DB/Storage: Supabase(Postgres + Storage)
- 프론트: Astro SSG (빌드 시점 데이터 수집)
- 콘텐츠 입력: Supabase Studio + 간단한 관리 화면 + CLI
- CLI 역할: 조회/통계/정리/보조 작업
- 빌드 트리거: 수동 + 일정 주기 보조

## 작업 흐름
1) Supabase Studio/간단한 관리 화면/CLI에서 글 발행/수정
2) 수동 또는 일정 빌드 트리거
3) Actions가 빌드 시점에 DB에서 데이터 수집
4) GitHub Pages로 배포

## 데이터 원본 규칙
- DB가 원본
- GitHub Pages는 빌드 시점 스냅샷
- 실시간 DB 조회는 하지 않음

## CLI 역할
- 조회/통계/정리 중심
- 필요 시 보조 발행 가능

## 비밀 관리
- DB/API 키는 GitHub Actions Secrets에만 저장
- 레포에 키/토큰을 커밋하지 않음

## 개발 명령어
- `npm run dev`
- `npm run build`
- `npm run preview`

## 문서 위치
- 마스터 플랜: `docs/MASTERPLAN.md`
- 설계 메모: `docs/AI-CMS-설계-메모.md`
- Plan C 설계: `docs/PLAN_C_GITHUB_PAGES.md`
- 마이그레이션 워크플로우: `docs/MIGRATION_WORKFLOW.md`
- 간단한 관리 화면: `docs/LIGHT_ADMIN_UI.md`
- Plan A/B: 참고용 문서 (`docs/PLAN_A_DIRECTUS_CLOUD.md`, `docs/PLAN_B_VERCEL_NETLIFY.md`)
