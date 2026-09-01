"use client";

import Link from "next/link";
import { useState } from "react";

import { ErrorState } from "@/components/common/ErrorState";
import { Field } from "@/components/common/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isApiClientError } from "@/lib/apiClient";
import { toDisplayMessage, toFieldErrors } from "@/lib/errorMessages";
import {
  PASSWORD_MAX_BYTES,
  utf8ByteLength,
  validateEmail,
  validateNickname,
  validatePassword,
} from "@/lib/validation";
import { useAuth } from "@/hooks/useAuth";

export default function SignupPage() {
  const { signup, isSigningUp } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState<unknown>(null);

  // 검증 규칙과 문구는 전부 validation.ts에 있다. 여기서 정규식이나 길이 상수를 다시 쓰지 않는다.
  const emailResult = validateEmail(email);
  const passwordResult = validatePassword(password);
  const nicknameResult = validateNickname(nickname);

  const passwordBytes = utf8ByteLength(password);
  // 바이트 초과는 touched를 기다리지 않고 즉시 알린다.
  // 사용자가 한참 입력한 뒤 제출 단계에서야 알게 되면 다 지워야 한다.
  const isPasswordOverBytes = passwordBytes > PASSWORD_MAX_BYTES;

  const showError = (key: string, ok: boolean) => touched[key] === true && !ok;

  const canSubmit = emailResult.ok && passwordResult.ok && nicknameResult.ok && !isSigningUp;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setServerFieldErrors({});
    setNetworkError(null);
    setTouched({ email: true, password: true, nickname: true });

    if (!emailResult.ok || !passwordResult.ok || !nicknameResult.ok) return;

    try {
      await signup({ email, password, nickname });
    } catch (error) {
      if (isApiClientError(error) && error.normalized.kind === "network") {
        setNetworkError(error);
        return;
      }
      // 서버가 INVALID_INPUT의 details에 {필드명: 메시지}를 담는다.
      // 백엔드 SignupRequest의 필드명이 email/password/nickname이라 그대로 맞물린다.
      const fields = toFieldErrors(error);
      if (Object.keys(fields).length > 0) {
        setServerFieldErrors(fields);
        return;
      }
      // EMAIL_DUPLICATED는 이메일 입력 아래 인라인으로 붙인다 (AUTH-03).
      if (isApiClientError(error) && error.normalized.kind === "api") {
        if (error.normalized.code === "EMAIL_DUPLICATED") {
          setServerFieldErrors({ email: toDisplayMessage(error) });
          return;
        }
      }
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
        <h1 className="text-2xl font-semibold tracking-tight">회원가입</h1>
        <p className="text-sm text-muted-foreground">이메일로 계정을 만듭니다.</p>
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
          id="email"
          label="이메일"
          required
          error={
            serverFieldErrors.email ??
            (showError("email", emailResult.ok) ? emailResult.message : undefined)
          }
        >
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            autoComplete="email"
            aria-invalid={Boolean(serverFieldErrors.email) || showError("email", emailResult.ok)}
          />
        </Field>

        <Field
          id="password"
          label="비밀번호"
          required
          hint={`6자 이상. 한글 1자는 3바이트로 계산되며 ${PASSWORD_MAX_BYTES}바이트까지 쓸 수 있습니다. (현재 ${passwordBytes}바이트)`}
          error={
            serverFieldErrors.password ??
            (isPasswordOverBytes || showError("password", passwordResult.ok)
              ? passwordResult.message
              : undefined)
          }
        >
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            autoComplete="new-password"
            aria-invalid={Boolean(serverFieldErrors.password) || isPasswordOverBytes}
          />
        </Field>

        <Field
          id="nickname"
          label="닉네임"
          required
          error={
            serverFieldErrors.nickname ??
            (showError("nickname", nicknameResult.ok) ? nicknameResult.message : undefined)
          }
        >
          <Input
            id="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, nickname: true }))}
            autoComplete="nickname"
            aria-invalid={
              Boolean(serverFieldErrors.nickname) || showError("nickname", nicknameResult.ok)
            }
          />
        </Field>

        <Button type="submit" className="min-h-11 w-full" disabled={!canSubmit}>
          {isSigningUp ? "가입 중..." : "가입하기"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        이미 계정이 있으신가요?{" "}
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
