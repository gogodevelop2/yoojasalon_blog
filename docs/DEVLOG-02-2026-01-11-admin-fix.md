# 2026-01-11 (02) - 관리자 로그인 오류 수정

## 요약
- `/admin` 페이지의 JavaScript 오류 수정
- Supabase RLS 무한 재귀 문제 해결
- 로그인 카드 가운데 정렬

## 문제 1: JavaScript 구문 오류

### 증상
```
SyntaxError: Unexpected token '{'. Expected ';' after variable declaration.
```

### 원인
Astro에서 frontmatter 변수를 클라이언트 스크립트에 전달할 때 `${JSON.stringify()}`를 직접 사용. Astro의 `type="module"` 스크립트에서는 이 방식이 작동하지 않음.

### 해결
- `<body>` 태그에 `data-*` 속성으로 환경 변수 저장
- 스크립트에서 `document.body.dataset`으로 읽기

```html
<body
  data-supabase-url={supabaseUrl}
  data-supabase-key={supabaseAnonKey}
  data-has-env={hasEnv ? "true" : "false"}
>
```

## 문제 2: Supabase 500 오류 (RLS 무한 재귀)

### 증상
```
Failed to load resource: the server responded with a status of 500
```

### 원인
`profiles` 테이블의 RLS 정책이 자기 자신을 참조:
```sql
EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin')
```
→ profiles 조회 → 정책 평가 위해 profiles 조회 → 무한 반복

### 해결
`SECURITY DEFINER` 함수를 만들어 RLS 우회:

```sql
-- admin 체크 함수 (RLS 우회)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;
```

기존 posts 정책 모두 삭제 후 새 정책 적용:
```sql
-- admin 전체 접근
CREATE POLICY "Admin full access posts"
ON posts FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- 발행된 글 공개 읽기
CREATE POLICY "Public can read published posts"
ON posts FOR SELECT
TO anon, authenticated
USING (status = 'published');
```

## 문제 3: 로그인 카드 왼쪽 치우침

### 해결
`.login-card`에 가운데 정렬 추가:
```css
.login-card {
  max-width: 420px;
  margin: 0 auto;
}
```

## 변경 파일
- `src/pages/admin.astro`

## 현재 상태
- `/admin` 로그인 정상 작동
- 글 목록/편집/삭제 기능 정상 작동
- RLS 보안 유지 (admin 역할만 관리 가능)

## 다음 단계
- 글 작성 테스트
- 카테고리 관리 테스트
- 마이그레이션 작업 진행
