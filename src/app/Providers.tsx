"use client";

import { QueryClientProvider } from "@tanstack/react-query";

import { getQueryClient } from "@/lib/getQueryClient";

/**
 * QueryClientProvider가 useContext에 의존하므로 클라이언트 컴포넌트여야 한다.
 * 루트 레이아웃에 'use client'를 붙이면 앱 전체가 클라이언트 트리가 되므로
 * Provider만 이렇게 분리한다 (CLAUDE.md 4장).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
