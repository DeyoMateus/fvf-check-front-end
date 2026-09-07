import { useEffect, useState } from "react";
import { Building2, PackageSearch, UserCheck, Wrench, Loader2 } from "lucide-react";
import { pecasService, type PecasAnalytics } from "../../services/pecas.service";
import { Stat } from "../../components/ui/Stat";

export function PartsAnalyticsWidget() {
  const [data, setData] = useState<PecasAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    pecasService
      .getAnalytics({})
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-24 items-center justify-center text-steel-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Stat label="Total de Avarias" value={data.totalRegistros} hint={`${data.totalItens} unidades`} icon={<PackageSearch className="h-5 w-5" />} tone="gold" />
      <Stat label="Ofensor Principal" value={data.topFabricaName} hint={`${data.topFabricaCount} casos`} icon={<Building2 className="h-5 w-5" />} tone="danger" />
      <Stat label="Destaque Técnico" value={data.topAssemblerName} hint={`${data.topAssemblerTotal} atend. (${data.topAssemblerErrors} falhas)`} icon={<UserCheck className="h-5 w-5" />} tone="gold" />
      <Stat label="Falha de Montagem" value={data.assemblyCases} hint={`vs ${data.factoryCases} de fábrica`} icon={<Wrench className="h-5 w-5" />} tone="info" />
    </div>
  );
}