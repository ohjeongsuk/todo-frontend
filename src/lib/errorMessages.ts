import { isApiClientError } from "./apiClient";

import type { ErrorCode } from "@/types/api";

/**
 * 화면 문구를 만드는 유일한 함수.
 *
 * 화면마다 문구를 직접 쓰면 서로 다른 문구가 생겨 매핑이 사문화된다.
 * apiClient가 던지는 에러는 반드시 이 함수 하나만 거친다.
 *
 * 정본: todo-backend/src/main/java/com/example/todoapp/exception/ErrorCode.java
 * (PRD.md에 「에러 문구 매핑」 표는 존재하지 않는다. 백엔드 enum이 정본이다.)
 */
const MESSAGES: Record<ErrorCode, string> = {
  INVALID_INPUT: "입력값이 올바르지 않습니다.",
  EMAIL_DUPLICATED: "이미 사용 중인 이메일입니다.",
  // 로그인 실패·토큰 만료·refresh 실패가 모두 이 코드로 온다.
  // 계정 존재 여부를 드러내지 않기 위한 서버 정책이다 (PRD NF-31).
  UNAUTHORIZED: "이메일 또는 비밀번호가 올바르지 않습니다.",
  RESET_TOKEN_INVALID: "링크가 만료되었거나 이미 사용되었습니다.",
  FORBIDDEN: "접근 권한이 없습니다.",
  NOT_FOUND: "요청한 리소스를 찾을 수 없습니다.",
  INTERNAL_ERROR: "서버 오류가 발생했습니다.",
};

/** 서버에 닿지 못한 경우. error.code가 없으므로 코드 매핑으로는 잡히지 않는다. */
const NETWORK_MESSAGE = "네트워크 연결을 확인해 주세요. 잠시 후 다시 시도해 주세요.";

/** 어느 분기에도 걸리지 않은 경우의 최종 폴백. */
const FALLBACK_MESSAGE = "알 수 없는 오류가 발생했습니다.";

function isKnownCode(code: string): code is ErrorCode {
  return code in MESSAGES;
}

/**
 * 어떤 에러든 화면에 띄울 수 있는 한 줄 문구로 바꾼다.
 *
 * 3단 폴백이다:
 *   1. 네트워크 실패 → 고정 문구
 *   2. 알려진 코드 → 위 표의 문구
 *   3. 모르는 코드 → 서버가 준 message, 그것도 없으면 일반 문구
 */
export function toDisplayMessage(error: unknown): string {
  if (!isApiClientError(error)) return FALLBACK_MESSAGE;

  const normalized = error.normalized;
  if (normalized.kind === "network") return NETWORK_MESSAGE;

  if (isKnownCode(normalized.code)) return MESSAGES[normalized.code];

  return normalized.message || FALLBACK_MESSAGE;
}

/**
 * 검증 실패(INVALID_INPUT) 시 서버가 details에 { 필드명: 메시지 } 맵을 담아 보낸다.
 * 폼에서 필드별 문구를 붙이는 데 쓴다.
 */
export function toFieldErrors(error: unknown): Record<string, string> {
  if (!isApiClientError(error)) return {};

  const normalized = error.normalized;
  if (normalized.kind !== "api" || normalized.code !== "INVALID_INPUT") return {};
  if (typeof normalized.details !== "object" || normalized.details === null) return {};

  const result: Record<string, string> = {};
  for (const [field, message] of Object.entries(normalized.details)) {
    if (typeof message === "string") result[field] = message;
  }
  return result;
}
