interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  /** 비어 있을 때 유도할 다음 행동. 버튼 등을 넘긴다. */
  action?: React.ReactNode;
}

/** 목록이 비었을 때 쓰는 자리표시. 문구는 호출부에서 정한다. */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      {icon ? <div className="text-muted-foreground [&>svg]:size-10">{icon}</div> : null}
      <p className="text-base font-medium">{title}</p>
      {description ? <p className="max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
