"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { ErrorState } from "@/components/common/ErrorState";
import { Field } from "@/components/common/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { isApiClientError } from "@/lib/apiClient";
import { toDisplayMessage, toFieldErrors } from "@/lib/errorMessages";
import { toOAuthErrorMessage } from "@/lib/oauthMessages";
import { validateEmail } from "@/lib/validation";
import { useAuth } from "@/hooks/useAuth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

function LoginForm() {
  const { login, isLoggingIn } = useAuth();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  // 잡은 에러를 그대로 보관한다. toDisplayMessage가 instanceof로 판별하므로
  // 문구만 뽑아 두거나 가짜 객체를 만들면 fallback 문구로 떨어진다.
  const [networkError, setNetworkError] = useState<unknown>(null);

  const oauthError = toOAuthErrorMessage(searchParams.get("error"));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setNetworkError(null);

    // 로그인에서는 이메일 형식만 미리 본다. 비밀번호 형식은 검사하지 않는다 —
    // 기존 계정의 비밀번호가 지금 규칙과 달라도 로그인 자체를 막으면 안 된다.
    const emailResult = validateEmail(email);
    if (!emailResult.ok) {
      setFieldErrors({ email: emailResult.message ?? "" });
      return;
    }

    try {
      await login({ email, password });
    } catch (error) {
      // 문구는 전부 errorMessages를 거친다. 화면에서 직접 쓰지 않는다.
      if (isApiClientError(error) && error.normalized.kind === "network") {
        setNetworkError(error);
        return;
      }
      const fields = toFieldErrors(error);
      if (Object.keys(fields).length > 0) {
        setFieldErrors(fields);
        return;
      }
      // UNAUTHORIZED는 미가입 이메일과 비밀번호 오류를 구분하지 않는다.
      // 서버가 같은 코드로 응답하므로 화면 문구도 자동으로 같아진다 (PRD NF-31).
      setFormError(toDisplayMessage(error));
    }
  }

  if (networkError) {
    return (
      <ErrorState message={toDisplayMessage(networkError)} onRetry={() => setNetworkError(null)} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">로그인</h1>
        <p className="text-sm text-muted-foreground">Todo List에 오신 것을 환영합니다.</p>
      </div>

      {oauthError ? (
        <p
          role="alert"
          className="rounded-md border border-destructive p-3 text-sm text-destructive"
        >
          {oauthError}
        </p>
      ) : null}

      {formError ? (
        <p
          role="alert"
          className="rounded-md border border-destructive p-3 text-sm text-destructive"
        >
          {formError}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field id="email" label="이메일" error={fieldErrors.email} required>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
          />
        </Field>

        <Field id="password" label="비밀번호" error={fieldErrors.password} required>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? "password-error" : undefined}
          />
        </Field>

        <Button type="submit" className="min-h-11 w-full" disabled={isLoggingIn}>
          {isLoggingIn ? "로그인 중..." : "로그인"}
        </Button>
      </form>

      {/* 구글 로그인은 fetch가 아니라 브라우저 이동이다 (PRD 7.2).
          백엔드가 구글로 리다이렉트하고 콜백까지 처리한 뒤 프론트로 되돌린다. */}
      <a
        href={`${API_BASE_URL}/oauth2/authorization/google`}
        className="flex min-h-11 w-full items-center justify-center rounded-md border border-input text-sm font-medium hover:bg-accent hover:text-accent-foreground"
      >
        Google로 계속하기
      </a>

      <p className="text-center text-sm text-muted-foreground">
        아직 계정이 없으신가요?{" "}
        <Link
          href="/signup"
          className="rounded font-medium text-primary underline-offset-4 hover:underline"
        >
          회원가입
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  // useSearchParams를 쓰므로 Suspense 경계가 필요하다. 없으면 빌드가 실패한다.
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <LoginForm />
    </Suspense>
  );
}
