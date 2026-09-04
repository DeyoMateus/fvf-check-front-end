import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Box,
  PackageSearch,
  Plus,
  ScanLine,
  Loader2,
  Wrench,
  X,
  Building2,
  Truck,
  UserCheck,
  TrendingUp,
  Tag,
  Filter,
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
type FilterResponsibility = "TODOS" | "FACTORY_DEFECT" | "TRANSPORT_DAMAGE" | "ASSEMBLY_ERROR";

const DEFECT_CFG: Record<
  PecaAvariada["defectType"],
  { label: string; variant: "danger" | "gold" | "info" }
> = {
  BROKEN: { label: "Quebrada / Avariada", variant: "danger" },
  MISSING: { label: "Peça Faltante", variant: "gold" },
  HARDWARE_FAULT: { label: "Defeito em Ferragem", variant: "info" },
};

const RESPONSIBILITY_CFG: Record<
  string,
  { label: string; icon: any; color: string }
> = {
  FACTORY_DEFECT: { label: "Fábrica / Produção", icon: Building2, color: "text-red-400" },
  TRANSPORT_DAMAGE: { label: "Transportadora", icon: Truck, color: "text-amber-400" },
  ASSEMBLY_ERROR: { label: "Montador / Cliente", icon: Wrench, color: "text-blue-400" },
};

export function PecasLotesPage() {
  const [pecas, setPecas] = useState<PecaAvariada[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterDefect>("TODOS");
  const [responsibilityFilter, setResponsibilityFilter] = useState<FilterResponsibility>("TODOS");
  const [selectedPeca, setSelectedPeca] = useState<PecaAvariada | null>(null);

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

  // Filtragem Analítica Avançada
  const filtered = useMemo(() => {
    return pecas.filter((p) => {
      if (filter !== "TODOS" && p.defectType !== filter) return false;
      
      const pResp = (p as any).suggestedResponsibility || "FACTORY_DEFECT";
      if (responsibilityFilter !== "TODOS" && pResp !== responsibilityFilter) return false;

      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        p.partCode.toLowerCase().includes(q) ||
        p.productName.toLowerCase().includes(q) ||
        p.productSku.toLowerCase().includes(q) ||
        p.ticketCode.toLowerCase().includes(q) ||
        p.fabrica.toLowerCase().includes(q) ||
        p.danfe.toLowerCase().includes(q) ||
        (p.assignedTechnician && p.assignedTechnician.toLowerCase().includes(q))
      );
    });
  }, [pecas, query, filter, responsibilityFilter]);

  // Agregações e Ranking Analítico para Tomada de Decisão
  const analytics = useMemo(() => {
    const totalItens = pecas.reduce((acc, p) => acc + p.quantity, 0);
    const totalRegistros = pecas.length;

    // Métricas por Responsabilidade (Causa Raiz)
    const factoryCases = pecas.filter((p) => (p as any).suggestedResponsibility === "FACTORY_DEFECT").length;
    const transportCases = pecas.filter((p) => (p as any).suggestedResponsibility === "TRANSPORT_DAMAGE").length;
    const assemblyCases = pecas.filter((p) => (p as any).suggestedResponsibility === "ASSEMBLY_ERROR").length;

    // Ranking de Fábricas com Mais Ocorrências
    const factoryMap: Record<string, number> = {};
    pecas.forEach((p) => {
      if (p.fabrica) {
        factoryMap[p.fabrica] = (factoryMap[p.fabrica] || 0) + 1;
      }
    });
    const topFabrica = Object.entries(factoryMap).sort((a, b) => b[1] - a[1])[0] || ["N/A", 0];

    // Ranking de Montadores / Técnicos (Mais Solucionados vs Erros)
    const assemblerMap: Record<string, { total: number; errors: number }> = {};
    pecas.forEach((p) => {
      const tech = p.assignedTechnician || "Não Atribuído";
      if (!assemblerMap[tech]) assemblerMap[tech] = { total: 0, errors: 0 };
      assemblerMap[tech].total += 1;
      if ((p as any).suggestedResponsibility === "ASSEMBLY_ERROR") {
        assemblerMap[tech].errors += 1;
      }
    });

    const topAssembler = Object.entries(assemblerMap)
      .filter(([name]) => name !== "Não Atribuído")
      .sort((a, b) => b[1].total - a[1].total)[0] || ["Sem dados", { total: 0, errors: 0 }];

    return {
      totalItens,
      totalRegistros,
      factoryCases,
      transportCases,
      assemblyCases,
      topFabricaName: topFabrica[0],
      topFabricaCount: topFabrica[1],
      topAssemblerName: topAssembler[0],
      topAssemblerTotal: topAssembler[1].total,
      topAssemblerErrors: topAssembler[1].errors,
    };
  }, [pecas]);

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
        kicker="FVF CHECK • Inteligência & Rastreabilidade"
        title={<span className="text-gold-gradient">Central Analítica de Peças & Defeitos</span>}
        description="Diagnóstico de causa raiz, ranking de montadores, performance de fábricas e rastreabilidade dos chamados."

      />

      {/* Painel Estratégico de Indicadores (KPIs) */}
      <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Stat
          label="Total de Avarias"
          value={analytics.totalRegistros}
          hint={`${analytics.totalItens.toLocaleString("pt-BR")} unidades afetadas`}
          icon={<PackageSearch className="h-5 w-5" />}
          tone="gold"
        />
        <Stat
          label="Ofensor Principal (Fábrica)"
          value={analytics.topFabricaName}
          hint={`${analytics.topFabricaCount} casos registrados`}
          icon={<Building2 className="h-5 w-5" />}
          tone="danger"
        />
        <Stat
          label="Destaque Técnico / Montador"
          value={analytics.topAssemblerName}
          hint={`${analytics.topAssemblerTotal} atendimentos (${analytics.topAssemblerErrors} falhas)`}
          icon={<UserCheck className="h-5 w-5" />}
          tone="gold"
        />
        <Stat
          label="Causa: Falha de Montagem"
          value={analytics.assemblyCases}
          hint={`vs ${analytics.factoryCases} defeitos de fabricação`}
          icon={<Wrench className="h-5 w-5" />}
          tone="info"
        />
      </section>

      {/* Barra de Filtros e Busca Multi-Parâmetro */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-abyss-950/80 p-3 rounded-xl border border-steel-800">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Buscar por Cód. Peça, SKU, NF-e, Técnico ou Fábrica…"
            className="min-w-[260px] flex-1 max-w-md"
          />

          {/* Filtro por Causa Raiz */}
          <div className="flex items-center gap-2 border-l border-steel-800 pl-3">
            <Filter className="h-4 w-4 text-steel-400" />
            <select
              value={responsibilityFilter}
              onChange={(e) => setResponsibilityFilter(e.target.value as FilterResponsibility)}
              className="rounded-lg border border-steel-700 bg-abyss-900 px-3 py-1.5 text-xs text-steel-200 outline-none focus:border-gold-500"
            >
              <option value="TODOS">Todas as Responsabilidades</option>
              <option value="FACTORY_DEFECT">Fábrica / Produção</option>
              <option value="TRANSPORT_DAMAGE">Transportadora</option>
              <option value="ASSEMBLY_ERROR">Montador / Cliente</option>
            </select>
          </div>
        </div>

        <Tabs<FilterDefect>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "TODOS", label: "Todas" },
            { value: "BROKEN", label: "Quebradas" },
            { value: "MISSING", label: "Faltantes" },
            { value: "HARDWARE_FAULT", label: "Ferragens" },
          ]}
        />
      </div>

      {/* Tabela de Rastreabilidade Total */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhuma ocorrência encontrada"
          description="Não há peças registradas no banco para os filtros selecionados."
          icon={<PackageSearch className="h-7 w-7" />}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-steel-700/60 bg-abyss-950/40 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-abyss-900/80 text-[10px] uppercase tracking-[0.18em] text-steel-400 border-b border-steel-800">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Cód. Peça / Data</th>
                  <th className="px-4 py-3 text-left font-semibold">Produto / SKU</th>
                  <th className="px-4 py-3 text-left font-semibold">Fábrica</th>
                  <th className="px-4 py-3 text-left font-semibold">NF-e</th>
                  <th className="px-4 py-3 text-left font-semibold">Causa Raiz</th>
                  <th className="px-4 py-3 text-left font-semibold">Técnico / Montador</th>
                  <th className="px-4 py-3 text-left font-semibold">Chamado</th>
                  <th className="px-4 py-3 text-right font-semibold">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-steel-700/40">
                {filtered.map((p) => {
                  const respKey = (p as any).suggestedResponsibility || "FACTORY_DEFECT";
                  const respConfig = RESPONSIBILITY_CFG[respKey] || RESPONSIBILITY_CFG["FACTORY_DEFECT"];
                  const RespIcon = respConfig.icon;

                  return (
                    <tr key={p.id} className="text-steel-200 transition-colors hover:bg-abyss-800/40">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold text-gold-400">
                          {p.partCode}
                        </span>
                        <p className="mt-0.5 text-[10px] text-steel-500">
                          {formatDate(p.createdAt)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="max-w-[200px] font-semibold text-steel-50 truncate">
                          {p.productName}
                        </p>
                        <p className="max-w-[200px] font-mono text-[11px] text-steel-400 truncate">
                          SKU: {p.productSku}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs text-steel-300 font-medium">
                        {p.fabrica}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-steel-300">
                        {p.danfe}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <RespIcon className={`h-3.5 w-3.5 ${respConfig.color}`} />
                          <span className="text-xs text-steel-200">{respConfig.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gold-300 font-semibold">
                        {p.assignedTechnician || "Não Atribuído"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gold-300">
                        {p.ticketCode}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedPeca(p)}
                          className="rounded-md border border-gold-500/30 bg-gold-500/5 px-2.5 py-1 text-[11px] font-semibold text-gold-300 hover:bg-gold-500/15 transition-all cursor-pointer"
                        >
                          Diagnóstico
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Diagnóstico Detalhado */}
      {selectedPeca && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-steel-700 bg-abyss-900 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-steel-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold-500/30 bg-gold-500/10 text-gold-300">
                  <Tag className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-steel-50 text-base">
                    Rastreabilidade da Peça
                  </h3>
                  <p className="text-xs font-mono text-gold-400">
                    Cód: {selectedPeca.partCode}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPeca(null)}
                className="text-steel-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-steel-800 bg-abyss-950 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-steel-500 block">
                    Tipo de Defeito
                  </span>
                  <div className="mt-1">
                    <Badge variant={DEFECT_CFG[selectedPeca.defectType].variant}>
                      {DEFECT_CFG[selectedPeca.defectType].label}
                    </Badge>
                  </div>
                </div>

                <div className="rounded-xl border border-steel-800 bg-abyss-950 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-steel-500 block">
                    Quantidade Avariada
                  </span>
                  <p className="mt-1 font-mono text-base font-bold text-steel-100">
                    {selectedPeca.quantity} unidade(s)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-steel-800 bg-abyss-950 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-steel-500 block">
                    Solicitante
                  </span>
                  <p className="mt-1 text-xs font-semibold text-steel-100">
                    {selectedPeca.openedBy}
                  </p>
                </div>
                <div className="rounded-xl border border-steel-800 bg-abyss-950 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-steel-500 block">
                    Técnico / Montador
                  </span>
                  <p className="mt-1 text-xs font-semibold text-gold-300">
                    {selectedPeca.assignedTechnician || "Não atribuído"}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-steel-800 bg-abyss-950 p-4 space-y-2.5">
                <div className="flex justify-between border-b border-steel-800/60 pb-2 text-xs">
                  <span className="text-steel-400">Produto:</span>
                  <span className="font-semibold text-steel-100">{selectedPeca.productName}</span>
                </div>
                <div className="flex justify-between border-b border-steel-800/60 pb-2 text-xs">
                  <span className="text-steel-400">SKU:</span>
                  <span className="font-mono text-steel-200">{selectedPeca.productSku}</span>
                </div>
                <div className="flex justify-between border-b border-steel-800/60 pb-2 text-xs">
                  <span className="text-steel-400">Fábrica / Produção:</span>
                  <span className="text-steel-200">{selectedPeca.fabrica}</span>
                </div>
                <div className="flex justify-between border-b border-steel-800/60 pb-2 text-xs">
                  <span className="text-steel-400">DANFE / NF-e:</span>
                  <span className="font-mono text-steel-200">{selectedPeca.danfe}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-steel-400">Chamado Vinculado:</span>
                  <span className="font-mono font-bold text-gold-300">{selectedPeca.ticketCode}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-steel-800">
              <Button onClick={() => setSelectedPeca(null)}>Fechar Diagnóstico</Button>
            </div>
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