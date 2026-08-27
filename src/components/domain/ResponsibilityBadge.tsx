import { ShieldAlert, Truck, Wrench } from "lucide-react";
import { Badge } from "../ui/Badge";
import { RESPONSIBILITY_LABELS, type ResponsibilityLabel } from "../../lib/types";
import type { ReactNode } from "react";

interface ResponsibilityBadgeProps {
  value: ResponsibilityLabel;
  className?: string;
  iconOnly?: boolean;
}

const ICONS: Record<ResponsibilityLabel, ReactNode> = {
  TRANSPORT_DAMAGE: <Truck className="h-3.5 w-3.5" />,
  FACTORY_DEFECT: <ShieldAlert className="h-3.5 w-3.5" />,
  ASSEMBLY_ERROR: <Wrench className="h-3.5 w-3.5" />,
};

const TONE: Record<ResponsibilityLabel, "warning" | "danger" | "info"> = {
  TRANSPORT_DAMAGE: "warning",
  FACTORY_DEFECT: "danger",
  ASSEMBLY_ERROR: "info",
};

export function ResponsibilityBadge({
  value,
  className,
  iconOnly,
}: ResponsibilityBadgeProps) {
  const label = RESPONSIBILITY_LABELS[value] ?? "Pendente";
  const icon = ICONS[value];
  const tone = TONE[value] ?? "default";

  if (iconOnly) {
    return (
      <span className="inline-flex items-center" aria-label={label}>
        {icon}
      </span>
    );
  }

  return (
    <Badge variant={tone} className={className}>
      {icon}
      {label}
    </Badge>
  );
}