"use client";

import { AnimatePresence, motion, stagger } from "motion/react";

import { TodoItem } from "@/components/todo/TodoItem";

import type { Todo } from "@/types/todo";

interface TodoListProps {
  todos: Todo[];
  onDelete: (todo: Todo) => void;
  deletingId?: number | null;
}

/**
 * 목록 등장 간격.
 *
 * 항목당 20ms씩 밀고 항목 자체의 재생은 150ms라, 한 항목 기준으로는 200ms 안에 끝난다
 * (ROADMAP Phase 9 DoD). staggerChildren은 v13에서 deprecated라 delayChildren + stagger()를 쓴다.
 */
const listVariants = {
  hidden: {},
  visible: { transition: { delayChildren: stagger(0.02) } },
};

export function TodoList({ todos, onDelete, deletingId }: TodoListProps) {
  return (
    <motion.ul
      className="border-t border-border"
      variants={listVariants}
      initial="hidden"
      animate="visible"
    >
      {/* 삭제(낙관적 제거) 시 퇴장 애니메이션을 재생한다. key는 todo.id라 안정적이다. */}
      <AnimatePresence>
        {todos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onDelete={onDelete}
            isDeleting={deletingId === todo.id}
          />
        ))}
      </AnimatePresence>
    </motion.ul>
  );
}
