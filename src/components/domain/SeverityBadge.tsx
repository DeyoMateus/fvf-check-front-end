import { Badge } from "../ui/Badge";
import type { Severity } from "../../lib/types";
import { SEVERITY_LABELS } from "../../lib/types";

interface SeverityBadgeProps {
  value?: Severity;
}

const MAP: Record<Severity, { variant: "muted" | "info" | "warning" | "danger" }> = {
  LOW: { variant: "muted" },
  MEDIUM: { variant: "info" },
  HIGH: { variant: "warning" },
  CRITICAL: { variant: "danger" },
};

export function SeverityBadge({ value }: SeverityBadgeProps) {
  // Fallback seguro caso 'value' venha indefinido ou com valor inesperado
  const severityKey = value && MAP[value] ? value : "MEDIUM";
  const cfg = MAP[severityKey];
  const label = SEVERITY_LABELS[severityKey] ?? "Média";

  return (
    <Badge variant={cfg.variant}>
      <span
        className="h-1.5 w-1.5 rounded-full bg-current pulse-dot"
        aria-hidden
      />
      {label}
    </Badge>
  );
}