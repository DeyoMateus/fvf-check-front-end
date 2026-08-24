import { useState } from "react";
import {
  Bell,
  Building2,
  Check,
  Database,
  Globe,
  KeyRound,
  Link2,
  Palette,
  Save,
  Shield,
  User,
} from "lucide-react";
import { PageHeader } from "../ui/PageHeader";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { cn } from "../../utils/cn";

type Section =
  | "perfil"
  | "empresa"
  | "notificacoes"
  | "integracoes"
  | "seguranca"
  | "aparencia";

const SECTIONS: {
  id: Section;
  label: string;
  icon: typeof User;
  desc: string;
}[] = [
  { id: "perfil", label: "Meu perfil", icon: User, desc: "Dados do gestor" },
  { id: "empresa", label: "Empresa", icon: Building2, desc: "Rede / loja" },
  { id: "notificacoes", label: "Notificações", icon: Bell, desc: "Alertas e SLA" },
  { id: "integracoes", label: "Integrações", icon: Link2, desc: "SAP, TOTVS, EDI" },
  { id: "seguranca", label: "Segurança", icon: Shield, desc: "Acesso e 2FA" },
  { id: "aparencia", label: "Aparência", icon: Palette, desc: "Tema do painel" },
];

export function ConfiguracoesPage() {
  const [section, setSection] = useState<Section>("perfil");
  const [saved, setSaved] = useState(false);

  // form state
  const [nome, setNome] = useState("Carlos Drumond");
  const [email, setEmail] = useState("carlos.drumond@fvfcheck.com.br");
  const [cargo, setCargo] = useState("Gestor de Triagem");
  const [empresa, setEmpresa] = useState("Rede Concept Móveis");
  const [cnpj, setCnpj] = useState("11.222.333/0001-44");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");

  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(true);
  const [notifSla, setNotifSla] = useState(true);
  const [notifRma, setNotifRma] = useState(false);

  const [sapOn, setSapOn] = useState(true);
  const [totvsOn, setTotvsOn] = useState(true);
  const [whatsOn, setWhatsOn] = useState(false);

  const [twoFa, setTwoFa] = useState(true);
  const [sessaoUnica, setSessaoUnica] = useState(false);

  function salvar() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        kicker="FVF CHECK • Sistema"
        title={
          <>
            <span className="text-gold-gradient">Configurações</span>
          </>
        }
        description="Preferências da conta, dados da operação, integrações ERP e políticas de segurança."
        actions={
          <Button onClick={salvar}>
            {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? "Salvo" : "Salvar alterações"}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Nav lateral de seções */}
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

        {/* Conteúdo */}
        <div className="rounded-xl border border-steel-700/60 bg-gradient-to-b from-abyss-800/70 to-abyss-900/70 p-5 lg:col-span-3">
          {section === "perfil" && (
            <SectionBlock
              title="Meu perfil"
              desc="Informações exibidas no painel e nos comentários de triagem."
            >
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-lg font-bold text-abyss-950">
                  CD
                </div>
                <div>
                  <p className="font-semibold text-steel-50">{nome}</p>
                  <p className="text-xs text-steel-400">{cargo}</p>
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
                <Field label="Cargo">
                  <input className={inputCls} value={cargo} onChange={(e) => setCargo(e.target.value)} />
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

          {section === "notificacoes" && (
            <SectionBlock
              title="Notificações"
              desc="Escolha o que chega por e-mail, push e WhatsApp operacional."
            >
              <div className="space-y-3">
                <Toggle
                  label="E-mail de novos tickets"
                  desc="Receber quando um montador enviar evidências"
                  checked={notifEmail}
                  onChange={setNotifEmail}
                />
                <Toggle
                  label="Push no navegador"
                  desc="Alertas em tempo real no painel"
                  checked={notifPush}
                  onChange={setNotifPush}
                />
                <Toggle
                  label="SLA crítico (< 6h)"
                  desc="Prioridade máxima para tickets prestes a vencer"
                  checked={notifSla}
                  onChange={setNotifSla}
                />
                <Toggle
                  label="Atualizações de RMA"
                  desc="Quando a fábrica aceitar ou recusar reposição"
                  checked={notifRma}
                  onChange={setNotifRma}
                />
              </div>
            </SectionBlock>
          )}

          {section === "integracoes" && (
            <SectionBlock
              title="Integrações"
              desc="Conectores ERP e canais de campo. Status do handshake em tempo real."
            >
              <div className="space-y-3">
                <IntegrationRow
                  name="SAP Business One"
                  detail="EDI de lotes e NF-e"
                  icon={<Database className="h-4 w-4" />}
                  enabled={sapOn}
                  onToggle={setSapOn}
                  status={sapOn ? "Conectado" : "Desligado"}
                />
                <IntegrationRow
                  name="TOTVS Protheus"
                  detail="Danfe, estoque e pedidos de reposição"
                  icon={<Globe className="h-4 w-4" />}
                  enabled={totvsOn}
                  onToggle={setTotvsOn}
                  status={totvsOn ? "Conectado" : "Desligado"}
                />
                <IntegrationRow
                  name="WhatsApp Business API"
                  detail="Alertas para montadores em campo"
                  icon={<Link2 className="h-4 w-4" />}
                  enabled={whatsOn}
                  onToggle={setWhatsOn}
                  status={whatsOn ? "Conectado" : "Pendente token"}
                />
              </div>
              <div className="mt-5 rounded-lg border border-steel-700/50 bg-abyss-950/50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-steel-100">
                  <KeyRound className="h-4 w-4 text-gold-400" />
                  Chave de API do tenant
                </div>
                <p className="mt-2 font-mono text-xs text-steel-400">
                  fvf_live_••••••••••••••••c9a2
                </p>
                <Button variant="outline" size="sm" className="mt-3">
                  Rotacionar chave
                </Button>
              </div>
            </SectionBlock>
          )}

          {section === "seguranca" && (
            <SectionBlock
              title="Segurança"
              desc="Políticas de acesso para o painel web e PWA do montador."
            >
              <div className="space-y-3">
                <Toggle
                  label="Autenticação em dois fatores (2FA)"
                  desc="Obrigatório para gestores e analistas de triagem"
                  checked={twoFa}
                  onChange={setTwoFa}
                />
                <Toggle
                  label="Sessão única por usuário"
                  desc="Encerra login anterior ao entrar em outro dispositivo"
                  checked={sessaoUnica}
                  onChange={setSessaoUnica}
                />
              </div>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Tempo de sessão ociosa">
                  <select className={inputCls} defaultValue="30">
                    <option value="15">15 minutos</option>
                    <option value="30">30 minutos</option>
                    <option value="60">1 hora</option>
                    <option value="240">4 horas</option>
                  </select>
                </Field>
                <Field label="Política de senha">
                  <select className={inputCls} defaultValue="forte">
                    <option value="media">Média (8+ caracteres)</option>
                    <option value="forte">Forte (12+ e símbolos)</option>
                    <option value="corporativa">Corporativa (SSO Azure AD)</option>
                  </select>
                </Field>
              </div>
            </SectionBlock>
          )}

          {section === "aparencia" && (
            <SectionBlock
              title="Aparência"
              desc="O painel FVF Check usa tema abissal com acento dourado por padrão."
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <ThemeCard
                  active
                  name="Abissal Dourado"
                  swatches={["#020816", "#0c2e66", "#c79a10"]}
                />
                <ThemeCard
                  name="Grafite (em breve)"
                  swatches={["#0f172a", "#334155", "#94a3b8"]}
                  disabled
                />
                <ThemeCard
                  name="Claro (em breve)"
                  swatches={["#f8fafc", "#e2e8f0", "#c79a10"]}
                  disabled
                />
              </div>
              <p className="mt-4 text-xs text-steel-400">
                Densidade da interface e tamanho de fonte do PWA do montador serão
                liberados na próxima versão (Build 2025.11).
              </p>
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

function Toggle({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-lg border border-steel-700/50 bg-abyss-950/40 px-4 py-3 text-left transition-colors hover:border-gold-500/30"
    >
      <div>
        <p className="text-sm font-semibold text-steel-100">{label}</p>
        <p className="text-[11px] text-steel-400">{desc}</p>
      </div>
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-gold-500" : "bg-steel-700",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "left-5" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}

function IntegrationRow({
  name,
  detail,
  icon,
  enabled,
  onToggle,
  status,
}: {
  name: string;
  detail: string;
  icon: React.ReactNode;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  status: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-steel-700/50 bg-abyss-950/40 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold-500/30 bg-gold-500/10 text-gold-300">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-steel-100">{name}</p>
          <p className="text-[11px] text-steel-400">{detail}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={enabled ? "success" : "muted"}>{status}</Badge>
        <button
          type="button"
          onClick={() => onToggle(!enabled)}
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full transition-colors",
            enabled ? "bg-gold-500" : "bg-steel-700",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
              enabled ? "left-5" : "left-0.5",
            )}
          />
        </button>
      </div>
    </div>
  );
}

function ThemeCard({
  name,
  swatches,
  active,
  disabled,
}: {
  name: string;
  swatches: string[];
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        active
          ? "border-gold-500/50 bg-gold-500/5 glow-gold"
          : "border-steel-700/50 bg-abyss-950/40",
        disabled && "opacity-50",
      )}
    >
      <div className="flex gap-1.5">
        {swatches.map((c) => (
          <span
            key={c}
            className="h-8 flex-1 rounded-md border border-white/10"
            style={{ background: c }}
          />
        ))}
      </div>
      <p className="mt-3 text-xs font-semibold text-steel-100">{name}</p>
      {active && (
        <Badge variant="gold" className="mt-2">
          Ativo
        </Badge>
      )}
    </div>
  );
}
