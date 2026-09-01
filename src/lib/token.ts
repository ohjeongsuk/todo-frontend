/**
 * Access Token(JWT)의 만료를 클라이언트에서 미리 판정한다.
 *
 * 왜 필요한가: useAuth가 토큰의 "존재 여부"만 보면 이미 만료된 토큰도 판정을 통과한다.
 * 그러면 /auth/me가 401을 내고 refresh가 왕복하는 동안 보호 화면이 노출된다.
 * exp를 먼저 보고 만료면 요청 자체를 보내지 않는 것이 ROADMAP Phase 7 DoD
 * "만료 토큰으로 접근했을 때 보호 화면이 한 프레임도 노출되지 않음"의 근거다.
 *
 * 주의: 서명을 검증하지 않고 payload만 읽는다. 이 판정은 화면 전환을 위한 것이고
 * 실제 권한 판정은 언제나 서버가 한다. 여기서 통과했다고 안전한 토큰이 아니다.
 *
 * atob은 브라우저 API다. 이 모듈은 클라이언트 컴포넌트에서만 import한다.
 */

interface JwtPayload {
  exp?: number;
  sub?: string;
}

/** base64url을 base64로 바꾸고 패딩을 채운다. JWT는 = 패딩을 떼고 -_를 쓴다. */
function toBase64(base64url: string): string {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (base64.length % 4)) % 4;
  return base64 + "=".repeat(padding);
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split(".");
  // tsconfig의 noUncheckedIndexedAccess가 켜져 있어 parts[1]이 string | undefined다.
  const payloadPart = parts.length === 3 ? parts[1] : undefined;
  if (!payloadPart) return null;

  try {
    const parsed: unknown = JSON.parse(atob(toBase64(payloadPart)));
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * 토큰이 지금 시점에 유효한지.
 *
 * 디코드 실패나 exp 부재는 만료로 취급한다 — 판단할 수 없으면 안전한 쪽으로 떨어뜨린다.
 * 시계 오차 보정(leeway)은 두지 않는다. 만료 직전 토큰은 apiClient의 refresh가 받아내므로
 * 이중 방어가 이미 있다.
 */
export function isTokenValid(token: string | null): boolean {
  if (!token) return false;

  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return false;

  // exp는 초 단위 NumericDate다. Date.now()는 밀리초다.
  return payload.exp * 1000 > Date.now();
}
