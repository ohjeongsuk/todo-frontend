"use client";

import { AnimatePresence, motion } from "motion/react";

import { TodoItem } from "@/components/todo/TodoItem";

import type { Todo } from "@/types/todo";

interface TodoListProps {
  todos: Todo[];
  onDelete: (todo: Todo) => void;
  deletingId?: number | null;
}

// 진입 시 항목마다 조금씩 늦게 나타난다(stagger). 총 지속시간이 200ms를 넘지 않도록
// staggerChildren을 작게 잡는다 — 페이지당 최대 10건이므로 0.03 * 10 = 0.3초에 각 항목의
// 0.15초 자체 duration이 겹쳐 실제 체감 시간은 그보다 짧다(실측 태스크에서 재확인).
const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.03 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 4 },
  show: { opacity: 1, y: 0, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export function TodoList({ todos, onDelete, deletingId }: TodoListProps) {
  return (
    <motion.ul
      className="border-t border-border"
      variants={listVariants}
      initial="hidden"
      animate="show"
    >
      {/* initial={false}: 최초 마운트 시 진입 애니메이션이 두 번(모션 variants + AnimatePresence)
          겹쳐 재생되는 것을 막는다. 페이지·필터 전환으로 key 구성이 바뀔 때만 AnimatePresence가
          작동해 새 항목 진입/이전 항목 퇴장을 처리한다. */}
      <AnimatePresence initial={false}>
        {todos.map((todo) => (
          <motion.li
            key={todo.id}
            variants={itemVariants}
            exit="exit"
            className="flex items-center gap-3 border-b border-border py-3"
          >
            <TodoItem todo={todo} onDelete={onDelete} isDeleting={deletingId === todo.id} />
          </motion.li>
        ))}
      </AnimatePresence>
    </motion.ul>
  );
}
