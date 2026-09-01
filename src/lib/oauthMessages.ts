/**
 * OAuth 리다이렉트 파라미터(`?error=`)의 안내 문구.
 *
 * 이 값들은 서버 ErrorCode가 아니라 OAuth2FailureHandler가 URL에 붙이는 코드라
 * errorMessages.ts의 대상이 아니다. 다만 화면에 흩어지지 않도록 여기 모은다.
 *
 * 정본: todo-backend/.../security/OAuth2FailureHandler.java 의 resolveErrorCode
 */
const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  email_conflict: "같은 이메일로 가입된 계정이 이미 있습니다. 이메일과 비밀번호로 로그인해 주세요.",
  oauth_failed: "구글 로그인이 완료되지 않았습니다. 다시 시도해 주세요.",
};

/** 알 수 없는 코드는 null을 반환해 배너를 띄우지 않는다. 임의 값으로 안내를 조작당하지 않기 위해서다. */
export function toOAuthErrorMessage(code: string | null): string | null {
  if (!code) return null;
  return OAUTH_ERROR_MESSAGES[code] ?? null;
}
