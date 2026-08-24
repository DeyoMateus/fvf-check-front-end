import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Box,
  PackageSearch,
  Plus,
  ScanLine,
  Loader2,
  Wrench,
} from "lucide-react";
import { pecasService, type PecaAvariada } from "../../services/pecas.service";
import { PageHeader } from "../ui/PageHeader";
import { Stat } from "../ui/Stat";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Tabs } from "../ui/Tabs";
import { SearchInput } from "../ui/SearchInput";
import { EmptyState } from "../ui/EmptyState";

type FilterDefect = "TODOS" | "BROKEN" | "MISSING" | "HARDWARE_FAULT";

// Mapeamento de variantes ajustado para evitar conflitos de tipos no Badge
const DEFECT_CFG: Record<
  PecaAvariada["defectType"],
  { label: string; variant: "danger" | "gold" | "info" }
> = {
  BROKEN: { label: "Quebrada / Avariada", variant: "danger" },
  MISSING: { label: "Peça Faltante", variant: "gold" },
  HARDWARE_FAULT: { label: "Defeito em Ferragem", variant: "info" },
};

export function PecasLotesPage() {
  const [pecas, setPecas] = useState<PecaAvariada[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterDefect>("TODOS");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await pecasService.getAll();
        setPecas(data);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = useMemo(() => {
    return pecas.filter((p) => {
      if (filter !== "TODOS" && p.defectType !== filter) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        p.partCode.toLowerCase().includes(q) ||
        p.productName.toLowerCase().includes(q) ||
        p.productSku.toLowerCase().includes(q) ||
        p.ticketCode.toLowerCase().includes(q) ||
        p.fabrica.toLowerCase().includes(q) ||
        p.danfe.toLowerCase().includes(q)
      );
    });
  }, [pecas, query, filter]);

  // Cálculos dinâmicos
  const totalItens = pecas.reduce((acc, p) => acc + p.quantity, 0);
  const quebradas = pecas.filter((p) => p.defectType === "BROKEN").length;
  const faltantes = pecas.filter((p) => p.defectType === "MISSING").length;
  const ferragens = pecas.filter((p) => p.defectType === "HARDWARE_FAULT").length;

  if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center text-steel-400">
        <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        kicker="FVF CHECK • Rastreabilidade"
        title={<span className="text-gold-gradient">Peças & Defeitos</span>}
        description="Rastreabilidade de peças avariadas, faltantes e defeitos registrados nos chamados do sistema."
        actions={
          <>
            <Button variant="secondary">
              <ScanLine className="h-4 w-4 text-gold-300" />
              Escanear Peça
            </Button>
            <Button>
              <Plus className="h-4 w-4" />
              Registrar Peça
            </Button>
          </>
        }
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          label="Registros de Peças"
          value={pecas.length}
          hint={`${totalItens.toLocaleString("pt-BR")} unidades totais`}
          icon={<PackageSearch className="h-5 w-5" />}
          tone="gold"
        />
        <Stat
          label="Quebradas / Avariadas"
          value={quebradas}
          hint="Danos físicos"
          icon={<AlertTriangle className="h-5 w-5" />}
          tone="danger"
        />
        <Stat
          label="Peças Faltantes"
          value={faltantes}
          hint="Ausência na embalagem"
          icon={<Box className="h-5 w-5" />}
          tone="gold" /* FIX: Corrigido de "warning" para "gold" para satisfazer os tipos da prop 'tone' */
        />
        <Stat
          label="Falhas em Ferragens"
          value={ferragens}
          hint="Acessórios e dobradiças"
          icon={<Wrench className="h-5 w-5" />}
          tone="info"
        />
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Buscar por código da peça, SKU, produto ou Nota Fiscal…"
          className="min-w-[240px] flex-1 max-w-md"
        />
        <Tabs<FilterDefect>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "TODOS", label: "Todas" },
            { value: "BROKEN", label: "Quebradas", count: quebradas },
            { value: "MISSING", label: "Faltantes", count: faltantes },
            { value: "HARDWARE_FAULT", label: "Ferragens", count: ferragens },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhuma peça encontrada"
          description="Não há peças registradas no banco para os filtros selecionados."
          icon={<PackageSearch className="h-7 w-7" />}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-steel-700/60 bg-abyss-950/40">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-abyss-900/80 text-[10px] uppercase tracking-[0.18em] text-steel-400">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Cód. Peça</th>
                  <th className="px-4 py-3 text-left font-semibold">Produto / SKU</th>
                  <th className="px-4 py-3 text-left font-semibold">Fábrica</th>
                  <th className="px-4 py-3 text-left font-semibold">NF-e</th>
                  <th className="px-4 py-3 text-left font-semibold">Qtd</th>
                  <th className="px-4 py-3 text-left font-semibold">Tipo do Defeito</th>
                  <th className="px-4 py-3 text-left font-semibold">Chamado</th>
                  <th className="px-4 py-3 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-steel-700/40">
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="text-steel-200 transition-colors hover:bg-abyss-800/40"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold text-gold-400">
                        {p.partCode}
                      </span>
                      <p className="mt-0.5 text-[10px] text-steel-500">
                        {formatDate(p.createdAt)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="max-w-[220px] font-semibold text-steel-50 truncate">
                        {p.productName}
                      </p>
                      <p className="max-w-[220px] font-mono text-[11px] text-steel-400 truncate">
                        SKU: {p.productSku}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs text-steel-300">{p.fabrica}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-steel-300">
                      {p.danfe}
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums">{p.quantity}</td>
                    <td className="px-4 py-3">
                      <Badge variant={DEFECT_CFG[p.defectType].variant}>
                        {DEFECT_CFG[p.defectType].label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gold-300">
                      {p.ticketCode}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="rounded-md border border-gold-500/30 bg-gold-500/5 px-2.5 py-1 text-[11px] font-semibold text-gold-300 hover:bg-gold-500/15">
                        Ver Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string) {
  if (!iso) return "";
  const date = new Date(iso);
  return date.toLocaleDateString("pt-BR");
}