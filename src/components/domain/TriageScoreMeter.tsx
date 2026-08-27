import { cn } from "../../utils/cn";
import type { Ticket } from "../../lib/types";
import { RESPONSIBILITY_LABELS } from "../../lib/types";

interface TriageScoreMeterProps {
  scores?: Ticket["scores"];
  size?: "sm" | "md";
  showLegend?: boolean;
  className?: string;
}

/**
 * Visualização radial (donut) dos 3 scores de responsabilidade.
 * - Transporte: dourado (âmbar)
 * - Fábrica: vermelho
 * - Montagem: azul claro
 */
export function TriageScoreMeter({
  scores = { transporte: 33, fabrica: 33, montagem: 34 },
  size = "md",
  showLegend = true,
  className,
}: TriageScoreMeterProps) {
  const currentScores = scores ?? { transporte: 0, fabrica: 0, montagem: 0 };

  const radius = size === "sm" ? 26 : 38;
  const stroke = size === "sm" ? 6 : 8;
  const c = 2 * Math.PI * radius;

  const segs = [
    {
      key: "transporte",
      value: currentScores.transporte,
      color: "#f59e0b",
      label: RESPONSIBILITY_LABELS.TRANSPORT_DAMAGE,
    },
    {
      key: "fabrica",
      value: currentScores.fabrica,
      color: "#ef4444",
      label: RESPONSIBILITY_LABELS.FACTORY_DEFECT,
    },
    {
      key: "montagem",
      value: currentScores.montagem,
      color: "#38bdf8",
      label: RESPONSIBILITY_LABELS.ASSEMBLY_ERROR,
    },
  ];

  let offset = 0;
  const dominant = segs.reduce((a, b) => (a.value >= b.value ? a : b));

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative" style={{ width: (radius + stroke) * 2, height: (radius + stroke) * 2 }}>
        <svg
          width={(radius + stroke) * 2}
          height={(radius + stroke) * 2}
          viewBox={`0 0 ${(radius + stroke) * 2} ${(radius + stroke) * 2}`}
          className="-rotate-90"
        >
          <circle
            cx={radius + stroke}
            cy={radius + stroke}
            r={radius}
            fill="none"
            stroke="rgba(100,116,139,0.18)"
            strokeWidth={stroke}
          />
          {segs.map((s) => {
            const len = (s.value / 100) * c;
            const el = (
              <circle
                key={s.key}
                cx={radius + stroke}
                cy={radius + stroke}
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth={stroke}
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[9px] font-bold uppercase tracking-widest text-steel-400">
            Top
          </span>
          <span
            className="font-bold tabular-nums"
            style={{ color: dominant.color, fontSize: size === "sm" ? 14 : 18 }}
          >
            {dominant.value}%
          </span>
        </div>
      </div>

      {showLegend && (
        <ul className="space-y-1 text-[11px]">
          {segs.map((s) => (
            <li key={s.key} className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-sm"
                style={{ background: s.color }}
                aria-hidden
              />
              <span className="font-semibold tabular-nums text-steel-100">
                {s.value}%
              </span>
              <span className="text-steel-400">{s.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}