# todo-frontend

Todo List 서비스의 프론트엔드. Next.js 16 (App Router) + React 19.

문서 저장소(`todo-project`)와 함께 클론했다고 가정한다. 프로젝트 전체 구조와 규칙은 [`../CLAUDE.md`](../CLAUDE.md)를 참고하고, 이 저장소만의 규칙은 [`./CLAUDE.md`](./CLAUDE.md)에 있다.

## 기술 스택

| 항목       | 버전/선택                        |
| ---------- | -------------------------------- |
| 프레임워크 | Next.js 16 (App Router)          |
| 라이브러리 | React 19                         |
| 언어       | TypeScript (strict)              |
| 스타일     | Tailwind CSS 4                   |
| 컴포넌트   | shadcn/ui                        |
| 서버 상태  | TanStack Query (React Query) v5  |
| 애니메이션 | `motion`                         |
| 에디터     | Tiptap                           |
| Sanitize   | DOMPurify (isomorphic-dompurify) |

## 로컬 실행

### 1. 환경변수

`.env.example`을 복사해 `.env.local`을 만든다.

```bash
cp .env.example .env.local
```

`NEXT_PUBLIC_API_BASE_URL`이 백엔드 주소를 가리킨다(로컬 기본값 `http://localhost:8080`). 이 값에는 접두사 `NEXT_PUBLIC_` 때문에 브라우저 번들에 그대로 노출되므로 비밀·키를 넣지 않는다.

### 2. 백엔드 준비

이 프론트엔드는 API를 직접 제공하지 않는다. [`../todo-backend/README.md`](../todo-backend/README.md)를 따라 백엔드를 먼저 `localhost:8080`에 띄운다.

### 3. 실행

```bash
npm install
npm run dev
```

`http://localhost:3000`에서 확인한다.

## 검증 명령

```bash
npm run type-check     # 타입 검사
npm run lint           # ESLint
npm run format:check   # Prettier 포맷 검사
npm run check          # 위 세 개를 순서대로 실행
npm run build           # 프로덕션 빌드
```

Phase별 완료 판정은 `check`와 `build`의 **실제 종료 코드**로 정한다.

## 디렉터리 구조

소스는 전부 `src/` 아래에 있다.

```
src/
├── app/          # App Router. 루트 레이아웃은 서버 컴포넌트
├── components/   # ui/(shadcn), common/(공용), todo/(도메인)
├── hooks/        # React Query 훅
├── lib/          # apiClient, errorMessages, validation, sanitize, datetime, queryKeys
└── types/        # 백엔드 DTO 대응 타입
```

## 커밋

husky + commitlint(`config-conventional`)가 걸려 있어 Conventional Commits 형식이 아니면 커밋이 거부된다. lint-staged가 스테이징 파일에 prettier·eslint를 돌린다.

타입 앞 이모지는 선택 사항이다. `✨ feat: ...`와 `feat: ...` 둘 다 통과한다.

```bash
feat: 마감일 하한 추가        # OK
✨ feat: 마감일 하한 추가      # OK
✨ 없는타입: 제목              # 거부 (type-enum)
feat: 제목에 마침표.          # 거부 (subject-full-stop)
```
