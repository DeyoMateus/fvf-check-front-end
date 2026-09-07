import { useState, type ReactNode } from "react";
import { GripVertical, X, ChevronDown } from "lucide-react";
import { cn } from "../../utils/cn";
import { SIZE_COLS, HEIGHT_CLASS, type WidgetInstance, type WidgetSize, type WidgetHeight } from "../../lib/widgets/types";

interface WidgetShellProps {
  instance: WidgetInstance;
  title: string;
  children: ReactNode;
  onRemove: (id: string) => void;
  onResize: (id: string, size: WidgetSize) => void;
  onChangeHeight: (id: string, height: WidgetHeight) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  isDragOver: boolean;
}

export function WidgetShell({
  instance, title, children, onRemove, onResize, onChangeHeight,
  onDragStart, onDragOver, onDrop, isDragOver,
}: WidgetShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, instance.id)}
      onDragOver={(e) => onDragOver(e, instance.id)}
      onDrop={(e) => onDrop(e, instance.id)}
      className={cn(
        SIZE_COLS[instance.size],
        "flex flex-col rounded-xl border bg-abyss-950/40 transition-colors",
        isDragOver ? "border-gold-400/60 bg-gold-500/5" : "border-steel-700/50",
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-steel-700/40 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-steel-500 active:cursor-grabbing" />
          <span className="truncate text-xs font-bold uppercase tracking-wider text-steel-300">
            {title}
          </span>
        </div>
        <div className="relative flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-md p-1 text-steel-400 hover:bg-abyss-800 hover:text-gold-300"
            title="Tamanho do bloco"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onRemove(instance.id)}
            className="rounded-md p-1 text-steel-400 hover:bg-red-500/10 hover:text-red-300"
            title="Remover bloco"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-8 z-20 w-44 rounded-lg border border-steel-700/60 bg-abyss-900 p-2 shadow-2xl">
              <p className="px-1 pb-1 text-[9px] font-bold uppercase text-steel-500">Largura</p>
              {(["sm", "md", "lg", "full"] as WidgetSize[]).map((s) => (
                <button
                  key={s}
                  onClick={() => { onResize(instance.id, s); setMenuOpen(false); }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-2 py-1 text-[11px]",
                    instance.size === s ? "bg-gold-500/10 text-gold-300" : "text-steel-300 hover:bg-abyss-800",
                  )}
                >
                  {{ sm: "Pequeno", md: "Médio", lg: "Grande", full: "Tela toda" }[s]}
                </button>
              ))}
              <p className="mt-2 border-t border-steel-800 px-1 pb-1 pt-2 text-[9px] font-bold uppercase text-steel-500">Altura</p>
              {(["compact", "normal", "tall"] as WidgetHeight[]).map((h) => (
                <button
                  key={h}
                  onClick={() => { onChangeHeight(instance.id, h); setMenuOpen(false); }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-2 py-1 text-[11px]",
                    instance.height === h ? "bg-gold-500/10 text-gold-300" : "text-steel-300 hover:bg-abyss-800",
                  )}
                >
                  {{ compact: "Compacta", normal: "Normal", tall: "Alta" }[h]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={cn("flex-1 overflow-y-auto p-3", HEIGHT_CLASS[instance.height])}>
        {children}
      </div>
    </div>
  );
}