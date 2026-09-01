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
