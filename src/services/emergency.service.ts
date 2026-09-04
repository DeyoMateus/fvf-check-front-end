export type RequiredEmergencyMediaType = "LABEL" | "DEFECT" | "MANUAL_PAGE";

export const EMERGENCY_MEDIA_LABELS: Record<
  RequiredEmergencyMediaType,
  string
> = {
  LABEL: "Etiqueta da caixa / DANFE",
  DEFECT: "Foto da peça danificada",
  MANUAL_PAGE: "Página do manual com a peça marcada",
};

export interface EmergencyStatusResponse {
  isEmergencyMode: boolean;
  satisfied: boolean;
  missing: RequiredEmergencyMediaType[];
}
