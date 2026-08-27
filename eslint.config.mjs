import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  // 검사 대상에서 제외할 경로
  globalIgnores([
    // eslint-config-next 의 기본 제외 목록
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 프로젝트 추가 제외 목록
    "node_modules/**",
    "public/**",
    "*.tsbuildinfo",
  ]),

  ...nextVitals,
  ...nextTs,

  // 프로젝트 공통 규칙
  {
    rules: {
      // CLAUDE.md 규칙: any 금지. 불가피하면 unknown + 타입가드를 쓴다
      "@typescript-eslint/no-explicit-any": "error",

      // 미사용 변수는 경고. _ 로 시작하는 이름은 의도적 무시로 허용한다
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // 타입 전용 import 는 import type 으로 분리해 번들에서 제거되게 한다
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],

      // 디버깅 잔재 방지. warn / error 는 의도적 로깅으로 허용한다
      "no-console": ["warn", { allow: ["warn", "error"] }],

      // == 대신 === 사용. null 비교만 예외로 둔다
      eqeqeq: ["error", "always", { null: "ignore" }],

      // var 금지, 재할당하지 않는 변수는 const 로
      "no-var": "error",
      "prefer-const": "error",
    },
  },

  // 설정 파일에는 no-console 을 적용하지 않는다
  {
    files: ["*.config.{js,mjs,ts}", "*.config.*.{js,mjs,ts}"],
    rules: {
      "no-console": "off",
    },
  },

  // Prettier 와 충돌하는 포맷 규칙을 해제한다. 반드시 배열의 마지막이어야 한다
  prettierConfig,
]);

export default eslintConfig;
