"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * 저장하지 않은 변경이 있을 때 이탈을 막는다.
 *
 * App Router에는 라우터 레벨 차단 API가 없다(Pages Router의 router.events가 사라졌다).
 * 그래서 세 경로를 각각 다뤄야 한다.
 *
 *   1) beforeunload — 새로고침·탭 닫기·주소창 직접 이동
 *   2) confirmNavigation — 페이지 안의 취소 버튼·링크. 호출부가 감싼다
 *   3) popstate — 브라우저 뒤로가기
 *
 * (1)은 브라우저 기본 문구만 나오고 커스텀 문구를 넣을 수 없다. 명세상 막혀 있다.
 */
export function useUnsavedChanges(isDirty: boolean) {
  // 리스너를 재등록하지 않고 최신 값을 읽기 위해 ref에 담는다.
  // 렌더 중에 ref를 쓰면 동시성 렌더링 가정이 깨지므로 effect에서 동기화한다.
  const dirtyRef = useRef(isDirty);
  useEffect(() => {
    dirtyRef.current = isDirty;
  }, [isDirty]);

  /** popstate 가드용으로 쌓아둔 더미 항목이 있는지. 균형을 맞추는 데 쓴다. */
  const guardPushedRef = useRef(false);

  // (1) 새로고침·탭 닫기
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (!dirtyRef.current) return;
      e.preventDefault();
      // 일부 브라우저가 아직 returnValue를 본다. 문구는 무시되고 기본 문구가 뜬다.
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // (3) 뒤로가기
  useEffect(() => {
    if (!isDirty) {
      // 깨끗해지면 쌓아둔 더미를 굳이 걷어내지 않는다. 걷어내면 그 자체가 한 번의
      // 뒤로가기를 소비해 사용자가 의도치 않게 이동한다. 리스너만 떼면 충분하다.
      guardPushedRef.current = false;
      return;
    }

    // 뒤로가기를 한 번 흡수할 더미 항목을 쌓는다.
    if (!guardPushedRef.current) {
      window.history.pushState(null, "", window.location.href);
      guardPushedRef.current = true;
    }

    function handlePopState() {
      if (!dirtyRef.current) return;
      const leave = window.confirm("저장하지 않은 변경이 있습니다. 이 페이지를 벗어나시겠습니까?");
      if (leave) {
        guardPushedRef.current = false;
        // 사용자가 나가기로 했으므로 실제로 한 칸 더 뒤로 보낸다.
        window.history.back();
        return;
      }
      // 남기로 했으면 소비된 더미를 다시 채워 균형을 맞춘다.
      // 이걸 하지 않으면 다음 뒤로가기에서 가드 없이 빠져나간다.
      window.history.pushState(null, "", window.location.href);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isDirty]);

  /**
   * (2) 페이지 안에서 스스로 이동할 때 호출한다.
   * 이동해도 되면 true를 반환한다. 호출부가 이 값으로 라우팅 여부를 정한다.
   */
  const confirmNavigation = useCallback(() => {
    if (!dirtyRef.current) return true;
    return window.confirm("저장하지 않은 변경이 있습니다. 이 페이지를 벗어나시겠습니까?");
  }, []);

  return { confirmNavigation };
}
