import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "../../utils/cn";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-steel-700/50 bg-abyss-950/30 p-12 text-center",
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gold-500/30 bg-gold-500/10 text-gold-300">
        {icon ?? <Inbox className="h-7 w-7" />}
      </div>
      <h3 className="mt-4 text-base font-bold text-steel-100">{title}</h3>
      {description && (
        <p className="mt-1 max-w-md text-sm text-steel-400">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
