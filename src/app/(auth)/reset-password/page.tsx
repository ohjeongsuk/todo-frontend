"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";

import { ErrorState } from "@/components/common/ErrorState";
import { Field } from "@/components/common/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { isApiClientError } from "@/lib/apiClient";
import { toDisplayMessage, toFieldErrors } from "@/lib/errorMessages";
import { validatePassword } from "@/lib/validation";
import { usePasswordReset, useVerifyResetToken } from "@/hooks/usePasswordReset";

/** 링크가 죽었을 때. 다시 요청할 수단을 반드시 함께 준다 (PRD 7.5). */
function InvalidLink({ message }: { message: string }) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">링크를 쓸 수 없습니다</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      <Link
        href="/forgot-password"
        className="flex min-h-11 w-full items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        재설정 링크 다시 요청
      </Link>
      <p className="text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="rounded font-medium text-primary underline-offset-4 hover:underline"
        >
          로그인으로 돌아가기
        </Link>
      </p>
    </div>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const verifyQuery = useVerifyResetToken(token);
  const { reset, isResetting } = usePasswordReset();

  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [networkError, setNetworkError] = useState<unknown>(null);

  const passwordResult = validatePassword(password);
  // 바이트 초과는 입력 즉시 보여준다. 길이 미달은 다 치기 전에 잔소리하지 않도록 touched 이후에만.
  const passwordError = touched && !passwordResult.ok ? passwordResult.message : undefined;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setNetworkError(null);
    setTouched(true);

    if (!passwordResult.ok || !token) return;

    try {
      await reset({ token, newPassword: password });
      // 자동 로그인시키지 않는다 (PRD F-44). 재설정으로 모든 세션이 폐기됐으므로
      // 새 비밀번호로 다시 로그인해야 한다.
      toast.success("비밀번호를 변경했습니다. 새 비밀번호로 로그인해 주세요.");
      router.replace("/login");
    } catch (error) {
      if (isApiClientError(error) && error.normalized.kind === "network") {
        setNetworkError(error);
        return;
      }
      const fields = toFieldErrors(error);
      if (Object.keys(fields).length > 0) {
        setFieldErrors(fields);
        return;
      }
      // 제출 사이에 링크가 만료·소모됐을 수 있다 (RESET_TOKEN_INVALID).
      setFormError(toDisplayMessage(error));
    }
  }

  if (!token) {
    return <InvalidLink message="주소에 토큰이 없습니다. 메일의 링크를 그대로 열어 주세요." />;
  }
  if (verifyQuery.isPending) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (verifyQuery.isError) {
    if (isApiClientError(verifyQuery.error) && verifyQuery.error.normalized.kind === "network") {
      return (
        <ErrorState
          message={toDisplayMessage(verifyQuery.error)}
          onRetry={() => verifyQuery.refetch()}
        />
      );
    }
    return <InvalidLink message={toDisplayMessage(verifyQuery.error)} />;
  }
  if (networkError) {
    return (
      <ErrorState message={toDisplayMessage(networkError)} onRetry={() => setNetworkError(null)} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">새 비밀번호 설정</h1>
        <p className="text-sm text-muted-foreground">
          변경하면 다른 기기의 로그인도 모두 해제됩니다.
        </p>
      </div>

      {formError ? (
        <p
          role="alert"
          className="rounded-md border border-destructive p-3 text-sm text-destructive"
        >
          {formError}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field
          id="password"
          label="새 비밀번호"
          error={passwordError ?? fieldErrors.newPassword}
          required
        >
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched(true)}
            autoComplete="new-password"
            aria-invalid={Boolean(passwordError ?? fieldErrors.newPassword)}
            aria-describedby={
              (passwordError ?? fieldErrors.newPassword) ? "password-error" : undefined
            }
          />
        </Field>

        <Button type="submit" className="min-h-11 w-full" disabled={isResetting}>
          {isResetting ? "변경 중..." : "비밀번호 변경"}
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  // useSearchParams를 쓰므로 Suspense 경계가 필요하다. 없으면 빌드가 실패한다.
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
