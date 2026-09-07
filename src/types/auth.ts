/**
 * 인증 관련 계약.
 * 정본: todo-backend/src/main/java/com/example/todoapp/dto/ 의 record들
 */

export type AuthProvider = "LOCAL" | "GOOGLE";

export interface SignupRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Refresh Token은 여기에 없다.
 * httpOnly + Secure 쿠키로만 전달되며 JS에서 읽지 않는다 (PRD NF-26).
 * 이 인터페이스에 refreshToken을 추가하면 정책 위반이다.
 */
export interface TokenResponse {
  accessToken: string;
}

/**
 * /api/auth/me 응답.
 * email이 포함되지만 화면에는 nickname만 노출한다 (PRD AUTH-08).
 */
export interface UserResponse {
  nickname: string;
  email: string;
}

/** 재설정 링크 발송 요청 (PRD F-41). 응답 본문은 없다 — 계정 유무와 무관하게 204다. */
export interface PasswordForgotRequest {
  email: string;
}

/**
 * 새 비밀번호 확정 (PRD F-42).
 *
 * 응답에 토큰이 없다. 재설정 후 자동 로그인시키지 않고 로그인 화면으로 보낸다 (PRD F-44).
 */
export interface PasswordResetRequest {
  token: string;
  newPassword: string;
}
