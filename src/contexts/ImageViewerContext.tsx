import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { X, ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export interface ViewerImage {
  url: string;
  label?: string;
}

interface ImageViewerContextValue {
  open: (images: ViewerImage[], startIndex?: number) => void;
}

const ImageViewerContext = createContext<ImageViewerContextValue | null>(null);

export function useImageViewer(): ImageViewerContextValue {
  const ctx = useContext(ImageViewerContext);
  if (!ctx) {
    throw new Error("useImageViewer precisa ser usado dentro de <ImageViewerProvider>");
  }
  return ctx;
}

export function ImageViewerProvider({ children }: { children: ReactNode }) {
  const [images, setImages] = useState<ViewerImage[] | null>(null);
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [downloading, setDownloading] = useState(false);
  const dragState = useRef<{ startX: number; startY: number; offsetX: number; offsetY: number } | null>(null);

  const open = useCallback((imgs: ViewerImage[], startIndex = 0) => {
    if (!imgs.length) return;
    setImages(imgs);
    setIndex(Math.min(Math.max(startIndex, 0), imgs.length - 1));
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const close = useCallback(() => {
    setImages(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const next = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setIndex((i) => (images ? (i + 1) % images.length : i));
  }, [images]);

  const prev = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setIndex((i) => (images ? (i - 1 + images.length) % images.length : i));
  }, [images]);

  useEffect(() => {
    if (!images) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [images, close, next, prev]);

  async function handleDownload() {
    if (!images) return;
    const current = images[index];
    try {
      setDownloading(true);
      const response = await fetch(current.url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = current.url.split("/").pop()?.split("?")[0] || "evidencia.jpg";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Erro ao baixar imagem:", err);
      window.open(current.url, "_blank");
    } finally {
      setDownloading(false);
    }
  }

  function toggleZoom() {
    setZoom((z) => (z === 1 ? 2 : 1));
    setOffset({ x: 0, y: 0 });
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (zoom === 1) return;
    dragState.current = { startX: e.clientX, startY: e.clientY, offsetX: offset.x, offsetY: offset.y };
  }
  function handleMouseMove(e: React.MouseEvent) {
    if (!dragState.current) return;
    setOffset({
      x: dragState.current.offsetX + (e.clientX - dragState.current.startX),
      y: dragState.current.offsetY + (e.clientY - dragState.current.startY),
    });
  }
  function handleMouseUp() {
    dragState.current = null;
  }

  const current = images ? images[index] : null;

  return (
    <ImageViewerContext.Provider value={{ open }}>
      {children}
      {current && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-sm" onClick={close}>
          <div className="flex items-center justify-between gap-3 px-4 py-3 text-steel-100" onClick={(e) => e.stopPropagation()}>
            <div className="min-w-0">
              {current.label && <p className="truncate text-sm font-semibold text-gold-300">{current.label}</p>}
              {images && images.length > 1 && (
                <p className="text-[11px] text-steel-400">{index + 1} de {images.length}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleZoom} className="rounded-md border border-steel-700 bg-abyss-900/80 p-2 text-steel-200 hover:bg-abyss-800" title={zoom === 1 ? "Aproximar" : "Afastar"}>
                {zoom === 1 ? <ZoomIn className="h-4 w-4" /> : <ZoomOut className="h-4 w-4" />}
              </button>
              <button onClick={handleDownload} disabled={downloading} className="rounded-md border border-steel-700 bg-abyss-900/80 p-2 text-steel-200 hover:bg-abyss-800 disabled:opacity-50" title="Baixar imagem">
                {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              </button>
              <button onClick={close} className="rounded-md border border-steel-700 bg-abyss-900/80 p-2 text-steel-200 hover:bg-abyss-800" title="Fechar">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div
            className="relative flex flex-1 items-center justify-center overflow-hidden px-4 pb-4"
            onClick={(e) => e.stopPropagation()}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {images && images.length > 1 && (
              <button onClick={prev} className="absolute left-2 z-10 rounded-full border border-steel-700 bg-abyss-900/80 p-2 text-steel-200 hover:bg-abyss-800">
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <img
              src={current.url}
              alt={current.label || "Evidência"}
              onMouseDown={handleMouseDown}
              onDoubleClick={toggleZoom}
              draggable={false}
              className="max-h-full max-w-full select-none rounded-lg object-contain shadow-2xl transition-transform"
              style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`, cursor: zoom === 1 ? "zoom-in" : "grab" }}
            />
            {images && images.length > 1 && (
              <button onClick={next} className="absolute right-2 z-10 rounded-full border border-steel-700 bg-abyss-900/80 p-2 text-steel-200 hover:bg-abyss-800">
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      )}
    </ImageViewerContext.Provider>
  );
}