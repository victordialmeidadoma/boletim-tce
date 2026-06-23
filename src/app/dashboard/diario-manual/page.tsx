"use client";
import { useState, useEffect } from "react";
import {
  Plus, Trash2, CheckCircle, Building2, FileText,
  Loader2, ChevronDown,
} from "lucide-react";
import { Municipio, TipoDiario } from "@/types";
import { formatWeekday, todayISO, cn } from "@/lib/utils";

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

interface Mencao extends FormState {
  id: string;
}

export default function DiarioManualPage() {
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [mencoes,    setMencoes]    = useState<Mencao[]>([]);
  const [showForm,   setShowForm]   = useState(true);
  const [form,       setForm]       = useState<FormState>(emptyForm);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [genStatus,  setGenStatus]  = useState<"idle"|"loading"|"done">("idle");
  const today = todayISO();

  useEffect(() => {
    fetch("/api/municipios").then(r => r.json()).then(setMunicipios);
    fetch(`/api/diario-manual?data=${today}`).then(r => r.json()).then(setMencoes);
  }, [today]);

  async function addMencao() {
    if (!form.municipio || !form.tipo) return;
    setSaving(true);
    const payload = {
      data: today,
      municipio: form.municipio.toUpperCase(),
      tipo: form.tipo,
      proc: form.proc,
      natureza: form.natureza,
      especie: form.especie,
      exercicio: form.exercicio,
      entidade: form.entidade,
      responsaveis: form.responsaveis ? form.responsaveis.split(";").map(s => s.trim()).filter(Boolean) : [],
      relator: form.relator,
      prazo: form.prazo,
      parecer_mp: form.parecer_mp,
      decisao: form.decisao,
      descricao: form.descricao,
      resumo_consolidado: form.resumo_consolidado,
    };
    const res = await fetch("/api/diario-manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const novo = await res.json();
    setMencoes(prev => [...prev, { ...form, municipio: payload.municipio, id: novo.id }]);
    setForm(emptyForm);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function removeMencao(id: string) {
    await fetch(`/api/diario-manual?id=${id}`, { method: "DELETE" });
    setMencoes(prev => prev.filter(m => m.id !== id));
  }

  async function gerarRelatorioDiario() {
    setGenStatus("loading");
    const res = await fetch("/api/gerar-relatorio-diario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: today }),
    });
    const html = await res.text();
    const blob = new Blob([html], { type: "text/html" });
    window.open(URL.createObjectURL(blob), "_blank");
    setGenStatus("done");
    setTimeout(() => setGenStatus("idle"), 2000);
  }

  const fields = form.tipo ? (FIELDS_BY_TYPE[form.tipo as TipoDiario] ?? []) : [];
const municipiosComMencao = Array.from(new Set(mencoes.map(m => m.municipio)));

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-ink-400 uppercase tracking-widest mb-1">{formatWeekday(today)}</p>
          <h1 className="text-2xl font-semibold text-ink-900">Diário do TCE-MA</h1>
          <p className="text-ink-500 text-sm mt-1">Registre as menções encontradas no Diário, por município.</p>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow-card p-5 mb-4 animate-fade-in">
          <h2 className="text-sm font-semibold text-ink-800 mb-4">Nova menção</h2>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-ink-500 font-medium block mb-1">Município</label>
              <select className="field-input bg-white" value={form.municipio}
                onChange={e => setForm(f => ({ ...f, municipio: e.target.value }))}>
                <option value="">Selecione...</option>
                {municipios.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-ink-500 font-medium block mb-1">Processo nº</label>
              <input className="field-input font-mono" value={form.proc}
                onChange={e => setForm(f => ({ ...f, proc: e.target.value }))}
                placeholder="Ex: 3901/2023" />
            </div>
          </div>

          <div className="mb-3">
            <label className="text-xs text-ink-500 font-medium block mb-1">Tipo de publicação</label>
            <select className="field-input bg-white" value={form.tipo}
              onChange={e => setForm(f => ({ ...f, tipo: e.target.value as TipoDiario }))}>
              <option value="">Selecione...</option>
              {Object.entries(TIPO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          {form.tipo && (
            <div className="space-y-3 border-t border-ink-100 pt-3 mb-3">
              {fields.includes("entidade") && (
                <Field label="Entidade">
                  <input className="field-input" value={form.entidade}
                    onChange={e => setForm(f => ({ ...f, entidade: e.target.value }))}
                    placeholder="Ex: Câmara Municipal de Matões do Norte/MA" />
                </Field>
              )}
              {fields.includes("natureza") && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Natureza">
                    <input className="field-input" value={form.natureza}
                      onChange={e => setForm(f => ({ ...f, natureza: e.target.value }))}
                      placeholder="Ex: Prestação de Contas" />
                  </Field>
                  <Field label="Espécie">
                    <input className="field-input" value={form.especie}
                      onChange={e => setForm(f => ({ ...f, especie: e.target.value }))}
                      placeholder="Ex: Prefeito Municipal" />
                  </Field>
                </div>
              )}
              {fields.includes("exercicio") && (
                <Field label="Exercício financeiro">
                  <input className="field-input w-32" value={form.exercicio}
                    onChange={e => setForm(f => ({ ...f, exercicio: e.target.value }))}
                    placeholder="Ex: 2022" />
                </Field>
              )}
              {fields.includes("responsaveis") && (
                <Field label="Responsável(is)" hint="separe múltiplos por ponto-e-vírgula">
                  <input className="field-input" value={form.responsaveis}
                    onChange={e => setForm(f => ({ ...f, responsaveis: e.target.value }))}
                    placeholder="Nome Completo; Outro Nome" />
                </Field>
              )}
              {fields.includes("relator") && (
                <Field label="Relator">
                  <input className="field-input" value={form.relator}
                    onChange={e => setForm(f => ({ ...f, relator: e.target.value }))}
                    placeholder="Ex: Conselheiro João Jorge Jinkings Pavão" />
                </Field>
              )}
              {fields.includes("prazo") && (
                <Field label="Prazo para defesa">
                  <input className="field-input w-40" value={form.prazo}
                    onChange={e => setForm(f => ({ ...f, prazo: e.target.value }))}
                    placeholder="Ex: 30 dias" />
                </Field>
              )}
              {fields.includes("parecer_mp") && (
                <Field label="Parecer do MP">
                  <input className="field-input" value={form.parecer_mp}
                    onChange={e => setForm(f => ({ ...f, parecer_mp: e.target.value }))}
                    placeholder="Ex: Arquivamento dos autos" />
                </Field>
              )}
              {fields.includes("decisao") && (
                <Field label="Dispositivo">
                  <textarea className="field-textarea" rows={3} value={form.decisao}
                    onChange={e => setForm(f => ({ ...f, decisao: e.target.value }))}
                    placeholder="Resumo do que foi decidido..." />
                </Field>
              )}
              {fields.includes("descricao") && (
                <Field label="Descrição">
                  <textarea className="field-textarea" rows={3} value={form.descricao}
                    onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
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
              onChange={e => setForm(f => ({ ...f, resumo_consolidado: e.target.value }))}
              placeholder="Observações sobre este município..." />
          </div>

          <button onClick={addMencao} disabled={!form.municipio || !form.tipo || saving}
            className="w-full mt-3 py-2.5 rounded-xl text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> :
             saved  ? <><CheckCircle className="w-4 h-4" />Adicionado!</> :
                      <><Plus className="w-4 h-4" />Adicionar menção</>}
          </button>
        </div>
      )}

      <button onClick={() => setShowForm(v => !v)}
        className="text-sm text-ink-400 hover:text-ink-600 transition-colors flex items-center gap-1 mb-6">
        <ChevronDown className={cn("w-4 h-4 transition-transform", !showForm && "-rotate-90")} />
        {showForm ? "Ocultar formulário" : "Mostrar formulário"}
      </button>

      {mencoes.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-ink-400">
              {mencoes.length} {mencoes.length === 1 ? "menção" : "menções"} · {municipiosComMencao.length} municípios
            </p>
            <button
              onClick={gerarRelatorioDiario}
              disabled={genStatus === "loading"}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink-900 text-white text-xs font-medium hover:bg-ink-800 disabled:opacity-50"
            >
              {genStatus === "loading"
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Gerando...</>
                : genStatus === "done"
                ? <><CheckCircle className="w-3.5 h-3.5" />Gerado!</>
                : <><FileText className="w-3.5 h-3.5" />Gerar relatório do diário</>}
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            {mencoes.map((m, i) => {
              const colorClass = TIPO_COLOR[m.tipo as TipoDiario] ?? TIPO_COLOR.OUTROS;
              const label      = TIPO_LABELS[m.tipo as TipoDiario] ?? m.tipo;
              return (
                <div key={m.id} className={cn("flex items-start gap-3 px-5 py-3.5", i < mencoes.length - 1 && "border-b border-ink-100")}>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", colorClass)}>{label}</span>
                      {m.proc && <span className="text-xs font-mono text-ink-400">{m.proc}</span>}
                      <span className="flex items-center gap-1 text-xs text-brand-600">
                        <Building2 className="w-3 h-3" />{m.municipio.charAt(0) + m.municipio.slice(1).toLowerCase()}
                      </span>
                    </div>
                    {m.entidade && <p className="text-sm text-ink-800">{m.entidade}</p>}
                    {m.descricao && <p className="text-xs text-ink-500 mt-0.5">{m.descricao}</p>}
                    {m.decisao && <p className="text-xs text-ink-500 mt-0.5">{m.decisao}</p>}
                    {m.prazo && <p className="text-xs text-amber-700 font-medium mt-0.5">⏱ {m.prazo}</p>}
                  </div>
                  <button onClick={() => removeMencao(m.id)} className="text-ink-300 hover:text-red-500 p-1 flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-ink-500 font-medium block mb-1">
        {label}{hint && <span className="text-ink-300 font-normal ml-1">— {hint}</span>}
      </label>
      {children}
    </div>
  );
}
