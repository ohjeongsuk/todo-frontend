"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";

import { DeleteTodoDialog } from "@/components/todo/DeleteTodoDialog";
import { PriorityBadge } from "@/components/todo/PriorityBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDate, isOverdue } from "@/lib/datetime";
import { cn } from "@/lib/utils";

import type { Todo } from "@/types/todo";

interface TodoItemProps {
  todo: Todo;
  onToggle: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
  isToggling?: boolean;
  isDeleting?: boolean;
}

export function TodoItem({ todo, onToggle, onDelete, isToggling, isDeleting }: TodoItemProps) {
  // 마감일은 LocalDate라 parseServerDate 계열을 쓴다.
  // parseServerDateTime을 쓰면 UTC 자정으로 해석돼 하루가 밀린다.
  const overdue = todo.dueDate !== null && !todo.completed && isOverdue(todo.dueDate);

  return (
    <li className="flex items-center gap-3 border-b border-border py-3">
      {/* 터치 타겟 44x44px (PRD NF-22). Checkbox 자체는 작으므로 감싸서 넓힌다 */}
      <label className="flex size-11 shrink-0 cursor-pointer items-center justify-center">
        <Checkbox
          checked={todo.completed}
          onCheckedChange={() => onToggle(todo)}
          disabled={isToggling}
          aria-label={`${todo.title} 완료 상태 전환`}
        />
      </label>

      <div className="min-w-0 flex-1">
        <Link
          href={`/todos/${todo.id}`}
          className={cn(
            "block truncate rounded text-sm font-medium",
            // 색만으로 구분하지 않는다 — 체크박스 상태와 취소선이 함께 신호를 준다 (PRD NF-24)
            todo.completed && "text-muted-foreground line-through",
          )}
        >
          {todo.title}
        </Link>

        {todo.dueDate ? (
          <p
            className={cn("mt-0.5 text-xs", overdue ? "text-destructive" : "text-muted-foreground")}
          >
            {formatDate(todo.dueDate)}
            {overdue ? " · 기한 지남" : ""}
          </p>
        ) : null}
      </div>

      <PriorityBadge priority={todo.priority} />

      {/* 삭제 확인을 거친다 (PRD F-22) */}
      <DeleteTodoDialog title={todo.title} onConfirm={() => onDelete(todo)} isDeleting={isDeleting}>
        <Button
          variant="ghost"
          size="icon"
          className="size-11 shrink-0 text-muted-foreground hover:text-destructive"
          aria-label={`${todo.title} 삭제`}
        >
          <Trash2 className="size-4" />
        </Button>
      </DeleteTodoDialog>
    </li>
  );
}
