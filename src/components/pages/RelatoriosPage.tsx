import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Download,
  Factory,
  FileSpreadsheet,
  Truck,
  Wrench,
  Loader2,
} from "lucide-react";
import { PageHeader } from "../ui/PageHeader";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Tabs } from "../ui/Tabs";
import { cn } from "../../utils/cn";

type Periodo = "7d" | "30d" | "90d" | "12m";

interface AnalyticsResponse {
  kpis: Array<{
    label: string;
    valor: string;
    delta: string;
    positivo: boolean;
  }>;
  distribuicao: Array<{
    mes: string;
    transporte: number;
    fabrica: number;
    montagem: number;
  }>;
  topDefeitos: Array<{
    nome: string;
    cat: "TRANSPORTE" | "FABRICA" | "MONTAGEM";
    qtd: number;
  }>;
}

export function RelatoriosPage() {
  const [periodo, setPeriodo] = useState<Periodo>("30d");
  const [loading, setLoading] = useState<boolean>(true);
  const [exportingPdf, setExportingPdf] = useState<boolean>(false);
  const [exportingCsv, setExportingCsv] = useState<boolean>(false);
  const [data, setData] = useState<AnalyticsResponse | null>(null);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);

        const response = await fetch(
          `http://localhost:3333/api/v1/analyst/analytics?periodo=${periodo}`,
          {
            method: "GET",
            credentials: "include", // Crucial: envia o cookie HttpOnly do Fastify
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const result = await response.json();
          setData(result);
        } else {
          console.error("Erro ao buscar analytics:", response.statusText);
        }
      } catch (error) {
        console.error("Falha na requisição de analytics:", error);
      } finally {
        setLoading(false);
      }
    }
  
    loadAnalytics();
  }, [periodo]);

  // Função genérica para baixar arquivos (PDF / CSV) via cookies HttpOnly
  async function handleDownloadFile(endpoint: string, filename: string, setExporting: (val: boolean) => void) {
    try {
      setExporting(true);

      const response = await fetch(`http://localhost:3333/api/v1${endpoint}`, {
        method: "GET",
        credentials: "include", // Crucial para autenticar via cookie no download
      });

      if (!response.ok) {
        throw new Error("Erro ao gerar o arquivo no servidor.");
      }

      const blob = await response.blob();
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

  const maxBar = data?.distribuicao
    ? Math.max(
        ...data.distribuicao.flatMap((m) => [
          m.transporte,
          m.fabrica,
          m.montagem,
        ]),
        1,
      )
    : 1;

  if (loading) {
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
          <>
            <Tabs<Periodo>
              value={periodo}
              onChange={setPeriodo}
              options={[
                { value: "7d", label: "7d" },
                { value: "30d", label: "30d" },
                { value: "90d", label: "90d" },
                { value: "12m", label: "12m" },
              ]}
            />
            <Button variant="secondary">
              <Calendar className="h-4 w-4" />
              Período custom
            </Button>
            <Button 
              onClick={() => handleDownloadFile(`/analyst/export/pdf?periodo=${periodo}`, `relatorio-executivo-${periodo}.pdf`, setExportingPdf)}
              disabled={exportingPdf}
            >
              {exportingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {exportingPdf ? "Gerando PDF..." : "Exportar PDF"}
            </Button>
          </>
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
                k.positivo ? "text-emerald-300" : "text-amber-300",
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
          title="SLA de triagem"
          body="Tempo médio caiu 18% com a automação de scores. Mantenha o foco em tickets críticos < 2h."
        />
        <InsightCard
          icon={<Factory className="h-5 w-5" />}
          title="Atenção: Processos Produtivos"
          body="Monitore a incidência de falhas recorrentes agrupadas no filtro do período atual."
        />
        <InsightCard
          icon={<FileSpreadsheet className="h-5 w-5" />}
          title="Exportações disponíveis"
          body="CSV de tickets, PDF executivo mensal e planilha de RMA por fábrica (compatível SAP/TOTVS)."
          action={
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => handleDownloadFile(`/analyst/export/csv?periodo=${periodo}`, `pacote-rma-${periodo}.csv`, setExportingCsv)}
              disabled={exportingCsv}
            >
              {exportingCsv ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
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