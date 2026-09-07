import { useEffect, useState } from "react";
import { Download, Loader2, ChevronDown } from "lucide-react";
import { pecasService, type PecaAvariada, type PageLimit } from "../../services/pecas.service";

export function PartsQuantityTableWidget() {
  const [items, setItems] = useState<PecaAvariada[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<PageLimit>(50);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  async function load(targetPage: number, append: boolean) {
    setLoading(true);
    try {
      const result = await pecasService.getPage({
        page: targetPage,
        limit,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setItems((prev) => (append ? [...prev, ...result.items] : result.items));
      setPage(result.page);
      setTotal(result.total);
      setHasMore(result.hasMore);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, startDate, endDate]);

  async function handleExport() {
    try {
      setExporting(true);
      const blob = await pecasService.exportCsv({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pecas-avariadas-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="rounded-md border border-steel-700 bg-abyss-950 px-2 py-1 text-[11px] text-steel-200"
        />
        <span className="text-[10px] text-steel-500">até</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="rounded-md border border-steel-700 bg-abyss-950 px-2 py-1 text-[11px] text-steel-200"
        />

        <div className="relative ml-auto flex items-center gap-1">
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value) as PageLimit)}
            className="rounded-md border border-steel-700 bg-abyss-950 px-2 py-1 text-[11px] text-steel-200"
          >
            <option value={10}>10 por página</option>
            <option value={50}>50 por página</option>
            <option value={100}>100 por página</option>
          </select>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1 rounded-md border border-gold-500/30 bg-gold-500/5 px-2 py-1 text-[11px] font-semibold text-gold-300 hover:bg-gold-500/15 disabled:opacity-50"
          >
            {exporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
            Exportar
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-lg border border-steel-800">
        <table className="w-full text-[11px]">
          <thead className="sticky top-0 bg-abyss-900 text-steel-400">
            <tr>
              <th className="px-2 py-1.5 text-left">Peça</th>
              <th className="px-2 py-1.5 text-left">Qtd</th>
              <th className="px-2 py-1.5 text-left">Chamado</th>
              <th className="px-2 py-1.5 text-left">Fábrica</th>
              <th className="px-2 py-1.5 text-left">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-steel-800/60">
            {items.map((p) => (
              <tr key={p.id} className="text-steel-200">
                <td className="px-2 py-1.5 font-mono text-gold-300">{p.partCode}</td>
                <td className="px-2 py-1.5">{p.quantity}</td>
                <td className="px-2 py-1.5 font-mono">{p.ticketCode}</td>
                <td className="px-2 py-1.5">{p.fabrica}</td>
                <td className="px-2 py-1.5">{new Date(p.createdAt).toLocaleDateString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-[10px] text-steel-500">
        <span>{items.length} de {total} registro(s)</span>
        {hasMore && (
          <button
            onClick={() => load(page + 1, true)}
            disabled={loading}
            className="flex items-center gap-1 font-semibold text-gold-300 hover:underline"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ChevronDown className="h-3 w-3" />}
            Carregar mais
          </button>
        )}
      </div>
    </div>
  );
}