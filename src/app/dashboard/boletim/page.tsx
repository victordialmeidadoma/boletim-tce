"use client";
import { useState, useEffect, useRef } from "react";
import {
  Plus, X, CheckCircle, Copy, AlertTriangle,
  Newspaper, Building2, FileText, Gavel, FileWarning,
  Bell, ClipboardList, FileSearch, Clock, User,
  Calendar, Download, Loader2, PackageOpen,
} from "lucide-react";
import {
  Boletim, MencaoDiario, MunicipioCruzado,
  Processo, TipoDiario,
} from "@/types";
import { StatCard }        from "@/components/ui/StatCard";
import { MunicipioSection } from "@/components/ui/MunicipioSection";
import { TipoBadge }       from "@/components/ui/Badge";
import { formatWeekday, todayISO } from "@/lib/utils";
import { cn }              from "@/lib/utils";
import { supabase }        from "@/lib/supabase";

/* ─── constants ────────────────────────────────────────────────── */

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

const FIELDS_BY_TYPE: Record<TipoDiario, string[]> = {
  PLENO_ACORDAO:          ["entidade","natureza","especie","exercicio","responsaveis","relator","decisao"],
  PLENO_DECISAO:          ["entidade","natureza","especie","exercicio","responsaveis","relator","decisao"],
  PLENO_PARECER_PREVIO:   ["entidade","natureza","especie","exercicio","responsaveis","relator","decisao"],
  DESPACHO:               ["entidade","responsaveis","descricao"],
  CITACAO:                ["entidade","natureza","exercicio","responsaveis","relator","prazo","descricao"],
  FISCALIZACAO_AVISO:     ["entidade","descricao"],
  FISCALIZACAO_RESULTADO: ["entidade","descricao"],
  PAUTA:                  ["entidade","natureza","especie","exercicio","responsaveis","relator","parecer_mp"],
  OUTROS:                 ["entidade","descricao"],
};

interface FormState {
  municipio: string; tipo: TipoDiario | ""; proc: string;
  entidade: string; natureza: string; especie: string;
  exercicio: string; responsaveis: string; relator: string;
  prazo: string; parecer_mp: string; decisao: string;
  descricao: string; resumo_consolidado: string;
}
const emptyForm: FormState = {
  municipio:"", tipo:"", proc:"", entidade:"", natureza:"", especie:"",
  exercicio:"", responsaveis:"", relator:"", prazo:"", parecer_mp:"",
  decisao:"", descricao:"", resumo_consolidado:"",
};

/* ─── bulk download state ──────────────────────────────────────── */
type BulkStatus = "idle" | "loading" | "done" | "error";

/* ═══════════════════════════════════════════════════════════════ */
export default function BoletimPage() {
  const [processosDia,    setProcessosDia]    = useState<Processo[]>([]);
  const [municipiosMencoes, setMunicipiosMencoes] = useState<
    Record<string, { mencoes: MencaoDiario[]; resumo: string }>
  >({});
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState<FormState>(emptyForm);
  const [saved,     setSaved]     = useState(false);
  const [copied,    setCopied]    = useState(false);

  // bulk
  const [bulkStatus,   setBulkStatus]   = useState<BulkStatus>("idle");
  const [bulkProgress, setBulkProgress] = useState<string[]>([]);
  const [bulkAviso,    setBulkAviso]    = useState("");
  const [bulkImagem,   setBulkImagem]   = useState<File | null>(null);
  const [showBulkOpts, setShowBulkOpts] = useState(false);
  const imgRef = useRef<HTMLInputElement>(null);

  const today = todayISO();

  useEffect(() => {
    supabase.from("relatorios").select("processos").eq("data", today).single()
      .then(({ data }) => { if (data?.processos) setProcessosDia(data.processos as Processo[]); });
  }, [today]);

  const municipiosComProcesso = [...new Set(processosDia.map((p) => p.municipio))];
  const totalMencoes = Object.values(municipiosMencoes).reduce((a, v) => a + v.mencoes.length, 0);

  /* ── form helpers ─────────────────────────────────────────── */
  function openFormFor(municipio: string) {
    setForm({ ...emptyForm, municipio });
    setShowForm(true);
  }

  function addMencao() {
    if (!form.municipio || !form.tipo) return;
    const mencao: MencaoDiario = {
      tipo: form.tipo as TipoDiario, proc: form.proc,
      entidade:    form.entidade    || undefined,
      natureza:    form.natureza    || undefined,
      especie:     form.especie     || undefined,
      exercicio:   form.exercicio   || undefined,
      responsaveis: form.responsaveis
        ? form.responsaveis.split(";").map((s) => s.trim()).filter(Boolean)
        : undefined,
      relator:     form.relator     || undefined,
      prazo:       form.prazo       || undefined,
      parecer_mp:  form.parecer_mp  || undefined,
      decisao:     form.decisao     || undefined,
      descricao:   form.descricao   || undefined,
    };
    const key = form.municipio.toUpperCase();
    setMunicipiosMencoes((prev) => ({
      ...prev,
      [key]: {
        mencoes: [...(prev[key]?.mencoes ?? []), mencao],
        resumo:  form.resumo_consolidado || prev[key]?.resumo || "",
      },
    }));
    setShowForm(false);
    setForm(emptyForm);
  }

  function removeMencao(muni: string, idx: number) {
    setMunicipiosMencoes((prev) => {
      const updated = { ...prev };
      updated[muni] = { ...updated[muni], mencoes: updated[muni].mencoes.filter((_, i) => i !== idx) };
      if (!updated[muni].mencoes.length) delete updated[muni];
      return updated;
    });
  }

  /* ── save to supabase ─────────────────────────────────────── */
  async function saveBoletim() {
    const arr: MunicipioCruzado[] = Object.entries(municipiosMencoes).map(([nome, v]) => ({
      nome,
      processos_dia:     processosDia.filter((p) => p.municipio === nome),
      mencoes_diario:    v.mencoes,
      resumo_consolidado: v.resumo,
    }));
    const semProcesso = Object.keys(municipiosMencoes).filter(
      (m) => !processosDia.some((p) => p.municipio === m)
    );
    await supabase.from("boletins").upsert({
      data: today,
      municipios: arr,
      municipios_sem_processo: semProcesso,
      total_municipios: arr.length,
    }, { onConflict: "data" });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  /* ── copy text ────────────────────────────────────────────── */
  async function copyBoletim() {
    const lines: string[] = [`BOLETIM INFORMATIVO — ${formatWeekday(today).toUpperCase()}`, ""];
    Object.entries(municipiosMencoes).forEach(([muni, v]) => {
      lines.push(`▸ ${muni}`);
      const procs = processosDia.filter((p) => p.municipio === muni);
      if (procs.length) lines.push(`  Processos: ${procs.map((p) => p.proc).join(", ")}`);
      v.mencoes.forEach((m) => lines.push(`  ${TIPO_LABELS[m.tipo]}: ${m.proc || ""} ${m.entidade || ""}`));
      if (v.resumo) lines.push(`  ${v.resumo}`);
      lines.push("");
    });
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  /* ── GERAR TODOS ──────────────────────────────────────────── */
  async function gerarTodos() {
    setBulkStatus("loading");
    setBulkProgress([]);

    try {
      // 1. Save first so the API has the latest data
      await saveBoletim();
      setBulkProgress(["✓ Boletim salvo"]);

      // 2. Upload optional image to Supabase Storage
      let imagemUrl: string | undefined;
      if (bulkImagem) {
        setBulkProgress((p) => [...p, "↑ Enviando imagem..."]);
        const ext  = bulkImagem.name.split(".").pop();
        const path = `boletins/${today}/imagem.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("assets")
          .upload(path, bulkImagem, { upsert: true });
        if (!upErr) {
          const { data: urlData } = supabase.storage.from("assets").getPublicUrl(path);
          imagemUrl = urlData.publicUrl;
          setBulkProgress((p) => [...p, "✓ Imagem enviada"]);
        }
      }

      // 3. Call API to generate all HTMLs
      setBulkProgress((p) => [...p, "⚙ Gerando documentos..."]);
      const res = await fetch("/api/gerar-todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: today,
          aviso: bulkAviso || undefined,
          imagem_url: imagemUrl,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      setBulkProgress((p) => [...p, `✓ ${result.total} documentos gerados`]);

      // 4. Zip in the browser using JSZip (loaded dynamically)
      setBulkProgress((p) => [...p, "📦 Compactando arquivos..."]);
      const JSZip = (await import("jszip")).default;
      const zip   = new JSZip();
      const folder = zip.folder(`boletins_${today}`)!;

      for (const file of result.files as { nome: string; conteudo: string }[]) {
        folder.file(file.nome, file.conteudo, { base64: true });
        setBulkProgress((p) => [...p, `  + ${file.nome}`]);
      }

      const blob = await zip.generateAsync({ type: "blob" });

      // 5. Download
      const url  = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href     = url;
      link.download = `boletins_${today}.zip`;
      link.click();
      URL.revokeObjectURL(url);

      setBulkProgress((p) => [...p, `✓ Download iniciado — boletins_${today}.zip`]);
      setBulkStatus("done");
    } catch (err) {
      setBulkProgress((p) => [...p, `✗ Erro: ${String(err)}`]);
      setBulkStatus("error");
    }
  }

  const fields = form.tipo ? (FIELDS_BY_TYPE[form.tipo as TipoDiario] ?? []) : [];

  /* ═══════════════════════════════════════════════════════════ */
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">

      {/* ── header ── */}
      <div className="mb-8">
        <p className="text-xs font-medium text-ink-400 uppercase tracking-widest mb-1">
          {formatWeekday(today)}
        </p>
        <h1 className="text-2xl font-semibold text-ink-900">Boletim informativo</h1>
        <p className="text-ink-500 text-sm mt-1">
          Registre as menções do Diário do TCE-MA.
        </p>
      </div>

      {/* ── movimentação status ── */}
      <div className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-3 mb-6 text-sm",
        processosDia.length > 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
      )}>
        {processosDia.length > 0
          ? <><CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>Movimentação processual carregada — {processosDia.length} processos disponíveis.</span></>
          : <><AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Nenhuma movimentação hoje. As menções serão registradas sem cruzamento.</span></>}
      </div>

      {/* ── município shortcuts ── */}
      {municipiosComProcesso.length > 0 && (
        <div className="mb-5">
          <p className="text-xs text-ink-400 mb-2">
            Municípios com movimentação hoje — clique para adicionar menção
          </p>
          <div className="flex flex-wrap gap-2">
            {municipiosComProcesso.map((m) => {
              const has = !!municipiosMencoes[m]?.mencoes.length;
              return (
                <button key={m} onClick={() => openFormFor(m)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors",
                    has
                      ? "bg-brand-50 border-brand-200 text-brand-700 font-medium"
                      : "bg-white border-ink-200 text-ink-600 hover:border-brand-300 hover:text-brand-600",
                  )}>
                  {has ? <CheckCircle className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  {m.charAt(0) + m.slice(1).toLowerCase()}
                  {has && <span className="font-normal opacity-70">({municipiosMencoes[m].mencoes.length})</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── add form ── */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-ink-200 p-5 mb-4 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-ink-800">
              {form.municipio
                ? `Menção — ${form.municipio.charAt(0) + form.municipio.slice(1).toLowerCase()}`
                : "Nova menção"}
            </h2>
            <button onClick={() => setShowForm(false)}
              className="text-ink-400 hover:text-ink-700 p-1 rounded-md hover:bg-ink-50">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-ink-500 font-medium block mb-1">Município</label>
              <input className="field-input"
                value={form.municipio}
                onChange={(e) => setForm((f) => ({ ...f, municipio: e.target.value }))}
                placeholder="Ex: Matões do Norte" />
            </div>
            <div>
              <label className="text-xs text-ink-500 font-medium block mb-1">Processo nº</label>
              <input className="field-input font-mono"
                value={form.proc}
                onChange={(e) => setForm((f) => ({ ...f, proc: e.target.value }))}
                placeholder="Ex: 3901/2023" />
            </div>
          </div>

          <div className="mb-3">
            <label className="text-xs text-ink-500 font-medium block mb-1">Tipo de publicação</label>
            <select className="field-input bg-white"
              value={form.tipo}
              onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as TipoDiario }))}>
              <option value="">Selecione...</option>
              {Object.entries(TIPO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          {form.tipo && (
            <div className="space-y-3 border-t border-ink-100 pt-3 mb-3">
              {fields.includes("entidade") && (
                <Field label="Entidade">
                  <input className="field-input" value={form.entidade}
                    onChange={(e) => setForm((f) => ({ ...f, entidade: e.target.value }))}
                    placeholder="Ex: Câmara Municipal de Matões do Norte/MA" />
                </Field>
              )}
              {fields.includes("natureza") && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Natureza">
                    <input className="field-input" value={form.natureza}
                      onChange={(e) => setForm((f) => ({ ...f, natureza: e.target.value }))}
                      placeholder="Ex: Prestação de Contas" />
                  </Field>
                  <Field label="Espécie">
                    <input className="field-input" value={form.especie}
                      onChange={(e) => setForm((f) => ({ ...f, especie: e.target.value }))}
                      placeholder="Ex: Prefeito Municipal" />
                  </Field>
                </div>
              )}
              {fields.includes("exercicio") && (
                <Field label="Exercício financeiro">
                  <input className="field-input w-32" value={form.exercicio}
                    onChange={(e) => setForm((f) => ({ ...f, exercicio: e.target.value }))}
                    placeholder="Ex: 2022" />
                </Field>
              )}
              {fields.includes("responsaveis") && (
                <Field label="Responsável(is)" hint="separe múltiplos por ponto-e-vírgula">
                  <input className="field-input" value={form.responsaveis}
                    onChange={(e) => setForm((f) => ({ ...f, responsaveis: e.target.value }))}
                    placeholder="Nome Completo; Outro Nome" />
                </Field>
              )}
              {fields.includes("relator") && (
                <Field label="Relator">
                  <input className="field-input" value={form.relator}
                    onChange={(e) => setForm((f) => ({ ...f, relator: e.target.value }))}
                    placeholder="Ex: Conselheiro João Jorge Jinkings Pavão" />
                </Field>
              )}
              {fields.includes("prazo") && (
                <Field label="Prazo para defesa">
                  <input className="field-input w-40" value={form.prazo}
                    onChange={(e) => setForm((f) => ({ ...f, prazo: e.target.value }))}
                    placeholder="Ex: 30 dias" />
                </Field>
              )}
              {fields.includes("parecer_mp") && (
                <Field label="Parecer do MP">
                  <input className="field-input" value={form.parecer_mp}
                    onChange={(e) => setForm((f) => ({ ...f, parecer_mp: e.target.value }))}
                    placeholder="Ex: Arquivamento dos autos" />
                </Field>
              )}
              {fields.includes("decisao") && (
                <Field label="Dispositivo">
                  <textarea className="field-textarea" rows={3} value={form.decisao}
                    onChange={(e) => setForm((f) => ({ ...f, decisao: e.target.value }))}
                    placeholder="Resumo do que foi decidido..." />
                </Field>
              )}
              {fields.includes("descricao") && (
                <Field label="Descrição">
                  <textarea className="field-textarea" rows={3} value={form.descricao}
                    onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                    placeholder="Descreva brevemente a publicação..." />
                </Field>
              )}
            </div>
          )}

          <div className="mb-1">
            <label className="text-xs text-ink-500 font-medium block mb-1">
              Resumo consolidado <span className="text-ink-300 font-normal">(opcional)</span>
            </label>
            <textarea className="field-textarea" rows={2} value={form.resumo_consolidado}
              onChange={(e) => setForm((f) => ({ ...f, resumo_consolidado: e.target.value }))}
              placeholder="Observações sobre a situação do município..." />
          </div>

          <button onClick={addMencao} disabled={!form.municipio || !form.tipo}
            className="w-full mt-3 py-2.5 rounded-xl text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />Adicionar menção
          </button>
        </div>
      )}

      {/* ── add button ── */}
      {!showForm && (
        <button onClick={() => openFormFor("")}
          className="w-full py-3 mb-4 rounded-xl border border-dashed border-ink-300 text-sm text-ink-500 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50/50 transition-colors flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" />Adicionar município / menção
        </button>
      )}

      {/* ── results ── */}
      {Object.keys(municipiosMencoes).length > 0 && (
        <div className="animate-slide-up">
          <div className="grid grid-cols-2 gap-3 mb-5">
            <StatCard
              value={Object.keys(municipiosMencoes).length}
              label="Municípios com menções" accent />
            <StatCard
              value={Object.keys(municipiosMencoes).filter(
                (m) => !processosDia.some((p) => p.municipio === m)
              ).length}
              label="Somente no diário" />
          </div>

          {/* ── boletim card ── */}
          <div className="bg-white rounded-2xl shadow-card overflow-hidden mb-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
              <div>
                <h2 className="text-sm font-semibold text-ink-800">
                  Boletim informativo — {formatWeekday(today)}
                </h2>
                <p className="text-xs text-ink-400 mt-0.5">
                  Diário TCE-MA × Movimentação Processual
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={copyBoletim}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-ink-200 text-xs text-ink-600 hover:bg-ink-50">
                  {copied
                    ? <><CheckCircle className="w-3.5 h-3.5 text-emerald-500" />Copiado!</>
                    : <><Copy className="w-3.5 h-3.5" />Copiar</>}
                </button>
                <button onClick={saveBoletim}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                    saved
                      ? "bg-emerald-500 text-white border-emerald-500"
                      : "bg-ink-900 text-white border-ink-900 hover:bg-ink-800",
                  )}>
                  {saved
                    ? <><CheckCircle className="w-3.5 h-3.5" />Salvo!</>
                    : <><Newspaper className="w-3.5 h-3.5" />Salvar boletim</>}
                </button>
              </div>
            </div>

            <div className="p-5">
              {Object.entries(municipiosMencoes).map(([muni, v]) => (
                <div key={muni}>
                  <MunicipioSection
                    municipio={{
                      nome: muni,
                      processos_dia:      processosDia.filter((p) => p.municipio === muni),
                      mencoes_diario:     v.mencoes,
                      resumo_consolidado: v.resumo,
                    }}
                    onRemoveMencao={(idx) => removeMencao(muni, idx)}
                  />
                  <div className="flex justify-end mb-4 -mt-2">
                    <button
                      onClick={async () => {
                        await saveBoletim();
                        const res = await fetch("/api/gerar-pdf", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ data: today, municipio_nome: muni, aviso: bulkAviso }),
                        });
                        const html = await res.text();
                        const blob = new Blob([html], { type: "text/html" });
                        window.open(URL.createObjectURL(blob), "_blank");
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-ink-200 text-xs text-ink-600 hover:bg-ink-50 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                      Gerar PDF
                    </button>
                  </div>
                </div>
              ))}

              {/* sem processo */}
              {Object.keys(municipiosMencoes).filter(
                (m) => !processosDia.some((p) => p.municipio === m)
              ).length > 0 && (
                <div className="mt-4 pt-4 border-t border-ink-100">
                  <p className="text-xs font-medium text-ink-400 uppercase tracking-wide mb-2">
                    Somente no diário
                  </p>
                  <p className="text-sm text-ink-500">
                    {Object.keys(municipiosMencoes)
                      .filter((m) => !processosDia.some((p) => p.municipio === m))
                      .join(" · ")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════
              GERAR TODOS
          ══════════════════════════════════════════════════ */}
          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-ink-800">Gerar todos os boletins</h2>
                <p className="text-xs text-ink-400 mt-0.5">
                  Gera um PDF por município e baixa tudo em um único arquivo .zip
                </p>
              </div>
              <button
                onClick={() => setShowBulkOpts((v) => !v)}
                className="text-xs text-ink-400 hover:text-ink-700 px-2 py-1 rounded-md hover:bg-ink-50">
                {showBulkOpts ? "Fechar opções" : "Opções"}
              </button>
            </div>

            {showBulkOpts && (
              <div className="px-5 py-4 border-b border-ink-100 space-y-3 animate-fade-in">
                <div>
                  <label className="text-xs text-ink-500 font-medium block mb-1">
                    Aviso / instrução <span className="text-ink-300 font-normal">(aparece em todos os documentos)</span>
                  </label>
                  <textarea
                    className="field-textarea"
                    rows={2}
                    value={bulkAviso}
                    onChange={(e) => setBulkAviso(e.target.value)}
                    placeholder="Ex: Prazo para defesa se encerra em 30 dias. Comparecer à assessoria até 15/06." />
                </div>

                <div>
                  <label className="text-xs text-ink-500 font-medium block mb-1">
                    Imagem para incluir <span className="text-ink-300 font-normal">(evento, comunicado — opcional)</span>
                  </label>
                  <input ref={imgRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => setBulkImagem(e.target.files?.[0] ?? null)} />
                  <button
                    onClick={() => imgRef.current?.click()}
                    className={cn(
                      "w-full py-2.5 rounded-xl border border-dashed text-sm transition-colors flex items-center justify-center gap-2",
                      bulkImagem
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-ink-300 text-ink-500 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50/50",
                    )}>
                    {bulkImagem
                      ? <><CheckCircle className="w-4 h-4" />{bulkImagem.name}</>
                      : <><Plus className="w-4 h-4" />Selecionar imagem</>}
                  </button>
                </div>
              </div>
            )}

            <div className="px-5 py-4">
              {/* progress log */}
              {bulkProgress.length > 0 && (
                <div className="mb-4 bg-ink-50 rounded-xl p-4 font-mono text-xs text-ink-600 space-y-1 max-h-40 overflow-y-auto">
                  {bulkProgress.map((line, i) => (
                    <p key={i} className={cn(
                      line.startsWith("✗") ? "text-red-600" :
                      line.startsWith("✓") ? "text-emerald-600" : "text-ink-500"
                    )}>{line}</p>
                  ))}
                  {bulkStatus === "loading" && (
                    <p className="flex items-center gap-2 text-ink-400">
                      <Loader2 className="w-3 h-3 animate-spin" />processando...
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={gerarTodos}
                disabled={bulkStatus === "loading" || Object.keys(municipiosMencoes).length === 0}
                className={cn(
                  "w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all",
                  bulkStatus === "done"
                    ? "bg-emerald-500 text-white"
                    : bulkStatus === "error"
                    ? "bg-red-500 text-white"
                    : "bg-brand-600 text-white hover:bg-brand-700 active:scale-[0.99]",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                )}>
                {bulkStatus === "loading" ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Gerando boletins...</>
                ) : bulkStatus === "done" ? (
                  <><CheckCircle className="w-4 h-4" />Download concluído!</>
                ) : bulkStatus === "error" ? (
                  <><X className="w-4 h-4" />Erro — tentar novamente</>
                ) : (
                  <><PackageOpen className="w-4 h-4" />
                    Gerar todos ({Object.keys(municipiosMencoes).length} boletins) e baixar .zip</>
                )}
              </button>

              {bulkStatus === "done" && (
                <p className="text-center text-xs text-ink-400 mt-2">
                  Cada arquivo HTML pode ser aberto no navegador e impresso como PDF
                  via <strong>Ctrl+P → Salvar como PDF</strong>
                </p>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

function Field({
  label, hint, children,
}: {
  label: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs text-ink-500 font-medium block mb-1">
        {label}
        {hint && <span className="text-ink-300 font-normal ml-1">— {hint}</span>}
      </label>
      {children}
    </div>
  );
}
