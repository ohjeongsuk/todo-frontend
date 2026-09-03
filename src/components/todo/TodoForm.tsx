"use client";

import { useCallback, useEffect, useState } from "react";

import { Field } from "@/components/common/Field";
import { TodoEditor } from "@/components/todo/TodoEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toDisplayMessage, toFieldErrors } from "@/lib/errorMessages";
import { validateContent, validateTitle } from "@/lib/validation";

import type { Priority, Todo, TodoCreateRequest } from "@/types/todo";

interface TodoFormProps {
  /** null이면 생성 모드. mode 플래그를 두지 않는 이유는 두 화면의 차이가 폼 안으로 새어 들지 않게 하기 위해서다. */
  initial: Todo | null;
  onSubmit: (body: TodoCreateRequest) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  /** 훅이 던진 에러를 그대로 받는다. 문구는 폼이 만들지 않고 errorMessages가 만든다. */
  submitError: unknown;
  onDirtyChange: (dirty: boolean) => void;
  submitLabel: string;
}

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "LOW", label: "낮음" },
  { value: "MEDIUM", label: "보통" },
  { value: "HIGH", label: "높음" },
];

/** Tiptap은 빈 문서에서도 '<p></p>'를 반환한다. DB에 빈 껍데기를 남기지 않는다. */
function normalizeContent(html: string): string | null {
  const stripped = html.replace(/<p>\s*<\/p>/g, "").trim();
  return stripped.length === 0 ? null : html;
}

export function TodoForm({
  initial,
  onSubmit,
  onCancel,
  isSubmitting,
  submitError,
  onDirtyChange,
  submitLabel,
}: TodoFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? "MEDIUM");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [contentHtml, setContentHtml] = useState("");
  /**
   * dirty 판정의 기준값. 서버 원본이 아니라 Tiptap이 정규화한 직후의 HTML이다.
   * 서버 원본과 비교하면 정규화·TrailingNode 때문에 아무것도 안 고쳐도 dirty가 된다.
   */
  const [baselineHtml, setBaselineHtml] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const titleResult = validateTitle(title);
  const contentResult = validateContent(contentHtml);

  const isDirty =
    baselineHtml !== null &&
    (title !== (initial?.title ?? "") ||
      priority !== (initial?.priority ?? "MEDIUM") ||
      dueDate !== (initial?.dueDate ?? "") ||
      contentHtml !== baselineHtml);

  // onDirtyChange는 부모(NewTodoPage/[id]/page.tsx)의 state를 갱신하는 콜백이다.
  // 렌더 중 조정 패턴(자기 자신의 state를 렌더 중에 맞추는 것)은 여기 쓸 수 없다 —
  // 다른 컴포넌트의 state를 렌더 중에 갱신하면 "Cannot update a component while
  // rendering a different component" 경고가 뜬다. 반드시 effect로 커밋 이후에 알린다.
  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const handleEditorReady = useCallback((normalized: string) => {
    setContentHtml(normalized);
    setBaselineHtml(normalized);
  }, []);

  const serverFieldErrors = toFieldErrors(submitError);
  const isFieldError = Object.keys(serverFieldErrors).length > 0;
  const formError = submitError && !isFieldError ? toDisplayMessage(submitError) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!titleResult.ok || !contentResult.ok) return;

    await onSubmit({
      title: title.trim(),
      content: normalizeContent(contentHtml),
      priority,
      dueDate: dueDate === "" ? null : dueDate,
    });

    // 저장에 성공하면 현재 값이 새 기준이 된다. 저장 직후 이탈 확인이 뜨지 않아야 한다.
    setBaselineHtml(contentHtml);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {formError ? (
        <p
          role="alert"
          className="rounded-md border border-destructive p-3 text-sm text-destructive"
        >
          {formError}
        </p>
      ) : null}

      <Field
        id="title"
        label="제목"
        required
        error={
          serverFieldErrors.title ?? (touched && !titleResult.ok ? titleResult.message : undefined)
        }
      >
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="min-h-11"
          aria-invalid={Boolean(serverFieldErrors.title) || (touched && !titleResult.ok)}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="priority" label="우선순위">
          <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
            <SelectTrigger id="priority" className="min-h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field id="dueDate" label="마감일" error={serverFieldErrors.dueDate}>
          {/* type=date의 값이 'YYYY-MM-DD'라 서버 LocalDate와 형식이 같다.
              Date 객체로 변환하면 타임존 때문에 하루가 밀린다. */}
          <Input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="min-h-11"
          />
        </Field>
      </div>

      <Field id="content" label="본문" error={serverFieldErrors.content ?? contentResult.message}>
        <TodoEditor
          initialHtml={initial?.content ?? ""}
          onChange={setContentHtml}
          onReady={handleEditorReady}
        />
      </Field>

      <div className="flex gap-2">
        <Button type="submit" className="min-h-11" disabled={isSubmitting}>
          {isSubmitting ? "저장 중..." : submitLabel}
        </Button>
        <Button type="button" variant="outline" className="min-h-11" onClick={onCancel}>
          취소
        </Button>
      </div>
    </form>
  );
}
