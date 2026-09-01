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
