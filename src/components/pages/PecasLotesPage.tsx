import { WidgetGrid, type WidgetDefinition } from "../widgets/WidgetGrid";
import { PartsAnalyticsWidget } from "../../lib/widgets/PartsAnalyticsWidget";
import { PartsQuantityTableWidget } from "../widgets/PartsQuantityTableWidget";
import { PageHeader } from "../ui/PageHeader";

const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  {
    type: "kpis",
    label: "Resumo de Indicadores",
    defaultSize: "full",
    defaultHeight: "compact",
    render: () => <PartsAnalyticsWidget />,
  },
  {
    type: "table",
    label: "Tabela de Quantidade de Peças",
    defaultSize: "full",
    defaultHeight: "tall",
    render: () => <PartsQuantityTableWidget />,
  },
];

export function PecasLotesPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        kicker="FVF CHECK • Inteligência & Rastreabilidade"
        title={<span className="text-gold-gradient">Central Analítica de Peças & Defeitos</span>}
        description="Diagnóstico de causa raiz, ranking de montadores, performance de fábricas e rastreabilidade dos chamados."
      />

      <WidgetGrid
        pageKey="pecas-lotes"
        defaultLayout={[
          { id: "kpis", type: "kpis", size: "full", height: "compact" },
          { id: "table", type: "table", size: "full", height: "tall" },
        ]}
        availableWidgets={WIDGET_DEFINITIONS}
      />
    </div>
  );
}