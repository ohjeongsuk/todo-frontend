"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";

import { getQueryClient } from "@/lib/getQueryClient";

/**
 * QueryClientProvider가 useContext에 의존하므로 클라이언트 컴포넌트여야 한다.
 * 루트 레이아웃에 'use client'를 붙이면 앱 전체가 클라이언트 트리가 되므로
 * Provider만 이렇게 분리한다 (CLAUDE.md 4장).
 *
 * MotionConfig reducedMotion="user"도 여기서 함께 건다 — globals.css의 CSS 미디어쿼리는
 * CSS transition/animation만 끄고 motion/react가 JS로 구동하는 애니메이션에는 적용되지
 * 않는, 서로 다른 메커니즘이다. "user"는 OS의 '동작 줄이기' 설정을 켠 사용자에게만
 * motion/react 애니메이션 전체를 자동으로 축소한다.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </QueryClientProvider>
  );
}
