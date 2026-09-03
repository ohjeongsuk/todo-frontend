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
    await create.mutateAsync(body);
    // dirty를 먼저 내려야 이동 중 이탈 확인이 뜨지 않는다.
    setIsDirty(false);
    // 추가한 항목 하나가 아니라 목록으로 보낸다. 연달아 추가하거나 방금 넣은 것이
    // 전체에서 어디쯤인지 보는 쪽이 실제 흐름에 가깝다.
    router.replace("/todos");
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
