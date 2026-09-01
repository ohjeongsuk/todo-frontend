"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { SortDirection, TodoSortField } from "@/types/todo";

interface TodoFiltersProps {
  keyword: string;
  onKeywordChange: (value: string) => void;
  /** undefined = 전체, false = 진행 중, true = 완료 */
  completed: boolean | undefined;
  onCompletedChange: (value: boolean | undefined) => void;
  sort: TodoSortField;
  direction: SortDirection;
  onSortChange: (sort: TodoSortField, direction: SortDirection) => void;
}

/** Select는 문자열만 다루므로 3상태를 문자열로 표현한다. */
const ALL = "all";

/**
 * 정렬은 생성일·마감일 2종만 제공한다 (ROADMAP Phase 8 착수 결정).
 * 백엔드 SORT_WHITELIST가 createdAt·dueDate 둘뿐이고, 우선순위는 enum이 문자열로 정렬돼
 * (HIGH < LOW < MEDIUM) 의미가 맞지 않는다.
 */
const SORT_OPTIONS: {
  value: string;
  label: string;
  sort: TodoSortField;
  direction: SortDirection;
}[] = [
  { value: "createdAt,desc", label: "최신순", sort: "createdAt", direction: "desc" },
  { value: "createdAt,asc", label: "오래된순", sort: "createdAt", direction: "asc" },
  { value: "dueDate,asc", label: "마감 빠른순", sort: "dueDate", direction: "asc" },
  { value: "dueDate,desc", label: "마감 늦은순", sort: "dueDate", direction: "desc" },
];

export function TodoFilters({
  keyword,
  onKeywordChange,
  completed,
  onCompletedChange,
  sort,
  direction,
  onSortChange,
}: TodoFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id="todo-search"
          type="search"
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          placeholder="제목으로 검색"
          aria-label="할 일 제목 검색"
          className="min-h-11 pl-9"
        />
      </div>

      <Select
        value={completed === undefined ? ALL : String(completed)}
        onValueChange={(v) => onCompletedChange(v === ALL ? undefined : v === "true")}
      >
        <SelectTrigger className="min-h-11 sm:w-36" aria-label="완료 상태 필터">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>전체</SelectItem>
          <SelectItem value="false">진행 중</SelectItem>
          <SelectItem value="true">완료</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={`${sort},${direction}`}
        onValueChange={(v) => {
          const found = SORT_OPTIONS.find((o) => o.value === v);
          if (found) onSortChange(found.sort, found.direction);
        }}
      >
        <SelectTrigger className="min-h-11 sm:w-36" aria-label="정렬 기준">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
