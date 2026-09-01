"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { TodoForm } from "@/components/todo/TodoForm";
import { useCreateTodo } from "@/hooks/useTodos";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

import type { TodoCreateRequest } from "@/types/todo";

export default function NewTodoPage() {
  const router = useRouter();
  const create = useCreateTodo();
  const [isDirty, setIsDirty] = useState(false);
  const { confirmNavigation } = useUnsavedChanges(isDirty);

  async function handleSubmit(body: TodoCreateRequest) {
    const created = await create.mutateAsync(body);
    // dirty를 먼저 내려야 이동 중 이탈 확인이 뜨지 않는다.
    setIsDirty(false);
    router.replace(`/todos/${created.id}`);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">할 일 추가</h1>
      <TodoForm
        initial={null}
        onSubmit={handleSubmit}
        onCancel={() => {
          if (confirmNavigation()) router.push("/todos");
        }}
        isSubmitting={create.isPending}
        submitError={create.error}
        onDirtyChange={setIsDirty}
        submitLabel="추가"
      />
    </div>
  );
}
