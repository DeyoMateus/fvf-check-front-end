import { useEffect, useState, type ReactNode } from "react";
import { Plus, LayoutGrid } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { loadLayout, saveLayout } from "../../lib/widgets/storage";
import type { WidgetInstance, WidgetLayout, WidgetSize, WidgetHeight } from "../../lib/widgets/storage";
import { WidgetShell } from "./WidgetShell";

export interface WidgetDefinition {
  type: string;
  label: string;
  defaultSize: WidgetSize;
  defaultHeight: WidgetHeight;
  render: () => ReactNode;
}

interface WidgetGridProps {
  pageKey: string;
  availableWidgets: WidgetDefinition[];
  defaultLayout: WidgetInstance[];
}

export function WidgetGrid({ pageKey, availableWidgets, defaultLayout }: WidgetGridProps) {
  const { user } = useAuth();
  const [layout, setLayout] = useState<WidgetLayout>({ widgets: defaultLayout });
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const saved = loadLayout(pageKey, user.id);
    if (saved) setLayout(saved);
  }, [pageKey, user?.id]);

  function persist(next: WidgetLayout) {
    setLayout(next);
    if (user?.id) saveLayout(pageKey, user.id, next);
  }

  function handleRemove(id: string) {
    persist({ widgets: layout.widgets.filter((w) => w.id !== id) });
  }

  function handleResize(id: string, size: WidgetSize) {
    persist({ widgets: layout.widgets.map((w) => (w.id === id ? { ...w, size } : w)) });
  }

  function handleChangeHeight(id: string, height: WidgetHeight) {
    persist({ widgets: layout.widgets.map((w) => (w.id === id ? { ...w, height } : w)) });
  }

  function handleDragStart(e: React.DragEvent, id: string) {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    setDragOverId(id);
  }

  function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    if (!dragId || dragId === targetId) { setDragId(null); setDragOverId(null); return; }

    const items = [...layout.widgets];
    const fromIndex = items.findIndex((w) => w.id === dragId);
    const toIndex = items.findIndex((w) => w.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const [moved] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, moved);

    persist({ widgets: items });
    setDragId(null);
    setDragOverId(null);
  }

  function addWidget(type: string) {
    const def = availableWidgets.find((w) => w.type === type);
    if (!def) return;
    const instance: WidgetInstance = {
      id: crypto.randomUUID(),
      type,
      size: def.defaultSize,
      height: def.defaultHeight,
    };
    persist({ widgets: [...layout.widgets, instance] });
    setPickerOpen(false);
  }

  const addedTypes = new Set(layout.widgets.map((w) => w.type));
  const pickable = availableWidgets.filter((w) => !addedTypes.has(w.type));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-steel-400">
          <LayoutGrid className="h-3.5 w-3.5" /> Personalize os blocos: arraste para reordenar
        </p>
        <div className="relative">
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            disabled={pickable.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-gold-500/30 bg-gold-500/5 px-3 py-1.5 text-xs font-semibold text-gold-300 hover:bg-gold-500/15 disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar bloco
          </button>
          {pickerOpen && pickable.length > 0 && (
            <div className="absolute right-0 top-9 z-20 w-56 rounded-lg border border-steel-700/60 bg-abyss-900 p-2 shadow-2xl">
              {pickable.map((w) => (
                <button
                  key={w.type}
                  onClick={() => addWidget(w.type)}
                  className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-xs text-steel-200 hover:bg-abyss-800"
                >
                  {w.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {layout.widgets.map((instance) => {
          const def = availableWidgets.find((w) => w.type === instance.type);
          if (!def) return null;
          return (
            <WidgetShell
              key={instance.id}
              instance={instance}
              title={def.label}
              onRemove={handleRemove}
              onResize={handleResize}
              onChangeHeight={handleChangeHeight}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              isDragOver={dragOverId === instance.id}
            >
              {def.render()}
            </WidgetShell>
          );
        })}
      </div>
    </div>
  );
}