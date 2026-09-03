"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiClient } from "@/lib/apiClient";
import { toDisplayMessage } from "@/lib/errorMessages";
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

/** 목록 캐시 안의 해당 id 항목만 completed를 바꾼 새 페이지 데이터를 만든다(불변 업데이트). */
function patchContent(
  page: PageResponse<Todo>,
  id: number,
  completed: boolean,
): PageResponse<Todo> {
  return {
    ...page,
    content: page.content.map((t) => (t.id === id ? { ...t, completed } : t)),
  };
}

/**
 * 완료 토글. 목표 상태를 그대로 보낸다 — 서버가 값을 뒤집지 않는다.
 *
 * id별로 훅을 만든다(페이지 레벨에서 하나를 공유하지 않는다). scope는 useMutation 정의
 * 시점의 정적 옵션이라 mutate() 호출마다 다르게 줄 수 없기 때문이다 — 같은 todo에 대한
 * 연타를 직렬화하려면 그 todo 전용 mutation 인스턴스가 있어야 한다.
 *
 * scope를 쓰는 이유(더 간단해 보이는 onSettled의 isMutating() 가드를 쓰지 않는 이유):
 * TanStack Query의 retryer는 canRun()(=scope 게이트)을 실제 mutationFn 호출, 즉 fetch를
 * 보내기 "이전"에 확인한다(node_modules/@tanstack/query-core의 retryer.js canStart/pause와
 * mutation.js execute() 순서로 확인). 즉 scope는 같은 id의 연속 클릭이 서버에 도달하는
 * "요청 발사 순서" 자체를 직렬화한다. 반면 isMutating() 가드는 onSettled, 즉 응답이 이미
 * 온 뒤에야 "이게 마지막 요청인지"를 판정하므로 네트워크 재정렬(요청이 보낸 순서와 다르게
 * 서버에 도착하는 것)까지는 막지 못한다. 연타 후 "마지막 클릭 값으로 수렴"을 네트워크
 * 조건과 무관하게 보장하려면 scope가 필요하다.
 */
export function useToggleTodo(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    scope: { id: `todo-toggle-${id}` },
    mutationFn: (completed: boolean) =>
      apiClient.patch<Todo>(`/api/todos/${id}/toggle`, { completed }),
    onMutate: async (completed) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.lists() });
      await queryClient.cancelQueries({ queryKey: todoKeys.detail(id) });

      const prevLists = queryClient.getQueriesData<PageResponse<Todo>>({
        queryKey: todoKeys.lists(),
      });
      const prevDetail = queryClient.getQueryData<Todo>(todoKeys.detail(id));

      queryClient.setQueriesData<PageResponse<Todo>>({ queryKey: todoKeys.lists() }, (old) =>
        old ? patchContent(old, id, completed) : old,
      );
      queryClient.setQueryData<Todo>(todoKeys.detail(id), (old) =>
        old ? { ...old, completed } : old,
      );

      return { prevLists, prevDetail };
    },
    onError: (_error, _completed, context) => {
      context?.prevLists.forEach(([key, data]) => queryClient.setQueryData(key, data));
      if (context?.prevDetail !== undefined) {
        queryClient.setQueryData(todoKeys.detail(id), context.prevDetail);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: todoKeys.detail(id) });
    },
  });
}

/** 목록 캐시에서 해당 id 항목을 제거한 새 페이지 데이터를 만든다(불변 업데이트). */
function removeFromContent(page: PageResponse<Todo>, id: number): PageResponse<Todo> {
  return {
    ...page,
    content: page.content.filter((t) => t.id !== id),
    totalElements: Math.max(0, page.totalElements - 1),
  };
}

/**
 * 삭제. Soft Delete라 서버에서 행은 남는다.
 *
 * 이동은 onSuccess(page.tsx의 mutate() 호출부)에서만 한다 — 목록에서 지우면 그 자리에 남고
 * 상세에서 지우면 목록으로 가야 하므로 화면의 관심사다. onMutate로 앞당기면 실패 시 롤백이
 * 사용자 눈에 보이지 않으므로 절대 옮기지 않는다.
 *
 * 삭제 확인 다이얼로그가 이미 연타를 막으므로(확인 버튼이 isDeleting일 때 비활성화) 토글과
 * 달리 scope 직렬화는 필요 없다 — 페이지 레벨 단일 인스턴스를 그대로 공유한다.
 */
export function useDeleteTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete<void>(`/api/todos/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.lists() });

      const prevLists = queryClient.getQueriesData<PageResponse<Todo>>({
        queryKey: todoKeys.lists(),
      });

      queryClient.setQueriesData<PageResponse<Todo>>({ queryKey: todoKeys.lists() }, (old) =>
        old ? removeFromContent(old, id) : old,
      );

      return { prevLists };
    },
    onError: (error, _id, context) => {
      context?.prevLists.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toast.error(toDisplayMessage(error));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    },
  });
}
