"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  /** 현재 페이지. 서버 PageResponse와 같은 0-based다. */
  page: number;
  totalPages: number;
  /** 0-based 페이지 번호를 넘겨준다. */
  onChange: (page: number) => void;
  /** 현재 페이지 양옆에 보여줄 번호 개수 */
  siblingCount?: number;
}

/** 표시할 페이지 번호(0-based)를 계산한다. 인덱스 접근 대신 Array.from을 쓴다. */
function buildPageWindow(page: number, totalPages: number, siblingCount: number): number[] {
  const start = Math.max(0, Math.min(page - siblingCount, totalPages - (siblingCount * 2 + 1)));
  const length = Math.min(siblingCount * 2 + 1, totalPages);
  return Array.from({ length }, (_, offset) => start + offset);
}

/**
 * 페이지네이션.
 *
 * 페이지가 하나 이하면 아무것도 렌더하지 않는다. 이건 스타일이 아니라 동작 계약이다
 * (ROADMAP Phase 6 DoD).
 */
export function Pagination({ page, totalPages, onChange, siblingCount = 2 }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = buildPageWindow(page, totalPages, siblingCount);
  const isFirst = page <= 0;
  const isLast = page >= totalPages - 1;

  return (
    <nav aria-label="페이지 이동" className="flex items-center justify-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="size-11"
        disabled={isFirst}
        onClick={() => onChange(page - 1)}
        aria-label="이전 페이지"
      >
        <ChevronLeft className="size-4" />
      </Button>

      {pages.map((p) => {
        const isCurrent = p === page;
        // 모바일에서는 더 축약한다 (PRD F-29). 360px에서 5개를 다 그리면
        // 44px x 7개 + 간격이 가용 폭을 넘겨 nav가 넘친다.
        const isFarFromCurrent = Math.abs(p - page) > 1;
        return (
          <Button
            key={p}
            variant={isCurrent ? "default" : "ghost"}
            size="icon"
            className={cn(
              "size-11 tabular-nums",
              isCurrent && "pointer-events-none",
              isFarFromCurrent && "hidden sm:inline-flex",
            )}
            // 색만으로 현재 위치를 알리지 않는다 (PRD NF-24)
            aria-current={isCurrent ? "page" : undefined}
            aria-label={`${p + 1}페이지`}
            onClick={() => onChange(p)}
          >
            {/* 서버는 0-based, 사람이 읽는 표시는 1-based다 */}
            {p + 1}
          </Button>
        );
      })}

      <Button
        variant="ghost"
        size="icon"
        className="size-11"
        disabled={isLast}
        onClick={() => onChange(page + 1)}
        aria-label="다음 페이지"
      >
        <ChevronRight className="size-4" />
      </Button>
    </nav>
  );
}
