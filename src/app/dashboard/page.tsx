"use client";
import { useState, useRef } from "react";
import { Upload, FileText, Loader2, CheckCircle, Copy, ChevronDown } from "lucide-react";
import { Relatorio } from "@/types";
import { StatCard } from "@/components/ui/StatCard";
import { ProcessoCard } from "@/components/ui/ProcessoCard";
import { formatWeekday, todayISO } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Filter = "todos" | "acao" | "arquivados";

export default function DashboardPage() {
  const [loading, setLoading] = useState(false);
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("todos");
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileData, setFileData] = useState<File | null>(null);

  const today = todayISO();

  async function handleSubmit() {
    if (!text.trim() && !fileData) return;
    setLoading(true);
    setError(null);

    try {
      const fd = new FormData();
      if (fileData) fd.append("file", fileData);
      else fd.append("text", text);

      const res = await fetch("/api/analisar", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRelatorio(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  function handleFilePick(file: File) {
    if (!file.type.includes("pdf")) return;
    setFileData(file);
    setFileName(file.name);
    setText("");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFilePick(file);
  }

  async function copyReport() {
    if (!relatorio) return;
    const lines = [
      `MOVIMENTAÇÕES TCE-MA — ${formatWeekday(today).toUpperCase()}`,
      "",
      `Total: ${relatorio.total} processos`,
      `Arquivados: ${relatorio.arquivados}`,
      `Requerem ação: ${relatorio.requerem_acao}`,
      "",
      ...relatorio.processos.map((p) =>
        `[${p.proc}] ${p.municipio} — ${p.assunto}\n${p.movimentacao}${p.providencia ? `\n→ ${p.providencia}` : ""}`
      ),
    ];
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const filtered = relatorio?.processos.filter((p) => {
    if (filter === "acao") return p.tipo !== "ARQUIVADO";
    if (filter === "arquivados") return p.tipo === "ARQUIVADO";
    return true;
  });

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <p className="text-xs font-medium text-ink-400 uppercase tracking-widest mb-1">
          {formatWeekday(today)}
        </p>
        <h1 className="text-2xl font-semibold text-ink-900">Movimentação processual</h1>
        <p className="text-ink-500 text-sm mt-1">
          Importe as movimentações processuais do TCE-MA.
        </p>
      </div>

      {!relatorio && (
        <div className="space-y-4 animate-fade-in">
          {/* Drop zone */}
          <div
            ref={dropRef}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !fileName && fileRef.current?.click()}
            className={cn(
              "relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer",
              dragging ? "border-brand-400 bg-brand-50" : "border-ink-200 hover:border-ink-300 hover:bg-ink-50/50",
              fileName && "border-emerald-300 bg-emerald-50 cursor-default"
            )}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFilePick(e.target.files[0])}
            />
            {fileName ? (
              <div className="flex items-center justify-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <div className="text-left">
                  <p className="text-sm font-medium text-emerald-700">{fileName}</p>
                  <button
                    className="text-xs text-emerald-500 hover:text-emerald-700"
                    onClick={(e) => { e.stopPropagation(); setFileName(null); setFileData(null); }}
                  >
                    Remover
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-ink-300 mx-auto mb-3" />
                <p className="text-sm text-ink-600 font-medium">Arraste o PDF de movimentações</p>
                <p className="text-xs text-ink-400 mt-1">ou clique para selecionar</p>
              </>
            )}
          </div>

          {!fileName && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-ink-100" />
                <span className="text-xs text-ink-400">ou cole o texto</span>
                <div className="flex-1 h-px bg-ink-100" />
              </div>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Cole aqui o conteúdo das movimentações processuais do e-mail..."
                className="w-full min-h-36 rounded-xl border border-ink-200 px-4 py-3 text-sm text-ink-800 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent resize-none bg-white"
              />
            </>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || (!text.trim() && !fileData)}
            className={cn(
              "w-full py-3 rounded-xl text-sm font-medium transition-all",
              "bg-brand-600 text-white hover:bg-brand-700 active:scale-[0.99]",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              "flex items-center justify-center gap-2"
            )}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analisando processos...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Gerar movimentação processual
              </>
            )}
          </button>
        </div>
      )}

      {relatorio && (
        <div className="animate-slide-up space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-4 gap-3">
            <StatCard value={relatorio.total} label="Processos" />
            <StatCard value={relatorio.arquivados} label="Arquivados" />
            <StatCard value={relatorio.requerem_acao} label="Requerem ação" warn={relatorio.requerem_acao > 0} />
            <StatCard value={relatorio.visitar_mp} label="Visitar MP" />
          </div>

          {/* Report card */}
          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
              <div>
                <h2 className="text-sm font-semibold text-ink-800">
                  Movimentações de {formatWeekday(today)}
                </h2>
                <p className="text-xs text-ink-400 mt-0.5">TCE-MA</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Filter */}
                <div className="flex rounded-lg border border-ink-200 overflow-hidden text-xs">
                  {(["todos", "acao", "arquivados"] as Filter[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={cn(
                        "px-3 py-1.5 transition-colors",
                        filter === f ? "bg-ink-900 text-white" : "text-ink-500 hover:bg-ink-50"
                      )}
                    >
                      {f === "todos" ? "Todos" : f === "acao" ? "Ação" : "Arquivados"}
                    </button>
                  ))}
                </div>

                <button
                  onClick={copyReport}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-ink-200 text-xs text-ink-600 hover:bg-ink-50 transition-colors"
                >
                  {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copiado!" : "Copiar"}
                </button>
              </div>
            </div>

            <div className="px-5 py-2">
              {filtered?.map((p) => (
                <ProcessoCard key={p.proc + p.ordem} processo={p} />
              ))}
            </div>
          </div>

          <button
            onClick={() => { setRelatorio(null); setText(""); setFileName(null); setFileData(null); }}
            className="text-sm text-ink-400 hover:text-ink-600 transition-colors flex items-center gap-1"
          >
            <ChevronDown className="w-4 h-4 rotate-90" />
            Nova importação
          </button>
        </div>
      )}
    </div>
  );
}
