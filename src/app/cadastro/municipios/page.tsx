"use client";
import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Upload, CheckCircle, Building2, Loader2 } from "lucide-react";
import { Municipio, Assessoria } from "@/types";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const ESTADOS = ["Maranhão","Pará","Piauí","Tocantins","Ceará","Bahia","Outros"];

export default function MunicipiosPage() {
  const [municipios, setMunicipios]   = useState<(Municipio & { assessorias?: Assessoria })[]>([]);
  const [assessorias, setAssessorias] = useState<Assessoria[]>([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [brasaoFile, setBrasaoFile]   = useState<File | null>(null);
  const brasaoRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    nome: "", estado: "Maranhão", assessoria_id: "", brasao_url: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/municipios").then(r => r.json()),
      supabase.from("assessorias").select("*").order("nome").then(r => r.data ?? []),
    ]).then(([munis, assess]) => {
      setMunicipios(munis);
      setAssessorias(assess as Assessoria[]);
      setLoading(false);
    });
  }, []);

  async function save() {
    if (!form.nome) return;
    setSaving(true);
    let brasao_url = form.brasao_url;

    if (brasaoFile) {
      const ext  = brasaoFile.name.split(".").pop();
      const path = `brasoes/${form.nome.toLowerCase().replace(/\s+/g,"_")}.${ext}`;
      await supabase.storage.from("assets").upload(path, brasaoFile, { upsert: true });
      const { data: url } = supabase.storage.from("assets").getPublicUrl(path);
      brasao_url = url.publicUrl;
    }

    const res  = await fetch("/api/municipios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, brasao_url }),
    });
    const novo = await res.json();
    setMunicipios(prev => [novo, ...prev]);
    setForm({ nome: "", estado: "Maranhão", assessoria_id: "", brasao_url: "" });
    setBrasaoFile(null);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function remove(id: string) {
    await fetch(`/api/municipios?id=${id}`, { method: "DELETE" });
    setMunicipios(prev => prev.filter(m => m.id !== id));
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink-900">Municípios</h1>
        <p className="text-ink-500 text-sm mt-1">Cadastre os municípios e vincule às assessorias.</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-card p-5 mb-6">
        <h2 className="text-sm font-semibold text-ink-800 mb-4">Novo município</h2>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="col-span-2">
            <label className="text-xs text-ink-500 font-medium block mb-1">Nome do município</label>
            <input className="field-input" value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              placeholder="Ex: Matões do Norte" />
          </div>
          <div>
            <label className="text-xs text-ink-500 font-medium block mb-1">Estado</label>
            <select className="field-input bg-white" value={form.estado}
              onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}>
              {ESTADOS.map(e => <option key={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-ink-500 font-medium block mb-1">Assessoria responsável</label>
            <select className="field-input bg-white" value={form.assessoria_id}
              onChange={e => setForm(f => ({ ...f, assessoria_id: e.target.value }))}>
              <option value="">Selecione...</option>
              {assessorias.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs text-ink-500 font-medium block mb-1">Brasão do município <span className="text-ink-300 font-normal">(opcional)</span></label>
          <input ref={brasaoRef} type="file" accept="image/*" className="hidden"
            onChange={e => setBrasaoFile(e.target.files?.[0] ?? null)} />
          <button onClick={() => brasaoRef.current?.click()}
            className={cn("w-full py-2.5 rounded-xl border border-dashed text-sm transition-colors flex items-center justify-center gap-2",
              brasaoFile ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-ink-300 text-ink-500 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50/50")}>
            {brasaoFile ? <><CheckCircle className="w-4 h-4" />{brasaoFile.name}</> : <><Upload className="w-4 h-4" />Selecionar brasão</>}
          </button>
        </div>

        <button onClick={save} disabled={!form.nome || saving}
          className="w-full py-2.5 rounded-xl text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 flex items-center justify-center gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> :
           saved  ? <><CheckCircle className="w-4 h-4" />Salvo!</> :
                    <><Plus className="w-4 h-4" />Adicionar município</>}
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-ink-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />Carregando...
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          {municipios.length === 0 ? (
            <div className="text-center py-12 text-ink-400 text-sm">Nenhum município cadastrado.</div>
          ) : municipios.map((m, i) => (
            <div key={m.id} className={cn("flex items-center gap-3 px-5 py-3.5", i < municipios.length - 1 && "border-b border-ink-100")}>
              <div className="w-9 h-9 rounded-full bg-ink-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {m.brasao_url
                  ? <img src={m.brasao_url} alt="Brasão" className="w-full h-full object-cover" />
                  : <Building2 className="w-4 h-4 text-ink-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-900">{m.nome}</p>
                <p className="text-xs text-ink-400">{m.estado}{(m as any).assessorias?.nome ? ` · ${(m as any).assessorias.nome}` : ""}</p>
              </div>
              <button onClick={() => m.id && remove(m.id)}
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
