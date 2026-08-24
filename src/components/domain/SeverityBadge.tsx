import { Badge } from "../ui/Badge";
import type { Severidade } from "../../lib/types";

const MAP: Record<Severidade, { label: string; variant: "muted" | "info" | "warning" | "danger" }> = {
  BAIXA: { label: "Baixa", variant: "muted" },
  MEDIA: { label: "Média", variant: "info" },
  ALTA: { label: "Alta", variant: "warning" },
  CRITICA: { label: "Crítica", variant: "danger" },
};

export function SeverityBadge({ value }: { value: Severidade }) {
  const cfg = MAP[value];
  return (
    <Badge variant={cfg.variant}>
      <span
        className="h-1.5 w-1.5 rounded-full bg-current pulse-dot"
        aria-hidden
      />
      {cfg.label}
    </Badge>
  );
}
