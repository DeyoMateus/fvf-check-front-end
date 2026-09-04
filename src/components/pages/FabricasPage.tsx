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
  X,
  Loader2,
  Check,
  Clock,
  AlertTriangle,
  Trash2,
  UserX,
  UserCheck,
  User,
  Mail,
  Lock,
  Globe,
  Settings,
  Lock as LockIcon,
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
import { calcularScoreInteligente } from "../../utils/score";

type FilterStatus = "TODOS" | Fabrica["status"];

const STATUS_BADGE: Record<
  Fabrica["status"],
  { label: string; variant: "success" | "warning" | "danger" }
> = {
  ATIVA: { label: "Ativa", variant: "success" },
  EM_AUDITORIA: { label: "Em auditoria", variant: "warning" },
  SUSPENSA: { label: "Suspensa", variant: "danger" },
};

const INITIAL_FORM = {
  nome: "",
  cnpj: "",
  cidade: "",
  uf: "",
  planType: "FABRICA" as "LOJISTA" | "REDE" | "FABRICA",
  webhookUrl: "",
  parentId: "",
  adminName: "",
  adminEmail: "",
  adminPassword: "",
  status: "ATIVA" as Fabrica["status"],
  slaMetaHoras: 24,
};

export function FabricasPage() {
  const [fabricas, setFabricas] = useState<Fabrica[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("TODOS");
  const [selected, setSelected] = useState<Fabrica | null>(null);

  // Modal de Novo Cadastro
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);

  // Modal de Configurações da Empresa (Engrenagem)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    cidade: "",
    uf: "",
    slaMetaHoras: 24,
    webhookUrl: "",
    parentId: "",
    contactEmail: "",
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Estado para ações críticas (Suspender / Excluir)
  const [actionLoading, setActionLoading] = useState(false);

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

  const handleSelectFabrica = (f: Fabrica) => {
    setSelected(f);
  };

  // Abrir Modal de Configurações
  const handleOpenSettings = (f: Fabrica) => {
    setEditFormData({
      cidade: f.cidade || "",
      uf: f.uf || "",
      slaMetaHoras: f.slaMetaHoras ?? 24,
      webhookUrl: f.webhookUrl || "",
      parentId: f.parentId || "",
      contactEmail: f.contactEmail || "",
    });
    setIsSettingsOpen(true);
  };

  // Salvar Alterações de Configuração
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    try {
      setSavingSettings(true);
      const payload = {
        city: editFormData.cidade,
        state: editFormData.uf,
        slaMetaHoras: Number(editFormData.slaMetaHoras),
        webhookUrl: editFormData.webhookUrl || null,
        parentId: editFormData.parentId || null,
        contactEmail: editFormData.contactEmail || undefined,
      };

      const fabricaAtualizada = await fabricasService.update(selected.id, payload);

      setFabricas((prev) =>
        prev.map((item) => (item.id === selected.id ? fabricaAtualizada : item))
      );
      setSelected(fabricaAtualizada);
      setIsSettingsOpen(false);
    } catch (err) {
      console.error("Erro ao salvar configurações da empresa:", err);
    } finally {
      setSavingSettings(false);
    }
  };

  // Alterar Status (Suspender / Reativar)
  const handleToggleStatus = async () => {
    if (!selected) return;
    const nextActiveState = selected.status === "SUSPENSA";

    try {
      setActionLoading(true);
      await fabricasService.updateStatus(selected.id, nextActiveState);

      const updatedStatus: Fabrica["status"] = nextActiveState ? "ATIVA" : "SUSPENSA";
      const fabricaAtualizada: Fabrica = { ...selected, status: updatedStatus };

      setFabricas((prev) =>
        prev.map((item) => (item.id === selected.id ? fabricaAtualizada : item))
      );
      setSelected(fabricaAtualizada);
    } catch (err) {
      console.error("Erro ao alterar status da empresa:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Excluir Cadastro
  const handleDeleteEmpresa = async () => {
    if (!selected) return;
    if (
      !confirm(
        `Tem certeza que deseja excluir permanentemente a empresa "${selected.nome}"? Esta ação não pode ser desfeita.`
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);
      await fabricasService.delete(selected.id);

      const updatedFabricas = fabricas.filter((item) => item.id !== selected.id);
      setFabricas(updatedFabricas);
      setSelected(updatedFabricas.length > 0 ? updatedFabricas[0] : null);
      setIsSettingsOpen(false);
    } catch (err) {
      console.error("Erro ao excluir empresa:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return fabricas.filter((f) => {
      if (filter !== "TODOS" && f.status !== filter) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        f.nome.toLowerCase().includes(q) ||
        f.cidade.toLowerCase().includes(q) ||
        f.especialidade?.toLowerCase().includes(q) ||
        f.cnpj.includes(q)
      );
    });
  }, [fabricas, query, filter]);

  const ativas = fabricas.filter((f) => f.status === "ATIVA").length;
  const rmaTotal = fabricas.reduce((a, f) => a + f.rmaAbertos, 0);

  const mediaQualidade = fabricas.length
    ? Math.round(
        fabricas.reduce((a, f) => a + calcularScoreInteligente(f), 0) / fabricas.length
      )
    : 0;

  const handleCreateEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        name: formData.nome,
        document: formData.cnpj,
        city: formData.cidade,
        state: formData.uf,
        planType: formData.planType,
        webhookUrl: formData.webhookUrl || undefined,
        parentId: formData.parentId || undefined,
        adminName: formData.adminName,
        adminEmail: formData.adminEmail,
        adminPassword: formData.adminPassword,
        slaMetaHoras: formData.slaMetaHoras,
      };

      const novaEmpresa = await fabricasService.create(payload);

      setFabricas((prev) => [novaEmpresa, ...prev]);
      handleSelectFabrica(novaEmpresa);
      setIsModalOpen(false);
      setFormData(INITIAL_FORM);
    } catch (err) {
      console.error("Erro ao cadastrar empresa:", err);
    } finally {
      setSaving(false);
    }
  };

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
        description="Gestão de parceiros, score de qualidade inteligente e parâmetros de SLA."
        actions={
          <Button onClick={() => setIsModalOpen(true)}>
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
          label="Score médio real"
          value={mediaQualidade}
          hint="Calculado por tickets/SLA"
          icon={<Star className="h-5 w-5" />}
          tone="info"
        />
        <Stat
          label="Lotes ativos"
          value={fabricas.reduce((a, f) => a + (f.lotesAtivos || 0), 0)}
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
            {filtered.map((f) => {
              const scoreDinamico = calcularScoreInteligente(f);
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleSelectFabrica(f)}
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
                          {f.especialidade || "Assistência Técnica"}
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
                    <MiniKpi
                      label="Score Qualidade"
                      value={`${scoreDinamico}/100`}
                      tone={scoreDinamico < 60 ? "danger" : "default"}
                    />
                    <MiniKpi label="SLA Médio" value={`${f.slaMedioHoras}h`} />
                    <MiniKpi
                      label="RMA Abertos"
                      value={f.rmaAbertos}
                      tone={f.rmaAbertos > 5 ? "danger" : "default"}
                    />
                    <MiniKpi
                      label="Meta SLA"
                      value={`${f.slaMetaHoras ?? 24}h`}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          <aside className="xl:col-span-2">
            {selected ? (
              <div className="sticky top-4 rounded-xl border border-steel-700/60 bg-gradient-to-b from-abyss-800/80 to-abyss-900/90 p-5 space-y-5">
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-400">
                      Painel Analítico do Parceiro
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant={STATUS_BADGE[selected.status]?.variant || "success"}>
                        {selected.status}
                      </Badge>

                      {/* Botão de Engrenagem (Configurações Ocultas) */}
                      <button
                        type="button"
                        onClick={() => handleOpenSettings(selected)}
                        title="Configurações da Empresa"
                        className="rounded-lg border border-steel-700 p-1.5 text-steel-400 hover:border-gold-500/50 hover:bg-steel-800 hover:text-gold-300 transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="mt-2 text-lg font-bold text-steel-50">
                    {selected.nome}
                  </h3>
                  <p className="text-xs text-steel-400">
                    {selected.especialidade || "Assistência Técnica"}
                  </p>
                </div>

                <div className="space-y-3 text-sm border-t border-b border-steel-800/80 py-4">
                  <DetailRow label="CNPJ" value={selected.cnpj} mono />
                  <DetailRow
                    label="Localização"
                    value={`${selected.cidade} / ${selected.uf}`}
                  />
                  <DetailRow label="E-mail de Contato" value={selected.contactEmail || "N/A"} />
                </div>

                <div className="rounded-lg border border-steel-700/60 bg-abyss-950/80 p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-steel-300">
                    <Clock className="h-4 w-4 text-gold-400" />
                    SLA Alvo Contratado
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-xs text-steel-400">Tempo limite de resposta:</span>
                    <span className="font-mono text-base font-bold text-gold-300">
                      {selected.slaMetaHoras ?? 24}h
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-steel-400 flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-gold-400" />
                    Métricas da Assistência Técnica
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-steel-800 bg-abyss-950/60 p-3">
                      <div className="flex items-center gap-1.5 text-steel-400 text-[11px] mb-1">
                        <Layers className="h-3.5 w-3.5 text-gold-400" />
                        Lotes Ativos
                      </div>
                      <p className="font-mono text-base font-bold text-steel-50">
                        {selected.lotesAtivos || 0}
                      </p>
                    </div>

                    <div className="rounded-lg border border-steel-800 bg-abyss-950/60 p-3">
                      <div className="flex items-center gap-1.5 text-steel-400 text-[11px] mb-1">
                        <Activity className="h-3.5 w-3.5 text-gold-400" />
                        SLA Real Médio
                      </div>
                      <p className="font-mono text-base font-bold text-steel-50">
                        {selected.slaMedioHoras}h
                      </p>
                    </div>
                  </div>

                  {((selected as any).rmaEstourados || 0) > 0 && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-300">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>
                        Possui <strong>{(selected as any).rmaEstourados}</strong> ticket(s) com SLA estourado!
                      </span>
                    </div>
                  )}

                  {(() => {
                    const score = calcularScoreInteligente(selected);
                    return (
                      <div className="rounded-lg border border-steel-800 bg-abyss-950/60 p-3.5 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-steel-400 font-medium">Score de Qualidade Operacional</span>
                          <span
                            className={cn(
                              "font-mono font-bold",
                              score >= 80
                                ? "text-emerald-400"
                                : score >= 50
                                ? "text-gold-300"
                                : "text-red-400"
                            )}
                          >
                            {score}/100
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-abyss-950">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              score >= 80
                                ? "bg-gradient-to-r from-emerald-600 to-emerald-400"
                                : score >= 50
                                ? "bg-gradient-to-r from-gold-600 to-gold-400"
                                : "bg-gradient-to-r from-red-600 to-red-400"
                            )}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}
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

      {/* MODAL DE CONFIGURAÇÕES (ENGRENAGEM) */}
      {isSettingsOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl rounded-xl border border-steel-700 bg-abyss-900 p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-steel-800 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-gold-400" />
                <h3 className="text-lg font-bold text-steel-50">
                  Configurações da Empresa
                </h3>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="rounded-lg p-1 text-steel-400 hover:bg-steel-800 hover:text-steel-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="mt-4 space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              {/* DADOS PROTEGIDOS (NÃO EDITÁVEIS) */}
              <div className="rounded-lg border border-steel-800/80 bg-abyss-950/60 p-3.5 space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-steel-400 flex items-center gap-1.5">
                  <LockIcon className="h-3.5 w-3.5 text-gold-400" />
                  Identificação do Cadastro (Protegido)
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-steel-400">Razão Social</label>
                    <input
                      type="text"
                      disabled
                      value={selected.nome}
                      className="mt-1 w-full rounded-lg border border-steel-800 bg-abyss-950 px-3 py-2 text-sm text-steel-400 opacity-60 cursor-not-allowed select-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-steel-400">CNPJ</label>
                    <input
                      type="text"
                      disabled
                      value={selected.cnpj}
                      className="mt-1 w-full rounded-lg border border-steel-800 bg-abyss-950 px-3 py-2 text-sm text-steel-400 font-mono opacity-60 cursor-not-allowed select-none"
                    />
                  </div>
                </div>
              </div>

              {/* DADOS EDITÁVEIS */}
              <div className="space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-steel-300">
                  Parâmetros Editáveis
                </p>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-steel-300">Cidade *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.cidade}
                      onChange={(e) => setEditFormData({ ...editFormData, cidade: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-steel-700 bg-abyss-950 px-3 py-2 text-sm text-steel-100 focus:border-gold-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-steel-300">UF *</label>
                    <input
                      type="text"
                      required
                      maxLength={2}
                      value={editFormData.uf}
                      onChange={(e) => setEditFormData({ ...editFormData, uf: e.target.value.toUpperCase() })}
                      className="mt-1 w-full rounded-lg border border-steel-700 bg-abyss-950 px-3 py-2 text-sm text-steel-100 focus:border-gold-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-steel-300">Meta SLA (Horas) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="720"
                      value={editFormData.slaMetaHoras}
                      onChange={(e) => setEditFormData({ ...editFormData, slaMetaHoras: Number(e.target.value) })}
                      className="mt-1 w-full rounded-lg border border-steel-700 bg-abyss-950 px-3 py-2 text-sm text-steel-100 focus:border-gold-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-steel-300 flex items-center gap-1">
                      <Mail className="h-3 w-3 text-steel-400" /> E-mail de Contato
                    </label>
                    <input
                      type="email"
                      value={editFormData.contactEmail}
                      onChange={(e) => setEditFormData({ ...editFormData, contactEmail: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-steel-700 bg-abyss-950 px-3 py-2 text-sm text-steel-100 focus:border-gold-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-steel-300">Webhook URL</label>
                  <input
                    type="url"
                    value={editFormData.webhookUrl}
                    onChange={(e) => setEditFormData({ ...editFormData, webhookUrl: e.target.value })}
                    placeholder="https://api.empresa.com/webhooks/fvf"
                    className="mt-1 w-full rounded-lg border border-steel-700 bg-abyss-950 px-3 py-2 text-sm text-steel-100 focus:border-gold-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* ZONA DE PERIGO (AÇÕES DE RISCO) */}
              <div className="border-t border-steel-800 pt-4 space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-red-400 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Zona de Perigo
                </p>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                  <div>
                    <p className="text-xs font-semibold text-steel-100">Status da Conta</p>
                    <p className="text-[11px] text-steel-400">
                      {selected.status === "SUSPENSA"
                        ? "A empresa está suspensa e bloqueada para operações."
                        : "Suspenda para interromper temporariamente o acesso."}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleToggleStatus}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors shrink-0",
                      selected.status === "SUSPENSA"
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                        : "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                    )}
                  >
                    {actionLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : selected.status === "SUSPENSA" ? (
                      <>
                        <UserCheck className="h-3.5 w-3.5" /> Reativar Empresa
                      </>
                    ) : (
                      <>
                        <UserX className="h-3.5 w-3.5" /> Suspender Empresa
                      </>
                    )}
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                  <div>
                    <p className="text-xs font-semibold text-red-300">Excluir Registro</p>
                    <p className="text-[11px] text-red-400/80">
                      Remove esta empresa permanentemente do sistema.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleDeleteEmpresa}
                    className="flex items-center gap-1.5 rounded-lg border border-red-500/50 bg-red-600/20 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-600/40 transition-colors shrink-0"
                  >
                    {actionLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="h-3.5 w-3.5" /> Excluir Permanentemente
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-steel-800">
                <Button variant="outline" type="button" onClick={() => setIsSettingsOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={savingSettings}>
                  {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {savingSettings ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE NOVO CADASTRO COMPLETO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl rounded-xl border border-steel-700 bg-abyss-900 p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-steel-800 pb-3">
              <h3 className="text-lg font-bold text-steel-50">Nova Empresa Partner</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-steel-400 hover:bg-steel-800 hover:text-steel-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmpresa} className="mt-4 space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-semibold text-steel-300">
                  Tipo de Conta / Perfil *
                </label>
                <select
                  value={formData.planType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      planType: e.target.value as "LOJISTA" | "REDE" | "FABRICA",
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-steel-700 bg-abyss-950 px-3 py-2 text-sm text-steel-100 focus:border-gold-500 focus:outline-none"
                >
                  <option value="FABRICA">Fábrica / Indústria</option>
                  <option value="LOJISTA">Lojista Independente</option>
                  <option value="REDE">Rede de Lojas</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-steel-300">
                  Razão Social / Nome Fantasia *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Móveis Estrela LTDA"
                  className="mt-1 w-full rounded-lg border border-steel-700 bg-abyss-950 px-3 py-2 text-sm text-steel-100 focus:border-gold-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-steel-300">CNPJ *</label>
                  <input
                    type="text"
                    required
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    placeholder="00.000.000/0001-00"
                    className="mt-1 w-full rounded-lg border border-steel-700 bg-abyss-950 px-3 py-2 text-sm text-steel-100 focus:border-gold-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-steel-300">Meta SLA Inicial (Horas) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.slaMetaHoras}
                    onChange={(e) => setFormData({ ...formData, slaMetaHoras: Number(e.target.value) })}
                    className="mt-1 w-full rounded-lg border border-steel-700 bg-abyss-950 px-3 py-2 text-sm text-steel-100 focus:border-gold-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-steel-300">Cidade *</label>
                  <input
                    type="text"
                    required
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    placeholder="Ubá"
                    className="mt-1 w-full rounded-lg border border-steel-700 bg-abyss-950 px-3 py-2 text-sm text-steel-100 focus:border-gold-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-steel-300">UF *</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={formData.uf}
                    onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase() })}
                    placeholder="MG"
                    className="mt-1 w-full rounded-lg border border-steel-700 bg-abyss-950 px-3 py-2 text-sm text-steel-100 focus:border-gold-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* DADOS DO ADMINISTRADOR DA CONTA */}
              <div className="border-t border-steel-800 pt-3 space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Administrador da Conta
                </p>

                <div>
                  <label className="block text-xs font-semibold text-steel-300">Nome Completo do Admin *</label>
                  <input
                    type="text"
                    required
                    value={formData.adminName}
                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                    placeholder="Ex: João da Silva"
                    className="mt-1 w-full rounded-lg border border-steel-700 bg-abyss-950 px-3 py-2 text-sm text-steel-100 focus:border-gold-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-steel-300 flex items-center gap-1">
                      <Mail className="h-3 w-3 text-steel-400" /> E-mail de Acesso *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                      placeholder="admin@empresa.com"
                      className="mt-1 w-full rounded-lg border border-steel-700 bg-abyss-950 px-3 py-2 text-sm text-steel-100 focus:border-gold-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-steel-300 flex items-center gap-1">
                      <Lock className="h-3 w-3 text-steel-400" /> Senha Inicial *
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.adminPassword}
                      onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                      placeholder="••••••••"
                      className="mt-1 w-full rounded-lg border border-steel-700 bg-abyss-950 px-3 py-2 text-sm text-steel-100 focus:border-gold-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* INTEGRAÇÕES E CONFIGURAÇÕES AVANÇADAS */}
              <div className="border-t border-steel-800 pt-3 space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" /> Integrações (Opcional)
                </p>

                <div>
                  <label className="block text-xs font-semibold text-steel-300">Webhook URL</label>
                  <input
                    type="url"
                    value={formData.webhookUrl}
                    onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                    placeholder="https://api.empresa.com/webhooks/fvf"
                    className="mt-1 w-full rounded-lg border border-steel-700 bg-abyss-950 px-3 py-2 text-sm text-steel-100 focus:border-gold-500 focus:outline-none"
                  />
                </div>

                {formData.planType === "LOJISTA" && (
                  <div>
                    <label className="block text-xs font-semibold text-steel-300">ID da Rede / Matriz (Parent ID)</label>
                    <input
                      type="text"
                      value={formData.parentId}
                      onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                      placeholder="Identificador da rede caso pertença a um grupo"
                      className="mt-1 w-full rounded-lg border border-steel-700 bg-abyss-950 px-3 py-2 text-sm text-steel-100 focus:border-gold-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-steel-800">
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {saving ? "Salvando..." : "Cadastrar no Banco"}
                </Button>
              </div>
            </form>
          </div>
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
      <span className={cn("text-right text-steel-100 text-xs", mono && "font-mono")}>
        {value}
      </span>
    </div>
  );
}