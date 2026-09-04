import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar as CalendarIcon,
  Download,
  Factory,
  FileSpreadsheet,
  Truck,
  Wrench,
  Loader2,
  X,
  Check,
} from "lucide-react";
import { PageHeader } from "../ui/PageHeader";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Tabs } from "../ui/Tabs";
import { cn } from "../../utils/cn";
import {
  reportsService,
  Periodo,
  AnalyticsResponse,
} from "../../services/reports.service";

export function RelatoriosPage() {
  const [periodo, setPeriodo] = useState<Periodo | "custom">("30d");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [appliedCustomLabel, setAppliedCustomLabel] = useState<string>("");
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(true);
  const [exportingPdf, setExportingPdf] = useState<boolean>(false);
  const [exportingCsv, setExportingCsv] = useState<boolean>(false);
  const [data, setData] = useState<AnalyticsResponse | null>(null);

  useEffect(() => {
    async function loadAnalytics() {
      try {
      setLoading(true);

      const result = await reportsService.getAnalytics(
        periodo,
        customStartDate,
        customEndDate
      );

      setData(result);
    } catch (error) {
      console.error("Falha na requisição de analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  loadAnalytics();
}, [periodo, customStartDate, customEndDate]);

  async function handleDownloadFile(
    endpoint: string,
    filename: string,
    setExporting: (val: boolean) => void
  ) {
    try {
      setExporting(true);
      const blob = await reportsService.downloadFile(endpoint);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Falha no download:", error);
      alert("Não foi possível realizar o download do relatório. Tente novamente.");
    } finally {
      setExporting(false);
    }
  }

  function handleApplyCustomPeriod() {
    if (!customStartDate || !customEndDate) {
      alert("Por favor, selecione as datas de início e fim.");
      return;
    }

    if (new Date(customStartDate) > new Date(customEndDate)) {
      alert("A data inicial não pode ser maior que a data final.");
      return;
    }

    const startFormatted = new Date(customStartDate).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
    const endFormatted = new Date(customEndDate).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });

    setAppliedCustomLabel(`${startFormatted} a ${endFormatted}`);
    setPeriodo("custom");
    setIsCalendarOpen(false);
  }

  const maxBar = data?.distribuicao
    ? Math.max(
        ...data.distribuicao.flatMap((m) => [
          m.transporte,
          m.fabrica,
          m.montagem,
        ]),
        1
      )
    : 1;

  if (loading && !data) {
    return (
      <div className="flex h-96 w-full flex-col items-center justify-center gap-3 text-steel-400">
        <Loader2 className="h-8 w-8 animate-spin text-gold-400" />
        <p className="text-sm">Carregando métricas do sistema...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        kicker="FVF CHECK • Analytics"
        title={
          <>
            <span className="text-gold-gradient">Relatórios</span> operacionais
          </>
        }
        description="Indicadores de triagem, distribuição de responsabilidade, top defeitos e performance de fábrica e montagem."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Tabs<Periodo>
              value={periodo === "custom" ? ("30d" as Periodo) : (periodo as Periodo)}
              onChange={(val) => {
                setPeriodo(val);
                setAppliedCustomLabel("");
              }}
              options={[
                { value: "7d", label: "7d" },
                { value: "30d", label: "30d" },
                { value: "90d", label: "90d" },
                { value: "12m", label: "12m" },
              ]}
            />

            <div className="relative">
              <Button
                variant={periodo === "custom" ? "primary" : "secondary"}
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                className={cn(
                  periodo === "custom" && "border-gold-500/50 bg-gold-500/20 text-gold-300"
                )}
              >
                <CalendarIcon className="h-4 w-4" />
                {periodo === "custom" && appliedCustomLabel
                  ? appliedCustomLabel
                  : "Período custom"}
              </Button>

              {/* Modal / Popover de Seleção de Período Customizado */}
              {isCalendarOpen && (
                <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-steel-700/80 bg-abyss-900 p-4 shadow-2xl backdrop-blur-md glow-gold animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-steel-700/50 pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-gold-400">
                      Selecionar Período
                    </span>
                    <button
                      onClick={() => setIsCalendarOpen(false)}
                      className="rounded-lg p-1 text-steel-400 hover:bg-abyss-800 hover:text-steel-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-steel-300 mb-1">
                        Data Inicial
                      </label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full rounded-lg border border-steel-700 bg-abyss-950 px-3 py-2 text-xs text-steel-100 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-steel-300 mb-1">
                        Data Final
                      </label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full rounded-lg border border-steel-700 bg-abyss-950 px-3 py-2 text-xs text-steel-100 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                      />
                    </div>

                    {/* Atalhos rápidos */}
                    <div className="pt-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-steel-500 mb-1.5">
                        Atalhos Rápidos
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const now = new Date();
                            const start = new Date(now.getFullYear(), now.getMonth(), 1);
                            setCustomStartDate(start.toISOString().split("T")[0]);
                            setCustomEndDate(now.toISOString().split("T")[0]);
                          }}
                          className="rounded-md border border-steel-700/60 bg-abyss-950 px-2 py-1 text-[10px] font-medium text-steel-300 hover:border-gold-500/40 hover:text-gold-300"
                        >
                          Este Mês
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const now = new Date();
                            const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                            const end = new Date(now.getFullYear(), now.getMonth(), 0);
                            setCustomStartDate(start.toISOString().split("T")[0]);
                            setCustomEndDate(end.toISOString().split("T")[0]);
                          }}
                          className="rounded-md border border-steel-700/60 bg-abyss-950 px-2 py-1 text-[10px] font-medium text-steel-300 hover:border-gold-500/40 hover:text-gold-300"
                        >
                          Mês Anterior
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const end = new Date();
                            const start = new Date();
                            start.setDate(end.getDate() - 15);
                            setCustomStartDate(start.toISOString().split("T")[0]);
                            setCustomEndDate(end.toISOString().split("T")[0]);
                          }}
                          className="rounded-md border border-steel-700/60 bg-abyss-950 px-2 py-1 text-[10px] font-medium text-steel-300 hover:border-gold-500/40 hover:text-gold-300"
                        >
                          Últimos 15d
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-steel-700/50">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsCalendarOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button size="sm" onClick={handleApplyCustomPeriod}>
                        <Check className="h-3.5 w-3.5" />
                        Aplicar
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={() =>
                handleDownloadFile(
                  `/analyst/export/pdf?periodo=${periodo}&startDate=${customStartDate}&endDate=${customEndDate}`,
                  `relatorio-executivo-${periodo}.pdf`,
                  setExportingPdf
                )
              }
              disabled={exportingPdf}
            >
              {exportingPdf ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {exportingPdf ? "Gerando PDF..." : "Exportar PDF"}
            </Button>
          </div>
        }
      />

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {(data?.kpis || []).map((k) => (
          <div
            key={k.label}
            className="relative overflow-hidden rounded-xl border border-steel-700/60 bg-gradient-to-b from-abyss-800/70 to-abyss-900/70 p-4 before:absolute before:left-0 before:top-0 before:h-px before:w-10 before:bg-gradient-to-r before:from-gold-500 before:to-transparent"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-steel-400">
              {k.label}
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-steel-50">
              {k.valor}
            </p>
            <p
              className={cn(
                "mt-1 inline-flex items-center gap-1 text-[11px] font-semibold",
                k.positivo ? "text-emerald-300" : "text-amber-300"
              )}
            >
              {k.positivo ? (
                <ArrowDownRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowUpRight className="h-3.5 w-3.5" />
              )}
              {k.delta}
            </p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        {/* Chart de volume por responsabilidade */}
        <section className="rounded-xl border border-steel-700/60 bg-gradient-to-b from-abyss-800/70 to-abyss-900/70 p-5 xl:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-400">
                Volume por responsabilidade
              </p>
              <h2 className="mt-1 text-lg font-bold text-steel-50">
                Tickets no Período
              </h2>
            </div>
            <div className="flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-wider">
              <LegendDot color="#f59e0b" label="Transporte" />
              <LegendDot color="#ef4444" label="Fábrica" />
              <LegendDot color="#38bdf8" label="Montagem" />
            </div>
          </div>

          <div className="mt-6 flex h-56 items-end gap-3 sm:gap-5">
            {(data?.distribuicao || []).map((m) => (
              <div key={m.mes} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-44 w-full items-end justify-center gap-1">
                  <Bar
                    h={(m.transporte / maxBar) * 100}
                    color="#f59e0b"
                    title={`Transporte: ${m.transporte}`}
                  />
                  <Bar
                    h={(m.fabrica / maxBar) * 100}
                    color="#ef4444"
                    title={`Fábrica: ${m.fabrica}`}
                  />
                  <Bar
                    h={(m.montagem / maxBar) * 100}
                    color="#38bdf8"
                    title={`Montagem: ${m.montagem}`}
                  />
                </div>
                <span className="text-[11px] font-semibold text-steel-400">
                  {m.mes}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Top defeitos */}
        <section className="rounded-xl border border-steel-700/60 bg-gradient-to-b from-abyss-800/70 to-abyss-900/70 p-5 xl:col-span-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-400">
            Ranking
          </p>
          <h2 className="mt-1 text-lg font-bold text-steel-50">Top defeitos</h2>
          <ul className="mt-4 space-y-3">
            {(data?.topDefeitos || []).map((d, i) => {
              const max = data?.topDefeitos[0]?.qtd || 1;
              const pct = max > 0 ? Math.round((d.qtd / max) * 100) : 0;
              const tone =
                d.cat === "TRANSPORTE"
                  ? "warning"
                  : d.cat === "FABRICA"
                  ? "danger"
                  : "info";
              const Icon =
                d.cat === "TRANSPORTE"
                  ? Truck
                  : d.cat === "FABRICA"
                  ? Factory
                  : Wrench;
              return (
                <li key={d.nome}>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-abyss-950 font-mono text-[10px] font-bold text-gold-300">
                        {i + 1}
                      </span>
                      <span className="truncate text-steel-100">{d.nome}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant={tone} className="hidden sm:inline-flex">
                        <Icon className="h-3 w-3" />
                        {d.cat === "TRANSPORTE"
                          ? "Transporte"
                          : d.cat === "FABRICA"
                          ? "Fábrica"
                          : "Montagem"}
                      </Badge>
                      <span className="font-mono text-xs font-bold text-steel-200">
                        {d.qtd}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-abyss-950">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {/* Cards de exportação / insights */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <InsightCard
          icon={<BarChart3 className="h-5 w-5" />}
          title={`SLA de Triagem: ${data?.insights?.slaMedioHoras ?? 0}h`}
          body="Tempo médio do momento da abertura do chamado até o encerramento da avaliação da equipe técnica."
        />
        <InsightCard
          icon={<Factory className="h-5 w-5" />}
          title="Atenção: Processos Produtivos"
          body={data?.insights?.alertaProducao || "Carregando análises do período..."}
        />
        <InsightCard
          icon={<FileSpreadsheet className="h-5 w-5" />}
          title="Exportações disponíveis"
          body="Baixe a planilha bruta detalhada (CSV) com todos os chamados e ocorrências do período ativo."
          action={
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                const params = new URLSearchParams({ periodo });
                if (periodo === "custom") {
                  if (customStartDate) params.append("startDate", customStartDate);
                  if (customEndDate) params.append("endDate", customEndDate);
                }
                handleDownloadFile(
                  `/analyst/export/csv?${params.toString()}`,
                  `relatorio-chamados-${periodo}.csv`,
                  setExportingCsv
                );
              }}
              disabled={exportingCsv}
            >
              {exportingCsv ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              {exportingCsv ? "Baixando pacote..." : "Baixar pacote"}
            </Button>
          }
        />
      </section>
    </div>
  );
}

function Bar({ h, color, title }: { h: number; color: string; title: string }) {
  return (
    <div
      title={title}
      className="w-2.5 rounded-t-sm sm:w-3.5 transition-all duration-300"
      style={{
        height: `${Math.max(h, 4)}%`,
        background: color,
        boxShadow: `0 0 12px ${color}55`,
      }}
    />
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-steel-300">
      <span className="h-2 w-2 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}

function InsightCard({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-steel-700/60 bg-gradient-to-b from-abyss-800/70 to-abyss-900/70 p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gold-500/30 bg-gold-500/10 text-gold-300">
        {icon}
      </div>
      <h3 className="mt-3 text-sm font-bold text-steel-50">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-steel-400">{body}</p>
      {action}
    </div>
  );
}