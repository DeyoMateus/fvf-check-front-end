import { type ReactNode } from "react";
import { cn } from "../../utils/cn";

interface TabsProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: ReactNode; count?: number }[];
  className?: string;
}

export function Tabs<T extends string>({
  value,
  onChange,
  options,
  className,
}: TabsProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border border-steel-700/60 bg-abyss-900/60 p-1",
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all",
              active
                ? "bg-gold-500/15 text-gold-300 shadow-[inset_0_0_0_1px_rgba(227,185,33,0.3)]"
                : "text-steel-300 hover:bg-abyss-800/60 hover:text-steel-100",
            )}
          >
            {opt.icon}
            <span>{opt.label}</span>
            {typeof opt.count === "number" && (
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-bold",
                  active
                    ? "bg-gold-500/20 text-gold-200"
                    : "bg-steel-700/60 text-steel-300",
                )}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
