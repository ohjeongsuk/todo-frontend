"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/apiClient";
import { todoKeys } from "@/lib/queryKeys";

import type { PageResponse } from "@/types/api";
import type { Todo, TodoCreateRequest, TodoListParams, TodoUpdateRequest } from "@/types/todo";

/** 페이지당 건수. 서버도 기본 10이지만 계약을 분명히 하기 위해 항상 명시해 보낸다 (PRD F-13). */
export const PAGE_SIZE = 10;

function buildListQuery(params: TodoListParams): string {
  const qs = new URLSearchParams();
  qs.set("page", String(params.page ?? 0));
  qs.set("size", String(params.size ?? PAGE_SIZE));

  // completed는 false도 유효한 값이다. falsy 검사로 거르면 '진행 중' 필터가 동작하지 않는다.
  if (params.completed !== undefined) qs.set("completed", String(params.completed));
  if (params.keyword) qs.set("keyword", params.keyword);
  if (params.sort) qs.set("sort", `${params.sort},${params.direction ?? "desc"}`);

  return qs.toString();
}

/**
 * 목록 조회.
 *
 * placeholderData: keepPreviousData로 페이지를 넘길 때 목록이 사라졌다 나타나는 깜빡임을 막는다.
 * v5에서 keepPreviousData 옵션은 제거됐고 import한 함수를 placeholderData에 넣는 방식이다.
 *
 * 주의: placeholderData는 쿼리를 항상 success 상태로 만든다. 로딩 분기를 isPending만으로 짜면
 * 페이지 이동 중 스켈레톤이 나오지 않는다. 호출부는 isPlaceholderData를 함께 봐야 한다.
 */
export function useTodoList(params: TodoListParams) {
  return useQuery({
    queryKey: todoKeys.list(params),
    queryFn: () => apiClient.get<PageResponse<Todo>>(`/api/todos?${buildListQuery(params)}`),
    placeholderData: keepPreviousData,
  });
}

/** 단건 조회. 404는 전용 화면으로 가야 하므로 재시도하지 않는다(getQueryClient가 이미 제외한다). */
export function useTodo(id: number) {
  return useQuery({
    queryKey: todoKeys.detail(id),
    queryFn: () => apiClient.get<Todo>(`/api/todos/${id}`),
    enabled: Number.isFinite(id),
  });
}

export function useCreateTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: TodoCreateRequest) => apiClient.post<Todo>("/api/todos", body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    },
  });
}

export function useUpdateTodo(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    // PUT 전체 교체다. 본문에 completed가 없어 저장해도 완료 상태가 바뀌지 않는다 (TODO-10).
    mutationFn: (body: TodoUpdateRequest) => apiClient.put<Todo>(`/api/todos/${id}`, body),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: todoKeys.detail(id) }),
        queryClient.invalidateQueries({ queryKey: todoKeys.lists() }),
      ]);
    },
  });
}

/**
 * 완료 토글. 목표 상태를 그대로 보낸다 — 서버가 값을 뒤집지 않는다.
 * 낙관적 업데이트는 Phase 9 범위다. 여기서는 응답을 받고 목록을 무효화한다.
 */
export function useToggleTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, completed }: { id: number; completed: boolean }) =>
      apiClient.patch<Todo>(`/api/todos/${id}/toggle`, { completed }),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: todoKeys.detail(variables.id) }),
        queryClient.invalidateQueries({ queryKey: todoKeys.lists() }),
      ]);
    },
  });
}

/**
 * 삭제. Soft Delete라 서버에서 행은 남는다.
 *
 * 이동은 여기서 하지 않는다 — 목록에서 지우면 그 자리에 남고 상세에서 지우면 목록으로 가야 하므로
 * 화면의 관심사다. 또 이동을 onMutate로 앞당기면 실패 시 롤백이 사용자 눈에 보이지 않는다.
 */
export function useDeleteTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete<void>(`/api/todos/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    },
  });
}
