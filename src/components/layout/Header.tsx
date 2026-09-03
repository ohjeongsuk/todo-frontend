import Link from "next/link";

import { ThemeToggle } from "@/components/layout/ThemeToggle";

/**
 * 공통 헤더 껍데기.
 *
 * 닉네임·로그아웃 자리는 비워 둔다. useAuth가 없는 시점이므로 Phase 7에서 연결한다.
 * 더미 닉네임을 하드코딩하지 않는다 — 연결을 잊어도 화면상 티가 나지 않기 때문이다.
 *
 * 이메일은 어떤 시점에도 헤더에 노출하지 않는다. /auth/me 응답에는 들어오지만
 * 화면에는 닉네임만 표시한다 (PRD AUTH-08).
 */
export function Header({ actions }: { actions?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link
          href="/"
          className="rounded-md text-base font-semibold tracking-tight"
          // 터치 타겟 최소 44x44px (PRD NF-22)
          style={{ minHeight: 44, display: "inline-flex", alignItems: "center" }}
        >
          Todo List
        </Link>

        <div className="flex items-center gap-2">
          {/* 테마 전환은 로그인 여부와 무관하므로 슬롯이 아니라 헤더가 직접 들고 있는다 */}
          <ThemeToggle />
          {actions}
        </div>
      </div>
    </header>
  );
}
