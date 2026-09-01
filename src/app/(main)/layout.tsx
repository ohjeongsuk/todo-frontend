"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthGateSkeleton } from "@/components/common/AuthGate";
import { Header } from "@/components/layout/Header";
import { UserMenu } from "@/components/layout/UserMenu";
import { useAuth } from "@/hooks/useAuth";

/**
 * 보호 라우트 레이아웃.
 *
 * middleware.ts를 쓰지 않는 이유: 토큰이 localStorage에 있어 미들웨어에서 읽을 수 없다.
 * 클라이언트 레이아웃에서 판정하는 것이 이 프로젝트의 인증 구조와 맞는 유일한 방법이다.
 *
 * 핵심: status가 authenticated가 아니면 children을 아예 렌더하지 않는다.
 * unauthenticated에서도 스켈레톤을 유지해야 리다이렉트 직전 보호 화면이 깜빡이지 않는다.
 * 이것이 DoD "보호 화면이 한 프레임도 노출되지 않음"의 근거다.
 */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { status, user, logout } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (status !== "authenticated" || !user) {
    return <AuthGateSkeleton />;
  }

  return (
    <>
      <Header
        actions={
          <UserMenu nickname={user.nickname} onLogout={handleLogout} isLoggingOut={isLoggingOut} />
        }
      />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">{children}</main>
    </>
  );
}
