/**
 * commitlint 설정
 *
 * CLAUDE.md 규칙에 맞춘다.
 *  - 타입은 Conventional Commits (feat, fix, chore, test, docs 등)
 *  - 제목과 본문은 한글로 작성 가능해야 하므로 대소문자 규칙을 끈다
 *  - 한글은 영문보다 글자당 정보량이 많아 제목 길이 제한을 넉넉히 잡는다
 */
const config = {
  extends: ["@commitlint/config-conventional"],
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
