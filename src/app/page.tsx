"use client";

import { Inbox } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Pagination } from "@/components/common/Pagination";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/apiClient";
import { formatDateTime, formatRelative, parseServerDateTime } from "@/lib/datetime";
import { toDisplayMessage } from "@/lib/errorMessages";
import { sanitizeHtml } from "@/lib/sanitize";
import { utf8ByteLength, validatePassword } from "@/lib/validation";

/**
 * Phase 6 스캐폴딩 확인 페이지.
 *
 * 화면 구현은 Phase 7·8이다. 이 페이지는 ROADMAP Phase 6 DoD가 요구하는
 * "Pagination 단독 동작 확인", "ErrorState의 onRetry 호출 확인",
 * "apiClient 에러가 errorMessages를 거쳐 문구가 되는지 확인"을 눈으로 볼 수 있게 둔 것이다.
 */
export default function ScaffoldCheckPage() {
  const [page, setPage] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [apiResult, setApiResult] = useState<string>("아직 호출하지 않음");

  // 서버가 오프셋 없이 보내는 형태 그대로다.
  const serverDateTime = "2026-09-01T12:00:00.123456";

  async function callApi() {
    setApiResult("호출 중...");
    try {
      await apiClient.get("/api/todos");
      setApiResult("성공 — 200 응답을 받았고 data 언래핑까지 통과");
    } catch (error) {
      setApiResult(`에러 문구: ${toDisplayMessage(error)}`);
    }
  }

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl space-y-10 px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Phase 6 스캐폴딩 확인</h1>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">디자인 토큰</h2>
          <p className="text-sm text-muted-foreground">
            OS 다크 설정을 바꾸면 클래스 조작 없이 색이 전환된다.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground">
              브랜드 primary
            </span>
            <span className="rounded-md bg-accent px-3 py-1 text-sm text-accent-foreground">
              accent (호버 표면)
            </span>
            <span className="rounded-md border border-priority-low px-3 py-1 text-sm text-priority-low">
              낮음
            </span>
            <span className="rounded-md border border-priority-medium px-3 py-1 text-sm text-priority-medium">
              보통
            </span>
            <span className="rounded-md border border-priority-high px-3 py-1 text-sm text-priority-high">
              높음
            </span>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">날짜 파싱</h2>
          <p className="text-sm text-muted-foreground">
            서버 원본 <code className="font-mono">{serverDateTime}</code> (오프셋 없음)
          </p>
          <ul className="space-y-1 text-sm">
            <li>UTC로 해석: {parseServerDateTime(serverDateTime).toISOString()}</li>
            <li>로컬 표시: {formatDateTime(serverDateTime)}</li>
            <li>상대 표시: {formatRelative(serverDateTime)}</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">검증 · 정화</h2>
          <ul className="space-y-1 text-sm">
            <li>
              한글 25자 비밀번호({utf8ByteLength("가".repeat(25))}바이트):{" "}
              {validatePassword("가".repeat(25)).message ?? "통과"}
            </li>
            <li>영문 72자: {validatePassword("a".repeat(72)).message ?? "통과"}</li>
            <li className="break-all">
              정화 결과:{" "}
              <code className="font-mono text-xs">
                {sanitizeHtml('<p onclick="x()">안전</p><script>alert(1)</script>')}
              </code>
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Pagination</h2>
          <p className="text-sm text-muted-foreground">
            totalPages = 1 → 아무것도 렌더하지 않는다 (아래에 비어 있어야 정상)
          </p>
          <div className="min-h-12 rounded-md border border-dashed border-border p-2">
            <Pagination page={0} totalPages={1} onChange={() => {}} />
          </div>
          <p className="text-sm text-muted-foreground">totalPages = 5 → 현재 {page + 1}페이지</p>
          <Pagination page={page} totalPages={5} onChange={setPage} />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">ErrorState</h2>
          <p className="text-sm text-muted-foreground">
            재시도 클릭 횟수: <strong>{retryCount}</strong>
          </p>
          <ErrorState
            message="네트워크 연결을 확인해 주세요."
            onRetry={() => setRetryCount((n) => n + 1)}
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">EmptyState · Skeleton</h2>
          <EmptyState
            icon={<Inbox />}
            title="아직 할 일이 없어요"
            description="첫 번째 할 일을 추가해 보세요."
            action={<Button className="min-h-11">할 일 추가</Button>}
          />
          <div className="space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">apiClient · errorMessages</h2>
          <Button variant="outline" className="min-h-11" onClick={callApi}>
            GET /api/todos 호출
          </Button>
          <p className="text-sm" data-testid="api-result">
            {apiResult}
          </p>
        </section>
      </main>
    </>
  );
}
