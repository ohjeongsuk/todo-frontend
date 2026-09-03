"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

/** 사용자가 고르는 값. "system"은 OS 설정을 그대로 따른다는 뜻이다. */
export type ThemePreference = "system" | "light" | "dark";

/**
 * localStorage 키.
 *
 * app/layout.tsx의 인라인 스크립트가 같은 키를 문자열로 박아 쓴다. 그 스크립트는
 * 번들 밖에서 실행되므로 이 상수를 import할 수 없다. 한쪽만 바꾸면 조용히 어긋난다.
 */
export const THEME_STORAGE_KEY = "todo_theme";

/**
 * localStorage를 쓸 수 없는 환경(프라이빗 모드·저장소 차단)의 대체 저장소.
 * 탭을 닫으면 사라지지만, 그 세션 안에서는 전환이 정상으로 보인다.
 */
let fallbackPreference: ThemePreference = "system";

function readPreference(): ThemePreference {
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    // "system"은 저장하지 않는다. 값이 없는 것이 곧 시스템 설정을 따른다는 뜻이다.
    return raw === "light" || raw === "dark" ? raw : "system";
  } catch {
    return fallbackPreference;
  }
}

function writePreference(next: ThemePreference): void {
  fallbackPreference = next;
  try {
    if (next === "system") {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    }
  } catch {
    // 저장에 실패해도 fallbackPreference가 이번 세션을 버틴다.
  }
}

/**
 * 해석된 결과만 data-theme에 넣는다.
 *
 * globals.css는 light/dark 두 상태만 안다. "system"을 그대로 흘려보내지 않고 여기서
 * OS 설정을 읽어 확정하기 때문에, CSS가 같은 다크 토큰을 미디어쿼리용과 속성용으로
 * 두 벌 유지하지 않아도 된다.
 */
function applyTheme(preference: ThemePreference): void {
  const resolved =
    preference === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : preference;
  document.documentElement.dataset.theme = resolved;
}

/** 같은 탭 안의 변경은 storage 이벤트를 발생시키지 않으므로 구독자를 직접 관리한다. */
const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  // 다른 탭에서 바꾼 선택도 따라간다.
  window.addEventListener("storage", onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

/** 서버에는 localStorage가 없다. 이 값이 서버 HTML과 hydration 첫 렌더를 일치시킨다. */
function getServerSnapshot(): ThemePreference {
  return "system";
}

/**
 * 테마 선택을 읽고 바꾼다.
 *
 * localStorage는 React 바깥의 저장소이므로 useState로 복제하지 않고
 * useSyncExternalStore로 직접 구독한다. getServerSnapshot이 분리돼 있어
 * hydration 불일치가 구조적으로 생기지 않는다.
 */
export function useTheme() {
  const preference = useSyncExternalStore(subscribe, readPreference, getServerSnapshot);

  useEffect(() => {
    // "시스템"일 때만 OS 변경을 따라간다. 명시적으로 고른 값은 OS가 바뀌어도 유지한다.
    if (preference !== "system") return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyTheme("system");
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, [preference]);

  const setTheme = useCallback((next: ThemePreference) => {
    writePreference(next);
    applyTheme(next);
    // 저장소가 바뀐 것을 구독자에게 알린다. 이것이 리렌더를 부른다.
    for (const listener of listeners) listener();
  }, []);

  return { preference, setTheme };
}
