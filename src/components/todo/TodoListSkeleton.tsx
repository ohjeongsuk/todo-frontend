import { Skeleton } from "@/components/ui/skeleton";

/** 목록 로딩 자리표시. 실제 항목 높이와 비슷하게 맞춰 레이아웃이 튀지 않게 한다. */
export function TodoListSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <ul className="border-t border-border" aria-busy="true">
      <li className="sr-only">목록을 불러오는 중입니다</li>
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex items-center gap-3 border-b border-border py-3">
          <Skeleton className="size-11 shrink-0 rounded-md" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-12 rounded-md" />
        </li>
      ))}
    </ul>
  );
}
