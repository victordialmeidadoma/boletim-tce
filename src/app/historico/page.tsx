"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, FileText, Newspaper, Loader2, Download } from "lucide-react";
import { formatWeekday, cn } from "@/lib/utils";

interface HistoricoEntry {
  data: string;
  relatorio?: {
    id: string;
    total: number;
    arquivados: number;
    requerem_acao: number;
    visitar_mp: number;
  };
  boletim?: {
    id: string;
    total_municipios: number;
  };
}

export default function HistoricoPage() {
  const [entries, setEntries] = useState<HistoricoEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/historico")
      .then((r) => r.json())
      .then((d) => { setEntries(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function downloadMovimentacao(data: string) {
    setDownloading(data + "-mov");
    try {
      const res = await fetch("/api/gerar-relatorio-movimentacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      if (!res.ok) { alert("Nenhuma movimentação para gerar."); return; }
      const html = await res.text();
      const blob = new Blob([html], { type: "text/html" });
      window.open(URL.createObjectURL(blob), "_blank");
    } finally {
      setDownloading(null);
    }
  }

  async function downloadCompleto(data: string) {
    setDownloading(data + "-completo");
    try {
      const res = await fetch("/api/gerar-completo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      if (!res.ok) { alert("Nenhum boletim para gerar."); return; }
      const html = await res.text();
      const blob = new Blob([html], { type: "text/html" });
      window.open(URL.createObjectURL(blob), "_blank");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink-900">Histórico</h1>
        <p className="text-ink-500 text-sm mt-1">Movimentações e boletins dos últimos 30 dias.</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-ink-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Carregando...
        </div>
      )}

      {!loading && entries.length === 0 && (
        <div className="text-center py-16">
          <p className="text-ink-400 text-sm">Nenhum relatório gerado ainda.</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-3 text-sm text-brand-600 hover:text-brand-700"
          >
            Importar primeira movimentação →
          </button>
        </div>
      )}

      {!loading && entries.length > 0 && (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          {entries.map((entry, i) => (
            <div
              key={entry.data}
              className={cn(
                "px-5 py-4 hover:bg-ink-50 transition-colors",
                i < entries.length - 1 && "border-b border-ink-100"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className="cursor-pointer flex-1"
                  onClick={() => router.push(`/historico/${entry.data}`)}
                >
                  <p className="text-sm font-medium text-ink-800 capitalize">
                    {formatWeekday(entry.data)}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    {entry.relatorio && (
                      <span className="flex items-center gap-1 text-xs text-ink-400">
                        <FileText className="w-3 h-3" />
                        {entry.relatorio.total} processos · {entry.relatorio.requerem_acao} ações
                      </span>
                    )}
                    {entry.boletim && (
                      <span className="flex items-center gap-1 text-xs text-ink-400">
                        <Newspaper className="w-3 h-3" />
                        {entry.boletim.total_municipios} municípios
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {entry.relatorio && (
                    <span className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full">
                      <CheckCircle className="w-3 h-3" />
                      Movimentação
                    </span>
                  )}
                  {entry.boletim && (
                    <span className="flex items-center gap-1 text-xs bg-brand-50 text-brand-600 px-2 py-1 rounded-full">
                      <CheckCircle className="w-3 h-3" />
                      Boletim
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                {entry.relatorio && (
                  <button
                    onClick={() => downloadMovimentacao(entry.data)}
                    disabled={downloading === entry.data + "-mov"}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-ink-200 text-xs text-ink-600 hover:bg-ink-50 disabled:opacity-50"
                  >
                    {downloading === entry.data + "-mov"
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <Download className="w-3 h-3" />}
                    Movimentação
                  </button>
                )}
                {entry.boletim && (
                  <button
                    onClick={() => downloadCompleto(entry.data)}
                    disabled={downloading === entry.data + "-completo"}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-ink-200 text-xs text-ink-600 hover:bg-ink-50 disabled:opacity-50"
                  >
                    {downloading === entry.data + "-completo"
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <Download className="w-3 h-3" />}
                    Boletim completo
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
