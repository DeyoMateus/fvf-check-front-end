export type {
  WidgetInstance,
  WidgetLayout,
  WidgetSize,
  WidgetHeight,
} from "./types";
import type { WidgetLayout } from "./types";

function key(pageKey: string, userId: string): string {
  return `fvf-widgets:${pageKey}:${userId}`;
}

export function loadLayout(
  pageKey: string,
  userId: string,
): WidgetLayout | null {
  try {
    const raw = localStorage.getItem(key(pageKey, userId));
    return raw ? (JSON.parse(raw) as WidgetLayout) : null;
  } catch {
    return null;
  }
}

export function saveLayout(
  pageKey: string,
  userId: string,
  layout: WidgetLayout,
): void {
  try {
    localStorage.setItem(key(pageKey, userId), JSON.stringify(layout));
  } catch {
    // Se o storage estiver cheio/bloqueado, apenas ignora — é preferência
    // de UI, não dado crítico; não vale interromper o usuário por isso.
  }
}
