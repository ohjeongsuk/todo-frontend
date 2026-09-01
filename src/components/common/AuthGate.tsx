import { Skeleton } from "@/components/ui/skeleton";

/**
 * 인증 판정 중·리다이렉트 직전에 보여주는 자리표시.
 *
 * 조작 가능한 요소를 두지 않는다. 판정이 끝나기 전에 사용자가 무언가를 누르면
 * 그 동작이 어느 상태에서 일어난 것인지 모호해진다.
 */
export function AuthGateSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-10" aria-busy="true">
      <span className="sr-only">인증 상태를 확인하는 중입니다</span>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-4/5" />
      <Skeleton className="h-5 w-3/5" />
    </div>
  );
}
