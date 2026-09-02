"use client";

import { Trash2 } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

import { DeleteTodoDialog } from "@/components/todo/DeleteTodoDialog";
import { PriorityBadge } from "@/components/todo/PriorityBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToggleTodo } from "@/hooks/useTodos";
import { formatDate, isOverdue } from "@/lib/datetime";
import { cn } from "@/lib/utils";

import type { Todo } from "@/types/todo";

interface TodoItemProps {
  todo: Todo;
  onDelete: (todo: Todo) => void;
  isDeleting?: boolean;
}

/**
 * 항목 등장·퇴장.
 *
 * 등장 간격은 부모(TodoList)가 stagger로 준다. 퇴장은 삭제 시 AnimatePresence가 재생하며,
 * 높이와 세로 패딩을 함께 0으로 보내야 아래 항목이 매끄럽게 올라온다(그래서 overflow-hidden).
 */
const itemVariants = {
  hidden: { opacity: 0, y: -4 },
  visible: { opacity: 1, y: 0 },
};

export function TodoItem({ todo, onDelete, isDeleting }: TodoItemProps) {
  // 토글 mutation을 행이 직접 소유한다. scope가 useMutation 옵션이라
  // 할 일마다 고유한 scope를 가지려면 여기서 인스턴스화되어야 한다 (useTodos.ts 주석 참조).
  const toggle = useToggleTodo(todo.id);

  // 마감일은 LocalDate라 parseServerDate 계열을 쓴다.
  // parseServerDateTime을 쓰면 UTC 자정으로 해석돼 하루가 밀린다.
  const overdue = todo.dueDate !== null && !todo.completed && isOverdue(todo.dueDate);

  return (
    <motion.li
      layout
      variants={itemVariants}
      exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.15 }}
      className="flex items-center gap-3 overflow-hidden border-b border-border py-3"
    >
      {/* 터치 타겟 44x44px (PRD NF-22). Checkbox 자체는 작으므로 감싸서 넓힌다 */}
      <label className="flex size-11 shrink-0 cursor-pointer items-center justify-center">
        {/* 누르는 순간 스프링으로 반응한다. 상태가 아니라 제스처에 묶여 있어
            완료된 항목이 계속 커져 있지 않고, 리렌더로 다시 재생되지도 않는다. */}
        <motion.span
          whileTap={{ scale: 0.85 }}
          transition={{ type: "spring", stiffness: 600, damping: 25 }}
          className="flex items-center justify-center"
        >
          <Checkbox
            checked={todo.completed}
            // 목표 상태를 그대로 보낸다. 서버가 값을 뒤집지 않는다.
            onCheckedChange={(checked) => toggle.mutate(checked === true)}
            // 낙관적 반영이라 대기 상태로 막지 않는다. 막으면 연타 자체가 불가능해진다.
            aria-label={`${todo.title} 완료 상태 전환`}
          />
        </motion.span>
      </label>

      <div className="min-w-0 flex-1">
        <Link
          href={`/todos/${todo.id}`}
          className={cn(
            "block truncate rounded text-sm font-medium transition-colors",
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
    </motion.li>
  );
}
