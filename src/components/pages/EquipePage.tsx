import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Star,
  UserCheck,
  Users,
  Wrench,
  Loader2,
  Mail,
} from "lucide-react";
import { teamService, type TeamMember } from "../../services/team.service";
import { PageHeader } from "../ui/PageHeader";
import { Stat } from "../ui/Stat";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Tabs } from "../ui/Tabs";
import { SearchInput } from "../ui/SearchInput";
import { EmptyState } from "../ui/EmptyState";
import { cn } from "../../utils/cn";

type FilterStatus = "TODOS" | "ATIVO" | "INATIVO";
type FilterRole = "TODOS" | "ASSEMBLER" | "ANALYST";

export function EquipePage() {
  const [membros, setMembros] = useState<TeamMember[]>([]);
  const [roleFilter, setRoleFilter] = useState<FilterRole>("TODOS");
  const [newRole, setNewRole] = useState<"ASSEMBLER" | "ANALYST">("ASSEMBLER");
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
      const data = await teamService.getAll();
      setMembros(data);
    } catch (error) {
      console.error("Erro ao carregar equipe:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateMember(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSubmitting(true);

      if (newRole === "ASSEMBLER") {
        await teamService.createAssembler({
          name: newName,
          email: newEmail,
          password: newPassword,
        });
      } else {
        await teamService.createAnalyst({
          name: newName,
          email: newEmail,
          password: newPassword,
        });
      }

      setIsModalOpen(false);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      await loadData();
    } catch (error) {
      console.error("Erro ao cadastrar membro da equipe:", error);
      alert("Erro ao cadastrar. Verifique os dados.");
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = useMemo(() => {
    return membros.filter((m) => {
      if (roleFilter !== "TODOS" && m.role !== roleFilter) return false;
      if (filter === "ATIVO" && !m.active) return false;
      if (filter === "INATIVO" && m.active) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
      );
    });
  }, [membros, query, filter, roleFilter]);

  const ativosCount = membros.filter((m) => m.active).length;
  const inativosCount = membros.filter((m) => !m.active).length;

  const npsMedio = membros.length
    ? Math.round(
        membros.reduce((a, m: any) => a + (m.nps || 0), 0) / membros.length,
      )
    : 0;

  const taxaErroMedia = membros.length
    ? (
        membros.reduce((a, m: any) => a + (m.errorRate || 0), 0) /
        membros.length
      ).toFixed(1)
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
          value={ativosCount}
          hint={`${inativosCount} inativos`}
          icon={<UserCheck className="h-5 w-5" />}
          tone="gold"
        />
        <Stat
          label="Equipe total"
          value={membros.length}
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
          placeholder="Buscar montador por nome ou e-mail…"
          className="min-w-60 flex-1 max-w-md"
        />
        <Tabs<FilterRole>
          value={roleFilter}
          onChange={setRoleFilter}
          options={[
            { value: "TODOS", label: "Todos" },
            { value: "ASSEMBLER", label: "Montadores" },
            { value: "ANALYST", label: "Analistas" },
          ]}
        />
        <Tabs<FilterStatus>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "TODOS", label: "Todos" },
            { value: "ATIVO", label: "Ativos", count: ativosCount },
            { value: "INATIVO", label: "Inativos", count: inativosCount },
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
          {filtered.map((m: any) => (
            <article
              key={m.id}
              className="rounded-xl border border-steel-700/60 bg-linear-to-b from-abyss-800/80 to-abyss-900/80 p-4 transition-colors hover:border-gold-500/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-gold-400 to-gold-600 text-sm font-bold text-abyss-950">
                    {initials(m.name)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-steel-50">{m.name}</h3>
                    <p className="text-[11px] text-steel-400">
                      {m.team || "Equipe de Campo"}
                    </p>
                  </div>
                </div>
                <Badge variant={m.active ? "success" : "muted"}>
                  {m.active ? "Ativo / Disponível" : "Inativo"}
                </Badge>
              </div>

              <div className="mt-3 flex items-center gap-1.5 text-xs text-steel-300 truncate">
                <Mail className="h-3.5 w-3.5 shrink-0 text-steel-400" />
                <span className="truncate">{m.email}</span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <Mini label="Hoje" value={m.ticketsToday || 0} />
                <Mini label="Total" value={m.ticketsTotal || 0} />
                <Mini
                  label="Erro"
                  value={`${m.errorRate || 0}%`}
                  tone={(m.errorRate || 0) > 2 ? "danger" : "default"}
                />
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-steel-500">
                  <span>NPS</span>
                  <span className="font-mono text-gold-300">{m.nps || 0}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-abyss-950">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-gold-600 to-gold-400"
                    style={{ width: `${Math.min(m.nps || 0, 100)}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button size="sm" className="w-full" disabled={!m.active}>
                  Atribuir Visita
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
            <h3 className="font-bold text-steel-50 text-base">
              Cadastrar Novo Montador
            </h3>

            <form onSubmit={handleCreateMember} className="space-y-3">
              <div>
                <label className="text-xs text-steel-400 block mb-1">
                  Nome Completo
                </label>
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
                <label className="text-xs text-steel-400 block mb-1">
                  E-mail de Acesso
                </label>
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
                <label className="text-xs text-steel-400 block mb-1">
                  Senha de Acesso
                </label>
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
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Salvar Montador"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function initials(name: string) {
  return name
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
