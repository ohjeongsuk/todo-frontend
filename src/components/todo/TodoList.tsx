"use client";

import { TodoItem } from "@/components/todo/TodoItem";

import type { Todo } from "@/types/todo";

interface TodoListProps {
  todos: Todo[];
  onToggle: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
  togglingId?: number | null;
  deletingId?: number | null;
}

export function TodoList({ todos, onToggle, onDelete, togglingId, deletingId }: TodoListProps) {
  return (
    <ul className="border-t border-border">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onDelete={onDelete}
          isToggling={togglingId === todo.id}
          isDeleting={deletingId === todo.id}
        />
      ))}
    </ul>
  );
}
