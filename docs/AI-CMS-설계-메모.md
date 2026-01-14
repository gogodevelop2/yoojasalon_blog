# AI 친화형 CMS 설계 메모

## 참고
- 이 문서는 Directus 기반 CMS 플랜을 기록한 참고용 메모입니다.
- 현재 Plan C는 Directus를 사용하지 않고 Supabase Studio + CLI로 운영합니다.

## 목표
- 사람이 웹에서 편집 가능 (CMS UI)
- AI가 CLI로 데이터 조회/통계/정리 가능
- 디자인은 코드(Astro)로 자유롭게 수정
- 터미널에서 텍스트 파일을 지정하면 AI가 알아서 편집/발행까지 가능

## 제안 구성
- DB: Supabase (Postgres)
- CMS UI: Directus (관리용)
- 공개 API: 별도 경량 서비스 (관리 API와 분리)
- 프론트: Astro
- AI/CLI: 파일 입력 -> 메타 추출 -> Directus API 업로드

## 핵심 동작 흐름
1. 터미널에서 텍스트/마크다운 파일 지정
2. AI가 파일을 읽고 메타데이터(제목/카테고리/요약/태그 등) 추출
3. Directus API로 게시물 생성 요청
4. DB에 저장
5. Astro/공개 API는 DB에서 콘텐츠를 가져와 반영

## 역할 분리
- 사람: Directus 웹 UI로 편집/검수
- AI: CLI로 SQL 조회/분석/정리 + 게시 자동화
- 공개 API: 외부/내부 소비용 읽기 전용 제공
- 프론트: Astro 코드에서 레이아웃/스타일 자유 수정

## 구현 포인트
- Directus 컬렉션 스키마 정의
  - title, slug, description, category, tags, body, created_at, published_at 등
- 공개 API 서비스 설계
  - 읽기 전용 엔드포인트, 버전 관리, 캐싱 정책
  - 필요 시 검색/필터 전용 엔드포인트 추가
- CLI 발행 스크립트 설계
  - 예: scripts/publish.js
  - 입력: 파일 경로
  - 처리: 메타 추출 + Directus API 업로드
  - 결과: 게시물 생성 및 링크 출력
- 분석 스크립트
  - SQL 기반 통계/집계 (Directus API 또는 Supabase SQL)

## 호스팅 참고
- 실시간 DB 연동이 필요하면 Netlify/Vercel 등 사용
- 정적 배포만 가능하다면 빌드 시점에 DB에서 가져오는 SSG 방식

## 추가 요구사항 정리
- CLI에서 DB 조회/통계/활용까지 지원
- 화면 구성(레이아웃/컴포넌트) 쉽게 교체 가능
- GitHub Pages + GitHub Actions 기반으로 무료 배포/자동화

## GitHub 연계 전략 (정적 호스팅)
- GitHub Pages는 정적이므로 "빌드 시점"에 DB 내용을 가져와 정적 HTML로 생성
- GitHub Actions에서 빌드/배포 실행
- DB 접근 키는 GitHub Actions Secrets로 관리
- 프론트는 Astro SSG 기준으로 구성

## 빌드 트리거 전략 (추천)
- 기본: CMS에서 글 발행/수정 시 빌드 실행
- 보조: 일정 시간마다 자동 빌드 (예: 1시간/하루마다)
- 이유: CMS가 주 입력 채널이라 즉시 반영이 필요하고, 일정 빌드는 누락 대비용

## CMS -> GitHub Actions 트리거 (아주 쉬운 설명)
- **웹훅(Webhook)**: "무언가 바뀌면 다른 곳에 알려주는 알림"
- CMS에서 글을 발행하면 "빌드 시작" 신호를 GitHub에 보냄
- GitHub Actions가 그 신호를 받아 빌드를 시작
- 결과: 글 발행 직후에 사이트가 자동으로 갱신됨

간단한 흐름:
1) CMS에서 글 발행
2) 웹훅이 GitHub로 신호 전송
3) GitHub Actions가 빌드 실행
4) GitHub Pages에 배포

## 용어 풀이 (쉬운 설명)
- **DB(데이터베이스)**: 글과 이미지 같은 데이터를 저장하는 창고
- **Supabase**: 온라인 DB를 쉽게 쓰게 해주는 서비스 (Postgres 기반)
- **Postgres**: DB의 종류, 안정적이고 널리 쓰임
- **Directus**: DB를 웹에서 쉽게 편집하는 관리자 화면(CMS)을 만들어주는 도구
- **CMS**: 글/이미지 등을 웹에서 관리하는 시스템
- **API**: 다른 시스템이 데이터를 읽거나 쓰게 해주는 통로
- **공개 API**: 읽기 전용으로 외부에 공개하는 데이터 통로
- **CLI**: 터미널(콘솔)에서 명령어로 작업하는 방식
- **Astro**: 정적 사이트를 만드는 프론트엔드 프레임워크
- **정적 사이트(SSG)**: 미리 만들어 둔 HTML을 배포하는 방식
- **GitHub Pages**: GitHub에서 무료로 정적 사이트를 배포하는 기능
- **GitHub Actions**: 자동 빌드/배포를 실행하는 GitHub의 자동화 기능
- **Secrets**: 배포 중 필요한 비밀번호/키를 안전하게 보관하는 곳
- **빌드 시점**: 배포 전에 사이트를 미리 생성하는 순간
- **레이아웃/컴포넌트**: 화면 구조(레이아웃)와 반복되는 부품(컴포넌트)

## CLI 활용 설계 (DB 조회 + 발행)
- 발행: Markdown 파일 -> 메타 추출 -> Directus API 업로드
- 조회/통계: Directus API 또는 Supabase SQL API로 리드 쿼리 실행
- 리포팅: CLI에서 JSON/CSV 출력, 필요 시 요약 리포트 생성
- 권장 구현: `scripts/cli/`에 `publish.js`, `query.js` 분리

## 화면 구성 교체 전략
- Astro 레이아웃/컴포넌트 분리 유지
- 디자인 시스템은 `src/styles`에 토큰/변수 관리
- 페이지는 데이터 소스에 독립적으로 구성
- 페이지 스켈레톤을 유지하고 컴포넌트만 교체 가능하도록 설계

## 마스터플랜 (Part로 분리)
### Part 0. 준비/설계 정리
- Directus 컬렉션 스키마 확정 (필드, 인덱스, 관계)
- 공개 API 스펙 정리 (필수/선택, 필터, 정렬)
- Astro 데이터 모델 정의 (frontmatter와 일치)
- 배포 방식 확정 (GitHub Pages + Actions)

### Part 1. 데이터 인프라 구축
- Supabase 프로젝트 생성 및 DB 스키마 작성
- Directus 설치/연결, 컬렉션 생성
- 테스트 데이터로 CRUD 흐름 확인

### Part 2. 공개 API/쿼리 레이어
- 읽기 전용 API 설계 및 엔드포인트 정의
- 필터/검색/정렬 쿼리 지원
- 캐싱 정책 및 버전 관리 전략 정의

### Part 3. Astro 데이터 연동/뷰
- Astro에서 빌드 시점 데이터 fetch
- 글 목록/상세/카테고리 페이지 연결
- 레이아웃/컴포넌트 교체 가능한 구조 정리

### Part 4. CLI 발행/조회 도구
- `scripts/cli/publish.js` (파일 입력 -> 발행)
- `scripts/cli/query.js` (통계/조회 쿼리)
- 결과 출력 포맷(JSON/CSV) 옵션 제공

### Part 5. 배포 자동화
- GitHub Actions 워크플로우 구성
- Secrets 관리 (DB/API 키)
- main push 시 빌드/배포

## Part별 구현 계획 (간단 체크리스트)
### Part 0
- [ ] Directus 컬렉션 필드 정의 문서화
- [ ] 공개 API 스펙 초안 작성
- [ ] Astro 콘텐츠 모델 확정
- [ ] Actions 기반 배포 설계 확정

### Part 1
- [ ] Supabase 프로젝트/DB 생성
- [ ] Directus 연결 및 컬렉션 생성
- [ ] 샘플 데이터 입력/검증

### Part 2
- [ ] 읽기 전용 엔드포인트 스펙 작성
- [ ] 검색/필터/정렬 구현 및 테스트
- [ ] 캐싱 전략 초안 작성

### Part 3
- [ ] Astro에서 데이터 fetch
- [ ] 목록/상세/카테고리 연결
- [ ] 컴포넌트 교체 가능한 구조 정리

### Part 4
- [ ] CLI publish 스크립트 뼈대
- [ ] 메타 추출 로직 구현
- [ ] CLI query 스크립트 및 결과 출력 옵션

### Part 5
- [ ] GitHub Actions 워크플로우 작성
- [ ] Secrets 설정 및 배포 테스트

## 다음 단계 (나중에 구현용)
1. Directus + Supabase 세팅
2. 공개 API 서비스 스켈레톤 구성
3. Astro에서 데이터 소스 연결
4. CLI 발행 스크립트 제작
5. 분석 스크립트 제작
