"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";

import { getQueryClient } from "@/lib/getQueryClient";

/**
 * QueryClientProvider가 useContext에 의존하므로 클라이언트 컴포넌트여야 한다.
 * 루트 레이아웃에 'use client'를 붙이면 앱 전체가 클라이언트 트리가 되므로
 * Provider만 이렇게 분리한다 (CLAUDE.md 4장).
 *
 * MotionConfig reducedMotion="user": OS의 '동작 줄이기' 설정을 따라 이동·크기 변화를
 * 자동으로 끄고 불투명도만 남긴다. 컴포넌트마다 useReducedMotion으로 분기하면
 * 새 애니메이션에서 빠뜨리기 쉬우므로 여기서 한 번에 건다.
 * globals.css의 prefers-reduced-motion 블록은 CSS transition만 잡고 JS 스프링은 잡지 못하므로
 * 둘 다 필요하다.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </QueryClientProvider>
  );
}
