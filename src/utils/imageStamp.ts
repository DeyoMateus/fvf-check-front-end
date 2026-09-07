/**
 * Desenha um carimbo com data/hora, coordenadas e (best-effort) endereço
 * diretamente sobre a imagem, via Canvas — assim a evidência antifraude
 * fica visível no próprio arquivo, não só como metadado no banco.
 */
interface StampMeta {
  timestamp: string;
  latitude?: number;
  longitude?: number;
}

async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string | null> {
  try {
    // Nominatim (OpenStreetMap) — gratuito, sem API key, mas com rate
    // limit (~1 req/s). Aceitável para uso pontual de captura em campo;
    // se o volume crescer, migrar para um provedor pago (Google/Mapbox).
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`,
      { headers: { "Accept-Language": "pt-BR" } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.display_name ?? null;
  } catch {
    return null; // best-effort — nunca bloqueia a captura da foto
  }
}

export async function stampImageWithMetadata(
  file: File,
  meta: StampMeta,
): Promise<File> {
  const address =
    meta.latitude && meta.longitude
      ? await reverseGeocode(meta.latitude, meta.longitude)
      : null;

  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file; // sem canvas disponível, devolve original

  ctx.drawImage(bitmap, 0, 0);

  const lines = [
    new Date(meta.timestamp).toLocaleString("pt-BR"),
    meta.latitude && meta.longitude
      ? `GPS: ${meta.latitude.toFixed(6)}, ${meta.longitude.toFixed(6)}`
      : "GPS indisponível",
    address ? truncate(address, 60) : null,
  ].filter(Boolean) as string[];

  const barHeight = 22 * lines.length + 16;
  ctx.fillStyle = "rgba(0,0,0,0.65)";
  ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);

  ctx.fillStyle = "#ffffff";
  ctx.font = "16px sans-serif";
  lines.forEach((line, i) => {
    ctx.fillText(line, 10, canvas.height - barHeight + 22 * (i + 1) + 4);
  });

  const blob: Blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.9),
  );

  return new File([blob], file.name, { type: "image/jpeg" });
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}
