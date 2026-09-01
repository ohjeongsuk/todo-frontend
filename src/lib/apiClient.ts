import type { ApiResponse } from "@/types/api";

/** Access Token을 담는 localStorage 키. CLAUDE.md 5장에서 고정된 이름이다. */
export const ACCESS_TOKEN_KEY = "todo_access_token";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

/** refresh 자체는 재시도 대상에서 제외한다. 이 경로가 401을 내도 다시 refresh 하지 않는다. */
const REFRESH_PATH = "/api/auth/refresh";

/**
 * apiClient가 던지는 에러의 정규화된 형태.
 *
 * kind로 구분하는 이유: 네트워크 실패는 서버 응답이 없어 error.code가 존재하지 않는다.
 * 화면 문구를 만드는 errorMessages는 이 구분자로 분기한다.
 */
export type NormalizedError =
  | { kind: "api"; code: string; message: string; status: number; details: unknown }
  | { kind: "network" };

export class ApiClientError extends Error {
  readonly normalized: NormalizedError;

  constructor(normalized: NormalizedError) {
    super(normalized.kind === "api" ? normalized.message : "network error");
    this.name = "ApiClientError";
    this.normalized = normalized;
  }
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}

/**
 * 진행 중인 refresh 요청을 공유하기 위한 슬롯.
 *
 * 이건 성능 최적화가 아니라 정책상 필수다. 목록 화면은 병렬 요청을 보내고,
 * 토큰이 만료되면 여러 요청이 동시에 401을 받는다. 각각 refresh를 쏘면
 * rotation 규칙(CLAUDE.md 5장)상 먼저 성공한 것이 이전 토큰을 폐기하고,
 * 뒤늦은 요청은 "이미 폐기된 Refresh Token 재사용" = 탈취로 간주되어
 * 해당 사용자의 모든 Refresh Token이 폐기된다. 즉 정상 사용자가 강제 로그아웃된다.
 */
let refreshInFlight: Promise<boolean> | null = null;

async function refreshOnce(): Promise<boolean> {
  refreshInFlight ??= (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}${REFRESH_PATH}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) return false;

      const body = (await res.json()) as ApiResponse<{ accessToken: string }>;
      if (!body.success || !body.data) return false;

      setAccessToken(body.data.accessToken);
      return true;
    } catch {
      return false;
    } finally {
      // 다음 만료 시점에는 새로 시도할 수 있도록 슬롯을 비운다.
      queueMicrotask(() => {
        refreshInFlight = null;
      });
    }
  })();

  return refreshInFlight;
}

function redirectToLogin(): void {
  clearAccessToken();
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    // 여기는 React 컴포넌트가 아니라 useRouter를 쓸 수 없다.
    // 게다가 인증이 끊긴 상황에서는 soft navigation이 아니라 전체 리로드가 맞다 —
    // React Query 캐시에 남은 이전 사용자의 데이터를 확실히 버리기 위해서다.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/login");
  }
}

/** 본문 없이 실패한 응답에서 HTTP 상태로 에러 코드를 유추한다. */
function codeFromStatus(status: number): string {
  switch (status) {
    case 400:
      return "INVALID_INPUT";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "EMAIL_DUPLICATED";
    default:
      return "INTERNAL_ERROR";
  }
}

async function rawFetch(path: string, init: RequestInit): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  try {
    // 쿠키를 쓰므로 모든 요청이 credentials: 'include'다 (CLAUDE.md 5장).
    return await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      credentials: "include",
    });
  } catch {
    throw new ApiClientError({ kind: "network" });
  }
}

/**
 * 백엔드 호출의 단일 진입점.
 *
 * - Access Token 주입
 * - ApiResponse 언래핑 (호출부는 data만 받는다)
 * - 에러 정규화 (api / network)
 * - 401 시 refresh 1회 후 원요청 재시도, 실패하면 토큰 삭제 + /login 이동
 */
export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res = await rawFetch(path, init);

  if (res.status === 401 && path !== REFRESH_PATH) {
    const refreshed = await refreshOnce();
    if (!refreshed) {
      redirectToLogin();
      throw new ApiClientError({
        kind: "api",
        code: "UNAUTHORIZED",
        message: "인증이 만료되었습니다.",
        status: 401,
        details: null,
      });
    }
    // 재시도는 1회뿐이다. 여기서 또 401이 나면 아래 에러 처리로 떨어진다.
    res = await rawFetch(path, init);
  }

  // DELETE는 ResponseEntity<Void>라 본문이 없다. json() 파싱을 시도하면 터진다.
  if (res.status === 204 || res.headers.get("Content-Length") === "0") {
    if (!res.ok) {
      // 본문이 없으면 error.code를 읽을 수 없으므로 HTTP 상태로 코드를 유추한다.
      // 전부 INTERNAL_ERROR로 뭉개면 404·403이 "서버 오류"로 잘못 표시된다.
      throw new ApiClientError({
        kind: "api",
        code: codeFromStatus(res.status),
        message: "",
        status: res.status,
        details: null,
      });
    }
    return undefined as T;
  }

  let body: ApiResponse<T>;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiClientError({
      kind: "api",
      code: "INTERNAL_ERROR",
      message: "서버 응답을 해석할 수 없습니다.",
      status: res.status,
      details: null,
    });
  }

  if (!res.ok || !body.success) {
    // body.error가 우리 형식이 아닐 수도 있다(8080을 다른 앱이 점유한 경우 등).
    // 그때는 HTTP 상태로 유추한다.
    const serverCode = typeof body.error?.code === "string" ? body.error.code : null;
    throw new ApiClientError({
      kind: "api",
      code: serverCode ?? codeFromStatus(res.status),
      message: body.error?.message ?? "",
      status: res.status,
      details: body.error?.details ?? null,
    });
  }

  return body.data as T;
}

export const apiClient = {
  get: <T>(path: string) => apiRequest<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  put: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, {
      method: "PUT",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  patch: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, {
      method: "PATCH",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: "DELETE" }),
};
