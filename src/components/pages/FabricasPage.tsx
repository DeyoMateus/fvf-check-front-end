import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Factory,
  MapPin,
  Package,
  Plus,
  ShieldAlert,
  Star,
  TrendingUp,
  Activity,
  Layers,
} from "lucide-react";
import { type Fabrica, fabricasService } from "../../services/fabricas.service";
import { PageHeader } from "../ui/PageHeader";
import { Stat } from "../ui/Stat";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Tabs } from "../ui/Tabs";
import { SearchInput } from "../ui/SearchInput";
import { EmptyState } from "../ui/EmptyState";
import { cn } from "../../utils/cn";

type FilterStatus = "TODOS" | Fabrica["status"];

const STATUS_BADGE: Record<
  Fabrica["status"],
  { label: string; variant: "success" | "warning" | "danger" }
> = {
  ATIVA: { label: "Ativa", variant: "success" },
  EM_AUDITORIA: { label: "Em auditoria", variant: "warning" },
  SUSPENSA: { label: "Suspensa", variant: "danger" },
};

export function FabricasPage() {
  const [fabricas, setFabricas] = useState<Fabrica[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("TODOS");
  const [selected, setSelected] = useState<Fabrica | null>(null);

  useEffect(() => {
    async function loadFabricas() {
      try {
        setLoading(true);
        const data = await fabricasService.getAll();
        setFabricas(data);
        if (data.length > 0) {
          setSelected(data[0]);
        }
      } catch (err) {
        console.error("Erro ao carregar empresas:", err);
      } finally {
        setLoading(false);
      }
    }

    loadFabricas();
  }, []);

  const filtered = useMemo(() => {
    return fabricas.filter((f) => {
      if (filter !== "TODOS" && f.status !== filter) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        f.nome.toLowerCase().includes(q) ||
        f.cidade.toLowerCase().includes(q) ||
        f.especialidade.toLowerCase().includes(q) ||
        f.cnpj.includes(q)
      );
    });
  }, [fabricas, query, filter]);

  const ativas = fabricas.filter((f) => f.status === "ATIVA").length;
  const rmaTotal = fabricas.reduce((a, f) => a + f.rmaAbertos, 0);
  const mediaQualidade = fabricas.length
    ? Math.round(
        fabricas.reduce((a, f) => a + f.scoreQualidade, 0) / fabricas.length
      )
    : 0;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-steel-400">
        Carregando dados do banco de dados...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        kicker="FVF CHECK • Fornecedores"
        title={
          <>
            <span className="text-gold-gradient">Fábricas</span> e Lojistas
          </>
        }
        description="Gestão de parceiros, score de qualidade, volume operacional e indicadores de SLA."
        actions={
          <Button>
            <Plus className="h-4 w-4" />
            Nova empresa
          </Button>
        }
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          label="Empresas ativas"
          value={ativas}
          hint={`${fabricas.length} cadastradas`}
          icon={<Factory className="h-5 w-5" />}
          tone="gold"
        />
        <Stat
          label="RMA abertos"
          value={rmaTotal}
          hint="Aguardando resposta"
          icon={<ShieldAlert className="h-5 w-5" />}
          tone="danger"
        />
        <Stat
          label="Score médio"
          value={mediaQualidade}
          hint="Qualidade consolidada"
          icon={<Star className="h-5 w-5" />}
          tone="info"
        />
        <Stat
          label="Lotes ativos"
          value={fabricas.reduce((a, f) => a + f.lotesAtivos, 0)}
          hint="Em produção / trânsito"
          icon={<Package className="h-5 w-5" />}
        />
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Buscar empresa, CNPJ, cidade ou tipo…"
          className="min-w-[240px] flex-1 max-w-md"
        />
        <Tabs<FilterStatus>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "TODOS", label: "Todas", count: fabricas.length },
            { value: "ATIVA", label: "Ativas", count: ativas },
            {
              value: "EM_AUDITORIA",
              label: "Auditoria",
              count: fabricas.filter((f) => f.status === "EM_AUDITORIA").length,
            },
            {
              value: "SUSPENSA",
              label: "Suspensas",
              count: fabricas.filter((f) => f.status === "SUSPENSA").length,
            },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhuma empresa encontrada"
          description="Ajuste os filtros ou cadastre um novo parceiro."
          icon={<Factory className="h-7 w-7" />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
          <div className="space-y-3 xl:col-span-3">
            {filtered.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelected(f)}
                className={cn(
                  "w-full rounded-xl border p-4 text-left transition-all",
                  "bg-gradient-to-b from-abyss-800/80 to-abyss-900/80",
                  selected?.id === f.id
                    ? "border-gold-500/50 glow-gold"
                    : "border-steel-700/60 hover:border-gold-500/30"
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-gold-500/30 bg-gold-500/10 text-gold-300">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-steel-50">{f.nome}</p>
                      <p className="mt-0.5 text-[11px] text-steel-400">
                        {f.especialidade}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-steel-400">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {f.cidade} / {f.uf}
                        </span>
                        <span className="font-mono">{f.cnpj}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={STATUS_BADGE[f.status]?.variant || "success"}>
                    {STATUS_BADGE[f.status]?.label || f.status}
                  </Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <MiniKpi label="Qualidade" value={f.scoreQualidade} />
                  <MiniKpi label="SLA médio" value={`${f.slaMedioHoras}h`} />
                  <MiniKpi
                    label="RMA"
                    value={f.rmaAbertos}
                    tone={f.rmaAbertos > 5 ? "danger" : "default"}
                  />
                  <MiniKpi label="Defeito" value={`${f.taxaDefeito}%`} />
                </div>
              </button>
            ))}
          </div>

          {/* FICHA LATERAL COM KPI'S CHAVE DE NEGÓCIO */}
          <aside className="xl:col-span-2">
            {selected ? (
              <div className="sticky top-4 rounded-xl border border-steel-700/60 bg-gradient-to-b from-abyss-800/80 to-abyss-900/90 p-5 space-y-5">
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-400">
                      Painel Analítico do Parceiro
                    </p>
                    <Badge variant={STATUS_BADGE[selected.status]?.variant || "success"}>
                      {selected.status}
                    </Badge>
                  </div>
                  <h3 className="mt-2 text-lg font-bold text-steel-50">
                    {selected.nome}
                  </h3>
                  <p className="text-xs text-steel-400">{selected.especialidade}</p>
                </div>

                <div className="space-y-3 text-sm border-t border-b border-steel-800/80 py-4">
                  <DetailRow label="CNPJ" value={selected.cnpj} mono />
                  <DetailRow
                    label="Localização"
                    value={`${selected.cidade} / ${selected.uf}`}
                  />
                  <DetailRow label="E-mail de Contato" value={selected.contato} />
                </div>

                {/* Bloco de Indicadores de Negócio (KPIs) */}
                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-steel-400 flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-gold-400" />
                    Métricas de Desempenho
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-steel-800 bg-abyss-950/60 p-3">
                      <div className="flex items-center gap-1.5 text-steel-400 text-[11px] mb-1">
                        <Layers className="h-3.5 w-3.5 text-gold-400" />
                        Lotes Ativos
                      </div>
                      <p className="font-mono text-base font-bold text-steel-50">
                        {selected.lotesAtivos}
                      </p>
                    </div>

                    <div className="rounded-lg border border-steel-800 bg-abyss-950/60 p-3">
                      <div className="flex items-center gap-1.5 text-steel-400 text-[11px] mb-1">
                        <Activity className="h-3.5 w-3.5 text-gold-400" />
                        SLA de Resposta
                      </div>
                      <p className="font-mono text-base font-bold text-steel-50">
                        {selected.slaMedioHoras}h
                      </p>
                    </div>
                  </div>

                  {/* Barra de Score de Qualidade */}
                  <div className="rounded-lg border border-steel-800 bg-abyss-950/60 p-3.5 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-steel-400 font-medium">Score de Qualidade Geral</span>
                      <span className="font-mono font-bold text-gold-300">{selected.scoreQualidade}/100</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-abyss-950">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-400 transition-all duration-500"
                        style={{ width: `${selected.scoreQualidade}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                title="Selecione uma empresa"
                description="Clique em um card para ver os indicadores detalhados."
              />
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

function MiniKpi({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "danger";
}) {
  return (
    <div className="rounded-lg border border-steel-700/40 bg-abyss-950/40 px-2.5 py-2">
      <p className="text-[9px] font-bold uppercase tracking-widest text-steel-500">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 font-mono text-sm font-bold tabular-nums",
          tone === "danger" ? "text-red-300" : "text-steel-100"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-steel-500">
        {label}
      </span>
      <span
        className={cn("text-right text-steel-100 text-xs", mono && "font-mono")}
      >
        {value}
      </span>
    </div>
  );
}