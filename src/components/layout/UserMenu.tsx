"use client";

import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

interface UserMenuProps {
  /**
   * 닉네임만 받는다. email을 prop으로 두지 않는 것이 의도다 —
   * /auth/me 응답에는 email이 있지만 화면에는 노출하지 않는다 (AUTH-08).
   * 타입 수준에서 막아 실수로 넘기는 것을 방지한다.
   */
  nickname: string;
  onLogout: () => void;
  isLoggingOut?: boolean;
}

export function UserMenu({ nickname, onLogout, isLoggingOut }: UserMenuProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">{nickname}</span>
      <Button
        variant="ghost"
        size="sm"
        className="min-h-11 min-w-11"
        onClick={onLogout}
        disabled={isLoggingOut}
      >
        <LogOut className="size-4" />
        로그아웃
      </Button>
    </div>
  );
}
