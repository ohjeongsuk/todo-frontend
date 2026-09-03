"use client";

import { Toaster } from "sonner";

import { useTheme } from "@/hooks/useTheme";

/**
 * 토스트를 앱의 테마 선택에 맞춘다.
 *
 * sonner는 자기 DOM에 색을 직접 칠하므로 globals.css의 data-theme 토큰을 따라오지 않는다.
 * theme="system" 하나로 두면 OS만 보기 때문에, 사용자가 버튼으로 라이트를 골라도
 * OS가 다크면 토스트만 검게 뜬다. 선택값을 그대로 넘겨 그 어긋남을 막는다.
 * "system"은 sonner도 같은 의미로 해석하므로 변환 없이 전달한다.
 */
export function ThemeToaster() {
  const { preference } = useTheme();

  return <Toaster theme={preference} position="top-center" richColors closeButton />;
}
