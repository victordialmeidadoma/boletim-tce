"use client";
import { useState, useRef } from "react";
import {
  Upload, CheckCircle, Loader2, FileText,
  Building2, AlertTriangle, Search, ChevronDown, ChevronRight,
} from "lucide-react";
import { PublicacaoDiario, TipoDiario } from "@/types";
import { formatWeekday, todayISO } from "@/lib/utils";
import { cn } from "@/lib/utils";

const TIPO_LABELS: Record<TipoDiario, string> = {
  PLENO_ACORDAO:          "Pleno — Acórdão",
  PLENO_DECISAO:          "Pleno — Decisão",
  PLENO_PARECER_PREVIO:   "Pleno — Parecer prévio",
  DESPACHO:               "Despacho",
  CITACAO:                "Citação",
  FISCALIZACAO_AVISO:     "Fiscalização — Aviso",
  FISCALIZACAO_RESULTADO: "Fiscalização — Resultado",
  PAUTA:                  "Pauta",
  OUTROS:                 "Outros",
};

const TIPO_COLOR: Record<TipoDiario, string> = {
  PLENO_ACORDAO:          "bg-purple-50 text-purple-700 border-purple-200",
  PLENO_DECISAO:          "bg-purple-50 text-purple-700 border-purple-200",
  PLENO_PARECER_PREVIO:   "bg-purple-50 text-purple-700 border-purple-200",
  DESPACHO:               "bg-sky-50 text-sky-700 border-sky-200",
  CITACAO:                "bg-red-50 text-red-700 border-red-200",
  FISCALIZACAO_AVISO:     "bg-amber-50 text-amber-700 border-amber-200",
  FISCALIZACAO_RESULTADO: "bg-amber-50 text-amber-700 border-amber-200",
  PAUTA:                  "bg-slate-50 text-slate-700 border-slate-200",
  OUTROS:                 "bg-ink-50 text-ink-500 border-ink-200",
};

type Status = "idle" | "loading" | "done" | "error";

export default function DiarioPage() {
  const [file,        setFile]        = useState<File | null>(null);
  const [status,      setStatus]      = useState<Status>("idle");
  const [result,      setResult]      = useState<{ total: number; municipios: string[]; data: string } | null>(null);
  const [publicacoes, setPublicacoes] = useState<PublicacaoDiario[]>([]);
  const [search,      setSearch]      = useState("");
  const [expanded,    setExpanded]    = useState<Set<string>>(new Set());
  const [progress,    setProgress]    = useState("");
  const [error,       setError]       = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const today   = todayISO();

  async function processar() {
    if (!file) return;
    setStatus("loading");
    setProgress("Enviando PDF para o Gemini...");
    setError("");

    try {
      const fd = new FormData();
      fd.append("file", file);

      setProgress("Gemini lendo o diário (pode levar até 1 minuto para PDFs grandes)...");
      const res  = await fetch("/api/diario", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setProgress("Salvando no banco e gerando boletim...");
      setResult(data);

      // Fetch publicacoes
      const pubRes  = await fetch(`/api/diario?data=${data.data}`);
      const pubData = await pubRes.json();
      setPublicacoes(pubData);
      setStatus("done");
    } catch (e) {
      setError(String(e));
      setStatus("error");
    }
  }

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const filtered = publicacoes.filter(p =>
    !search ||
    p.proc?.toLowerCase().includes(search.toLowerCase()) ||
    p.municipio?.toLowerCase().includes(search.toLowerCase()) ||
    p.entidade?.toLowerCase().includes(search.toLowerCase()) ||
    p.descricao?.toLowerCase().includes(search.toLowerCase())
  );

  // Group by tipo
  const byTipo = filtered.reduce<Record<string, PublicacaoDiario[]>>((acc, p) => {
    if (!acc[p.tipo]) acc[p.tipo] = [];
    acc[p.tipo].push(p);
    return acc;
  }, {});

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <p className="text-xs font-medium text-ink-400 uppercase tracking-widest mb-1">
          {formatWeekday(today)}
        </p>
        <h1 className="text-2xl font-semibold text-ink-900">Diário do TCE-MA</h1>
        <p className="text-ink-500 text-sm mt-1">
          Faça upload do PDF — o Gemini extrai todas as publicações automaticamente.
        </p>
      </div>

      {/* Upload */}
      {status !== "done" && (
        <div className="bg-white rounded-2xl shadow-card p-5 mb-6">
          <input ref={fileRef} type="file" accept=".pdf" className="hidden"
            onChange={e => setFile(e.target.files?.[0] ?? null)} />

          <div
            onClick={() => fileRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors mb-4",
              file ? "border-emerald-300 bg-emerald-50" : "border-ink-200 hover:border-brand-300 hover:bg-brand-50/30"
            )}
          >
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
                <div className="text-left">
                  <p className="text-sm font-medium text-emerald-700">{file.name}</p>
                  <p className="text-xs text-emerald-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-ink-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-ink-600">Arraste o PDF do Diário ou clique para selecionar</p>
                <p className="text-xs text-ink-400 mt-1">Suporta PDFs de 6 até 400+ páginas</p>
              </>
            )}
          </div>

          {status === "loading" && (
            <div className="flex items-center gap-3 bg-brand-50 rounded-xl px-4 py-3 mb-4 text-sm text-brand-700">
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              {progress}
            </div>
          )}

          {status === "error" && (
            <div className="flex items-center gap-3 bg-red-50 rounded-xl px-4 py-3 mb-4 text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={processar}
            disabled={!file || status === "loading"}
            className="w-full py-3 rounded-xl text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {status === "loading"
              ? <><Loader2 className="w-4 h-4 animate-spin" />Processando...</>
              : <><FileText className="w-4 h-4" />Processar diário com Gemini</>}
          </button>
        </div>
      )}

      {/* Result */}
      {status === "done" && result && (
        <div className="animate-slide-up">
          <div className="flex items-center gap-3 bg-emerald-50 rounded-xl px-4 py-3 mb-6 text-sm text-emerald-700">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>
              <strong>{result.total} publicações</strong> extraídas de {result.municipios.length} municípios.
              Boletim gerado automaticamente.
            </span>
            <button
              onClick={() => { setStatus("idle"); setFile(null); setResult(null); setPublicacoes([]); }}
              className="ml-auto text-xs text-emerald-600 hover:text-emerald-800 underline"
            >
              Novo upload
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-xl shadow-card px-4 py-3">
              <p className="text-2xl font-semibold text-ink-900">{result.total}</p>
              <p className="text-xs text-ink-400 mt-1">Publicações</p>
            </div>
            <div className="bg-white rounded-xl shadow-card px-4 py-3">
              <p className="text-2xl font-semibold text-ink-900">{result.municipios.length}</p>
              <p className="text-xs text-ink-400 mt-1">Municípios</p>
            </div>
            <div className="bg-white rounded-xl shadow-card px-4 py-3">
              <p className="text-2xl font-semibold text-ink-900">{Object.keys(byTipo).length}</p>
              <p className="text-xs text-ink-400 mt-1">Tipos de publicação</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
            <input
              className="field-input pl-9"
              placeholder="Buscar por processo, município, entidade..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Grouped by tipo */}
          {Object.entries(byTipo).map(([tipo, pubs]) => {
            const colorClass = TIPO_COLOR[tipo as TipoDiario] ?? TIPO_COLOR.OUTROS;
            const label      = TIPO_LABELS[tipo as TipoDiario] ?? tipo;
            const isOpen     = expanded.has(tipo);
            return (
              <div key={tipo} className="bg-white rounded-2xl shadow-card overflow-hidden mb-3">
                <button
                  onClick={() => toggleExpand(tipo)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-ink-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border", colorClass)}>
                      {label}
                    </span>
                    <span className="text-sm text-ink-500">{pubs.length} publicação{pubs.length > 1 ? "ões" : ""}</span>
                  </div>
                  {isOpen
                    ? <ChevronDown className="w-4 h-4 text-ink-400" />
                    : <ChevronRight className="w-4 h-4 text-ink-400" />}
                </button>

                {isOpen && (
                  <div className="divide-y divide-ink-100 border-t border-ink-100">
                    {pubs.map((p, i) => (
                      <div key={i} className="px-5 py-3">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          {p.proc && <span className="text-xs font-mono text-ink-500 bg-ink-50 px-2 py-0.5 rounded">{p.proc}</span>}
                          {p.exercicio && <span className="text-xs text-ink-400">Exerc. {p.exercicio}</span>}
                          {p.municipio && (
                            <span className="flex items-center gap-1 text-xs text-brand-600">
                              <Building2 className="w-3 h-3" />{p.municipio.charAt(0) + p.municipio.slice(1).toLowerCase()}
                            </span>
                          )}
                        </div>
                        {p.entidade && <p className="text-sm font-medium text-ink-800 mb-1">{p.entidade}</p>}
                        {p.descricao && <p className="text-xs text-ink-500 leading-relaxed">{p.descricao}</p>}
                        {p.prazo && (
                          <p className="text-xs text-amber-700 font-semibold mt-1">⏱ Prazo: {p.prazo}</p>
                        )}
                        {p.decisao && (
                          <p className="text-xs text-ink-600 mt-1 border-l-2 border-ink-200 pl-2">{p.decisao}</p>
                        )}
                        {p.relator && <p className="text-xs text-ink-400 mt-1">Relator: {p.relator}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
