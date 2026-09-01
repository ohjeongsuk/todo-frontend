/**
 * 백엔드 공통 응답 계약.
 * 정본: todo-backend/src/main/java/com/example/todoapp/exception/ApiResponse.java
 */

/** 성공 시 data, 실패 시 error만 채워진다. */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiErrorResponse | null;
}

export interface ApiErrorResponse {
  code: string;
  message: string;
  /** 검증 실패 시 { 필드명: 메시지 } 맵이 들어온다. 그 외에는 null. */
  details: unknown;
}

/** 페이지네이션 응답. page는 0-based다 (Spring Pageable). */
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/**
 * 백엔드 ErrorCode enum과 1:1 대응하는 7종.
 * 정본: todo-backend/src/main/java/com/example/todoapp/exception/ErrorCode.java
 *
 * 주의: TODO_NOT_FOUND라는 코드는 존재하지 않는다. 실제 이름은 NOT_FOUND다.
 */
export type ErrorCode =
  | "INVALID_INPUT" // 400
  | "EMAIL_DUPLICATED" // 409
  | "UNAUTHORIZED" // 401
  | "RESET_TOKEN_INVALID" // 400
  | "FORBIDDEN" // 403
  | "NOT_FOUND" // 404
  | "INTERNAL_ERROR"; // 500

/**
 * 서버가 LocalDateTime을 오프셋 없이 직렬화한 문자열. 예: "2026-09-01T12:00:00.123456"
 *
 * 값은 UTC지만 표기에 Z가 없다. new Date()로 직접 파싱하면 로컬 시각으로 해석돼
 * KST에서 9시간 어긋난다. 반드시 lib/datetime.ts의 parseServerDateTime을 거친다.
 */
export type IsoDateTime = string;

/**
 * 서버가 LocalDate를 직렬화한 문자열. 예: "2026-09-01"
 *
 * 시각이 아니라 날짜다. Z를 붙이면 안 되므로 parseServerDate를 쓴다.
 */
export type IsoDate = string;
