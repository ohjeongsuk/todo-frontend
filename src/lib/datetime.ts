import { format, formatDistanceToNow, parseISO } from "date-fns";
import { ko } from "date-fns/locale";

import type { IsoDate, IsoDateTime } from "@/types/api";

/**
 * 서버 시각 문자열을 Date로 바꾼다.
 *
 * 백엔드가 LocalDateTime을 오프셋 없이 직렬화하므로("2026-09-01T12:00:00.123456")
 * new Date()에 그대로 넣으면 브라우저가 이를 *로컬 시각*으로 해석한다.
 * 값은 실제로 UTC이므로 KST에서는 9시간 어긋난다.
 *
 * 이 함수가 유일한 파싱 진입점이다. 컴포넌트에서 new Date(raw)를 직접 쓰지 않는다.
 */
export function parseServerDateTime(raw: IsoDateTime): Date {
  // 이미 오프셋이 붙어 있으면(Z 또는 +09:00) 덧붙이지 않는다.
  const hasZone = /([Zz]|[+-]\d{2}:?\d{2})$/.test(raw);
  return new Date(hasZone ? raw : `${raw}Z`);
}

/**
 * 서버 날짜 문자열("2026-09-01")을 Date로 바꾼다.
 *
 * LocalDate는 시각이 아니라 날짜다. Z를 붙이면 UTC 자정으로 해석돼
 * KST에서 하루 밀릴 수 있으므로, 로컬 자정으로 해석되는 parseISO를 쓴다.
 */
export function parseServerDate(raw: IsoDate): Date {
  return parseISO(raw);
}

/** "2026년 9월 1일 21:00" 형태 */
export function formatDateTime(raw: IsoDateTime): string {
  return format(parseServerDateTime(raw), "yyyy년 M월 d일 HH:mm", { locale: ko });
}

/** "2026년 9월 1일" 형태. dueDate 표시용. */
export function formatDate(raw: IsoDate): string {
  return format(parseServerDate(raw), "yyyy년 M월 d일", { locale: ko });
}

/** "3시간 전" 형태 */
export function formatRelative(raw: IsoDateTime): string {
  return formatDistanceToNow(parseServerDateTime(raw), {
    addSuffix: true,
    locale: ko,
  });
}

/**
 * 오늘 날짜를 서버 LocalDate와 같은 "2026-09-03" 형식으로 반환한다.
 *
 * toISOString()을 쓰지 않는다 — 그쪽은 UTC로 변환하므로 KST 자정 직후에 어제가 나온다.
 * 여기서 필요한 것은 사용자가 보고 있는 로컬 날짜다. 마감일 입력의 하한에 쓴다.
 */
export function todayIsoDate(): IsoDate {
  return format(new Date(), "yyyy-MM-dd");
}

/** 마감일이 오늘보다 이전인지. 완료되지 않은 할 일의 지연 표시에 쓴다. */
export function isOverdue(dueDate: IsoDate): boolean {
  const due = parseServerDate(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due.getTime() < today.getTime();
}
