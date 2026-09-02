/**
 * lint-staged 설정
 *
 * 주의 1: tsc 는 파일 경로를 인자로 받으면 tsconfig.json 을 통째로 무시하고
 * 해당 파일만 기본 옵션으로 컴파일한다. strict, paths 별칭, jsx 설정이 모두
 * 사라져 대량 오탐이 발생하므로, 화살표 함수로 감싸 인자 주입을 차단한다.
 *
 * 주의 2: 실행 파일을 이름만("tsc")으로 적으면 Windows 에서 반드시 ENOENT 로 실패한다.
 * lint-staged 17 은 tinyexec 로 셸 없이 프로세스를 띄우는데, Windows 의
 * node_modules/.bin 항목은 .cmd 배치 파일이라 셸 없이는 spawn 자체가 되지 않는다.
 * (npx 도 npx.cmd 이므로 같은 이유로 실패한다.)
 * 그래서 node 로 패키지의 실제 진입점을 직접 실행한다 — 셸에 의존하지 않아
 * Windows·macOS·Linux 에서 동일하게 동작한다.
 * 경로는 cwd(패키지 루트) 기준 상대 경로이며, 공백이 없어 인용 부호가 필요 없다.
 */
const TSC = "node node_modules/typescript/bin/tsc";
const ESLINT = "node node_modules/eslint/bin/eslint.js";
const PRETTIER = "node node_modules/prettier/bin/prettier.cjs";

const config = {
  // 타입스크립트: 타입 검사 -> lint 자동수정 -> 포맷
  "*.{ts,tsx}": [
    () => `${TSC} --noEmit`,
    `${ESLINT} --fix --max-warnings=0`,
    `${PRETTIER} --write`,
  ],

  // 자바스크립트 / 설정 파일
  "*.{js,jsx,mjs,cjs}": [`${ESLINT} --fix --max-warnings=0`, `${PRETTIER} --write`],

  // 스타일 및 문서 · 데이터 파일은 포맷만 적용
  "*.{css,json,md,mdx,yml,yaml}": [`${PRETTIER} --write`],
};

export default config;
