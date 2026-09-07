"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/apiClient";

import type { PasswordForgotRequest, PasswordResetRequest } from "@/types/auth";

/**
 * 비밀번호 재설정 (PRD F-41 ~ F-45).
 *
 * `useAuth`와 분리한 이유: 이 흐름은 로그인 세션과 무관하다. 토큰을 발급받지도, 저장하지도 않는다.
 * 재설정이 끝나도 자동 로그인시키지 않고 로그인 화면으로 보낸다 (PRD F-44).
 *
 * 세 요청 모두 미인증 상태로 나간다. `apiClient`는 액세스 토큰이 없으면 `Authorization` 헤더를
 * 그냥 빼고 보내므로 별도 경로가 필요 없다.
 */
export function usePasswordReset() {
  const forgotMutation = useMutation({
    mutationFn: (body: PasswordForgotRequest) =>
      apiClient.post<void>("/api/auth/password/forgot", body),
  });

  const resetMutation = useMutation({
    mutationFn: (body: PasswordResetRequest) =>
      apiClient.post<void>("/api/auth/password/reset", body),
  });

  return {
    // mutate가 아니라 mutateAsync다. mutate는 rejection을 삼켜 화면의 try/catch가 동작하지 않는다.
    forgot: forgotMutation.mutateAsync,
    isSendingLink: forgotMutation.isPending,
    reset: resetMutation.mutateAsync,
    isResetting: resetMutation.isPending,
  };
}

/**
 * 링크 진입 시 토큰 유효성 선확인 (PRD F-42).
 *
 * 만료된 링크로 비밀번호 입력 폼을 채우게 두지 않으려고, 폼을 보여주기 전에 확인한다.
 * `retry: false`인 이유: 유효하지 않은 토큰은 재시도해도 유효해지지 않는다.
 */
export function useVerifyResetToken(token: string | null) {
  return useQuery({
    queryKey: ["password-reset", "verify", token],
    queryFn: () =>
      apiClient.get<void>(`/api/auth/password/verify?token=${encodeURIComponent(token ?? "")}`),
    enabled: Boolean(token),
    retry: false,
    // 토큰은 1회용이라 캐시를 재사용할 이유가 없다.
    staleTime: 0,
    gcTime: 0,
  });
}
