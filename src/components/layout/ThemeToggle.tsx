"use client";

import { Monitor, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";

import type { ThemePreference } from "@/hooks/useTheme";
import type { LucideIcon } from "lucide-react";

/** 버튼 하나로 세 값을 순환한다. 시스템 → 라이트 → 다크 → 시스템 */
const NEXT_PREFERENCE: Record<ThemePreference, ThemePreference> = {
  system: "light",
  light: "dark",
  dark: "system",
};

const PREFERENCE_LABEL: Record<ThemePreference, string> = {
  system: "시스템 설정",
  light: "라이트 모드",
  dark: "다크 모드",
};

const PREFERENCE_ICON: Record<ThemePreference, LucideIcon> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

export function ThemeToggle() {
  const { preference, setTheme } = useTheme();
  const next = NEXT_PREFERENCE[preference];
  const Icon = PREFERENCE_ICON[preference];

  return (
    <Button
      variant="ghost"
      size="sm"
      // 터치 타겟 최소 44x44px (PRD NF-22)
      className="min-h-11 min-w-11"
      onClick={() => setTheme(next)}
      /*
       * 아이콘만으로는 현재 상태를 읽을 수 없다(PRD NF-24: 색·모양만으로 구분 금지).
       * 지금 무엇이고 누르면 무엇이 되는지를 함께 알린다.
       */
      aria-label={`테마: ${PREFERENCE_LABEL[preference]}. 누르면 ${PREFERENCE_LABEL[next]}로 바뀝니다`}
      title={`테마: ${PREFERENCE_LABEL[preference]}`}
    >
      <Icon className="size-4" />
    </Button>
  );
}
