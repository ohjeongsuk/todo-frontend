"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiClient } from "@/lib/apiClient";
import { toDisplayMessage } from "@/lib/errorMessages";
import { todoKeys } from "@/lib/queryKeys";

import type { QueryClient, QueryKey } from "@tanstack/react-query";
import type { PageResponse } from "@/types/api";
import type { Todo, TodoCreateRequest, TodoListParams, TodoUpdateRequest } from "@/types/todo";

/** 페이지당 건수. 서버도 기본 10이지만 계약을 분명히 하기 위해 항상 명시해 보낸다 (PRD F-13). */
export const PAGE_SIZE = 10;

/**
 * 낙관적 업데이트 롤백용 목록 스냅샷.
 *
 * 목록 캐시는 페이지·필터·검색어 조합마다 별도 엔트리다. 단건(setQueryData)으로 다루면
 * 지금 보고 있지 않은 페이지의 캐시가 어긋나므로 접두사로 전부 잡는다.
 */
type ListSnapshot = Array<[QueryKey, PageResponse<Todo> | undefined]>;

function snapshotLists(queryClient: QueryClient): ListSnapshot {
  return queryClient.getQueriesData<PageResponse<Todo>>({ queryKey: todoKeys.lists() });
}

function restoreLists(queryClient: QueryClient, snapshot: ListSnapshot): void {
  for (const [queryKey, data] of snapshot) {
    queryClient.setQueryData(queryKey, data);
  }
}

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
 *
 * id를 인자로 받는 이유는 scope 때문이다. scope는 useMutation 옵션이라
 * mutate(variables, options)로 넘길 수 없다. 따라서 할 일마다 고유한 scope를 가지려면
 * 훅이 행 단위로(TodoItem에서) 인스턴스화되어야 한다.
 *
 * scope가 필요한 이유: v5 mutation은 기본 병렬이다. 연타하면 PATCH 요청이 서로 앞질러
 * 서버에 도착할 수 있고, 그러면 서버의 최종값이 마지막 클릭과 달라진다. 목표 상태를
 * 보내는 것(멱등)만으로는 이 재정렬을 막지 못한다. 같은 scope의 mutation은 직렬 실행되어
 * 요청이 클릭 순서대로 하나씩 나간다.
 *
 * 직렬화해도 체감은 느려지지 않는다. onMutate는 큐 대기와 무관하게 즉시 실행되므로
 * (query-core mutation.ts에서 onMutate가 retryer.start()보다 먼저다) 화면은 클릭마다 바로 바뀐다.
 */
export function useToggleTodo(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (completed: boolean) =>
      apiClient.patch<Todo>(`/api/todos/${id}/toggle`, { completed }),
    scope: { id: `todo-toggle-${id}` },

    onMutate: async (completed) => {
      // 진행 중인 조회가 뒤늦게 도착해 낙관적 값을 덮어쓰는 것을 막는다.
      await Promise.all([
        queryClient.cancelQueries({ queryKey: todoKeys.lists() }),
        queryClient.cancelQueries({ queryKey: todoKeys.detail(id) }),
      ]);

      const previousLists = snapshotLists(queryClient);
      const previousDetail = queryClient.getQueryData<Todo>(todoKeys.detail(id));

      // 서버는 완료 시 시각을 채우고 해제 시 null로 되돌린다. 낙관적 값도 같은 규칙을 따른다.
      const completedAt = completed ? new Date().toISOString() : null;

      queryClient.setQueriesData<PageResponse<Todo>>({ queryKey: todoKeys.lists() }, (old) =>
        old === undefined
          ? old
          : {
              ...old,
              content: old.content.map((todo) =>
                todo.id === id ? { ...todo, completed, completedAt } : todo,
              ),
            },
      );

      if (previousDetail !== undefined) {
        queryClient.setQueryData<Todo>(todoKeys.detail(id), {
          ...previousDetail,
          completed,
          completedAt,
        });
      }

      return { previousLists, previousDetail };
    },

    onError: (error, _completed, context) => {
      if (context === undefined) return;
      restoreLists(queryClient, context.previousLists);
      if (context.previousDetail !== undefined) {
        queryClient.setQueryData(todoKeys.detail(id), context.previousDetail);
      }
      toast.error(toDisplayMessage(error));
    },

    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: todoKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: todoKeys.detail(id) }),
      ]);
    },
  });
}

/**
 * 삭제. Soft Delete라 서버에서 행은 남는다.
 *
 * 이동은 여기서 하지 않는다 — 목록에서 지우면 그 자리에 남고 상세에서 지우면 목록으로 가야 하므로
 * 화면의 관심사다. 또 이동을 onMutate로 앞당기면 실패 시 롤백이 사용자 눈에 보이지 않는다.
 *
 * 토글과 달리 scope를 쓰지 않는다. 삭제는 확인 대화상자가 가로막아 같은 id를 연타할 수 없고,
 * 서로 다른 id의 동시 삭제는 호출마다 별도 context를 가져 롤백이 서로 섞이지 않는다.
 */
export function useDeleteTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiClient.delete<void>(`/api/todos/${id}`),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.lists() });

      const previousLists = snapshotLists(queryClient);

      queryClient.setQueriesData<PageResponse<Todo>>({ queryKey: todoKeys.lists() }, (old) =>
        old === undefined
          ? old
          : {
              ...old,
              content: old.content.filter((todo) => todo.id !== id),
              // 총 건수도 함께 줄인다. 그대로 두면 페이지네이션이 실제보다 많은 페이지를 그린다.
              totalElements: Math.max(0, old.totalElements - 1),
            },
      );

      return { previousLists };
    },

    onError: (error, _id, context) => {
      if (context === undefined) return;
      restoreLists(queryClient, context.previousLists);
      toast.error(toDisplayMessage(error));
    },

    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    },
  });
}
