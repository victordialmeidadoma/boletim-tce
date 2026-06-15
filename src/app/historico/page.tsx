"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, FileText, Newspaper, Loader2 } from "lucide-react";
import { formatWeekday } from "@/lib/utils";
import { cn } from "@/lib/utils";

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
  const router = useRouter();

  useEffect(() => {
    fetch("/api/historico")
      .then((r) => r.json())
      .then((d) => { setEntries(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink-900">Histórico</h1>
        <p className="text-ink-500 text-sm mt-1">Relatórios e boletins dos últimos 30 dias.</p>
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
                "flex items-center justify-between px-5 py-4 hover:bg-ink-50 transition-colors cursor-pointer",
                i < entries.length - 1 && "border-b border-ink-100"
              )}
              onClick={() => router.push(`/historico/${entry.data}`)}
            >
              <div>
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

              <div className="flex items-center gap-2">
                {entry.relatorio && (
                  <span className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    Matinal
                  </span>
                )}
                {entry.boletim && (
                  <span className="flex items-center gap-1 text-xs bg-brand-50 text-brand-600 px-2 py-1 rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    Vespertino
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
