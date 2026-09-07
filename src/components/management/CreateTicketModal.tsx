import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { runSync } from "../../lib/offline/sync-engine";
import { enqueueTicket, enqueueMedia } from "../../lib/offline/outbox";
import {
  X,
  QrCode,
  Camera,
  AlertTriangle,
  FileText,
  HardDriveUpload,
  Zap,
  RefreshCw,
  VideoOff,
  Trash2,
  Mic,
  Square,
  Play,
  Pause,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Plus,
  Package,
  UserCheck,
  FileSpreadsheet,
  BookOpen,
} from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { ticketsService, CreateTicketPayload } from "../../services/tickets.service";
import { api } from "../../lib/api";
import { stampImageWithMetadata } from "@/utils/imageStamp";
import { cn } from "@/utils/cn";

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 1 | 2 | 3;

interface CatalogPart {
  code: string;
  name: string;
}

interface GeneralEvidence {
  id: string;
  type: "MANUAL_ETIQUETA" | "MANUAL_PAGINA";
  file: File;
  previewUrl: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
}

interface TicketPartItem {
  id: string;
  partCode: string;
  description: string;
  quantity: number;
  defectType: "PECA_QUEBRADA" | "FALTOU_PECA" | "FERRAGEM_DEFEITUOSA";
  emergencyNotes?: string;
  evidenceFile: File;
  evidencePreviewUrl: string;
  latitude?: number;
  longitude?: number;
  capturedAt: string;
}

async function captureGeolocation(): Promise<{ latitude?: number; longitude?: number }> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) {
      resolve({});
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      },
      () => resolve({}),
      { enableHighAccuracy: true, timeout: 5000 },
    );
  });
}

function mapMediaTypeForOffline(
  type: GeneralEvidence["type"],
): "LABEL" | "MANUAL_PAGE" {
  return type === "MANUAL_ETIQUETA" ? "LABEL" : "MANUAL_PAGE";
}

function mapDefectType(type: string): "BROKEN" | "MISSING" | "HARDWARE_FAULT" {
  switch (type) {
    case "PECA_QUEBRADA": return "BROKEN";
    case "FALTOU_PECA": return "MISSING";
    default: return "HARDWARE_FAULT";
  }
}

export function CreateTicketModal({ isOpen, onClose, onSuccess }: CreateTicketModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Câmeras & Mídia
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const scannerVideoRef = useRef<HTMLVideoElement>(null);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  // "part" = foto de avaria de uma peça específica; os outros valores são
  // as evidências gerais do ticket (etiqueta / página do manual).
  const [cameraTarget, setCameraTarget] = useState<"part" | GeneralEvidence["type"] | null>(null);

  // Leitor de código de barras a laser (USB/Bluetooth, comporta-se como
  // teclado): detectamos digitação muito rápida seguida de Enter.
  const laserBufferRef = useRef("");
  const laserTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Gravador de Áudio
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Etapa 1
  const [chaveNfe, setChaveNfe] = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [loteFabricacao, setLoteFabricacao] = useState("");
  const [products, setProducts] = useState<{ sku: string; name: string }[]>([]);
  const [selectedSku, setSelectedSku] = useState("");
  const [catalogParts, setCatalogParts] = useState<CatalogPart[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Etapa 2 — dados gerais do ticket
  const [packageCondition, setPackageCondition] = useState<"INTACT" | "DAMAGED" | "">("");
  const [responsabilidadeEstimada, setResponsabilidadeEstimada] = useState<
    "TRANSPORT_DAMAGE" | "FACTORY_DEFECT" | "ASSEMBLY_ERROR" | ""
  >("");
  const [descricaoDefeito, setDescricaoDefeito] = useState("");
  const [generalEvidences, setGeneralEvidences] = useState<GeneralEvidence[]>([]);

  // Etapa 2 — montagem de peça (uma foto obrigatória por peça, evita a
  // duplicação/contagem zerada que existia quando as fotos eram soltas)
  const [addedParts, setAddedParts] = useState<TicketPartItem[]>([]);
  const [selectedPartCode, setSelectedPartCode] = useState("");
  const [codigoPecaManual, setCodigoPecaManual] = useState("");
  const [descricaoPeca, setDescricaoPeca] = useState("");
  const [quantidadePeca, setQuantidadePeca] = useState(1);
  const [tipoDefeitoPeca, setTipoDefeitoPeca] = useState<TicketPartItem["defectType"] | "">("");
  const [pendingPartPhoto, setPendingPartPhoto] = useState<File | null>(null);
  const [pendingPartPhotoPreview, setPendingPartPhotoPreview] = useState<string | null>(null);
  const [pendingPartCoords, setPendingPartCoords] = useState<{ latitude?: number; longitude?: number }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Catálogo de produtos do fornecedor real (via resolveSupplierTenantId
  // no backend — a Loja já recebe o catálogo da Fábrica-mãe automaticamente).
  useEffect(() => {
    if (!isOpen) return;
    setLoadingProducts(true);
    api
      .get<{ products: { sku: string; name: string }[] }>("/products")
      .then((res) => setProducts(res.data.products ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false));
  }, [isOpen]);

  useEffect(() => {
    if (!selectedSku) {
      setCatalogParts([]);
      return;
    }
    api
      .get<{ product: { partsTree: CatalogPart[] } }>(`/products/${selectedSku}/parts`)
      .then((res) => setCatalogParts(res.data.product?.partsTree ?? []))
      .catch(() => setCatalogParts([]));
  }, [selectedSku]);

  // Leitor a laser: só ativo na Etapa 1, para não capturar digitação normal
  // do usuário em outros campos do formulário como se fosse um scan.
  useEffect(() => {
    if (!isOpen || step !== 1) return;

    function handleKeydown(e: KeyboardEvent) {
      if (e.key === "Enter") {
        const code = laserBufferRef.current.replace(/\D/g, "");
        if (code.length >= 20) {
          handleNfeChange(code);
          toast.success("Código lido via leitor a laser.");
        }
        laserBufferRef.current = "";
        return;
      }
      if (e.key.length === 1) {
        laserBufferRef.current += e.key;
        if (laserTimeoutRef.current) clearTimeout(laserTimeoutRef.current);
        laserTimeoutRef.current = setTimeout(() => {
          laserBufferRef.current = "";
        }, 100);
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [isOpen, step]);

  const stopAllMedia = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }
    if (scannerVideoRef.current?.srcObject) {
      const stream = scannerVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      scannerVideoRef.current.srcObject = null;
    }
    if (cameraVideoRef.current?.srcObject) {
      const stream = cameraVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      cameraVideoRef.current.srcObject = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsScannerActive(false);
    setIsCameraActive(false);
    setCameraTarget(null);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 59) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      setErrorMessage("Permissão para usar o microfone foi negada.");
    }
  };

  const removeAudio = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
  };

  useEffect(() => {
    return () => {
      stopAllMedia();
      stopRecording();
    };
  }, []);

  const startNfeScanner = async () => {
    setErrorMessage(null);
    setIsScannerActive(true);
    try {
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;
      setTimeout(async () => {
        if (scannerVideoRef.current) {
          await codeReader.decodeFromVideoDevice(null, scannerVideoRef.current, (result) => {
            if (result) {
              handleNfeChange(result.getText().replace(/\D/g, ""));
              stopAllMedia();
            }
          });
        }
      }, 200);
    } catch {
      setErrorMessage("Não foi possível acessar a câmera para leitura de código.");
      setIsScannerActive(false);
    }
  };

  const handleNfeChange = (val: string) => {
    setChaveNfe(val.replace(/\D/g, ""));
  };

  const startCameraForTarget = async (target: "part" | GeneralEvidence["type"]) => {
    setCameraTarget(target);
    if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
      fileInputRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      mediaStreamRef.current = stream;
      setIsCameraActive(true);
      setTimeout(() => {
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = stream;
          cameraVideoRef.current.play();
        }
      }, 150);
    } catch {
      fileInputRef.current?.click();
    }
  };

  async function processCaptured(file: File) {
    const coords = await captureGeolocation();
    const timestamp = new Date().toISOString();
    const stamped = await stampImageWithMetadata(file, { timestamp, ...coords });

    if (cameraTarget === "part") {
      if (pendingPartPhotoPreview) URL.revokeObjectURL(pendingPartPhotoPreview);
      setPendingPartPhoto(stamped);
      setPendingPartPhotoPreview(URL.createObjectURL(stamped));
      setPendingPartCoords(coords);
    } else if (cameraTarget) {
      const evidence: GeneralEvidence = {
        id: crypto.randomUUID(),
        type: cameraTarget,
        file: stamped,
        previewUrl: URL.createObjectURL(stamped),
        timestamp,
        ...coords,
      };
      setGeneralEvidences((prev) => [...prev.filter((e) => e.type !== cameraTarget), evidence]);
    }
  }

  const capturePhotoFromStream = () => {
    if (!cameraVideoRef.current) return;
    const video = cameraVideoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `evidencia-${Date.now()}.jpg`, { type: "image/jpeg" });
          processCaptured(file);
          stopAllMedia();
        }
      }, "image/jpeg");
    }
  };

  function handleAddPart() {
    const code = selectedPartCode || codigoPecaManual;
    if (!code) {
      setErrorMessage("Informe o código da peça ou selecione-a no catálogo.");
      return;
    }
    if (!tipoDefeitoPeca) {
      setErrorMessage("Selecione o tipo de defeito da peça.");
      return;
    }
    if (!pendingPartPhoto || !pendingPartPhotoPreview) {
      setErrorMessage("Fotografe a avaria desta peça antes de incluí-la.");
      return;
    }

    const newPart: TicketPartItem = {
      id: crypto.randomUUID(),
      partCode: code,
      description: descricaoPeca || code,
      quantity: quantidadePeca > 0 ? quantidadePeca : 1,
      defectType: tipoDefeitoPeca,
      emergencyNotes: descricaoDefeito || undefined,
      evidenceFile: pendingPartPhoto,
      evidencePreviewUrl: pendingPartPhotoPreview,
      latitude: pendingPartCoords.latitude,
      longitude: pendingPartCoords.longitude,
      capturedAt: new Date().toISOString(),
    };

    setAddedParts((prev) => [...prev, newPart]);
    setSelectedPartCode("");
    setCodigoPecaManual("");
    setDescricaoPeca("");
    setQuantidadePeca(1);
    setTipoDefeitoPeca("");
    setPendingPartPhoto(null);
    setPendingPartPhotoPreview(null);
    setPendingPartCoords({});
    setErrorMessage(null);
  }

  function handleRemovePart(id: string) {
    setAddedParts((prev) => {
      const removed = prev.find((p) => p.id === id);
      if (removed) URL.revokeObjectURL(removed.evidencePreviewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }

  const validateStep1 = () => {
    if (!clienteNome.trim()) {
      setErrorMessage("Por favor, preencha o Nome do Consumidor na Etapa 1.");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!packageCondition) {
      setErrorMessage("Por favor, informe o Estado da Embalagem (Intacta ou Danificada).");
      return false;
    }
    if (!responsabilidadeEstimada) {
      setErrorMessage("Por favor, selecione a Responsabilidade Provável.");
      return false;
    }
    if (addedParts.length === 0) {
      setErrorMessage("Adicione ao menos uma peça avariada, com a respectiva foto.");
      return false;
    }
    if (isFallbackMode) {
      const hasLabel = generalEvidences.some((e) => e.type === "MANUAL_ETIQUETA");
      const hasManualPage = generalEvidences.some((e) => e.type === "MANUAL_PAGINA");
      if (!hasLabel || !hasManualPage) {
        setErrorMessage(
          "Modo de Emergência ativo: anexe a foto da Etiqueta/DANFE e da Página do Manual antes de continuar.",
        );
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    setErrorMessage(null);
    if (step === 1) {
      if (validateStep1()) setStep(2);
    } else if (step === 2) {
      if (validateStep2()) setStep(3);
    }
  };

  function handleReset() {
    stopAllMedia();
    removeAudio();
    setStep(1);
    setChaveNfe("");
    setClienteNome("");
    setClienteTelefone("");
    setLoteFabricacao("");
    setSelectedSku("");
    setCatalogParts([]);
    setPackageCondition("");
    setResponsabilidadeEstimada("");
    setDescricaoDefeito("");
    generalEvidences.forEach((e) => URL.revokeObjectURL(e.previewUrl));
    setGeneralEvidences([]);
    addedParts.forEach((p) => URL.revokeObjectURL(p.evidencePreviewUrl));
    setAddedParts([]);
    setSelectedPartCode("");
    setCodigoPecaManual("");
    setDescricaoPeca("");
    setQuantidadePeca(1);
    setTipoDefeitoPeca("");
    if (pendingPartPhotoPreview) URL.revokeObjectURL(pendingPartPhotoPreview);
    setPendingPartPhoto(null);
    setPendingPartPhotoPreview(null);
    setPendingPartCoords({});
    setIsFallbackMode(false);
    setErrorMessage(null);
    setIsFullscreen(false);
    onClose();
  }

  async function queueTicketOffline(payload: CreateTicketPayload) {
    if (!user?.id) {
      throw new Error("Não foi possível identificar o usuário logado para salvar o chamado offline.");
    }

    const ticketRecord = await enqueueTicket(user.id, payload);

    for (const part of addedParts) {
      await enqueueMedia(
        user.id,
        ticketRecord.localId,
        part.evidenceFile,
        "DEFECT",
        { capturedAt: part.capturedAt, latitude: part.latitude, longitude: part.longitude },
        part.partCode,
      );
    }
    for (const evidence of generalEvidences) {
      await enqueueMedia(user.id, ticketRecord.localId, evidence.file, mapMediaTypeForOffline(evidence.type), {
        capturedAt: evidence.timestamp,
        latitude: evidence.latitude,
        longitude: evidence.longitude,
      });
    }
    if (audioBlob) {
      await enqueueMedia(user.id, ticketRecord.localId, audioBlob, "AUDIO", {
        capturedAt: new Date().toISOString(),
      });
    }

    return ticketRecord;
  }

  async function handleSubmit() {
    setErrorMessage(null);
    if (!validateStep1()) {
      setStep(1);
      return;
    }
    if (!validateStep2()) {
      setStep(2);
      return;
    }

    const payload: CreateTicketPayload = {
      isEmergencyMode: isFallbackMode,
      packageCondition: packageCondition as "INTACT" | "DAMAGED",
      suggestedResponsibility: responsabilidadeEstimada as
        | "TRANSPORT_DAMAGE"
        | "FACTORY_DEFECT"
        | "ASSEMBLY_ERROR",
      productSku: selectedSku || undefined,
      invoice: {
        nfeKey: chaveNfe.length === 44 ? chaveNfe : "35240800000000000000550010000000001000000000",
        number: chaveNfe.length >= 34 ? chaveNfe.substring(25, 34) : "000000001",
        series: "1",
        issuedAt: new Date().toISOString(),
        customer: { name: clienteNome, phone: clienteTelefone || undefined },
        productName: products.find((p) => p.sku === selectedSku)?.name || "Móvel Padronizado",
        batchNumber: loteFabricacao || "LT-DEFAULT",
      },
      parts: addedParts.map((item) => ({
        partCode: item.partCode,
        quantity: item.quantity,
        defectType: mapDefectType(item.defectType),
        emergencyNotes: item.emergencyNotes,
      })),
    };

    try {
      setIsSubmitting(true);

      if (!navigator.onLine) {
        await queueTicketOffline(payload);
        void runSync();
        toast.info("Sem conexão — chamado salvo no aparelho.", {
          description: "Ele será enviado automaticamente quando a internet voltar.",
        });
        onSuccess();
        handleReset();
        return;
      }

      try {
        const createdTicket = await ticketsService.create(payload);
        const partIdByCode = new Map<string, string>(
          (createdTicket.parts ?? []).map((p: any) => [p.partCode, p.id]),
        );

        for (const part of addedParts) {
          const uploaded = await ticketsService.uploadFileToR2(part.evidenceFile, createdTicket.id!);
          if (uploaded) {
            await ticketsService
              .confirmMedia({
                ticketId: createdTicket.id!,
                objectKey: uploaded.objectKey,
                mediaType: "DEFECT",
                capturedAt: part.capturedAt,
                latitude: part.latitude,
                longitude: part.longitude,
                ticketPartId: partIdByCode.get(part.partCode),
              })
              .catch((err) => console.warn("⚠️ Falha ao confirmar mídia de peça:", err));
          }
        }

        for (const evidence of generalEvidences) {
          const uploaded = await ticketsService.uploadFileToR2(evidence.file, createdTicket.id!);
          if (uploaded) {
            await ticketsService
              .confirmMedia({
                ticketId: createdTicket.id!,
                objectKey: uploaded.objectKey,
                mediaType: mapMediaTypeForOffline(evidence.type),
                capturedAt: evidence.timestamp,
                latitude: evidence.latitude,
                longitude: evidence.longitude,
              })
              .catch((err) => console.warn("⚠️ Falha ao confirmar evidência geral:", err));
          }
        }

        if (audioBlob) {
          const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, { type: "audio/webm" });
          const uploaded = await ticketsService.uploadFileToR2(audioFile, createdTicket.id!);
          if (uploaded) {
            await ticketsService
              .confirmMedia({
                ticketId: createdTicket.id!,
                objectKey: uploaded.objectKey,
                mediaType: "AUDIO",
                capturedAt: new Date().toISOString(),
              })
              .catch((err) => console.warn("⚠️ Falha ao confirmar áudio:", err));
          }
        }

        toast.success("Chamado enviado com sucesso!");
        onSuccess();
        handleReset();
      } catch (err: any) {
        const isNetworkFailure = !err?.response;
        if (isNetworkFailure) {
          await queueTicketOffline(payload);
          void runSync();
          toast.info("Falha de conexão — chamado salvo no aparelho.", {
            description: "Ele será enviado automaticamente quando a internet voltar.",
          });
          onSuccess();
          handleReset();
          return;
        }

        console.error("❌ Erro ao submeter chamado:", err);
        const details = err.response?.data?.details;
        let backendError = err.response?.data?.message || err.response?.data?.error || "Falha na validação do chamado.";
        if (details && typeof details === "object") {
          const formattedDetails = Object.entries(details)
            .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(", ") : val}`)
            .join(" | ");
          backendError = `Erro de validação: ${formattedDetails}`;
        }
        setErrorMessage(backendError);
      }
    } catch (err) {
      console.error("❌ Erro ao salvar chamado offline:", err);
      setErrorMessage("Não foi possível salvar o chamado no aparelho. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md transition-all ${
        isFullscreen ? "p-0" : "p-2 sm:p-4"
      }`}
    >
      <div
        className={`relative w-full border border-slate-700 bg-slate-900 shadow-2xl flex flex-col justify-between overflow-hidden text-slate-100 transition-all duration-200 ${
          isFullscreen ? "h-full w-full rounded-none p-4 sm:p-6" : "max-w-2xl max-h-[90vh] rounded-2xl p-4 sm:p-6"
        }`}
      >
        <div className="absolute right-4 top-4 flex items-center gap-1 z-10">
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title={isFullscreen ? "Restaurar Tamanho" : "Expandir Tela Cheia"}
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) processCaptured(e.target.files[0]);
          }}
        />

        <div className="shrink-0 pr-16">
          <div className="flex items-center gap-2">
            <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
              FVF OS CHECK
            </span>
            {isFallbackMode && (
              <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-300 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Modo Emergência
              </span>
            )}
          </div>
          <h2 className="mt-2 text-lg sm:text-xl font-bold">
            {step === 1 && "1. Nota, Produto & Consumidor"}
            {step === 2 && "2. Peças Avariadas & Evidências"}
            {step === 3 && "3. Revisão & Envio"}
          </h2>
        </div>

        {errorMessage && (
          <div className="my-2 shrink-0 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-xs text-red-300 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <div>{errorMessage}</div>
          </div>
        )}

        <div className="my-3 shrink-0 flex items-center gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${step >= i ? "bg-amber-400" : "bg-slate-800"}`} />
          ))}
        </div>

        {(isScannerActive || isCameraActive) && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-between bg-black p-4">
            <div className="w-full flex justify-between items-center text-white">
              <span className="text-xs font-bold text-amber-400">
                {isScannerActive ? "Posicione o Código de Barras / QR Code" : "Capturar Evidência"}
              </span>
              <button type="button" onClick={stopAllMedia} className="p-2">
                <VideoOff className="h-5 w-5" />
              </button>
            </div>
            <div className="relative my-auto w-full max-w-md aspect-video rounded-xl overflow-hidden border border-amber-500/50 bg-slate-950 flex items-center justify-center">
              <video
                ref={isScannerActive ? scannerVideoRef : cameraVideoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
              {isScannerActive && (
                <div className="absolute inset-0 border-2 border-amber-500/30 flex items-center justify-center">
                  <div className="relative w-3/4 h-28 border-2 border-dashed border-amber-400 rounded-lg overflow-hidden flex items-center">
                    <div className="w-full h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse" />
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 w-full max-w-md">
              {isCameraActive && (
                <button type="button" onClick={capturePhotoFromStream} className="flex-1 rounded-xl bg-amber-500 py-3 text-xs font-bold text-slate-950">
                  Fotografar
                </button>
              )}
              <button type="button" onClick={stopAllMedia} className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-xs font-semibold">
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-1 pb-3 pl-1">
          {step === 1 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 sm:p-4">
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Chave da NF-e (44 Dígitos) — câmera, digitação ou leitor a laser
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={44}
                    value={chaveNfe}
                    onChange={(e) => handleNfeChange(e.target.value)}
                    placeholder="Aponte o leitor a laser ou digite a chave"
                    className={`w-full rounded-lg border px-3 py-2 text-xs font-mono transition-colors outline-none focus:ring-1 ${
                      chaveNfe.length === 44
                        ? "border-emerald-500 bg-emerald-950/30 text-emerald-300 focus:ring-emerald-500"
                        : "border-slate-700 bg-slate-900 text-slate-100 focus:ring-slate-600"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={startNfeScanner}
                    className="flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 shrink-0"
                  >
                    <QrCode className="h-4 w-4" /> Cam
                  </button>
                </div>
                <p className="mt-1.5 text-[10px] text-slate-500">
                  Leitor a laser USB/Bluetooth funciona automaticamente com o modal aberto nesta etapa.
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-mono">{chaveNfe.length}/44 dígitos</span>
                  {chaveNfe.length === 44 && (
                    <span className="font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Chave Completa
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-3">
                  <span className="text-[11px] text-slate-400">Sem chave da Nota Fiscal?</span>
                  <button
                    type="button"
                    onClick={() => setIsFallbackMode(!isFallbackMode)}
                    className="text-xs font-semibold text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <Zap className="h-3.5 w-3.5" /> {isFallbackMode ? "Modo Normal" : "Ativar Modo Emergência"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Produto (SKU do catálogo)</label>
                <select
                  value={selectedSku}
                  onChange={(e) => setSelectedSku(e.target.value)}
                  disabled={loadingProducts}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:ring-1 focus:ring-slate-600"
                >
                  <option value="">{loadingProducts ? "Carregando catálogo..." : "Selecione o produto (opcional)"}</option>
                  {products.map((p) => (
                    <option key={p.sku} value={p.sku}>
                      {p.sku} — {p.name}
                    </option>
                  ))}
                </select>
                {!loadingProducts && products.length === 0 && (
                  <p className="mt-1 text-[10px] text-amber-400/80">Nenhum produto cadastrado para esta empresa ainda.</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Nome do Consumidor *</label>
                  <input
                    type="text"
                    value={clienteNome}
                    onChange={(e) => setClienteNome(e.target.value)}
                    placeholder="Ex: João da Silva"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:ring-1 focus:ring-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={clienteTelefone}
                    onChange={(e) => setClienteTelefone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:ring-1 focus:ring-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Lote de Fabricação</label>
                <input
                  type="text"
                  value={loteFabricacao}
                  onChange={(e) => setLoteFabricacao(e.target.value)}
                  placeholder="Ex: LT-99882"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:ring-1 focus:ring-slate-600"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Estado da Embalagem *</label>
                  <select
                    value={packageCondition}
                    onChange={(e) => setPackageCondition(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:ring-1 focus:ring-slate-600"
                  >
                    <option value="">Selecione</option>
                    <option value="INTACT">Intacta / Sem Danos</option>
                    <option value="DAMAGED">Danificada / Avariada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Responsabilidade Provável *</label>
                  <select
                    value={responsabilidadeEstimada}
                    onChange={(e) => setResponsabilidadeEstimada(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:ring-1 focus:ring-slate-600"
                  >
                    <option value="">Selecione</option>
                    <option value="TRANSPORT_DAMAGE">Transportadora</option>
                    <option value="FACTORY_DEFECT">Fábrica / Produção</option>
                    <option value="ASSEMBLY_ERROR">Montador / Cliente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Descrição do Problema</label>
                <textarea
                  rows={2}
                  value={descricaoDefeito}
                  onChange={(e) => setDescricaoDefeito(e.target.value)}
                  placeholder="Explique o defeito encontrado..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:ring-1 focus:ring-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  Evidências Gerais {isFallbackMode && <span className="text-red-400">(obrigatórias em Modo de Emergência)</span>}
                </label>
                <div className={cn("grid gap-2", isFallbackMode ? "grid-cols-2" : "grid-cols-1")}>
                  <EvidenceButton type="MANUAL_ETIQUETA" label="Etiqueta / DANFE" Icon={FileText} generalEvidences={generalEvidences} onCapture={startCameraForTarget} />
                  {isFallbackMode && (
                    <EvidenceButton type="MANUAL_PAGINA" label="Página do Manual" Icon={BookOpen} generalEvidences={generalEvidences} onCapture={startCameraForTarget} />
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase text-amber-400 flex items-center gap-1.5">
                  <Package className="h-4 w-4" /> Adicionar Peça Danificada
                </h3>

                <select
                  value={selectedPartCode}
                  onChange={(e) => {
                    const code = e.target.value;
                    setSelectedPartCode(code);
                    setCodigoPecaManual("");
                    const found = catalogParts.find((p) => p.code === code);
                    if (found) setDescricaoPeca(found.name);
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:ring-1 focus:ring-slate-600"
                >
                  <option value="">
                    {selectedSku ? "Selecionar peça do catálogo do produto" : "Selecione um produto na Etapa 1 para ver o catálogo"}
                  </option>
                  {catalogParts.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.code} - {p.name}
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={codigoPecaManual}
                    onChange={(e) => {
                      setCodigoPecaManual(e.target.value);
                      setSelectedPartCode("");
                    }}
                    placeholder="Ou código manual (Ex: P-04)"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:ring-1 focus:ring-slate-600"
                  />
                  <input
                    type="text"
                    value={descricaoPeca}
                    onChange={(e) => setDescricaoPeca(e.target.value)}
                    placeholder="Descrição da peça"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:ring-1 focus:ring-slate-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={tipoDefeitoPeca}
                    onChange={(e) => setTipoDefeitoPeca(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:ring-1 focus:ring-slate-600"
                  >
                    <option value="">Tipo de defeito</option>
                    <option value="PECA_QUEBRADA">Peça Quebrada</option>
                    <option value="FALTOU_PECA">Faltou Peça</option>
                    <option value="FERRAGEM_DEFEITUOSA">Ferragem Defeituosa</option>
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={quantidadePeca}
                    onChange={(e) => setQuantidadePeca(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:ring-1 focus:ring-slate-600 font-mono"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => startCameraForTarget("part")}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-lg border p-2.5 text-xs font-semibold",
                    pendingPartPhoto ? "border-emerald-500 bg-emerald-950/40 text-emerald-300" : "border-dashed border-amber-500/50 bg-slate-900 text-amber-300",
                  )}
                >
                  <Camera className="h-4 w-4" />
                  {pendingPartPhoto ? "Foto anexada (toque para refazer)" : "Fotografar avaria desta peça *"}
                </button>
                {pendingPartPhotoPreview && <img src={pendingPartPhotoPreview} className="h-24 w-full rounded-lg object-cover" />}

                <button
                  type="button"
                  onClick={handleAddPart}
                  className="flex w-full items-center justify-center gap-1 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
                >
                  <Plus className="h-4 w-4" /> Incluir Peça no Chamado
                </button>

                {addedParts.length > 0 && (
                  <div className="mt-3 border-t border-slate-800 pt-3 space-y-2">
                    <span className="block text-[11px] font-bold text-slate-400">Peças Adicionadas ({addedParts.length})</span>
                    {addedParts.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs">
                        <img src={item.evidencePreviewUrl} className="h-10 w-10 rounded object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-mono font-semibold text-slate-200 truncate">
                            {item.quantity}x {item.partCode}
                          </p>
                          <p className="text-slate-500 truncate">{item.description}</p>
                        </div>
                        <button type="button" onClick={() => handleRemovePart(item.id)} className="p-1 text-slate-500 hover:text-red-400 shrink-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <label className="block text-xs font-semibold text-slate-300 mb-2">Relato em Áudio (Até 1 Minuto)</label>
                {!audioUrl ? (
                  <div className="flex items-center gap-3">
                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={startRecording}
                        className="flex items-center gap-2 rounded-lg bg-red-600/20 border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-600/30"
                      >
                        <Mic className="h-4 w-4 text-red-400" /> Gravar Áudio
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white animate-pulse"
                      >
                        <Square className="h-4 w-4" /> Parar ({60 - recordingTime}s)
                      </button>
                    )}
                    {isRecording && <span className="text-xs font-mono text-red-400">Gravando... {recordingTime}s / 60s</span>}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <audio ref={audioPlayerRef} src={audioUrl} onEnded={() => setIsPlayingAudio(false)} className="hidden" />
                    <button
                      type="button"
                      onClick={() => {
                        if (isPlayingAudio) {
                          audioPlayerRef.current?.pause();
                          setIsPlayingAudio(false);
                        } else {
                          audioPlayerRef.current?.play();
                          setIsPlayingAudio(true);
                        }
                      }}
                      className="p-1.5 rounded-full bg-slate-800 text-amber-400 hover:bg-slate-700"
                    >
                      {isPlayingAudio ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    <span className="text-xs text-slate-300 font-mono flex-1">Áudio gravado ({recordingTime}s)</span>
                    <button type="button" onClick={removeAudio} className="p-1.5 text-slate-400 hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-400" /> Resumo do Chamado
                </h3>

                <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                    <UserCheck className="h-3 w-3" /> Consumidor
                  </span>
                  <p className="font-semibold text-slate-200">{clienteNome || "Não informado"}</p>
                  <p className="text-slate-400 text-[11px]">{clienteTelefone || "Sem telefone"}</p>
                </div>

                <div className="space-y-2">
                  <span className="block text-[10px] font-bold uppercase text-slate-500">Peças ({addedParts.length})</span>
                  {addedParts.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs">
                      <img src={item.evidencePreviewUrl} className="h-12 w-12 rounded object-cover shrink-0" />
                      <div>
                        <p className="font-mono font-semibold text-slate-200">
                          {item.quantity}x {item.partCode}
                        </p>
                        <p className="text-slate-500">
                          {item.description} — {item.defectType}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-slate-400 text-[11px]">
                  Evidências gerais: {generalEvidences.length} • Áudio: {audioUrl ? "anexado" : "não gravado"}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 shrink-0 flex items-center justify-between border-t border-slate-800 pt-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold hover:bg-slate-700 transition-colors"
            >
              Voltar
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="rounded-lg bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors"
            >
              Avançar
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Enviando...
                </>
              ) : (
                <>
                  <HardDriveUpload className="h-4 w-4" /> Criar Chamado
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function EvidenceButton({
  type,
  label,
  Icon,
  generalEvidences,
  onCapture,
}: {
  type: GeneralEvidence["type"];
  label: string;
  Icon: typeof FileText;
  generalEvidences: GeneralEvidence[];
  onCapture: (target: GeneralEvidence["type"]) => void;
}) {
  const captured = generalEvidences.find((e) => e.type === type);
  return (
    <button
      type="button"
      onClick={() => onCapture(type)}
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border p-3 text-xs font-semibold transition-all",
        captured ? "border-emerald-500 bg-emerald-950/40 text-emerald-300" : "border-dashed border-slate-700 bg-slate-950/40 text-slate-400 hover:bg-slate-800",
      )}
    >
      {captured ? <CheckCircle2 className="h-4 w-4 mb-1 text-emerald-400" /> : <Icon className="h-4 w-4 mb-1 text-amber-400" />}
      <span>{label}</span>
    </button>
  );
}