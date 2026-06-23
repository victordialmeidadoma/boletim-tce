"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, CheckCircle, Loader2, FileText, ChevronDown } from "lucide-react";
import { Processo, Municipio, Gestor } from "@/types";
import { StatCard } from "@/components/ui/StatCard";
import { TipoBadge } from "@/components/ui/Badge";
import { formatWeekday, todayISO } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

const ASSUNTOS = [
  "Contas de Governo","Prestação de Contas","Tomada de Contas",
  "FMS","FMAS","FUNDEB","Representação","Outro",
];
const PROVIDENCIAS = [
  "Arquivado — Arquivo Prescrição","Fazer manifestação",
  "Fazer recurso de reconsideração","Visitar MP de Contas","Outros",
];
const PROVIDENCIA_TIPO: Record<string, Processo["tipo"]> = {
  "Arquivado — Arquivo Prescrição": "ARQUIVADO",
  "Fazer manifestação":              "FAZER_MANIFESTACAO",
  "Fazer recurso de reconsideração": "RECURSO_RECONSIDERACAO",
  "Visitar MP de Contas":            "VISITAR_MP",
  "Outros":                          "OUTROS",
};

const emptyForm = {
  proc: "", exerc: "", assunto: "Contas de Governo",
  municipio_id: "", municipio_nome: "",
  responsavel_id: "", responsavel: "",
  movimentacao: "", providencia: "",
};

export default function DashboardPage() {
  const [processos,  setProcessos]  = useState<Processo[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [gestores,   setGestores]   = useState<Gestor[]>([]);
  const [form,       setForm]       = useState(emptyForm);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [showForm,   setShowForm]   = useState(true);
  const today = todayISO();

  useEffect(() => {
    fetch("/api/municipios").then(r => r.json()).then(setMunicipios);
    supabase.from("relatorios").select("processos").eq("data", today).single()
      .then(({ data }) => { if (data?.processos) setProcessos(data.processos as Processo[]); });
  }, [today]);

  async function onMunicipioChange(id: string) {
    const muni = municipios.find(m => m.id === id);
    setForm(f => ({ ...f, municipio_id: id, municipio_nome: muni?.nome ?? "", responsavel_id: "", responsavel: "" }));
    if (id) {
      const res = await fetch(`/api/gestores?municipio_id=${id}`);
      const data = await res.json();
      setGestores(data);
    } else {
      setGestores([]);
    }
  }

  async function addProcesso() {
    if (!form.proc || !form.municipio_nome) return;
    setSaving(true);
    const novoProcesso: Processo = {
      ordem:       processos.length + 1,
      proc:        form.proc,
      exerc:       form.exerc,
      assunto:     form.assunto,
      municipio:   form.municipio_nome.toUpperCase(),
      responsavel: form.responsavel,
      movimentacao: form.movimentacao,
      providencia: form.providencia,
      tipo:        PROVIDENCIA_TIPO[form.providencia] ?? "OUTROS",
      urgencia:    form.providencia === "Arquivado — Arquivo Prescrição" ? "normal" : "atencao",
    };
    const updated = [...processos, novoProcesso];
    setProcessos(updated);

    await supabase.from("relatorios").upsert({
      data:          today,
      total:         updated.length,
      arquivados:    updated.filter(p => p.tipo === "ARQUIVADO").length,
      requerem_acao: updated.filter(p => p.tipo !== "ARQUIVADO").length,
      visitar_mp:    updated.filter(p => p.tipo === "VISITAR_MP").length,
      processos:     updated,
    }, { onConflict: "data" });

    setForm(emptyForm);
    setGestores([]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function removeProcesso(idx: number) {
    const updated = processos.filter((_, i) => i !== idx);
    setProcessos(updated);
    await supabase.from("relatorios").upsert({
      data:          today,
      total:         updated.length,
      arquivados:    updated.filter(p => p.tipo === "ARQUIVADO").length,
      requerem_acao: updated.filter(p => p.tipo !== "ARQUIVADO").length,
      visitar_mp:    updated.filter(p => p.tipo === "VISITAR_MP").length,
      processos:     updated,
    }, { onConflict: "data" });
  }

  const arquivados   = processos.filter(p => p.tipo === "ARQUIVADO").length;
  const requeremAcao = processos.filter(p => p.tipo !== "ARQUIVADO").length;
  const visitarMP    = processos.filter(p => p.tipo === "VISITAR_MP").length;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <p className="text-xs font-medium text-ink-400 uppercase tracking-widest mb-1">{formatWeekday(today)}</p>
        <h1 className="text-2xl font-semibold text-ink-900">Movimentação processual</h1>
        <p className="text-ink-500 text-sm mt-1">Registre os processos do dia manualmente.</p>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-card p-5 mb-6 animate-fade-in">
          <h2 className="text-sm font-semibold text-ink-800 mb-4">Adicionar processo</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-ink-500 font-medium block mb-1">Processo nº</label>
              <input className="field-input font-mono" value={form.proc}
                onChange={e => setForm(f => ({ ...f, proc: e.target.value }))}
                placeholder="Ex: 1527/2023" />
            </div>
            <div>
              <label className="text-xs text-ink-500 font-medium block mb-1">Exercício</label>
              <input className="field-input" value={form.exerc}
                onChange={e => setForm(f => ({ ...f, exerc: e.target.value }))}
                placeholder="Ex: 2022" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-ink-500 font-medium block mb-1">Assunto</label>
              <select className="field-input bg-white" value={form.assunto}
                onChange={e => setForm(f => ({ ...f, assunto: e.target.value }))}>
                {ASSUNTOS.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-ink-500 font-medium block mb-1">Município</label>
              <select className="field-input bg-white" value={form.municipio_id}
                onChange={e => onMunicipioChange(e.target.value)}>
                <option value="">Selecione...</option>
                {municipios.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-ink-500 font-medium block mb-1">Responsável</label>
              <select className="field-input bg-white" value={form.responsavel_id}
                onChange={e => {
                  const g = gestores.find(g => g.id === e.target.value);
                  setForm(f => ({ ...f, responsavel_id: e.target.value, responsavel: g ? `${g.nome} (${g.cargo})` : "" }));
                }}
                disabled={!form.municipio_id}>
                <option value="">Selecione o município primeiro</option>
                {gestores.map(g => <option key={g.id} value={g.id}>{g.nome} — {g.cargo}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-ink-500 font-medium block mb-1">Movimentação</label>
              <textarea className="field-textarea" rows={3} value={form.movimentacao}
                onChange={e => setForm(f => ({ ...f, movimentacao: e.target.value }))}
                placeholder="Descreva a movimentação processual..." />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-ink-500 font-medium block mb-1">Providência</label>
              <select className="field-input bg-white" value={form.providencia}
                onChange={e => setForm(f => ({ ...f, providencia: e.target.value }))}>
                <option value="">Selecione (opcional)...</option>
                {PROVIDENCIAS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <button onClick={addProcesso} disabled={!form.proc || !form.municipio_nome || saving}
            className="w-full py-2.5 rounded-xl text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 flex items-center justify-center gap-2">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> :
             saved  ? <><CheckCircle className="w-4 h-4" />Adicionado!</> :
                      <><Plus className="w-4 h-4" />Adicionar processo</>}
          </button>
        </div>
      )}

      <button onClick={() => setShowForm(v => !v)}
        className="text-sm text-ink-400 hover:text-ink-600 transition-colors flex items-center gap-1 mb-6">
        <ChevronDown className={cn("w-4 h-4 transition-transform", !showForm && "-rotate-90")} />
        {showForm ? "Ocultar formulário" : "Mostrar formulário"}
      </button>

      {/* Stats */}
      {processos.length > 0 && (
        <>
          <div className="grid grid-cols-4 gap-3 mb-5">
            <StatCard value={processos.length} label="Processos" />
            <StatCard value={arquivados} label="Arquivados" />
            <StatCard value={requeremAcao} label="Requerem ação" warn={requeremAcao > 0} />
            <StatCard value={visitarMP} label="Visitar MP" />
          </div>

          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-ink-800">Processos do dia</h2>
                <p className="text-xs text-ink-400 mt-0.5">{formatWeekday(today)}</p>
              </div>
              <button
                onClick={async () => {
                  const res = await fetch("/api/gerar-relatorio-movimentacao", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ data: today }),
                  });
                  const html = await res.text();
                  const blob = new Blob([html], { type: "text/html" });
                  window.open(URL.createObjectURL(blob), "_blank");
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink-900 text-white text-xs font-medium hover:bg-ink-800"
              >
                <FileText className="w-3.5 h-3.5" />
                Gerar relatório
              </button>
            </div>
            <div className="divide-y divide-ink-100">
              {processos.map((p, i) => (
                <div key={i} className="flex items-start gap-3 px-5 py-3.5">
                  <div className={cn("w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0",
                    p.urgencia === "critica" ? "bg-red-500" : p.urgencia === "atencao" ? "bg-amber-400" : "bg-ink-300")} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-ink-400">{p.proc}</span>
                      <span className="text-xs text-ink-300">· Exerc. {p.exerc}</span>
                      <TipoBadge tipo={p.tipo} />
                    </div>
                    <p className="text-sm font-medium text-ink-800">{p.municipio} — {p.assunto}</p>
                    <p className="text-xs text-ink-500 mt-0.5 line-clamp-2">{p.movimentacao}</p>
                    <p className="text-xs text-ink-400 mt-1">Resp.: {p.responsavel}</p>
                  </div>
                  <button onClick={() => removeProcesso(i)}
                    className="text-ink-300 hover:text-red-500 transition-colors p-1 flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
