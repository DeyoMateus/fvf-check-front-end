import { useEffect, useMemo, useState } from "react";
import {
  Phone,
  Plus,
  Star,
  UserCheck,
  Users,
  Wrench,
  Loader2,
  Mail,
} from "lucide-react";
import { montadoresService, type Montador } from "../../services/montadores.service";
import { PageHeader } from "../ui/PageHeader";
import { Stat } from "../ui/Stat";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Tabs } from "../ui/Tabs";
import { SearchInput } from "../ui/SearchInput";
import { EmptyState } from "../ui/EmptyState";
import { cn } from "../../utils/cn";

// Status alinhados com o booleano 'active' do modelo User no Prisma
type FilterStatus = "TODOS" | "DISPONIVEL" | "INATIVO";

const STATUS_CFG: Record<
  "DISPONIVEL" | "INATIVO",
  { label: string; variant: "success" | "muted" }
> = {
  DISPONIVEL: { label: "Ativo / Disponível", variant: "success" },
  INATIVO: { label: "Inativo", variant: "muted" },
};

export function MontadoresPage() {
  const [montadores, setMontadores] = useState<Montador[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("TODOS");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      const data = await montadoresService.getAll();
      setMontadores(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateAssembler(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSubmitting(true);
      await montadoresService.create({
        name: newName,
        email: newEmail,
        password: newPassword,
      });
      setIsModalOpen(false);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      loadData();
    } catch (error) {
      console.error("Erro ao cadastrar montador:", error);
      alert("Erro ao cadastrar montador. Verifique os dados.");
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = useMemo(() => {
    return montadores.filter((m) => {
      if (filter !== "TODOS" && m.status !== filter) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        m.nome.toLowerCase().includes(q) ||
        m.equipe.toLowerCase().includes(q) ||
        m.telefone.toLowerCase().includes(q)
      );
    });
  }, [montadores, query, filter]);

  // Cálculos dinâmicos baseados no estado 'montadores' trazido do backend
  const disponiveis = montadores.filter((m) => m.status === "DISPONIVEL").length;
  const inativos = montadores.filter((m) => m.status === "INATIVO").length;
  
  const npsMedio = montadores.length
    ? Math.round(montadores.reduce((a, m) => a + m.nps, 0) / montadores.length)
    : 0;

  const taxaErroMedia = montadores.length
    ? (montadores.reduce((a, m) => a + m.taxaErro, 0) / montadores.length).toFixed(1)
    : "0.0";

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
        kicker="FVF CHECK • Campo"
        title={
          <>
            Equipe de <span className="text-gold-gradient">Montadores</span>
          </>
        }
        description="Acompanhe a lista de profissionais de montagem ativos na sua operação."
        actions={
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo montador
          </Button>
        }
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          label="Montadores ativos"
          value={disponiveis}
          hint={`${inativos} inativos`}
          icon={<UserCheck className="h-5 w-5" />}
          tone="gold"
        />
        <Stat
          label="Equipe total"
          value={montadores.length}
          hint="Cadastrados no tenant"
          icon={<Users className="h-5 w-5" />}
        />
        <Stat
          label="NPS médio"
          value={npsMedio}
          hint="Pós-montagem"
          icon={<Star className="h-5 w-5" />}
          tone="info"
        />
        <Stat
          label="Taxa de erro"
          value={`${taxaErroMedia}%`}
          hint="Média de assistência"
          icon={<Wrench className="h-5 w-5" />}
          tone={Number(taxaErroMedia) > 2 ? "danger" : "default"}
        />
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Buscar montador por nome, equipe ou e-mail…"
          className="min-w-[240px] flex-1 max-w-md"
        />
        <Tabs<FilterStatus>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "TODOS", label: "Todos" },
            { value: "DISPONIVEL", label: "Ativos", count: disponiveis },
            { value: "INATIVO", label: "Inativos", count: inativos },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhum montador encontrado"
          description="Ajuste os filtros de busca ou cadastre um novo profissional."
          icon={<Users className="h-7 w-7" />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((m) => (
            <article
              key={m.id}
              className="rounded-xl border border-steel-700/60 bg-gradient-to-b from-abyss-800/80 to-abyss-900/80 p-4 transition-colors hover:border-gold-500/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-sm font-bold text-abyss-950">
                    {initials(m.nome)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-steel-50">{m.nome}</h3>
                    <p className="text-[11px] text-steel-400">{m.equipe}</p>
                  </div>
                </div>
                <Badge variant={STATUS_CFG[m.status].variant}>
                  {STATUS_CFG[m.status].label}
                </Badge>
              </div>

              <div className="mt-3 flex items-center gap-1 text-xs text-steel-300 truncate">
                <Mail className="h-3.5 w-3.5 shrink-0 text-steel-400" />
                <span className="truncate">{m.telefone}</span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <Mini label="Hoje" value={m.ticketsHoje} />
                <Mini label="Total" value={m.ticketsMes} />
                <Mini
                  label="Erro"
                  value={`${m.taxaErro}%`}
                  tone={m.taxaErro > 2 ? "danger" : "default"}
                />
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-steel-500">
                  <span>NPS</span>
                  <span className="font-mono text-gold-300">{m.nps}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-abyss-950">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-400"
                    style={{ width: `${m.nps}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1">
                  <Phone className="h-3.5 w-3.5" />
                  Contatar
                </Button>
                <Button size="sm" className="flex-1" disabled={m.status !== "DISPONIVEL"}>
                  Atribuir ticket
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* MODAL DE CADASTRO DE NOVO MONTADOR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-steel-700 bg-abyss-900 p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-steel-50 text-base">Cadastrar Novo Montador</h3>
            
            <form onSubmit={handleCreateAssembler} className="space-y-3">
              <div>
                <label className="text-xs text-steel-400 block mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-lg border border-steel-700 bg-abyss-950 px-3 py-2 text-sm text-steel-100 focus:border-gold-500 outline-none"
                  placeholder="Ex: João da Silva"
                />
              </div>

              <div>
                <label className="text-xs text-steel-400 block mb-1">E-mail de Acesso</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full rounded-lg border border-steel-700 bg-abyss-950 px-3 py-2 text-sm text-steel-100 focus:border-gold-500 outline-none"
                  placeholder="joao@email.com"
                />
              </div>

              <div>
                <label className="text-xs text-steel-400 block mb-1">Senha de Acesso</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-steel-700 bg-abyss-950 px-3 py-2 text-sm text-steel-100 focus:border-gold-500 outline-none"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar Montador"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function initials(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function Mini({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "danger";
}) {
  return (
    <div className="rounded-lg border border-steel-700/40 bg-abyss-950/40 px-2 py-2 text-center">
      <p className="text-[9px] font-bold uppercase tracking-widest text-steel-500">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 font-mono text-sm font-bold tabular-nums",
          tone === "danger" ? "text-red-300" : "text-steel-100",
        )}
      >
        {value}
      </p>
    </div>
  );
}