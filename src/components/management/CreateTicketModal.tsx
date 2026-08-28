import { useState, useRef, useEffect } from "react";
import {
  X,
  QrCode,
  Camera,
  AlertTriangle,
  FileText,
  ShieldAlert,
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
} from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { ticketsService, CreateTicketPayload } from "../../services/tickets.service";

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 1 | 2 | 3;

interface EvidencePhoto {
  id: string;
  type: "GERAL" | "AVARIA" | "MANUAL_ETIQUETA";
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
  defectType: string;
  emergencyNotes?: string;
}

const PECA_CATALOG_MOCK = [
  { code: "P-101", name: "Lateral Esquerda 2100x450x15mm" },
  { code: "P-102", name: "Lateral Direita 2100x450x15mm" },
  { code: "P-103", name: "Tampo Superior 1800x450x15mm" },
  { code: "P-104", name: "Base Inferior 1800x450x15mm" },
  { code: "P-201", name: "Frente de Gaveta Mel 600x200mm" },
  { code: "K-001", name: "Kit Ferragem Completo (Minifix + Cavilhas)" },
];

async function captureGeolocation(): Promise<{ latitude?: number; longitude?: number }> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) {
      resolve({});
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => resolve({}),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  });
}

export function CreateTicketModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateTicketModalProps) {
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

  // Form States - Etapa 1
  const [chaveNfe, setChaveNfe] = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [produtoNome, setProdutoNome] = useState("");
  const [loteFabricacao, setLoteFabricacao] = useState("");

  // Form States - Etapa 2
  const [tipoAvaria, setTipoAvaria] = useState<
    "PECA_QUEBRADA" | "FALTOU_PECA" | "FERRAGEM_DEFEITUOSA" | "EMBALAGEM_AVARIADA" | ""
  >("");
  const [packageCondition, setPackageCondition] = useState<"INTACT" | "DAMAGED" | "">("");
  const [responsabilidadeEstimada, setResponsabilidadeEstimada] = useState<
    "TRANSPORT_DAMAGE" | "FACTORY_DEFECT" | "ASSEMBLY_ERROR" | ""
  >("");
  const [descricaoDefeito, setDescricaoDefeito] = useState("");
  const [photos, setPhotos] = useState<EvidencePhoto[]>([]);

  // Form States - Etapa 3 (Lista de Peças)
  const [addedParts, setAddedParts] = useState<TicketPartItem[]>([]);
  const [selectedPartCode, setSelectedPartCode] = useState("");
  const [codigoPecaManual, setCodigoPecaManual] = useState("");
  const [descricaoPeca, setDescricaoPeca] = useState("");
  const [quantidadePeca, setQuantidadePeca] = useState(1);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPhotoType, setCurrentPhotoType] = useState<EvidencePhoto["type"]>("GERAL");

  const stopAllMedia = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsScannerActive(false);
    setIsCameraActive(false);
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
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
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

  if (!isOpen) return null;

  const startNfeScanner = async () => {
    setErrorMessage(null);
    setIsScannerActive(true);

    try {
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      setTimeout(async () => {
        if (scannerVideoRef.current) {
          await codeReader.decodeFromVideoDevice(
            null,
            scannerVideoRef.current,
            (result) => {
              if (result) {
                const text = result.getText().replace(/\D/g, "");
                handleNfeChange(text);
                stopAllMedia();
              }
            }
          );
        }
      }, 200);
    } catch {
      setErrorMessage("Não foi possível acessar a câmera para leitura de código.");
      setIsScannerActive(false);
    }
  };

  const handleNfeChange = (val: string) => {
    const clean = val.replace(/\D/g, "");
    setChaveNfe(clean);
    if (clean.length === 44) {
      if (!produtoNome) setProdutoNome("Móvel Kit Cozinha Premium");
      if (!loteFabricacao) setLoteFabricacao(`LT-${clean.substring(22, 28)}`);
    }
  };

  const startCameraForPhoto = async (type: EvidencePhoto["type"]) => {
    setCurrentPhotoType(type);
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

  const addPhotoToList = async (file: File, timestamp: string) => {
    const coords = await captureGeolocation();

    const newPhoto: EvidencePhoto = {
      id: crypto.randomUUID(),
      type: currentPhotoType,
      file,
      previewUrl: URL.createObjectURL(file),
      timestamp,
      latitude: coords.latitude,
      longitude: coords.longitude,
    };
    setPhotos((prev) => [...prev.filter((p) => p.type !== currentPhotoType), newPhoto]);
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const photoToRemove = prev.find((p) => p.id === id);
      if (photoToRemove) {
        URL.revokeObjectURL(photoToRemove.previewUrl);
      }
      return prev.filter((p) => p.id !== id);
    });
  };

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
          addPhotoToList(file, new Date().toISOString());
          stopAllMedia();
        }
      }, "image/jpeg");
    }
  };

  const handleAddPart = () => {
    const code = selectedPartCode || codigoPecaManual;
    if (!code) {
      setErrorMessage("Informe o código da peça ou selecione-a no catálogo.");
      return;
    }

    const newPart: TicketPartItem = {
      id: crypto.randomUUID(),
      partCode: code,
      description: descricaoPeca || code,
      quantity: quantidadePeca > 0 ? quantidadePeca : 1,
      defectType: tipoAvaria || "PECA_QUEBRADA",
      emergencyNotes: descricaoDefeito || undefined,
    };

    setAddedParts((prev) => [...prev, newPart]);
    setSelectedPartCode("");
    setCodigoPecaManual("");
    setDescricaoPeca("");
    setQuantidadePeca(1);
    setErrorMessage(null);
  };

  const handleRemovePart = (id: string) => {
    setAddedParts((prev) => prev.filter((p) => p.id !== id));
  };

  const validateStep1 = () => {
    if (!clienteNome.trim()) {
      setErrorMessage("Por favor, preencha o Nome do Consumidor na Etapa 1.");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!tipoAvaria) {
      setErrorMessage("Por favor, selecione o Tipo de Avaria.");
      return false;
    }
    if (!packageCondition) {
      setErrorMessage("Por favor, informe o Estado da Embalagem (Intacta ou Danificada).");
      return false;
    }
    if (!responsabilidadeEstimada) {
      setErrorMessage("Por favor, selecione a Responsabilidade Provável.");
      return false;
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

  const handleSubmit = async () => {
    setErrorMessage(null);

    if (!validateStep1()) {
      setStep(1);
      return;
    }
    if (!validateStep2()) {
      setStep(2);
      return;
    }

    let finalParts = [...addedParts];
    if (finalParts.length === 0) {
      const code = selectedPartCode || codigoPecaManual || "PECA-GENERICA";
      finalParts.push({
        id: crypto.randomUUID(),
        partCode: code,
        description: descricaoPeca || code,
        quantity: quantidadePeca > 0 ? quantidadePeca : 1,
        defectType: tipoAvaria || "PECA_QUEBRADA",
        emergencyNotes: descricaoDefeito || undefined,
      });
    }

    try {
      setIsSubmitting(true);

      const mapDefectType = (type: string) => {
        switch (type) {
          case "PECA_QUEBRADA": return "BROKEN";
          case "FALTOU_PECA": return "MISSING";
          case "FERRAGEM_DEFEITUOSA":
          case "EMBALAGEM_AVARIADA":
          default: return "HARDWARE_FAULT";
        }
      };

      const mapMediaType = (type: EvidencePhoto["type"]): "LABEL" | "DEFECT" | "AMBIENT" | "AUDIO" => {
        switch (type) {
          case "MANUAL_ETIQUETA": return "LABEL";
          case "AVARIA": return "DEFECT";
          default: return "AMBIENT";
        }
      };

      const uploadedMediaFiles: NonNullable<CreateTicketPayload["mediaFiles"]> = await Promise.all(
        photos.map(async (photo) => {
          const url = await ticketsService.uploadFileToR2(photo.file);
          return {
            url,
            type: mapMediaType(photo.type),
            latitude: photo.latitude,
            longitude: photo.longitude,
            capturedAt: new Date().toISOString(), // Formato ISO exigido pelo backend
          };
        })
      );

      if (audioBlob) {
        const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, { type: "audio/webm" });
        const audioMediaUrl = await ticketsService.uploadFileToR2(audioFile);
        uploadedMediaFiles.push({
          url: audioMediaUrl,
          type: "AUDIO",
          latitude: undefined,
          longitude: undefined,
          capturedAt: new Date().toISOString(),
        });
      }

      const payload: CreateTicketPayload = {
        isEmergencyMode: isFallbackMode,
        packageCondition: packageCondition as "INTACT" | "DAMAGED",
        suggestedResponsibility: responsabilidadeEstimada as "TRANSPORT_DAMAGE" | "FACTORY_DEFECT" | "ASSEMBLY_ERROR",
        invoice: {
          nfeKey: chaveNfe.length === 44 ? chaveNfe : "35240800000000000000550010000000001000000000",
          number: chaveNfe.length >= 34 ? chaveNfe.substring(25, 34) : "000000001",
          series: "1",
          issuedAt: new Date().toISOString(),
          customer: {
            name: clienteNome,
            phone: clienteTelefone || undefined,
          },
          productName: produtoNome || "Móvel Padronizado",
          batchNumber: loteFabricacao || "LT-DEFAULT",
        },
        parts: finalParts.map((item) => ({
          partCode: item.partCode,
          quantity: item.quantity,
          defectType: mapDefectType(item.defectType),
          emergencyNotes: item.emergencyNotes,
        })),
        mediaFiles: uploadedMediaFiles.length > 0 ? uploadedMediaFiles : undefined,
      };

      await ticketsService.create(payload);
      onSuccess();
      handleReset();
    } catch (err: any) {
      const backendError =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Falha na validação do chamado. Verifique os campos obrigatórios.";
      setErrorMessage(backendError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    stopAllMedia();
    removeAudio();
    setStep(1);
    setChaveNfe("");
    setClienteNome("");
    setClienteTelefone("");
    setProdutoNome("");
    setLoteFabricacao("");
    setTipoAvaria("");
    setPackageCondition("");
    setResponsabilidadeEstimada("");
    setDescricaoDefeito("");
    setPhotos([]);
    setAddedParts([]);
    setSelectedPartCode("");
    setCodigoPecaManual("");
    setDescricaoPeca("");
    setQuantidadePeca(1);
    setIsFallbackMode(false);
    setErrorMessage(null);
    setIsFullscreen(false);
    onClose();
  };

  const getPhotoTypeLabel = (type: EvidencePhoto["type"]) => {
    switch (type) {
      case "GERAL": return "Visão Geral";
      case "AVARIA": return "Avaria";
      case "MANUAL_ETIQUETA": return "Etiqueta";
    }
  };

  const getPhotoForType = (type: EvidencePhoto["type"]) => {
    return photos.find((p) => p.type === type);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md transition-all ${isFullscreen ? "p-0" : "p-2 sm:p-4"}`}>
      <div
        className={`relative w-full border border-slate-700 bg-slate-900 shadow-2xl flex flex-col justify-between overflow-hidden text-slate-100 transition-all duration-200 ${
          isFullscreen
            ? "h-full w-full rounded-none p-4 sm:p-6"
            : "max-w-2xl max-h-[90vh] rounded-2xl p-4 sm:p-6"
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
            if (e.target.files?.[0]) {
              addPhotoToList(e.target.files[0], new Date().toISOString());
            }
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
            {step === 1 && "1. Leitura de Nota & Consumidor"}
            {step === 2 && "2. Triagem de Defeito & Áudio"}
            {step === 3 && "3. Vínculo de Peças & Resumo"}
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
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                step >= i ? "bg-amber-400" : "bg-slate-800"
              }`}
            />
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
                <button
                  type="button"
                  onClick={capturePhotoFromStream}
                  className="flex-1 rounded-xl bg-amber-500 py-3 text-xs font-bold text-slate-950"
                >
                  Fotografar
                </button>
              )}
              <button
                type="button"
                onClick={stopAllMedia}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-xs font-semibold"
              >
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
                  Chave da NF-e (44 Dígitos)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={44}
                    value={chaveNfe}
                    onChange={(e) => handleNfeChange(e.target.value)}
                    placeholder="3524 0800 0000 0000 0000 5500 1000 0000 0010 0000 0000"
                    className={`w-full rounded-lg border px-3 py-2 text-xs font-mono transition-colors outline-none focus:outline-none focus:ring-1 ${
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
                    <Zap className="h-3.5 w-3.5" />
                    {isFallbackMode ? "Modo Normal" : "Ativar Modo Emergência"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Nome do Consumidor *
                  </label>
                  <input
                    type="text"
                    value={clienteNome}
                    onChange={(e) => setClienteNome(e.target.value)}
                    placeholder="Ex: João da Silva"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:outline-none focus:ring-1 focus:ring-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={clienteTelefone}
                    onChange={(e) => setClienteTelefone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:outline-none focus:ring-1 focus:ring-slate-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Nome do Produto
                  </label>
                  <input
                    type="text"
                    value={produtoNome}
                    onChange={(e) => setProdutoNome(e.target.value)}
                    placeholder="Ex: Cozinha 3 Peças"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:outline-none focus:ring-1 focus:ring-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Lote de Fabricação
                  </label>
                  <input
                    type="text"
                    value={loteFabricacao}
                    onChange={(e) => setLoteFabricacao(e.target.value)}
                    placeholder="Ex: LT-99882"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:outline-none focus:ring-1 focus:ring-slate-600"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="w-full min-w-0 max-w-full box-border">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Tipo de Avaria *
                  </label>
                  <select
                    value={tipoAvaria}
                    onChange={(e) => setTipoAvaria(e.target.value as any)}
                    className="w-full min-w-0 max-w-full box-border rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:outline-none focus:ring-1 focus:ring-slate-600"
                  >
                    <option value="">Selecione uma opção</option>
                    <option value="PECA_QUEBRADA">Peça Quebrada</option>
                    <option value="FALTOU_PECA">Faltou Peça</option>
                    <option value="FERRAGEM_DEFEITUOSA">Ferragem Defeituosa</option>
                    <option value="EMBALAGEM_AVARIADA">Embalagem Avariada</option>
                  </select>
                </div>

                <div className="w-full min-w-0 max-w-full box-border">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Estado da Embalagem *
                  </label>
                  <select
                    value={packageCondition}
                    onChange={(e) => setPackageCondition(e.target.value as any)}
                    className="w-full min-w-0 max-w-full box-border rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:outline-none focus:ring-1 focus:ring-slate-600"
                  >
                    <option value="">Selecione uma opção</option>
                    <option value="INTACT">Intacta / Sem Danos</option>
                    <option value="DAMAGED">Danificada / Avariada</option>
                  </select>
                </div>

                <div className="w-full min-w-0 max-w-full box-border">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Responsabilidade Provável *
                  </label>
                  <select
                    value={responsabilidadeEstimada}
                    onChange={(e) => setResponsabilidadeEstimada(e.target.value as any)}
                    className="w-full min-w-0 max-w-full box-border rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:outline-none focus:ring-1 focus:ring-slate-600"
                  >
                    <option value="">Selecione uma opção</option>
                    <option value="TRANSPORT_DAMAGE">Transportadora</option>
                    <option value="FACTORY_DEFECT">Fábrica / Produção</option>
                    <option value="ASSEMBLY_ERROR">Montador / Cliente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Fotos de Evidência
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: "GERAL" as const, label: "Visão Geral", Icon: Camera },
                    { type: "AVARIA" as const, label: "Avaria", Icon: ShieldAlert },
                    { type: "MANUAL_ETIQUETA" as const, label: "Etiqueta", Icon: FileText },
                  ].map(({ type, label, Icon }) => {
                    const photo = getPhotoForType(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => startCameraForPhoto(type)}
                        className={`flex flex-col items-center justify-center rounded-xl border p-3 text-xs font-semibold transition-all ${
                          photo
                            ? "border-emerald-500 bg-emerald-950/40 text-emerald-300 ring-1 ring-emerald-500/50"
                            : "border-dashed border-slate-700 bg-slate-950/40 text-slate-400 hover:bg-slate-800 hover:text-white"
                        }`}
                      >
                        {photo ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 mb-1 text-emerald-400" />
                            <span>{label}</span>
                            <span className="text-[9px] text-emerald-400/80 font-normal mt-0.5">
                              OK (Refazer)
                            </span>
                          </>
                        ) : (
                          <>
                            <Icon className="h-4 w-4 mb-1 text-amber-400" />
                            <span>{label}</span>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>

                {photos.length > 0 && (
                  <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                    <span className="block text-[11px] font-bold text-slate-400 mb-2">
                      Fotos Anexadas ({photos.length})
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {photos.map((photo) => (
                        <div
                          key={photo.id}
                          className="relative group rounded-lg overflow-hidden border border-slate-700 bg-black aspect-video flex items-center justify-center"
                        >
                          <img
                            src={photo.previewUrl}
                            alt={getPhotoTypeLabel(photo.type)}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-slate-950/80 px-2 py-1 flex items-center justify-between text-[10px] text-slate-300">
                            <span className="font-semibold text-emerald-400">
                              {getPhotoTypeLabel(photo.type)}
                            </span>
                            <button
                              type="button"
                              onClick={() => removePhoto(photo.id)}
                              className="p-0.5 text-red-400 hover:text-red-300"
                              title="Remover Foto"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Descrição do Problema
                </label>
                <textarea
                  rows={2}
                  value={descricaoDefeito}
                  onChange={(e) => setDescricaoDefeito(e.target.value)}
                  placeholder="Explique o defeito encontrado..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:outline-none focus:ring-1 focus:ring-slate-600"
                />
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Relato em Áudio (Até 1 Minuto)
                </label>

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
                    {isRecording && (
                      <span className="text-xs font-mono text-red-400">
                        Gravando... {recordingTime}s / 60s
                      </span>
                    )}
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
                    <span className="text-xs text-slate-300 font-mono flex-1">
                      Áudio gravado ({recordingTime}s)
                    </span>
                    <button
                      type="button"
                      onClick={removeAudio}
                      className="p-1.5 text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase text-amber-400 flex items-center gap-1.5">
                  <Package className="h-4 w-4" /> Adicionar Peças Danificadas
                </h3>

                <div className="w-full min-w-0 max-w-full box-border">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Selecionar do Catálogo
                  </label>
                  <select
                    value={selectedPartCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      setSelectedPartCode(code);
                      setCodigoPecaManual("");
                      const found = PECA_CATALOG_MOCK.find((p) => p.code === code);
                      if (found) setDescricaoPeca(found.name);
                    }}
                    className="w-full min-w-0 max-w-full box-border rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:outline-none focus:ring-1 focus:ring-slate-600 mb-2"
                  >
                    <option value="">Selecione uma opção</option>
                    {PECA_CATALOG_MOCK.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.code} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Código Manual
                    </label>
                    <input
                      type="text"
                      value={codigoPecaManual}
                      onChange={(e) => {
                        setCodigoPecaManual(e.target.value);
                        setSelectedPartCode("");
                      }}
                      placeholder="Ex: P-04"
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:outline-none focus:ring-1 focus:ring-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Descrição da Peça
                    </label>
                    <input
                      type="text"
                      value={descricaoPeca}
                      onChange={(e) => setDescricaoPeca(e.target.value)}
                      placeholder="Ex: Lateral Esquerda"
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:outline-none focus:ring-1 focus:ring-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Quantidade
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={1}
                        value={quantidadePeca}
                        onChange={(e) => setQuantidadePeca(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:outline-none focus:ring-1 focus:ring-slate-600 font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleAddPart}
                        className="flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors shrink-0"
                      >
                        <Plus className="h-4 w-4" /> Incluir
                      </button>
                    </div>
                  </div>
                </div>

                {addedParts.length > 0 && (
                  <div className="mt-3 border-t border-slate-800 pt-3">
                    <span className="block text-[11px] font-bold text-slate-400 mb-2">
                      Peças Adicionadas ({addedParts.length})
                    </span>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {addedParts.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-amber-400 font-bold">{item.quantity}x</span>
                            <span className="font-mono font-semibold text-slate-200">{item.partCode}</span>
                            <span className="text-slate-400 hidden sm:inline">- {item.description}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemovePart(item.id)}
                            className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                            title="Remover Item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-400" /> Resumo do Chamado
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                      <UserCheck className="h-3 w-3" /> Consumidor & Produto
                    </span>
                    <p className="font-semibold text-slate-200">{clienteNome || "Não informado"}</p>
                    <p className="text-slate-400 text-[11px]">{clienteTelefone || "Sem telefone"}</p>
                    <p className="text-slate-300 text-[11px]">Produto: <span className="text-slate-100">{produtoNome || "Padrão"}</span></p>
                    <p className="text-slate-300 text-[11px]">Lote: <span className="text-slate-100">{loteFabricacao || "Não informado"}</span></p>
                  </div>

                  <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                      <ShieldAlert className="h-3 w-3" /> Triagem & Avaria
                    </span>
                    <p className="text-slate-300">
                      Tipo: <span className="text-amber-400 font-semibold">{tipoAvaria || "Não definido"}</span>
                    </p>
                    <p className="text-slate-300">
                      Embalagem: <span className="text-slate-100">{packageCondition === "DAMAGED" ? "Danificada" : "Intacta"}</span>
                    </p>
                    <p className="text-slate-400 text-[11px]">
                      Evidências: {photos.length} foto(s) {audioUrl ? "+ Áudio anexado" : ""}
                    </p>
                  </div>
                </div>
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