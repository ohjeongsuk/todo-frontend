import { cn } from "@/lib/utils";

interface FieldProps {
  /** 자식 input의 id와 반드시 같아야 한다. label 연결의 근거다. */
  id: string;
  label: string;
  /** 검증 실패 문구. validation.ts나 errorMessages.ts를 거친 값만 넣는다. */
  error?: string;
  /** 항상 보이는 도움말. 바이트 제한 안내처럼 미리 알려야 하는 내용에 쓴다. */
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

/**
 * label과 입력을 연결하고 에러·도움말을 그 아래 인라인으로 렌더하는 래퍼.
 *
 * 화면마다 htmlFor를 직접 쓰면 하나쯤 빠뜨려도 타입 검사가 통과한다.
 * 래퍼를 거치게 해서 label 연결(UX-06)을 구조적으로 강제한다.
 * Phase 6에서 ErrorState의 onRetry를 필수 prop으로 둔 것과 같은 이유다.
 *
 * 자식 입력에는 호출부가 id={id}, aria-invalid, aria-describedby를 붙인다.
 * 그 값들을 여기서 계산해 내려줄 수 없어(children이 이미 만들어진 엘리먼트다)
 * 아래 describedById/errorId를 export 대신 규칙으로 못박는다: `${id}-error`, `${id}-hint`.
 */
export function Field({ id, label, error, hint, required, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required ? (
          <span className="ml-0.5 text-destructive" aria-hidden>
            *
          </span>
        ) : null}
      </label>

      {children}

      {hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}

      {error ? (
        // 색만으로 알리지 않는다. role=alert로 스크린리더에도 전달한다 (PRD NF-24, NF-20)
        <p id={`${id}-error`} role="alert" className={cn("text-xs text-destructive")}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
