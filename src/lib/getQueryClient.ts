import { QueryClient, environmentManager } from "@tanstack/react-query";

import { isApiClientError } from "./apiClient";

/**
 * QueryClient 생성·재사용 규칙.
 *
 * 서버에서는 요청마다 새로 만든다. 모듈 최상위에서 공유하면 요청 간에 캐시가 섞여
 * 다른 사용자의 데이터가 노출된다.
 * 브라우저에서는 하나를 재사용한다. React가 초기 렌더에서 suspend할 때
 * 클라이언트가 버려지는 것을 막기 위해서다(TanStack Query 공식 권장 패턴).
 */
function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 0이면 포커스 전환마다 재요청이 돈다.
        staleTime: 60 * 1000,
        retry: (failureCount, error) => {
          // 401은 apiClient가 이미 refresh 1회를 처리했다.
          // 여기서 또 재시도하면 이중 재시도가 된다.
          if (isApiClientError(error)) {
            const n = error.normalized;
            if (n.kind === "api" && (n.status === 401 || n.status === 403 || n.status === 404)) {
              return false;
            }
          }
          return failureCount < 2;
        },
      },
      mutations: {
        // 변경 요청은 재시도하지 않는다. 중복 생성 위험이 있다.
        retry: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (environmentManager.isServer()) {
    return makeQueryClient();
  }
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
