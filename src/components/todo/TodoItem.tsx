"use client";

import { Trash2 } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { toast } from "sonner";

import { DeleteTodoDialog } from "@/components/todo/DeleteTodoDialog";
import { PriorityBadge } from "@/components/todo/PriorityBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToggleTodo } from "@/hooks/useTodos";
import { formatDate, isOverdue } from "@/lib/datetime";
import { toDisplayMessage } from "@/lib/errorMessages";
import { cn } from "@/lib/utils";

import type { Todo } from "@/types/todo";

interface TodoItemProps {
  todo: Todo;
  onDelete: (todo: Todo) => void;
  isDeleting?: boolean;
}

export function TodoItem({ todo, onDelete, isDeleting }: TodoItemProps) {
  // 마감일은 LocalDate라 parseServerDate 계열을 쓴다.
  // parseServerDateTime을 쓰면 UTC 자정으로 해석돼 하루가 밀린다.
  const overdue = todo.dueDate !== null && !todo.completed && isOverdue(todo.dueDate);

  // 이 훅을 여기(행 단위)에서 직접 만드는 이유는 useTodos.ts의 useToggleTodo 주석 참고 —
  // scope가 todo별로 분리되려면 todo별 mutation 인스턴스가 있어야 한다.
  const toggle = useToggleTodo(todo.id);

  function handleToggle() {
    toggle.mutate(!todo.completed, {
      onError: (error) => toast.error(toDisplayMessage(error)),
    });
  }

  // 루트는 li가 아니라 Fragment다 — motion.li(진입/퇴장 애니메이션)는 TodoList가 소유한다.
  return (
    <>
      {/* 터치 타겟 44x44px (PRD NF-22). Checkbox 자체는 작으므로 감싸서 넓힌다 */}
      <label className="flex size-11 shrink-0 cursor-pointer items-center justify-center">
        {/* 토글 시 짧은 scale 펄스. scope가 요청 순서를 이미 보장하므로 대기 중에도
            비활성화하지 않는다 — 연타해도 즉시 반영되는 쪽이 DoD("대기 시간 없이 즉시
            반영")에 맞다 */}
        <motion.span
          animate={{ scale: toggle.isPending ? [1, 1.15, 1] : 1 }}
          transition={{ duration: 0.2 }}
        >
          <Checkbox
            checked={todo.completed}
            onCheckedChange={handleToggle}
            aria-label={`${todo.title} 완료 상태 전환`}
          />
        </motion.span>
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
    </>
  );
}
