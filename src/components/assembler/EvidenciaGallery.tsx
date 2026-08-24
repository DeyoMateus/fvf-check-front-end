import { useState } from "react";
import {
  Camera,
  Check,
  ChevronRight,
  Layers,
  ScanLine,
  Sparkles,
  X,
  Zap,
  Wrench,
  Truck,
  Factory,
  PackageCheck,
  Image as ImageIcon,
  Plus,
} from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { cn } from "../../utils/cn";

type Step = "scan" | "peca" | "evidencia" | "revisao" | "sucesso";
type CategoriaDefeito = "transporte" | "fabrica" | "montagem";

interface Defeito {
  id: string;
  categoria: CategoriaDefeito;
  peca: string;
  descricao: string;
  fotos: number;
}

const PECAS = [
  "Lateral esquerda",
  "Lateral direita",
  "Porta superior",
  "Porta inferior",
  "Prateleira central",
  "Fundo do armário",
  "Fita de borda",
  "Dobradiça / Corrediça",
];

const DEFEITOS_SUGERIDOS: Record<CategoriaDefeito, string[]> = {
  transporte: [
    "Canto esmagado",
    "Arranhões na superfície",
    "Embalagem violada",
    "Peça trincada por impacto",
  ],
  fabrica: [
    "Fita de borda soltando",
    "Bolha na laca",
    "Furo de ferramenta fora do prumo",
    "Dimensões fora do projeto",
  ],
  montagem: [
    "Parafuso minifix solto",
    "Dobradiça desregulada",
    "Porta desencontrada",
    "Corrediça travando",
  ],
};

const CAT_ICON: Record<CategoriaDefeito, React.ReactNode> = {
  transporte: <Truck className="h-4 w-4" />,
  fabrica: <Factory className="h-4 w-4" />,
  montagem: <Wrench className="h-4 w-4" />,
};

const CAT_LABEL: Record<CategoriaDefeito, string> = {
  transporte: "Transporte",
  fabrica: "Fábrica",
  montagem: "Montagem",
};

const CAT_TONE: Record<CategoriaDefeito, "warning" | "danger" | "info"> = {
  transporte: "warning",
  fabrica: "danger",
  montagem: "info",
};

export function AssemblerScannerView() {
  const [step, setStep] = useState<Step>("scan");
  const [danfe, setDanfe] = useState<string | null>(null);
  const [categoria, setCategoria] = useState<CategoriaDefeito>("transporte");
  const [peca, setPeca] = useState<string | null>(null);
  const [descricao, setDescricao] = useState<string | null>(null);
  const [fotos, setFotos] = useState<number>(0);
  const [defeitos, setDefeitos] = useState<Defeito[]>([]);

  function addDefeito() {
    if (!peca || !descricao) return;
    const novo: Defeito = {
      id: `d${Date.now()}`,
      categoria,
      peca,
      descricao,
      fotos: Math.max(fotos, 1),
    };
    setDefeitos((d) => [...d, novo]);
    setPeca(null);
    setDescricao(null);
    setFotos(0);
  }

  return (
    <div className="mx-auto flex h-full min-h-screen max-w-md flex-col bg-abyss-950">
      {/* HEADER PWA */}
      <PwaHeader step={step} danfe={danfe} />

      <main className="flex-1 px-4 pb-28 pt-4">
        {step === "scan" && (
          <ScanStep
            onDetected={(code) => {
              setDanfe(code);
              setStep("peca");
            }}
          />
        )}

        {step === "peca" && (
          <PecaStep
            categoria={categoria}
            onCategoria={setCategoria}
            peca={peca}
            onPeca={setPeca}
            descricao={descricao}
            onDescricao={setDescricao}
            fotos={fotos}
            onFotos={setFotos}
            defeitos={defeitos}
            onAdd={addDefeito}
            onRemove={(id) => setDefeitos((d) => d.filter((x) => x.id !== id))}
            onContinue={() => setStep("revisao")}
          />
        )}

        {step === "revisao" && (
          <RevisaoStep
            defeitos={defeitos}
            danfe={danfe!}
            onVoltar={() => setStep("peca")}
          />
        )}

        {step === "sucesso" && (
          <SucessoStep
            defeitos={defeitos.length}
            onNova={() => {
              setStep("scan");
              setDanfe(null);
              setDefeitos([]);
            }}
          />
        )}
      </main>

      {/* Bottom action bar por etapa */}
      {step === "peca" && (
        <BottomBar
          primaryLabel={defeitos.length > 0 ? "Revisar e enviar" : "Adicionar primeira peça"}
          onPrimary={() => {
            if (defeitos.length === 0) {
              // requer seleção
              if (peca && descricao) addDefeito();
            } else setStep("revisao");
          }}
          secondaryLabel="Escanear novamente"
          onSecondary={() => setStep("scan")}
        />
      )}

      {step === "revisao" && (
        <BottomBar
          primaryLabel="Enviar para fábrica"
          onPrimary={() => setStep("sucesso")}
          secondaryLabel="Adicionar mais peças"
          onSecondary={() => setStep("peca")}
        />
      )}

      {step === "sucesso" && (
        <BottomBar
          primaryLabel="Novo atendimento"
          onPrimary={() => {
            setStep("scan");
            setDanfe(null);
            setDefeitos([]);
          }}
        />
      )}
    </div>
  );
}

/* ================== HEADER ================== */

function PwaHeader({ step, danfe }: { step: Step; danfe: string | null }) {
  const steps: { key: Step; label: string }[] = [
    { key: "scan", label: "1. Danfe" },
    { key: "peca", label: "2. Peças" },
    { key: "revisao", label: "3. Revisão" },
  ];
  const idx = steps.findIndex((s) => s.key === step);

  return (
    <header className="sticky top-0 z-20 border-b border-steel-700/40 bg-abyss-950/85 px-4 py-3 backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold-500/40 bg-gradient-to-br from-abyss-700 to-abyss-900 glow-gold">
            <ScanLine className="h-4 w-4 text-gold-300" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-[0.18em] text-steel-50">FVF CHECK</p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-gold-400">
              Modo Montador
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">
            Online
          </span>
        </div>
      </div>

      {/* Stepper */}
      <ol className="mt-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
        {steps.map((s, i) => {
          const done = i < idx;
          const active = i === idx;
          return (
            <li key={s.key} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border text-[9px]",
                  done
                    ? "border-gold-400 bg-gold-400 text-abyss-950"
                    : active
                      ? "border-gold-400 text-gold-300"
                      : "border-steel-700 text-steel-500",
                )}
              >
                {done ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span
                className={cn(
                  active ? "text-gold-300" : done ? "text-steel-300" : "text-steel-500",
                )}
              >
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <ChevronRight className="h-3 w-3 text-steel-600" />
              )}
            </li>
          );
        })}
      </ol>

      {danfe && step !== "scan" && (
        <div className="mt-2 flex items-center gap-2 rounded-md border border-gold-500/20 bg-abyss-900/50 px-2 py-1.5 text-[10px] text-steel-300">
          <Layers className="h-3 w-3 text-gold-400" />
          <span className="font-mono">{danfe}</span>
        </div>
      )}
    </header>
  );
}

/* ================== STEP 1: SCAN ================== */

function ScanStep({ onDetected }: { onDetected: (code: string) => void }) {
  const [scanning, setScanning] = useState(true);

  // Simula leitura
  setTimeout(() => {
    if (scanning) {
      setScanning(false);
      onDetected("NF-e 45213 • Lote L-FAB-09-2025-B12");
    }
  }, 2500);

  return (
    <div className="space-y-4">
      <SectionHeader
        kicker="Etapa 1"
        title="Escanear Danfe / NF-e"
        desc="Aponte a câmera para o QR Code da nota fiscal eletrônica ou do lote."
      />

      {/* Viewfinder */}
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-gold-500/30 bg-black">
        {/* Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(227,185,33,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(227,185,33,0.08)_1px,transparent_1px)] bg-[size:32px_32px]" />

        {/* Retângulo de mira */}
        <div className="absolute inset-12 rounded-xl border-2 border-gold-400/60 shadow-[inset_0_0_60px_rgba(227,185,33,0.25)]">
          <Corner pos="tl" />
          <Corner pos="tr" />
          <Corner pos="bl" />
          <Corner pos="br" />
        </div>

        {scanning && <div className="scan-line" />}

        {/* Status overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-lg bg-abyss-950/85 px-3 py-2 text-[11px] backdrop-blur">
          <span className="flex items-center gap-2">
            {scanning ? (
              <>
                <Sparkles className="h-3.5 w-3.5 animate-pulse text-gold-400" />
                <span className="font-semibold text-steel-200">
                  Lendo QR Code…
                </span>
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="font-semibold text-emerald-300">
                  NF-e reconhecida
                </span>
              </>
            )}
          </span>
          <span className="font-mono text-[10px] text-steel-400">ISO 27001</span>
        </div>
      </div>

      <Button
        variant="secondary"
        className="w-full"
        onClick={() => onDetected("NF-e 45213 • Lote L-FAB-09-2025-B12")}
      >
        <Zap className="h-4 w-4 text-gold-300" />
        Inserir manualmente
      </Button>
    </div>
  );
}

function Corner({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const map = {
    tl: "top-0 left-0 border-t-2 border-l-2",
    tr: "top-0 right-0 border-t-2 border-r-2",
    bl: "bottom-0 left-0 border-b-2 border-l-2",
    br: "bottom-0 right-0 border-b-2 border-r-2",
  } as const;
  return (
    <span
      className={cn(
        "absolute h-5 w-5 border-gold-400",
        map[pos],
      )}
    />
  );
}

/* ================== STEP 2: PEÇA ================== */

interface PecaStepProps {
  categoria: CategoriaDefeito;
  onCategoria: (c: CategoriaDefeito) => void;
  peca: string | null;
  onPeca: (p: string) => void;
  descricao: string | null;
  onDescricao: (d: string) => void;
  fotos: number;
  onFotos: (n: number) => void;
  defeitos: Defeito[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onContinue: () => void;
}

function PecaStep({
  categoria,
  onCategoria,
  peca,
  onPeca,
  descricao,
  onDescricao,
  fotos,
  onFotos,
  defeitos,
  onAdd,
  onRemove,
  onContinue,
}: PecaStepProps) {
  const sugestoes = DEFEITOS_SUGERIDOS[categoria];
  const canAdd = !!peca && !!descricao;

  return (
    <div className="space-y-5">
      <SectionHeader
        kicker="Etapa 2"
        title="Mapeamento rápido de defeitos"
        desc="Classifique, aponte a peça e registre evidências. Operação com 1 mão."
      />

      {/* Categoria — segmented control grande p/ toque */}
      <div>
        <Label>Categoria do defeito</Label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(Object.keys(CAT_LABEL) as CategoriaDefeito[]).map((c) => {
            const active = c === categoria;
            return (
              <button
                key={c}
                onClick={() => onCategoria(c)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border p-3 text-center text-[11px] font-bold uppercase tracking-wider transition-all",
                  active
                    ? "border-gold-400 bg-gold-500/10 text-gold-200 glow-gold"
                    : "border-steel-700/60 bg-abyss-900/40 text-steel-300 hover:border-steel-600",
                )}
              >
                <span className={active ? "text-gold-300" : "text-steel-400"}>
                  {CAT_ICON[c]}
                </span>
                {CAT_LABEL[c]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Peça */}
      <div>
        <Label>Peça afetada</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {PECAS.map((p) => {
            const active = p === peca;
            return (
              <button
                key={p}
                onClick={() => onPeca(p)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "border-gold-400 bg-gold-500/15 text-gold-200"
                    : "border-steel-700/60 bg-abyss-900/40 text-steel-300 hover:border-steel-600",
                )}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {/* Descrição */}
      <div>
        <Label>Descrição do defeito</Label>
        <div className="mt-2 space-y-2">
          {sugestoes.map((s) => {
            const active = s === descricao;
            return (
              <button
                key={s}
                onClick={() => onDescricao(s)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                  active
                    ? "border-gold-400 bg-gold-500/10 text-gold-200"
                    : "border-steel-700/60 bg-abyss-900/40 text-steel-200 hover:border-steel-600",
                )}
              >
                <span>{s}</span>
                {active && <Check className="h-4 w-4 text-gold-300" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Captura de evidência — bloco grande p/ toque com 1 mão */}
      <div>
        <Label>Evidência fotográfica</Label>
        <button
          onClick={() => onFotos(fotos + 1)}
          className="mt-2 flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gold-500/40 bg-gradient-to-br from-gold-500/5 to-transparent p-6 text-gold-300 transition-all hover:border-gold-400 hover:bg-gold-500/10"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold-400/60 bg-gold-500/10">
            <Camera className="h-6 w-6" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold">Capturar foto</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gold-400/80">
              {fotos > 0
                ? `${fotos} foto${fotos !== 1 ? "s" : ""} capturada${fotos !== 1 ? "s" : ""}`
                : "Toque para abrir a câmera"}
            </p>
          </div>
          <Plus className="ml-auto h-5 w-5" />
        </button>

        {fotos > 0 && (
          <div className="mt-2 flex gap-2 overflow-x-auto">
            {Array.from({ length: fotos }).map((_, i) => (
              <div
                key={i}
                className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-steel-700 bg-gradient-to-br from-abyss-700 to-abyss-900"
              >
                <ImageIcon className="absolute inset-0 m-auto h-6 w-6 text-steel-500" />
                <span className="absolute right-0.5 top-0.5 rounded bg-abyss-950/80 px-1 text-[9px] font-bold text-gold-300">
                  #{i + 1}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Adicionar à lista */}
      <Button
        className="w-full"
        disabled={!canAdd}
        onClick={onAdd}
      >
        <Plus className="h-4 w-4" />
        Adicionar peça ao chamado
      </Button>

      {/* Lista de defeitos adicionados */}
      {defeitos.length > 0 && (
        <div>
          <div className="flex items-center justify-between">
            <Label>Peças registradas ({defeitos.length})</Label>
            <button
              onClick={onContinue}
              className="text-[11px] font-bold uppercase tracking-widest text-gold-300 hover:underline"
            >
              Revisar →
            </button>
          </div>
          <ul className="mt-2 space-y-2">
            {defeitos.map((d) => (
              <li
                key={d.id}
                className="flex items-center gap-3 rounded-lg border border-steel-700/50 bg-abyss-900/60 p-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-md border border-gold-500/30 bg-gold-500/10">
                  <PackageCheck className="h-4 w-4 text-gold-300" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-steel-50">{d.peca}</p>
                  <p className="text-[11px] text-steel-400">{d.descricao}</p>
                </div>
                <Badge variant={CAT_TONE[d.categoria]}>
                  {CAT_LABEL[d.categoria]}
                </Badge>
                <button
                  onClick={() => onRemove(d.id)}
                  aria-label="Remover"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-steel-400 hover:bg-red-500/15 hover:text-red-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ================== STEP 3: REVISÃO ================== */

function RevisaoStep({
  defeitos,
  danfe,
  onVoltar,
}: {
  defeitos: Defeito[];
  danfe: string;
  onVoltar: () => void;
}) {
  const dominante = (() => {
    const map: Record<CategoriaDefeito, number> = {
      transporte: 0,
      fabrica: 0,
      montagem: 0,
    };
    defeitos.forEach((d) => (map[d.categoria] += 1));
    return (Object.entries(map) as [CategoriaDefeito, number][])
      .sort((a, b) => b[1] - a[1])[0][0];
  })();

  return (
    <div className="space-y-5">
      <SectionHeader
        kicker="Etapa 3"
        title="Revisão final"
        desc="Confira tudo antes de enviar para a central de triagem."
      />

      <div className="rounded-xl border border-gold-500/30 bg-gradient-to-br from-gold-500/10 to-transparent p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gold-400">
          Triagem preliminar
        </p>
        <p className="mt-1 text-lg font-bold text-steel-50">
          {CAT_LABEL[dominante]} é a hipótese dominante
        </p>
        <p className="mt-1 text-xs text-steel-400">
          Baseado em {defeitos.length} peça{defeitos.length !== 1 && "s"} registrada
          {defeitos.length !== 1 && "s"}.
        </p>
      </div>

      <div className="rounded-xl border border-steel-700/50 bg-abyss-900/60 p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gold-400">
          Referência
        </p>
        <p className="mt-1 font-mono text-sm text-steel-100">{danfe}</p>
      </div>

      <div>
        <Label>Itens</Label>
        <ul className="mt-2 space-y-2">
          {defeitos.map((d, i) => (
            <li
              key={d.id}
              className="flex items-center gap-3 rounded-lg border border-steel-700/50 bg-abyss-900/60 p-3"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gold-500/15 text-xs font-bold text-gold-300">
                {i + 1}
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-steel-50">{d.peca}</p>
                <p className="text-[11px] text-steel-400">{d.descricao}</p>
              </div>
              <Badge variant={CAT_TONE[d.categoria]}>{CAT_LABEL[d.categoria]}</Badge>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={onVoltar}
        className="text-[11px] font-bold uppercase tracking-widest text-steel-400 hover:text-gold-300"
      >
        ← Adicionar mais peças
      </button>
    </div>
  );
}

/* ================== STEP 4: SUCESSO ================== */

function SucessoStep({
  defeitos,
  onNova,
}: {
  defeitos: number;
  onNova: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/30" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-emerald-400/60 bg-emerald-500/15">
          <Check className="h-10 w-10 text-emerald-300" />
        </div>
      </div>
      <h2 className="mt-6 text-xl font-bold text-steel-50">Ticket enviado!</h2>
      <p className="mt-2 max-w-[280px] text-sm text-steel-400">
        {defeitos} {defeitos === 1 ? "peça registrada" : "peças registradas"} para
        a central de triagem. Protocolo gerado.
      </p>
      <div className="mt-6 rounded-xl border border-gold-500/30 bg-gradient-to-br from-gold-500/10 to-transparent p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gold-400">
          Protocolo
        </p>
        <p className="mt-1 font-mono text-base font-bold text-gold-200">
          FVF-2025-0143
        </p>
      </div>
      <Button onClick={onNova} className="mt-8 w-full">
        Iniciar novo atendimento
      </Button>
    </div>
  );
}

/* ================== UI atoms ================== */

function SectionHeader({
  kicker,
  title,
  desc,
}: {
  kicker: string;
  title: string;
  desc: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold-400 hud-line">
        {kicker}
      </p>
      <h2 className="mt-2 text-xl font-bold text-steel-50">{title}</h2>
      <p className="mt-1 text-sm text-steel-400">{desc}</p>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-steel-400">
      {children}
    </p>
  );
}

function BottomBar({
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: {
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-steel-700/40 bg-abyss-950/95 p-3 backdrop-blur">
      <div className="mx-auto flex max-w-md gap-2">
        {secondaryLabel && (
          <Button variant="secondary" onClick={onSecondary} className="flex-1">
            {secondaryLabel}
          </Button>
        )}
        <Button onClick={onPrimary} className="flex-1">
          {primaryLabel}
        </Button>
      </div>
    </div>
  );
}
