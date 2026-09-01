"use client";

import { AlertCircle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  /** 반드시 lib/errorMessages.ts의 toDisplayMessage를 거친 값을 넘긴다. */
  message: string;
  /**
   * 필수다. 선택 prop으로 두면 호출부에서 빠뜨려도 타입 검사가 통과해
   * 재시도 버튼 없는 에러 화면이 조용히 만들어진다 (PRD UX-04).
   */
  onRetry: () => void;
  title?: string;
}

export function ErrorState({ message, onRetry, title = "문제가 발생했어요" }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border px-6 py-12 text-center"
    >
      {/* 색만으로 상태를 구분하지 않는다 — 아이콘과 문구를 함께 둔다 (PRD NF-24) */}
      <AlertCircle className="size-8 text-destructive" aria-hidden />
      <p className="text-base font-medium">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" className="mt-2 min-h-11" onClick={onRetry}>
        <RotateCcw className="size-4" />
        다시 시도
      </Button>
    </div>
  );
}
