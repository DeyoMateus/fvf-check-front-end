import { type ReactNode } from "react";
import { cn } from "../../utils/cn";

interface StatProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "gold" | "danger" | "info";
  className?: string;
}

const toneStyles = {
  default: "text-steel-100",
  gold: "text-gold-300",
  danger: "text-red-300",
  info: "text-sky-300",
};

const iconWrap = {
  default: "bg-steel-700/50 text-steel-200",
  gold: "bg-gold-500/15 text-gold-300",
  danger: "bg-red-500/15 text-red-300",
  info: "bg-sky-500/15 text-sky-300",
};

export function Stat({ label, value, hint, icon, tone = "default", className }: StatProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-steel-700/60 bg-gradient-to-b from-abyss-800/70 to-abyss-900/70 p-4",
        "before:absolute before:left-0 before:top-0 before:h-px before:w-12 before:bg-gradient-to-r before:from-gold-500 before:to-transparent",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-steel-300">
            {label}
          </p>
          <p className={cn("mt-2 text-2xl font-bold tabular-nums", toneStyles[tone])}>
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-steel-400">{hint}</p>}
        </div>
        {icon && (
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              iconWrap[tone],
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
