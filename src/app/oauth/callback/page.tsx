"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { setAccessToken } from "@/lib/apiClient";

/**
 * 처리 중 화면. 버튼·링크·입력을 두지 않는다.
 *
 * 인증 처리 중이라 사용자가 조작할 수 있는 것이 있으면 어느 상태에서 일어난
 * 동작인지 모호해진다. 공통 헤더도 두지 않는다 — 아직 닉네임을 모른다.
 */
function CallbackSkeleton() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12" aria-busy="true">
      <div className="w-full max-w-sm space-y-3">
        <span className="sr-only">로그인 처리 중입니다</span>
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/5" />
      </div>
    </main>
  );
}

function CallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  useEffect(() => {
    // 파라미터가 없거나 빈 문자열이면 정상 흐름이 아니다. 로그인으로 되돌린다.
    if (!token) {
      router.replace("/login");
      return;
    }

    setAccessToken(token);

    // 주소창에서 토큰을 즉시 지운다. 라우터 이동이 한 틱 늦으면
    // 그 사이 주소창에 Access Token이 그대로 보이고 히스토리에도 남는다.
    window.history.replaceState(null, "", "/oauth/callback");

    router.replace("/todos");
  }, [token, router]);

  return <CallbackSkeleton />;
}

export default function OAuthCallbackPage() {
  // useSearchParams를 쓰므로 Suspense 경계가 필수다. 없으면 npm run build가 실패한다.
  return (
    <Suspense fallback={<CallbackSkeleton />}>
      <CallbackHandler />
    </Suspense>
  );
}
