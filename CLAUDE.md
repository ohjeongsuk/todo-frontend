@../CLAUDE.md

---

# todo-frontend 저장소 규칙

위 임포트가 프로젝트 공통 규칙의 정본이다. 아래는 **이 저장소에만 해당하는** 사항이다.

## 디렉터리 구조

소스는 전부 `src/` 아래에 있다. 루트 직하에 `app/`·`components/`·`lib/`을 만들지 않는다.

```
todo-frontend/
├── src/
│   ├── app/          # App Router. 루트 레이아웃은 서버 컴포넌트
│   ├── components/   # ui/(shadcn), common/(공용), layout/(헤더 등)
│   ├── lib/          # apiClient, errorMessages, validation, sanitize, datetime, queryKeys
│   └── types/        # 백엔드 DTO 대응 타입. 여기 한 번만 정의한다
└── public/           # Next 규약상 루트에 있어야 한다. static/ 하위 경로 금지(Amplify 예약)
```

경로 별칭 `@/*`는 `./src/*`로 해석된다(`tsconfig.json`). `components.json`의 css 경로도
`src/app/globals.css`를 가리키므로 **셋 중 하나만 고치면 조용히 깨진다.**

## 검증 명령

```bash
npm run check    # type-check && lint && format:check
npm run build    # .next 출력
```

Phase DoD는 이 두 명령의 **실제 종료 코드**로 판정한다. 빌드 성공만으로 통과시키지 않는다.

## 이 저장소에서 하지 않는 것

- `npx shadcn add form` — `react-hook-form` 유입 경로다. 폼은 `useState` + `src/lib/validation.ts` 수동 검증으로 간다.
- `framer-motion` 설치 — 패키지 이름은 `motion`이다.
- `@tiptap/extension-link` 설치 — v3 `StarterKit`에 `Link`가 내장돼 중복 등록된다.
- `public/static/` 생성 — AWS Amplify 예약 경로다.
- 컴포넌트 안에서 `fetch` 직접 호출 — 데이터 패칭은 React Query 훅으로 통일한다.
- 서버 응답 타입의 인라인 재선언 — `src/types/`에 정의된 것을 import 한다.

## AGENTS.md

`next dev`가 자동 생성·재추가하는 파일이다(`node_modules/next/dist/server/lib/generate-agent-files.js`).
지워도 되돌아오므로 **생성물로 인정해 커밋한다.** 저장소 규칙의 정본은 이 파일(`CLAUDE.md`)이다.

## 날짜 처리

백엔드가 `LocalDateTime`을 **오프셋 없이** 직렬화한다(`"2026-09-01T12:00:00"`).
`new Date(raw)`를 직접 쓰면 로컬 시각으로 해석돼 KST에서 9시간 어긋난다.
**항상 `src/lib/datetime.ts`의 `parseServerDateTime`을 거친다.**
`dueDate`는 `LocalDate`라 규칙이 다르므로 `parseServerDate`를 쓴다.

## 커밋

husky + commitlint(`config-conventional`)가 걸려 있어 Conventional Commits 형식이 아니면
커밋이 거부된다. lint-staged가 스테이징 파일에 prettier·eslint를 돌린다.
