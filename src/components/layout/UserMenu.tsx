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
    // 닉네임은 50자까지 허용되므로(NICKNAME_MAX_LENGTH) 좁은 화면에서 줄어들 수 있어야 한다.
    // min-w-0이 없으면 flex 아이템이 콘텐츠 크기 아래로 줄지 않아 truncate가 걸리지 않는다.
    <div className="flex min-w-0 items-center gap-2">
      <span className="truncate text-sm font-medium" title={nickname}>
        {nickname}
      </span>
      <Button
        variant="ghost"
        size="sm"
        // shrink-0: 줄어들 쪽은 닉네임이다. 버튼이 찌그러지면 터치 타겟이 무너진다
        className="min-h-11 min-w-11 shrink-0"
        onClick={onLogout}
        disabled={isLoggingOut}
      >
        <LogOut className="size-4" />
        로그아웃
      </Button>
    </div>
  );
}
