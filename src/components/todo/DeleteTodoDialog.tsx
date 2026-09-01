"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DeleteTodoDialogProps {
  title: string;
  onConfirm: () => void;
  isDeleting?: boolean;
  children: React.ReactNode;
}

/**
 * 삭제 확인 (PRD F-22).
 *
 * Soft Delete라 데이터는 남지만 UI에 복구 경로가 없어 사용자에겐 사실상 비가역이다.
 * 그래서 확인을 거친다.
 */
export function DeleteTodoDialog({
  title,
  onConfirm,
  isDeleting,
  children,
}: DeleteTodoDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>할 일을 삭제할까요?</AlertDialogTitle>
          <AlertDialogDescription>
            &lsquo;{title}&rsquo;을(를) 삭제합니다. 목록에서 사라지며 되돌릴 수 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="min-h-11">취소</AlertDialogCancel>
          <AlertDialogAction
            className="min-h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            삭제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
