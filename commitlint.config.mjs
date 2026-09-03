/**
 * commitlint 설정
 *
 * CLAUDE.md 규칙에 맞춘다.
 *  - 타입은 Conventional Commits (feat, fix, chore, test, docs 등)
 *  - 제목과 본문은 한글로 작성 가능해야 하므로 대소문자 규칙을 끈다
 *  - 한글은 영문보다 글자당 정보량이 많아 제목 길이 제한을 넉넉히 잡는다
 *  - 타입 앞 이모지를 선택적으로 허용한다 (아래 parserPreset 참고)
 */

/**
 * 타입 앞에 이모지를 붙일 수 있게 헤더 파싱 규칙을 넓힌다.
 *
 * 기본 파서는 헤더가 반드시 `type: subject`로 시작한다고 보기 때문에, `✨ feat: ...`를
 * 넣으면 타입을 찾지 못해 type-empty·subject-empty로 **커밋이 거부된다.**
 *
 * 이모지 부분을 `(?:...)?`로 감싸 **선택 사항**으로 둔다. 이모지 없는 기존 형식이
 * 그대로 통과해야 하기 때문이다 — 지금까지의 커밋 이력이 전부 그 형식이고,
 * 이모지를 강제하면 과거와 현재의 규칙이 갈린다.
 *
 * 문자 클래스에 FE0F(이모지 표현 선택자)와 200D(ZWJ)를 함께 넣은 이유:
 * `♻️`는 `U+267B U+FE0F`, `🧑‍💻`는 `U+1F9D1 U+200D U+1F4BB`처럼 여러 코드포인트로
 * 이루어져 있어 `\p{Extended_Pictographic}` 하나로는 끝까지 먹지 못한다.
 *
 * 타입을 `[a-z]+`가 아니라 `\w+`로 두는 것도 의도다. 대문자 타입을 쓰면 파싱 실패로
 * 애매한 오류가 나는 대신 아래 type-case 규칙이 정확한 이유를 알려준다.
 */
const HEADER_PATTERN =
  /^(?:[\p{Extended_Pictographic}\u{FE0F}\u{200D}]+\s+)?(\w+)(?:\(([^)]*)\))?!?: (.+)$/u;

const config = {
  extends: ["@commitlint/config-conventional"],
  parserPreset: {
    parserOpts: {
      headerPattern: HEADER_PATTERN,
      headerCorrespondence: ["type", "scope", "subject"],
    },
  },
  rules: {
    // 허용 타입 목록 (CLAUDE.md 명시 5종 + 일반적으로 쓰이는 타입)
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "chore",
        "test",
        "docs",
        "refactor",
        "style",
        "perf",
        "build",
        "ci",
        "revert",
      ],
    ],

    // 타입은 소문자 고정
    "type-case": [2, "always", "lower-case"],
    "type-empty": [2, "never"],

    // 제목(subject)에 한글을 쓰므로 대소문자 규칙을 비활성화한다
    "subject-case": [0],
    "subject-empty": [2, "never"],
    // 제목 끝에 마침표를 붙이지 않는다
    "subject-full-stop": [2, "never", "."],

    // 한글 기준 길이 완화
    "header-max-length": [2, "always", 100],
    "body-max-line-length": [2, "always", 200],
    "footer-max-line-length": [0],
  },
};

export default config;
