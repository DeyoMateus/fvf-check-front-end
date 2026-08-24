import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Factory,
  Mail,
  MapPin,
  Package,
  Plus,
  ShieldAlert,
  Star,
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
        console.error("Erro ao carregar fábricas:", err);
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
        Carregando fábrica(s)...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        kicker="FVF CHECK • Fornecedores"
        title={
          <>
            <span className="text-gold-gradient">Fábricas</span> parceiras
          </>
        }
        description="Cadastro de indústrias, score de qualidade, RMA abertos e SLA médio de reposição de peças."
        actions={
          <Button>
            <Plus className="h-4 w-4" />
            Nova fábrica
          </Button>
        }
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          label="Fábricas ativas"
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
          placeholder="Buscar fábrica, CNPJ, cidade ou especialidade…"
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
          title="Nenhuma fábrica encontrada"
          description="Ajuste os filtros ou cadastre um novo fornecedor industrial."
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
                  <Badge variant={STATUS_BADGE[f.status].variant}>
                    {STATUS_BADGE[f.status].label}
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

          {/* Detalhe */}
          <aside className="xl:col-span-2">
            {selected ? (
              <div className="sticky top-4 rounded-xl border border-steel-700/60 bg-gradient-to-b from-abyss-800/80 to-abyss-900/90 p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-400">
                  Ficha do fornecedor
                </p>
                <h3 className="mt-2 text-lg font-bold text-steel-50">
                  {selected.nome}
                </h3>
                <p className="text-xs text-steel-400">{selected.especialidade}</p>

                <div className="mt-4 space-y-3 text-sm">
                  <DetailRow label="CNPJ" value={selected.cnpj} mono />
                  <DetailRow
                    label="Local"
                    value={`${selected.cidade} / ${selected.uf}`}
                  />
                  <DetailRow label="Contato" value={selected.contato} />
                  <DetailRow
                    label="Lotes ativos"
                    value={String(selected.lotesAtivos)}
                  />
                  <DetailRow
                    label="SLA médio reposição"
                    value={`${selected.slaMedioHoras}h`}
                  />
                </div>

                <div className="mt-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-steel-400">
                    Score de qualidade
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-abyss-950">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-400"
                      style={{ width: `${selected.scoreQualidade}%` }}
                    />
                  </div>
                  <p className="mt-1 font-mono text-sm font-bold text-gold-300">
                    {selected.scoreQualidade}/100
                  </p>
                </div>

                <div className="mt-5 flex flex-col gap-2">
                  <Button className="w-full">
                    <Mail className="h-4 w-4" />
                    Abrir RMA
                  </Button>
                  <Button variant="secondary" className="w-full">
                    Ver lotes vinculados
                  </Button>
                </div>
              </div>
            ) : (
              <EmptyState
                title="Selecione uma fábrica"
                description="Clique em um card para ver a ficha completa."
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
    <div className="flex items-center justify-between gap-3 border-b border-steel-700/30 pb-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-steel-500">
        {label}
      </span>
      <span
        className={cn("text-right text-steel-100", mono && "font-mono text-xs")}
      >
        {value}
      </span>
    </div>
  );
}