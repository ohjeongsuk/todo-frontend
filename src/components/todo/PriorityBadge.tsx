import { cn } from "@/lib/utils";

import type { Priority } from "@/types/todo";

/**
 * 우선순위 표시.
 *
 * 색만으로 구분하지 않고 텍스트 라벨을 항상 함께 보여준다 (PRD NF-24).
 * 색상은 Phase 6이 확정한 --color-priority-* 토큰을 쓴다. 새 색을 만들지 않는다.
 *
 * 라벨 문구는 이 파일에만 둔다. 다른 화면에서 '높음' 같은 문자열을 다시 쓰지 않는다.
 */
const LABELS: Record<Priority, string> = {
  LOW: "낮음",
  MEDIUM: "보통",
  HIGH: "높음",
};

/**
 * Tailwind는 빌드 시 소스에서 클래스명을 문자열로 추출한다.
 * `text-priority-${priority}` 처럼 조합하면 추출되지 않아 색이 나오지 않는다.
 * 완전한 클래스명을 값으로 갖는 매핑을 쓴다.
 */
const STYLES: Record<Priority, string> = {
  LOW: "text-priority-low border-priority-low",
  MEDIUM: "text-priority-medium border-priority-medium",
  HIGH: "text-priority-high border-priority-high",
};

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        STYLES[priority],
        className,
      )}
    >
      {LABELS[priority]}
    </span>
  );
}

/** 정렬·필터 등에서 라벨이 필요할 때 쓴다. 문구 중복을 막는다. */
export function priorityLabel(priority: Priority): string {
  return LABELS[priority];
}
