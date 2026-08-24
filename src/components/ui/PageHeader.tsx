import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

interface PageHeaderProps {
  kicker: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/**
 * Cabeçalho padrão de página — reconstruído a partir do padrão
 * repetido em todas as telas de referência (kicker uppercase
 * dourado + título grande + descrição + slot de ações à direita).
 */
export function PageHeader({ kicker, title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="max-w-2xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold-400 hud-line-left">{kicker}</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-steel-50">{title}</h1>
        {description && <p className="mt-2 text-sm leading-relaxed text-steel-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
