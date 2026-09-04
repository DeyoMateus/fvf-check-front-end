import { useState } from "react";
import { Loader2, PackageX, Undo2, Camera, AlertTriangle } from "lucide-react";
import { Button } from "../ui/Button";
import { ticketsService, type Ticket } from "../../services/tickets.service";
import { toast } from "sonner";

interface ReverseLogisticsPanelProps {
  ticket: Ticket;
  onClose: () => void;
  onUpdated: () => void;
}

function captureGeolocation(): Promise<{ latitude?: number; longitude?: number }> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve({});
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve({}),
      { enableHighAccuracy: true, timeout: 5000 },
    );
  });
}

export function ReverseLogisticsPanel({ ticket, onClose, onUpdated }: ReverseLogisticsPanelProps) {
  const [submitting, setSubmitting] = useState(false);
  const [discardPhoto, setDiscardPhoto] = useState<File | null>(null);

  const hasDiscardProof = (ticket.mediaFiles ?? []).some(
    (m) => m.type === "DISCARD_PROOF" && m.latitude != null && m.longitude != null,
  );

  async function handleRequireReturn() {
    setSubmitting(true);
    try {
      await ticketsService.decideReverseLogistics(ticket.id, "REQUIRE_RETURN");
      toast.success("Retorno obrigatório registrado. Etiqueta de logística reversa gerada.");
      onUpdated();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao registrar retorno.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAuthorizeDiscard() {
    setSubmitting(true);
    try {
      // Se ainda não existe DISCARD_PROOF válida, sobe a foto capturada antes de decidir
      if (!hasDiscardProof) {
        if (!discardPhoto) {
          toast.error("Anexe a foto da peça inutilizada antes de autorizar o descarte.");
          setSubmitting(false);
          return;
        }
        const coords = await captureGeolocation();
        if (!coords.latitude || !coords.longitude) {
          toast.error(
            "Não foi possível capturar a localização. A foto de descarte exige GPS ativo.",
          );
          setSubmitting(false);
          return;
        }
        const uploaded = await ticketsService.uploadFileToR2(discardPhoto, ticket.id);
        if (!uploaded) throw new Error("Falha ao enviar a foto de descarte.");
        await ticketsService.confirmMedia({
          ticketId: ticket.id,
          objectKey: uploaded.objectKey,
          mediaType: "DISCARD_PROOF",
          capturedAt: new Date().toISOString(),
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
      }

      await ticketsService.decideReverseLogistics(ticket.id, "AUTHORIZE_DISCARD");
      toast.success("Descarte autorizado com sucesso.");
      onUpdated();
      onClose();
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Erro ao autorizar descarte.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-xl border border-gold-500/30 bg-abyss-900/80 p-4 space-y-3">
      <h4 className="text-xs font-bold text-gold-300">Decisão de Logística Reversa</h4>

      {ticket.reverseLogistics && ticket.reverseLogistics !== "NONE" && (
        <p className="rounded-md border border-steel-700/50 bg-abyss-950/60 p-2 text-[11px] text-steel-300">
          Status atual: <span className="font-semibold text-gold-300">
            {ticket.reverseLogistics === "REQUIRED" ? "Retorno exigido" : "Descarte autorizado"}
          </span>
          {ticket.reverseLogisticsLabel && (
            <> — etiqueta <span className="font-mono">{ticket.reverseLogisticsLabel}</span></>
          )}
        </p>
      )}

      <div className="space-y-2">
        <button
          type="button"
          disabled={submitting}
          onClick={handleRequireReturn}
          className="flex w-full items-center gap-2.5 rounded-lg border border-sky-500/30 bg-sky-500/5 p-3 text-left text-xs font-semibold text-sky-200 hover:bg-sky-500/15 disabled:opacity-50"
        >
          <Undo2 className="h-4 w-4 shrink-0" />
          Exigir retorno da peça (gera etiqueta reversa)
        </button>

        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 space-y-2">
          <p className="flex items-center gap-2 text-xs font-semibold text-red-200">
            <PackageX className="h-4 w-4 shrink-0" />
            Autorizar descarte (exige foto + GPS)
          </p>

          {hasDiscardProof ? (
            <p className="text-[11px] text-emerald-300">
              ✓ Já existe uma foto de descarte válida anexada a este chamado.
            </p>
          ) : (
            <>
              <p className="flex items-center gap-1.5 text-[11px] text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Nenhuma foto de descarte anexada ainda. Anexe uma abaixo.
              </p>
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-red-500/40 bg-abyss-950/60 p-2 text-[11px] text-red-200 hover:bg-red-500/10">
                <Camera className="h-3.5 w-3.5 shrink-0" />
                {discardPhoto ? discardPhoto.name : "Selecionar foto da peça inutilizada"}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => setDiscardPhoto(e.target.files?.[0] ?? null)}
                />
              </label>
            </>
          )}

          <Button
            variant="danger"
            size="sm"
            className="w-full"
            disabled={submitting || (!hasDiscardProof && !discardPhoto)}
            onClick={handleAuthorizeDiscard}
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Autorizar Descarte"}
          </Button>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="secondary" size="sm" onClick={onClose}>
          Fechar
        </Button>
      </div>
    </section>
  );
}