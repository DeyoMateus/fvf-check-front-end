import { Clock } from "lucide-react";
import { cn } from "../../utils/cn";

interface SlaIndicatorProps {
  hours: number;
  className?: string;
}

/**
 * Indicador de SLA com tom adaptativo:
 *  - < 0: vencido
 *  - < 6: crítico
 *  - < 24: atenção
 *  - >= 24: ok
 */
export function SlaIndicator({ hours, className }: SlaIndicatorProps) {
  const vencendo = hours <= 6;
  const atencao = hours <= 24;
  const label =
    hours <= 0
      ? "SLA vencido"
      : hours < 1
        ? `${Math.round(hours * 60)} min`
        : `${hours.toFixed(0)}h`;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold tabular-nums",
        vencendo
          ? "border-red-500/40 bg-red-500/10 text-red-300"
          : atencao
            ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
        className,
      )}
    >
      <Clock className="h-3 w-3" />
      {label}
    </span>
  );
}
