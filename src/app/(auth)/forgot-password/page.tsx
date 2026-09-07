"use client";

import Link from "next/link";
import { useState } from "react";

import { ErrorState } from "@/components/common/ErrorState";
import { Field } from "@/components/common/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isApiClientError } from "@/lib/apiClient";
import { toDisplayMessage, toFieldErrors } from "@/lib/errorMessages";
import { validateEmail } from "@/lib/validation";
import { usePasswordReset } from "@/hooks/usePasswordReset";

export default function ForgotPasswordPage() {
  const { forgot, isSendingLink } = usePasswordReset();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  // 잡은 에러를 그대로 보관한다 (toDisplayMessage가 instanceof로 판별한다).
  const [networkError, setNetworkError] = useState<unknown>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setNetworkError(null);

    const emailResult = validateEmail(email);
    if (!emailResult.ok) {
      setFieldErrors({ email: emailResult.message ?? "" });
      return;
    }

    try {
      await forgot({ email });
      // 서버는 계정이 있든 없든, 소셜 전용이든 똑같이 204를 준다.
      // 화면 문구도 세 경우가 완전히 같아야 한다 (PRD NF-31, F-45).
      setSent(true);
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
      // 요청이 너무 잦으면 TOO_MANY_REQUESTS가 온다 (PRD NF-30).
      setFormError(toDisplayMessage(error));
    }
  }

  if (networkError) {
    return (
      <ErrorState message={toDisplayMessage(networkError)} onRetry={() => setNetworkError(null)} />
    );
  }

  if (sent) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">메일을 보냈습니다</h1>
          <p className="text-sm text-muted-foreground">
            가입된 계정이라면 재설정 링크가 담긴 메일이 도착합니다. 링크는 30분 뒤 만료됩니다.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          메일이 오지 않으면 스팸함을 확인하거나, 잠시 후 다시 요청해 주세요.
        </p>
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full"
            onClick={() => setSent(false)}
          >
            다른 이메일로 다시 요청
          </Button>
          <Link
            href="/login"
            className="flex min-h-11 w-full items-center justify-center rounded-md text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            로그인으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">비밀번호 재설정</h1>
        <p className="text-sm text-muted-foreground">
          가입할 때 쓴 이메일을 입력하면 재설정 링크를 보내 드립니다.
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

        <Button type="submit" className="min-h-11 w-full" disabled={isSendingLink}>
          {isSendingLink ? "보내는 중..." : "재설정 링크 받기"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        비밀번호가 기억나셨나요?{" "}
        <Link
          href="/login"
          className="rounded font-medium text-primary underline-offset-4 hover:underline"
        >
          로그인
        </Link>
      </p>
    </div>
  );
}
