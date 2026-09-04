import type { Fabrica } from "../services/fabricas.service";

export function calcularScoreInteligente(fabrica: Fabrica): number {
  const SCORE_BASE = 100;

  const PENALIDADE_RMA_ABERTO = 2;
  const PENALIDADE_SLA_ESTOURADO = 7;

  const metaSla = (fabrica as any).slaMetaHoras || 24;
  const desvioSla = Math.max(0, fabrica.slaMedioHoras - metaSla);
  const penalidadeAtrasoMedio = desvioSla * 1.5;

  const rmaEstourados = (fabrica as any).rmaEstourados || 0;
  const totalDeducoes =
    fabrica.rmaAbertos * PENALIDADE_RMA_ABERTO +
    rmaEstourados * PENALIDADE_SLA_ESTOURADO +
    penalidadeAtrasoMedio;

  const scoreFinal = SCORE_BASE - totalDeducoes;
  return Math.max(0, Math.min(100, Math.round(scoreFinal)));
}
