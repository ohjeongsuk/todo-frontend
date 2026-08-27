/**
 * lint-staged 설정
 *
 * 주의: tsc 는 파일 경로를 인자로 받으면 tsconfig.json 을 통째로 무시하고
 * 해당 파일만 기본 옵션으로 컴파일한다. strict, paths 별칭, jsx 설정이 모두
 * 사라져 대량 오탐이 발생하므로, 화살표 함수로 감싸 인자 주입을 차단한다.
 */
const config = {
  // 타입스크립트: 타입 검사 -> lint 자동수정 -> 포맷
  "*.{ts,tsx}": [() => "tsc --noEmit", "eslint --fix --max-warnings=0", "prettier --write"],

  // 자바스크립트 / 설정 파일
  "*.{js,jsx,mjs,cjs}": ["eslint --fix --max-warnings=0", "prettier --write"],

  // 스타일 및 문서 · 데이터 파일은 포맷만 적용
  "*.{css,json,md,mdx,yml,yaml}": ["prettier --write"],
};

export default config;
