"use client";

import { Inbox, Plus, RotateCcw, SearchX } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Pagination } from "@/components/common/Pagination";
import { TodoFilters } from "@/components/todo/TodoFilters";
import { TodoList } from "@/components/todo/TodoList";
import { TodoListSkeleton } from "@/components/todo/TodoListSkeleton";
import { Button } from "@/components/ui/button";
import { NETWORK_MESSAGE, toDisplayMessage } from "@/lib/errorMessages";
import { useDeleteTodo, useTodoList, useToggleTodo } from "@/hooks/useTodos";

import type { SortDirection, Todo, TodoSortField } from "@/types/todo";

/** 검색 입력 디바운스(ms). 매 글자마다 요청하면 시드 100건에서도 체감된다. */
const SEARCH_DEBOUNCE_MS = 300;

function TodosContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL이 상태의 정본이다. 새로고침·뒤로가기에서 그대로 복원된다 (PRD F-17).
  const rawPage = Number(searchParams.get("page") ?? "1");
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage - 1 : 0; // URL은 1-based, 서버는 0-based
  const rawCompleted = searchParams.get("completed");
  const completed = rawCompleted === null ? undefined : rawCompleted === "true";
  const keyword = searchParams.get("keyword") ?? "";
  const sort = (searchParams.get("sort") ?? "createdAt") as TodoSortField;
  const direction = (searchParams.get("direction") ?? "desc") as SortDirection;

  // 입력값은 즉시 반영하고, 디바운스된 값만 URL에 쓴다.
  const [keywordInput, setKeywordInput] = useState(keyword);

  // 뒤로가기 등으로 URL의 keyword가 외부에서 바뀌면 입력값을 맞춘다.
  // effect가 아니라 렌더 중 조정이다 — effect에서 동기적으로 setState하면 렌더가 연쇄된다.
  const [syncedKeyword, setSyncedKeyword] = useState(keyword);
  if (syncedKeyword !== keyword) {
    setSyncedKeyword(keyword);
    setKeywordInput(keyword);
  }

  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const query = useTodoList({ completed, keyword, page, sort, direction });
  const toggle = useToggleTodo();
  const remove = useDeleteTodo();

  /** 파라미터를 병합해 URL을 갱신한다. 값이 undefined면 해당 키를 지운다. */
  const updateParams = useCallback(
    (next: Record<string, string | undefined>, mode: "push" | "replace") => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(next)) {
        if (value === undefined || value === "") params.delete(key);
        else params.set(key, value);
      }
      const qs = params.toString();
      const url = qs ? `/todos?${qs}` : "/todos";
      if (mode === "push") router.push(url);
      else router.replace(url);
    },
    [router, searchParams],
  );

  // 검색어 디바운스. 타이핑마다 push하면 히스토리가 오염되므로 replace를 쓴다.
  useEffect(() => {
    if (keywordInput === keyword) return;
    const timer = setTimeout(() => {
      updateParams({ keyword: keywordInput || undefined, page: undefined }, "replace");
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [keywordInput, keyword, updateParams]);

  function handleToggle(todo: Todo) {
    setTogglingId(todo.id);
    // 목표 상태를 보낸다. 서버가 값을 뒤집지 않는다.
    toggle.mutate(
      { id: todo.id, completed: !todo.completed },
      { onSettled: () => setTogglingId(null) },
    );
  }

  function handleDelete(todo: Todo) {
    setDeletingId(todo.id);
    remove.mutate(todo.id, {
      onSuccess: () => {
        // 이 페이지의 마지막 항목이었다면 빈 페이지가 남는다. 이전 페이지로 물러난다.
        // 이 판단은 반드시 onSuccess 이후에 한다 — 앞당기면 실패 시 롤백이 눈에 보이지 않는다.
        const remaining = (query.data?.content.length ?? 1) - 1;
        if (remaining === 0 && page > 0) {
          updateParams({ page: String(page) }, "replace"); // page는 0-based, URL은 1-based
        }
      },
      onSettled: () => setDeletingId(null),
    });
  }

  const data = query.data;

  /**
   * 오프라인이거나 창이 백그라운드로 내려가면 React Query는 요청을 시작·재개하지 않고
   * fetchStatus를 paused로 둔다. 이때 status는 pending/success 그대로라 isError가 켜지지 않는다.
   * (query-core queryObserver.js: isPaused = fetchStatus === "paused")
   *
   * 실패로 status가 error가 되는 경우와 달리 이 상태는 아무 신호도 남기지 않는다.
   * 따로 다루지 않으면 두 가지가 조용히 잘못된다.
   *  - 이전 페이지 데이터가 남아 있으면 URL과 다른 목록을 아무 경고 없이 보여준다.
   *  - 첫 진입이라 데이터가 없으면 스켈레톤이 영원히 돌아간다.
   */
  const isPaused = query.isPaused;

  // placeholderData가 쿼리를 success로 만들기 때문에 isPending만 보면 페이지 이동 중
  // 스켈레톤이 나오지 않는다. isPlaceholderData를 함께 본다.
  // paused는 진행 중이 아니므로 로딩에서 제외한다. 아니면 스켈레톤이 멈추지 않는다.
  const isLoading = !isPaused && (query.isPending || (query.isPlaceholderData && query.isFetching));

  // 목록은 유지하되(작업 맥락을 잃지 않게) 최신이 아님을 알리고 재시도 수단을 준다.
  const hasStaleData = isPaused && data !== undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">할 일</h1>
        <Button asChild className="min-h-11">
          <Link href="/todos/new">
            <Plus className="size-4" />할 일 추가
          </Link>
        </Button>
      </div>

      <TodoFilters
        keyword={keywordInput}
        onKeywordChange={setKeywordInput}
        completed={completed}
        onCompletedChange={(v) =>
          updateParams(
            { completed: v === undefined ? undefined : String(v), page: undefined },
            "replace",
          )
        }
        sort={sort}
        direction={direction}
        onSortChange={(s, d) => updateParams({ sort: s, direction: d, page: undefined }, "replace")}
      />

      {remove.isError ? (
        <p
          role="alert"
          className="rounded-md border border-destructive p-3 text-sm text-destructive"
        >
          {toDisplayMessage(remove.error)}
        </p>
      ) : null}

      {hasStaleData ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-destructive p-3 text-sm"
        >
          <span className="text-destructive">
            {NETWORK_MESSAGE} 표시된 목록은 최신이 아닐 수 있습니다.
          </span>
          <Button
            variant="outline"
            size="sm"
            className="min-h-11"
            onClick={() => void query.refetch()}
          >
            <RotateCcw className="size-4" />
            다시 시도
          </Button>
        </div>
      ) : null}

      {query.isError ? (
        <ErrorState message={toDisplayMessage(query.error)} onRetry={() => void query.refetch()} />
      ) : isPaused && data === undefined ? (
        // 오프라인 상태로 첫 진입한 경우. 여기를 빼면 스켈레톤이 영원히 돈다.
        <ErrorState message={NETWORK_MESSAGE} onRetry={() => void query.refetch()} />
      ) : isLoading ? (
        <TodoListSkeleton />
      ) : data && data.content.length === 0 ? (
        keyword ? (
          <EmptyState
            icon={<SearchX />}
            title="검색 결과가 없어요"
            description={`'${keyword}'와 일치하는 할 일을 찾지 못했습니다. 다른 검색어로 시도해 보세요.`}
          />
        ) : (
          <EmptyState
            icon={<Inbox />}
            title="아직 할 일이 없어요"
            description="첫 번째 할 일을 추가해 보세요."
            action={
              <Button asChild className="min-h-11">
                <Link href="/todos/new">할 일 추가</Link>
              </Button>
            }
          />
        )
      ) : data ? (
        <>
          <TodoList
            todos={data.content}
            onToggle={handleToggle}
            onDelete={handleDelete}
            togglingId={togglingId}
            deletingId={deletingId}
          />
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            onChange={(next) => {
              updateParams({ page: String(next + 1) }, "push");
              window.scrollTo({ top: 0 });
            }}
          />
        </>
      ) : null}
    </div>
  );
}

export default function TodosPage() {
  // useSearchParams를 쓰므로 Suspense 경계가 필수다. 없으면 빌드가 실패한다.
  return (
    <Suspense fallback={<TodoListSkeleton />}>
      <TodosContent />
    </Suspense>
  );
}
