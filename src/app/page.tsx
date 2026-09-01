"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AuthGateSkeleton } from "@/components/common/AuthGate";
import { useAuth } from "@/hooks/useAuth";

/**
 * 진입점. 인증 상태에 따라 목록 또는 로그인으로 보낸다.
 *
 * Phase 6의 스캐폴딩 확인 페이지는 역할이 끝나 교체했다.
 * 남겨두면 미인증 사용자에게 내부 동작이 그대로 노출된다.
 */
export default function RootPage() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/todos");
    } else if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  return <AuthGateSkeleton />;
}
