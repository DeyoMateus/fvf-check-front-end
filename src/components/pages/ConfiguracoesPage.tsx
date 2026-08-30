import { useState, useEffect } from "react";
import { Building2, Check, Save, User } from "lucide-react";
import { PageHeader } from "../ui/PageHeader";
import { Button } from "../ui/Button";
import { cn } from "../../utils/cn";
import { settingsService } from "../../services/settings.Service";
import { useAuth } from "../../contexts/AuthContext";
import { formatUserRole } from "../../utils/formatters";

type Section = "perfil" | "empresa";

const SECTIONS: {
  id: Section;
  label: string;
  icon: typeof User;
  desc: string;
}[] = [
  { id: "perfil", label: "Meu perfil", icon: User, desc: "Dados do gestor" },
  { id: "empresa", label: "Empresa", icon: Building2, desc: "Rede / loja" },
];

export function ConfiguracoesPage() {
  const { user, refreshUser } = useAuth();

  const [section, setSection] = useState<Section>("perfil");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  // form state
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await settingsService.getSettings();
        if (data) {
          setNome(data.nome || user?.name || "");
          setEmail(data.email || user?.email || "");
          setEmpresa(data.empresa || "");
          setCnpj(data.cnpj || "");
          setTimezone(data.timezone || "America/Sao_Paulo");
        }
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
      }
    }
    loadSettings();
  }, [user]);

  async function salvar() {
    try {
      setLoading(true);

      // Payload sem a propriedade 'cargo' para respeitar o UpdateSettingsPayload
      await settingsService.updateSettings({
        nome,
        email,
        empresa,
        cnpj,
        timezone,
      });

      await refreshUser();

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
    } finally {
      setLoading(false);
    }
  }

  const avatarInitials = nome
    ? nome
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "US";

  return (
    <div className="space-y-5">
      <PageHeader
        kicker="FVF CHECK • Sistema"
        title={<span className="text-gold-gradient">Configurações</span>}
        description="Preferências da conta e dados da operação."
        actions={
          <Button onClick={salvar} disabled={loading}>
            {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? "Salvo" : loading ? "Salvando..." : "Salvar alterações"}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <nav className="space-y-1 rounded-xl border border-steel-700/60 bg-abyss-950/40 p-2 lg:col-span-1">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const active = section === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSection(s.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all",
                  active
                    ? "bg-gold-500/10 text-gold-200 shadow-[inset_0_0_0_1px_rgba(227,185,33,0.25)]"
                    : "text-steel-300 hover:bg-abyss-800/60 hover:text-steel-100",
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "text-gold-300" : "text-steel-400")} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{s.label}</p>
                  <p className="text-[10px] text-steel-500">{s.desc}</p>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="rounded-xl border border-steel-700/60 bg-gradient-to-b from-abyss-800/70 to-abyss-900/70 p-5 lg:col-span-3">
          {section === "perfil" && (
            <SectionBlock
              title="Meu perfil"
              desc="Informações exibidas no painel e nos comentários de triagem."
            >
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-lg font-bold text-abyss-950">
                  {avatarInitials}
                </div>
                <div>
                  <p className="font-semibold text-steel-50">{nome || user?.name}</p>
                  <p className="text-xs text-steel-400">{formatUserRole(user?.role)}</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Alterar foto
                  </Button>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Nome completo">
                  <input className={inputCls} value={nome} onChange={(e) => setNome(e.target.value)} />
                </Field>
                <Field label="E-mail corporativo">
                  <input className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field>
                <Field label="Função / Nível de Acesso">
                  <input
                    className={cn(inputCls, "opacity-75 cursor-not-allowed")}
                    value={formatUserRole(user?.role)}
                    readOnly
                    disabled
                  />
                </Field>
                <Field label="Fuso horário">
                  <select
                    className={inputCls}
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                  >
                    <option value="America/Sao_Paulo">America/São Paulo (BRT)</option>
                    <option value="America/Manaus">America/Manaus (AMT)</option>
                    <option value="America/Fortaleza">America/Fortaleza (BRT)</option>
                  </select>
                </Field>
              </div>
            </SectionBlock>
          )}

          {section === "empresa" && (
            <SectionBlock
              title="Empresa / Rede"
              desc="Dados fiscais e operacionais usados em Danfe, RMA e relatórios."
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Razão social / marca">
                  <input
                    className={inputCls}
                    value={empresa}
                    onChange={(e) => setEmpresa(e.target.value)}
                  />
                </Field>
                <Field label="CNPJ">
                  <input
                    className={inputCls}
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                  />
                </Field>
                <Field label="Segmento">
                  <select className={inputCls} defaultValue="varejo">
                    <option value="varejo">Varejo de móveis</option>
                    <option value="industria">Indústria / fábrica</option>
                    <option value="montagem">Prestador de montagem</option>
                    <option value="logistica">Logística / transporte</option>
                  </select>
                </Field>
                <Field label="Unidades">
                  <input className={inputCls} defaultValue="12 lojas + 1 CD" />
                </Field>
              </div>
            </SectionBlock>
          )}
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "h-10 w-full rounded-lg border border-steel-700/60 bg-abyss-900/60 px-3 text-sm text-steel-100 placeholder:text-steel-500 focus:border-gold-500/60 focus:outline-none focus:ring-2 focus:ring-gold-400/20";

function SectionBlock({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-400">
        Configuração
      </p>
      <h2 className="mt-1 text-lg font-bold text-steel-50">{title}</h2>
      <p className="mt-1 text-xs text-steel-400">{desc}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-steel-400">
        {label}
      </span>
      {children}
    </label>
  );
}