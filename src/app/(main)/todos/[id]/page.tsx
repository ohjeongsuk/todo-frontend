"use client";

import { FileQuestion, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { DeleteTodoDialog } from "@/components/todo/DeleteTodoDialog";
import { TodoForm } from "@/components/todo/TodoForm";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { isApiClientError } from "@/lib/apiClient";
import { toDisplayMessage } from "@/lib/errorMessages";
import { useDeleteTodo, useTodo, useUpdateTodo } from "@/hooks/useTodos";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

import type { TodoCreateRequest } from "@/types/todo";

/** 폼 형태 스켈레톤. 목록 스켈레톤을 재사용하면 화면이 바뀌는 것처럼 보인다 (UX-01). */
function TodoFormSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true">
      <span className="sr-only">할 일을 불러오는 중입니다</span>
      <Skeleton className="h-8 w-40" />
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-11 w-full" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-11 w-full" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

/** 소유권 위반도 서버가 404로 응답한다(존재 여부 비노출). 타인 소유 id도 이 화면이 된다. */
function isNotFound(error: unknown): boolean {
  return (
    isApiClientError(error) &&
    error.normalized.kind === "api" &&
    error.normalized.code === "NOT_FOUND"
  );
}

export default function TodoDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();

  const query = useTodo(id);
  const update = useUpdateTodo(id);
  const remove = useDeleteTodo();

  const [isDirty, setIsDirty] = useState(false);
  const { confirmNavigation } = useUnsavedChanges(isDirty);

  async function handleSubmit(body: TodoCreateRequest) {
    // 실패하면 여기서 throw되어 아래 코드가 실행되지 않는다.
    // 폼은 그대로 남고 submitError가 화면에 표시된다 (TODO-13).
    await update.mutateAsync(body);
  }

  function handleDelete() {
    // 이동은 onSuccess에서만 한다. 앞당기면 실패 시 롤백이 사용자 눈에 보이지 않는다.
    remove.mutate(id, {
      onSuccess: () => {
        setIsDirty(false);
        router.replace("/todos");
      },
    });
  }

  if (query.isPending) return <TodoFormSkeleton />;

  if (isNotFound(query.error)) {
    // 자동 리다이렉트를 하지 않는다. 사용자가 무슨 일이 일어났는지 읽을 시간을 준다 (TODO-14).
    return (
      <EmptyState
        icon={<FileQuestion />}
        title="찾을 수 없습니다"
        description="이미 삭제되었거나 접근할 수 없는 할 일입니다."
        action={
          <Button asChild className="min-h-11">
            <Link href="/todos">목록으로 가기</Link>
          </Button>
        }
      />
    );
  }

  if (query.isError || !query.data) {
    return (
      <ErrorState message={toDisplayMessage(query.error)} onRetry={() => void query.refetch()} />
    );
  }

  const todo = query.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">할 일 수정</h1>
        <DeleteTodoDialog title={todo.title} onConfirm={handleDelete} isDeleting={remove.isPending}>
          <Button variant="outline" className="min-h-11">
            <Trash2 className="size-4" />
            삭제
          </Button>
        </DeleteTodoDialog>
      </div>

      {remove.isError ? (
        <p
          role="alert"
          className="rounded-md border border-destructive p-3 text-sm text-destructive"
        >
          {toDisplayMessage(remove.error)}
        </p>
      ) : null}

      <TodoForm
        initial={todo}
        onSubmit={handleSubmit}
        onCancel={() => {
          if (confirmNavigation()) router.push("/todos");
        }}
        isSubmitting={update.isPending}
        submitError={update.error}
        onDirtyChange={setIsDirty}
        submitLabel="저장"
      />
    </div>
  );
}
