import type { TodoListParams } from "@/types/todo";

/**
 * React Query 키 규약.
 *
 * 접두사가 계층을 이루므로 상위 키로 무효화하면 하위가 모두 걸린다.
 *   todoKeys.all   → 목록·상세 전부
 *   todoKeys.lists → 목록만
 *   todoKeys.detail(id) → 해당 단건만
 *
 * 정본: ROADMAP.md 「Phase 6 확정 값 > React Query 쿼리 키 규약」
 */

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

export const todoKeys = {
  all: ["todos"] as const,
  lists: () => [...todoKeys.all, "list"] as const,
  list: (params: TodoListParams) => [...todoKeys.lists(), params] as const,
  details: () => [...todoKeys.all, "detail"] as const,
  detail: (id: number) => [...todoKeys.details(), id] as const,
};

/**
 * 첨부 조회 URL 캐시 키.
 *
 * URL 이 만료되므로(기본 30분) staleTime 을 만료보다 짧게 잡아야 한다. 캐시가 만료된 URL 을
 * 계속 돌려주면 이미지가 조용히 깨진다.
 */
export const attachmentKeys = {
  all: ["attachments"] as const,
  viewUrls: (ids: number[]) => [...attachmentKeys.all, "view-urls", [...ids].sort()] as const,
};
