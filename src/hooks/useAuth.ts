"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { apiClient, clearAccessToken, getAccessToken, setAccessToken } from "@/lib/apiClient";
import { authKeys } from "@/lib/queryKeys";
import { isTokenValid } from "@/lib/token";

import type { LoginRequest, SignupRequest, TokenResponse, UserResponse } from "@/types/auth";

/** 인증 판정 상태. checking 동안에는 보호 화면을 렌더하지 않는다. */
export type AuthStatus = "checking" | "authenticated" | "unauthenticated";

/**
 * 인증 상태와 로그인·가입·로그아웃을 다루는 훅.
 *
 * apiClient와 역할이 다르다. apiClient는 "세션이 끊겼다"는 비정상 경로를 맡아
 * window.location.assign으로 전체 리로드를 건다(캐시를 확실히 버려야 하는 상황이다).
 * 이 훅의 logout은 "사용자가 의도한" 정상 경로를 맡아 router.replace를 쓴다.
 */
export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();

  // 토큰이 만료됐으면 요청 자체를 보내지 않는다.
  // 이것이 "만료 토큰으로 접근했을 때 보호 화면이 한 프레임도 노출되지 않음"의 근거다.
  // 토큰 존재 여부만 보면 만료 토큰이 통과해 401 왕복 동안 화면이 노출된다.
  const hasValidToken = isTokenValid(getAccessToken());

  const meQuery = useQuery({
    queryKey: authKeys.me(),
    queryFn: () => apiClient.get<UserResponse>("/api/auth/me"),
    enabled: hasValidToken,
    // 세션 중 닉네임은 바뀌지 않는다. 0이면 라우트 이동마다 재요청이 돌아
    // 보호 레이아웃이 매번 checking으로 떨어지고 스켈레톤이 깜빡인다.
    staleTime: Infinity,
    retry: false,
  });

  let status: AuthStatus;
  if (!hasValidToken) {
    status = "unauthenticated";
  } else if (meQuery.isSuccess) {
    status = "authenticated";
  } else if (meQuery.isError) {
    status = "unauthenticated";
  } else {
    status = "checking";
  }

  /** 토큰 저장 후 목록으로 보낸다. 가입·로그인이 공유하는 마무리 절차다. */
  const finishAuth = useCallback(
    async (result: TokenResponse) => {
      setAccessToken(result.accessToken);
      await queryClient.invalidateQueries({ queryKey: authKeys.me() });
      // push가 아니라 replace다. 로그인 후 뒤로가기로 로그인 화면에 돌아가면 안 된다.
      router.replace("/todos");
    },
    [queryClient, router],
  );

  const loginMutation = useMutation({
    mutationFn: (body: LoginRequest) => apiClient.post<TokenResponse>("/api/auth/login", body),
    onSuccess: finishAuth,
  });

  // 가입 즉시 로그인 상태가 된다 (PRD F-01).
  const signupMutation = useMutation({
    mutationFn: (body: SignupRequest) => apiClient.post<TokenResponse>("/api/auth/signup", body),
    onSuccess: finishAuth,
  });

  const logout = useCallback(async () => {
    try {
      // 서버에서 Refresh Token을 폐기하고 쿠키를 만료시킨다 (CLAUDE.md 5장, PRD F-08).
      // 클라이언트 토큰 삭제만으로 끝내지 않는다.
      await apiClient.post<void>("/api/auth/logout");
    } catch {
      // 서버 호출이 실패해도 클라이언트 정리는 반드시 수행한다.
      // 네트워크가 끊긴 상태에서 로그아웃이 막히면 사용자가 빠져나갈 방법이 없다.
    } finally {
      clearAccessToken();
      // 다음 사용자가 이전 사용자의 캐시를 보면 안 된다. query·mutation 캐시를 모두 비운다.
      queryClient.clear();
      router.replace("/login");
    }
  }, [queryClient, router]);

  return {
    status,
    /** UserResponse에는 email이 있지만 화면에 렌더할지는 호출부 책임이다 (AUTH-08). */
    user: meQuery.data ?? null,
    // mutateAsync를 노출한다. mutate는 rejection을 .catch(noop)로 삼켜
    // 호출부에서 try/catch가 동작하지 않는다.
    login: loginMutation.mutateAsync,
    signup: signupMutation.mutateAsync,
    logout,
    isLoggingIn: loginMutation.isPending,
    isSigningUp: signupMutation.isPending,
  };
}
