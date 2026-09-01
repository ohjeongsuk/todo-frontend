/**
 * 입력값 제약의 단일 진입점.
 *
 * 폼 라이브러리를 쓰지 않기로 확정했으므로(CLAUDE.md 3장) 검증이 화면에 흩어지기 쉽다.
 * 제약과 문구를 여기 한곳에 둔다.
 *
 * 정본: ROADMAP.md 「Phase 6 확정 값 > 입력값 제약」 및 백엔드 DTO의 Bean Validation 어노테이션
 */

export interface ValidationResult {
  ok: boolean;
  message?: string;
}

const OK: ValidationResult = { ok: true };

/** BCrypt는 72바이트를 넘는 입력을 처리하지 못한다. 서버 ValidPassword와 같은 기준이다. */
export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_BYTES = 72;
export const NICKNAME_MIN_LENGTH = 1;
export const NICKNAME_MAX_LENGTH = 50;
export const TITLE_MAX_LENGTH = 200;
export const CONTENT_MAX_LENGTH = 50_000;

/**
 * UTF-8 바이트 길이.
 *
 * 비밀번호 상한은 문자 수가 아니라 바이트다. maxLength={64} 같은 문자 수 제한만 걸면
 * 한글 25자(=75바이트)가 통과해 서버 BCrypt 단계에서 터진다.
 */
export function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

// 서버 @Email과 완전히 같을 수는 없다. 클라이언트 검증은 편의일 뿐이고
// 신뢰 대상은 서버 검증이다 (PRD NF-04).
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: string): ValidationResult {
  if (value.trim().length === 0) return { ok: false, message: "이메일을 입력해 주세요." };
  if (!EMAIL_PATTERN.test(value)) {
    return { ok: false, message: "이메일 형식이 올바르지 않습니다." };
  }
  return OK;
}

export function validatePassword(value: string): ValidationResult {
  if (value.length < PASSWORD_MIN_LENGTH) {
    return { ok: false, message: `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.` };
  }
  const bytes = utf8ByteLength(value);
  if (bytes > PASSWORD_MAX_BYTES) {
    return {
      ok: false,
      message: `비밀번호가 너무 깁니다. 한글 1자는 3바이트로 계산되며, ${PASSWORD_MAX_BYTES}바이트까지 쓸 수 있습니다. (현재 ${bytes}바이트)`,
    };
  }
  return OK;
}

export function validateNickname(value: string): ValidationResult {
  const trimmed = value.trim();
  if (trimmed.length < NICKNAME_MIN_LENGTH) {
    return { ok: false, message: "닉네임을 입력해 주세요." };
  }
  if (trimmed.length > NICKNAME_MAX_LENGTH) {
    return { ok: false, message: `닉네임은 ${NICKNAME_MAX_LENGTH}자까지 쓸 수 있습니다.` };
  }
  return OK;
}

export function validateTitle(value: string): ValidationResult {
  const trimmed = value.trim();
  if (trimmed.length === 0) return { ok: false, message: "제목을 입력해 주세요." };
  if (trimmed.length > TITLE_MAX_LENGTH) {
    return { ok: false, message: `제목은 ${TITLE_MAX_LENGTH}자까지 쓸 수 있습니다.` };
  }
  return OK;
}

export function validateContent(value: string): ValidationResult {
  if (value.length > CONTENT_MAX_LENGTH) {
    return {
      ok: false,
      message: `본문은 ${CONTENT_MAX_LENGTH.toLocaleString("ko-KR")}자까지 쓸 수 있습니다.`,
    };
  }
  return OK;
}
