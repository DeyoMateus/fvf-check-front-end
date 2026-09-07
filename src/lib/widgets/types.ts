export type WidgetSize = "sm" | "md" | "lg" | "full";
export type WidgetHeight = "compact" | "normal" | "tall";

export interface WidgetInstance {
  id: string; // instância única (permite o mesmo widget 2x, se fizer sentido no futuro)
  type: string; // chave que o registro de widgets usa para saber o que renderizar
  size: WidgetSize;
  height: WidgetHeight;
}

export interface WidgetLayout {
  widgets: WidgetInstance[];
}

export const SIZE_COLS: Record<WidgetSize, string> = {
  sm: "col-span-1",
  md: "col-span-1 md:col-span-2",
  lg: "col-span-1 md:col-span-2 xl:col-span-3",
  full: "col-span-full",
};

export const HEIGHT_CLASS: Record<WidgetHeight, string> = {
  compact: "max-h-[280px]",
  normal: "max-h-[480px]",
  tall: "max-h-[720px]",
};
