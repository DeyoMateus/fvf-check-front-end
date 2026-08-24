import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

type Variant =
  | "default"
  | "gold"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "muted"
  | "outline";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

const styles: Record<Variant, string> = {
  default: "bg-steel-700/60 text-steel-100 border border-steel-600/40",
  gold: "bg-gold-500/15 text-gold-300 border border-gold-500/30",
  success: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
  danger: "bg-red-500/15 text-red-300 border border-red-500/30",
  info: "bg-sky-500/15 text-sky-300 border border-sky-500/30",
  muted: "bg-transparent text-steel-300 border border-steel-700",
  outline: "bg-transparent text-gold-300 border border-gold-500/40",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
