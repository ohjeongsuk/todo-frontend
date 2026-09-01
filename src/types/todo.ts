import type { IsoDate, IsoDateTime } from "./api";

/**
 * Todo 관련 계약.
 * 정본: todo-backend/src/main/java/com/example/todoapp/dto/ 및 domain/Priority.java
 */

export type Priority = "LOW" | "MEDIUM" | "HIGH";

/**
 * 서버 정렬 화이트리스트와 동일하다.
 * 정본: TodoService.SORT_WHITELIST = Set.of("createdAt", "dueDate")
 * 그 외 값을 보내면 서버가 조용히 createdAt DESC로 대체한다.
 */
export type TodoSortField = "createdAt" | "dueDate";

export type SortDirection = "asc" | "desc";

export interface Todo {
  id: number;
  title: string;
  /** Tiptap 본문 HTML. 서버에서 Jsoup으로 정화된 상태로 온다. */
  content: string | null;
  priority: Priority;
  dueDate: IsoDate | null;
  completed: boolean;
  /** 완료 해제 시 서버가 null로 되돌린다. */
  completedAt: IsoDateTime | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface TodoCreateRequest {
  title: string;
  content: string | null;
  priority: Priority;
  dueDate: IsoDate | null;
}

/**
 * completed 필드가 없다.
 * PUT 저장은 전체 교체이지만 완료 상태는 덮어쓰지 않는다 (ROADMAP Phase 4 TODO-10).
 * 완료 토글은 PATCH /api/todos/{id}/toggle 을 쓴다.
 */
export interface TodoUpdateRequest {
  title: string;
  content: string | null;
  priority: Priority;
  dueDate: IsoDate | null;
}

/** 목표 상태를 그대로 보낸다. 서버가 값을 뒤집지 않는다. */
export interface ToggleRequest {
  completed: boolean;
}

/** GET /api/todos 쿼리 파라미터. 전부 선택이다. */
export interface TodoListParams {
  completed?: boolean;
  keyword?: string;
  /** 0-based */
  page?: number;
  size?: number;
  sort?: TodoSortField;
  direction?: SortDirection;
}
