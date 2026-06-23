"use client";
import { useState, useEffect } from "react";
import {
  CheckCircle, AlertTriangle, Newspaper, Building2, FileText,
  Loader2, PackageOpen, Plus, X,
} from "lucide-react";
import { Processo, MunicipioCruzado, MencaoDiario } from "@/types";
import { StatCard } from "@/components/ui/StatCard";
import { MunicipioSection } from "@/components/ui/MunicipioSection";
import { formatWeekday, todayISO, cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

type BulkStatus = "idle" | "loading" | "done" | "error";

export default function BoletimPage() {
  const [processosDia, setProcessosDia] = useState<Processo[]>([]);
  const [municipiosBoletim, setMunicipiosBoletim] = useState<MunicipioCruzado[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const [bulkStatus, setBulkStatus] = useState<BulkStatus>("idle");
  const [bulkProgress, setBulkProgress] = useState<string[]>([]);
  const [bulkAviso, setBulkAviso] = useState("");
  const [showBulkOpts, setShowBulkOpts] = useState(false);

  const [completoStatus, setCompletoStatus] = useState<"idle"|"loading">("idle");

  const today = todayISO();

  useEffect(() => {
    carregar();
  }, [today]);

  async function carregar() {
    setLoading(true);

    const { data: relatorio } = await supabase
      .from("relatorios").select("processos").eq("data", today).single();
    const processos: Processo[] = relatorio?.processos ?? [];
    setProcessosDia(processos);

    const { data: mencoesRows } = await supabase
      .from("mencoes_diario_manual").select("*").eq("data", today);

    // Group mencoes by municipio
    const byMuni: Record<string, MencaoDiario[]> = {};
    const resumos: Record<string, string> = {};
    for (const r of mencoesRows ?? []) {
      if (!byMuni[r.municipio]) byMuni[r.municipio] = [];
      byMuni[r.municipio].push({
        tipo: r.tipo, proc: r.proc, natureza: r.natureza, especie: r.especie,
        exercicio: r.exercicio, entidade: r.entidade, responsaveis: r.responsaveis,
        relator: r.relator, prazo: r.prazo, parecer_mp: r.parecer_mp,
        decisao: r.decisao, descricao: r.descricao,
      });
      if (r.resumo_consolidado) resumos[r.municipio] = r.resumo_consolidado;
    }

    // All municipios that appear either in processos or mencoes
    const todosMunicipios = new Set<string>([
      ...processos.map(p => p.municipio),
      ...Object.keys(byMuni),
    ]);

    const municipiosArr: MunicipioCruzado[] = [...todosMunicipios].map(nome => ({
      nome,
      processos_dia: processos.filter(p => p.municipio === nome),
      mencoes_diario: byMuni[nome] ?? [],
      resumo_consolidado: resumos[nome] ?? "",
    }));

    setMunicipiosBoletim(municipiosArr);
    setLoading(false);
  }

  async function copyBoletim() {
    const lines: string[] = [`BOLETIM INFORMATIVO — ${formatWeekday(today).toUpperCase()}`, ""];
    municipiosBoletim.forEach((m) => {
      lines.push(`▸ ${m.nome}`);
      if (m.processos_dia.length) lines.push(`  Processos: ${m.processos_dia.map(p => p.proc).join(", ")}`);
      m.mencoes_diario.forEach((men) => lines.push(`  ${men.tipo}: ${men.proc || ""} ${men.entidade || ""}`));
      if (m.resumo_consolidado) lines.push(`  ${m.resumo_consolidado}`);
      lines.push("");
    });
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function gerarPdfMunicipio(muni: string) {
    const res = await fetch("/api/gerar-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: today, municipio_nome: muni, aviso: bulkAviso }),
    });
    const html = await res.text();
    const blob = new Blob([html], { type: "text/html" });
    window.open(URL.createObjectURL(blob), "_blank");
  }

  async function gerarTodos() {
    setBulkStatus("loading");
    setBulkProgress([]);
    try {
      setBulkProgress(p => [...p, "⚙ Gerando documentos..."]);
      const res = await fetch("/api/gerar-todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: today, aviso: bulkAviso || undefined }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      setBulkProgress(p => [...p, `✓ ${result.total} documentos gerados`, "📦 Compactando arquivos..."]);
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const folder = zip.folder(`boletins_${today}`)!;

      for (const file of result.files as { nome: string; conteudo: string }[]) {
        folder.file(file.nome, file.conteudo, { base64: true });
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `boletins_${today}.zip`;
      link.click();
      URL.revokeObjectURL(url);

      setBulkProgress(p => [...p, `✓ Download iniciado`]);
      setBulkStatus("done");
    } catch (err) {
      setBulkProgress(p => [...p, `✗ Erro: ${String(err)}`]);
      setBulkStatus("error");
    }
  }

  async function gerarCompleto() {
    setCompletoStatus("loading");
    const res = await fetch("/api/gerar-completo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: today, aviso: bulkAviso }),
    });
    const html = await res.text();
    const blob = new Blob([html], { type: "text/html" });
    window.open(URL.createObjectURL(blob), "_blank");
    setCompletoStatus("idle");
  }

  const municipiosComAmbos = municipiosBoletim.filter(m => m.processos_dia.length > 0 && m.mencoes_diario.length > 0).length;
  const municipiosSoMovimentacao = municipiosBoletim.filter(m => m.processos_dia.length > 0 && m.mencoes_diario.length === 0).length;
  const municipiosSoDiario = municipiosBoletim.filter(m => m.processos_dia.length === 0 && m.mencoes_diario.length > 0).length;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <p className="text-xs font-medium text-ink-400 uppercase tracking-widest mb-1">{formatWeekday(today)}</p>
        <h1 className="text-2xl font-semibold text-ink-900">Boletim informativo</h1>
        <p className="text-ink-500 text-sm mt-1">
          Compilação automática — movimentação processual + diário, por município.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-ink-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />Carregando...
        </div>
      ) : municipiosBoletim.length === 0 ? (
        <div className="bg-amber-50 rounded-xl px-4 py-3 text-sm text-amber-700 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Nenhuma movimentação ou menção registrada hoje. Cadastre em
          <a href="/dashboard" className="underline font-medium">Movimentação</a> ou
          <a href="/dashboard/diario-manual" className="underline font-medium">Diário</a>.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <StatCard value={municipiosComAmbos} label="Com movim. + diário" accent />
            <StatCard value={municipiosSoMovimentacao} label="Só movimentação" />
            <StatCard value={municipiosSoDiario} label="Só diário" />
          </div>

          {/* Boletim card */}
          <div className="bg-white rounded-2xl shadow-card overflow-hidden mb-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
              <div>
                <h2 className="text-sm font-semibold text-ink-800">Boletim — {formatWeekday(today)}</h2>
                <p className="text-xs text-ink-400 mt-0.5">{municipiosBoletim.length} municípios</p>
              </div>
              <button onClick={copyBoletim}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-ink-200 text-xs text-ink-600 hover:bg-ink-50">
                {copied
                  ? <><CheckCircle className="w-3.5 h-3.5 text-emerald-500" />Copiado!</>
                  : <>Copiar</>}
              </button>
            </div>

            <div className="p-5">
              {municipiosBoletim.map((m) => (
                <div key={m.nome}>
                  <MunicipioSection municipio={m} />
                  <div className="flex justify-end mb-4 -mt-2">
                    <button
                      onClick={() => gerarPdfMunicipio(m.nome)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-ink-200 text-xs text-ink-600 hover:bg-ink-50 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Gerar PDF — {m.nome.charAt(0) + m.nome.slice(1).toLowerCase()}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gerar todos / completo */}
          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-ink-800">Gerar boletins do dia</h2>
                <p className="text-xs text-ink-400 mt-0.5">Por gestor (individual ou em lote) ou completo para a equipe</p>
              </div>
              <button onClick={() => setShowBulkOpts(v => !v)}
                className="text-xs text-ink-400 hover:text-ink-700 px-2 py-1 rounded-md hover:bg-ink-50">
                {showBulkOpts ? "Fechar opções" : "Opções"}
              </button>
            </div>

            {showBulkOpts && (
              <div className="px-5 py-4 border-b border-ink-100">
                <label className="text-xs text-ink-500 font-medium block mb-1">
                  Aviso / instrução <span className="text-ink-300 font-normal">(aparece nos documentos)</span>
                </label>
                <textarea className="field-textarea" rows={2} value={bulkAviso}
                  onChange={e => setBulkAviso(e.target.value)}
                  placeholder="Ex: Prazo para defesa se encerra em 30 dias." />
              </div>
            )}

            <div className="px-5 py-4 space-y-3">
              {bulkProgress.length > 0 && (
                <div className="bg-ink-50 rounded-xl p-4 font-mono text-xs text-ink-600 space-y-1 max-h-32 overflow-y-auto">
                  {bulkProgress.map((line, i) => (
                    <p key={i} className={cn(
                      line.startsWith("✗") ? "text-red-600" :
                      line.startsWith("✓") ? "text-emerald-600" : "text-ink-500"
                    )}>{line}</p>
                  ))}
                </div>
              )}

              <button
                onClick={gerarTodos}
                disabled={bulkStatus === "loading"}
                className={cn(
                  "w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all",
                  bulkStatus === "done" ? "bg-emerald-500 text-white" :
                  bulkStatus === "error" ? "bg-red-500 text-white" :
                  "bg-brand-600 text-white hover:bg-brand-700",
                  "disabled:opacity-40",
                )}>
                {bulkStatus === "loading" ? <><Loader2 className="w-4 h-4 animate-spin" />Gerando...</> :
                 bulkStatus === "done" ? <><CheckCircle className="w-4 h-4" />Download concluído!</> :
                 <><PackageOpen className="w-4 h-4" />Gerar todos ({municipiosBoletim.length}) e baixar .zip</>}
              </button>

              <button
                onClick={gerarCompleto}
                disabled={completoStatus === "loading"}
                className="w-full py-3 rounded-xl text-sm font-medium border border-ink-200 text-ink-700 hover:bg-ink-50 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Gerar completo (todos os municípios em um PDF — uso interno)
              </button>
              <p className="text-center text-xs text-ink-400">
                Ideal para enviar à sua equipe — sem separar por gestor.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
