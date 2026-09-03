"use client";

import { ChevronDown, Monitor, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/useTheme";

import type { ThemePreference } from "@/hooks/useTheme";
import type { LucideIcon } from "lucide-react";

/**
 * 각 선택지의 표시 정보.
 *
 * 배열이 아니라 Record인 이유는 `noUncheckedIndexedAccess` 때문이다. 배열 인덱스는
 * 항상 undefined일 수 있지만, 키가 ThemePreference로 유한한 Record는 그렇지 않다.
 */
const THEME_OPTIONS: Record<ThemePreference, { label: string; icon: LucideIcon }> = {
  system: { label: "시스템 설정", icon: Monitor },
  light: { label: "라이트", icon: Sun },
  dark: { label: "다크", icon: Moon },
};

/**
 * 메뉴에 보이는 순서.
 *
 * 순환 버튼이 아니므로 "다음 값"을 계산할 필요가 없다. 세 항목을 그대로 보여주고
 * 사용자가 원하는 것을 직접 고른다.
 */
const THEME_ORDER: ThemePreference[] = ["system", "light", "dark"];

export function ThemeToggle() {
  const { preference, setTheme } = useTheme();
  const current = THEME_OPTIONS[preference];
  const CurrentIcon = current.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          // 터치 타겟 최소 44x44px (PRD NF-22)
          className="min-h-11 min-w-11"
          /*
           * 아이콘만으로는 현재 상태를 읽을 수 없다(PRD NF-24: 색·모양만으로 구분 금지).
           * 열림 상태와 popup 여부는 DropdownMenuTrigger가 aria로 알아서 붙인다.
           */
          aria-label={`테마: ${current.label}`}
          title={`테마: ${current.label}`}
        >
          <CurrentIcon className="size-4" />
          {/* 눌러야 뭔가 열린다는 신호. 없으면 순환 버튼과 구분되지 않는다 */}
          <ChevronDown className="size-3 opacity-60" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>

      {/* 헤더 오른쪽 끝에 있으므로 메뉴가 화면 밖으로 나가지 않게 오른쪽으로 정렬한다 */}
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuRadioGroup
          value={preference}
          onValueChange={(value) => setTheme(value as ThemePreference)}
        >
          {THEME_ORDER.map((value) => {
            // 소문자로 시작하는 이름을 JSX에 그대로 쓰면 HTML 태그로 해석된다.
            const { label, icon: Icon } = THEME_OPTIONS[value];
            return (
              <DropdownMenuRadioItem key={value} value={value} className="min-h-11">
                <Icon className="size-4" />
                {label}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
