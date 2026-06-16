"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, CheckCircle, Loader2 } from "lucide-react";
import { Gestor, Municipio } from "@/types";
import { cn } from "@/lib/utils";

const CARGOS = ["Prefeito","Vice-prefeito","Secretário(a) de Saúde","Secretário(a) de Educação","Secretário(a) de Finanças","Secretário(a) de Obras","Controlador(a) Interno","Presidente da Câmara","Outro"];

export default function GestoresPage() {
  const [gestores,   setGestores]   = useState<(Gestor & { municipios?: { nome: string } })[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [filterMuni, setFilterMuni] = useState("");

  const [form, setForm] = useState({
    nome: "", cargo: "Prefeito", cpf: "", email: "", municipio_id: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/gestores").then(r => r.json()),
      fetch("/api/municipios").then(r => r.json()),
    ]).then(([gest, munis]) => {
      setGestores(gest);
      setMunicipios(munis);
      setLoading(false);
    });
  }, []);

  async function save() {
    if (!form.nome || !form.municipio_id) return;
    setSaving(true);
    const res   = await fetch("/api/gestores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const novo  = await res.json();
    const muni  = municipios.find(m => m.id === form.municipio_id);
    setGestores(prev => [{ ...novo, municipios: { nome: muni?.nome ?? "" } }, ...prev]);
    setForm({ nome: "", cargo: "Prefeito", cpf: "", email: "", municipio_id: "" });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function remove(id: string) {
    await fetch(`/api/gestores?id=${id}`, { method: "DELETE" });
    setGestores(prev => prev.filter(g => g.id !== id));
  }

  const initials = (nome: string) => nome.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();

  const filtered = filterMuni
    ? gestores.filter(g => (g as any).municipios?.nome === filterMuni)
    : gestores;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink-900">Gestores</h1>
        <p className="text-ink-500 text-sm mt-1">Cadastre prefeitos, secretários e outros gestores por município.</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-card p-5 mb-6">
        <h2 className="text-sm font-semibold text-ink-800 mb-4">Novo gestor</h2>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="col-span-2">
            <label className="text-xs text-ink-500 font-medium block mb-1">Nome completo</label>
            <input className="field-input" value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              placeholder="Ex: Ivo Rezende Aragão" />
          </div>
          <div>
            <label className="text-xs text-ink-500 font-medium block mb-1">Município</label>
            <select className="field-input bg-white" value={form.municipio_id}
              onChange={e => setForm(f => ({ ...f, municipio_id: e.target.value }))}>
              <option value="">Selecione...</option>
              {municipios.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-ink-500 font-medium block mb-1">Cargo</label>
            <select className="field-input bg-white" value={form.cargo}
              onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))}>
              {CARGOS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-ink-500 font-medium block mb-1">CPF <span className="text-ink-300 font-normal">(opcional)</span></label>
            <input className="field-input" value={form.cpf}
              onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))}
              placeholder="000.000.000-00" />
          </div>
          <div>
            <label className="text-xs text-ink-500 font-medium block mb-1">E-mail <span className="text-ink-300 font-normal">(opcional)</span></label>
            <input className="field-input" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="gestor@municipio.ma.gov.br" />
          </div>
        </div>

        <button onClick={save} disabled={!form.nome || !form.municipio_id || saving}
          className="w-full py-2.5 rounded-xl text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 flex items-center justify-center gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> :
           saved  ? <><CheckCircle className="w-4 h-4" />Salvo!</> :
                    <><Plus className="w-4 h-4" />Adicionar gestor</>}
        </button>
      </div>

      {/* Filter */}
      <div className="mb-3">
        <select className="field-input bg-white w-auto text-sm" value={filterMuni}
          onChange={e => setFilterMuni(e.target.value)}>
          <option value="">Todos os municípios</option>
          {municipios.map(m => <option key={m.id}>{m.nome}</option>)}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-ink-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />Carregando...
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-ink-400 text-sm">Nenhum gestor cadastrado.</div>
          ) : filtered.map((g, i) => (
            <div key={g.id} className={cn("flex items-center gap-3 px-5 py-3.5", i < filtered.length - 1 && "border-b border-ink-100")}>
              <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-brand-700">{initials(g.nome)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-900">{g.nome}</p>
                <p className="text-xs text-ink-400">{g.cargo}{(g as any).municipios?.nome ? ` · ${(g as any).municipios.nome}` : ""}</p>
              </div>
              <button onClick={() => g.id && remove(g.id)}
                className="text-ink-300 hover:text-red-500 transition-colors p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
