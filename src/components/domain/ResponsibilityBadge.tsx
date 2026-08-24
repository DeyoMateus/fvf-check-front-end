import { ShieldAlert, Truck, Wrench } from "lucide-react";
import { Badge } from "../ui/Badge";
import { RESP_LABELS, type Responsabilidade } from "../../lib/types";
import type { ReactNode } from "react";

interface ResponsibilityBadgeProps {
  value: Responsabilidade;
  className?: string;
  iconOnly?: boolean;
}

const ICONS: Record<Responsabilidade, ReactNode> = {
  TRANSPORTE: <Truck className="h-3.5 w-3.5" />,
  FABRICA: <ShieldAlert className="h-3.5 w-3.5" />,
  MONTAGEM: <Wrench className="h-3.5 w-3.5" />,
};

const TONE: Record<Responsabilidade, "warning" | "danger" | "info"> = {
  TRANSPORTE: "warning",
  FABRICA: "danger",
  MONTAGEM: "info",
};

export function ResponsibilityBadge({
  value,
  className,
  iconOnly,
}: ResponsibilityBadgeProps) {
  if (iconOnly) {
    return (
      <span className="inline-flex items-center" aria-label={RESP_LABELS[value]}>
        {ICONS[value]}
      </span>
    );
  }
  return (
    <Badge variant={TONE[value]} className={className}>
      {ICONS[value]}
      {RESP_LABELS[value]}
    </Badge>
  );
}
