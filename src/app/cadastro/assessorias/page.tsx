"use client";
import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Upload, CheckCircle, Loader2, Pencil, X } from "lucide-react";
import { Assessoria } from "@/types";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const emptyForm = {
  nome: "", cnpj: "", endereco: "", email: "", telefone: "", logo_url: "",
};

export default function AssessoriasPage() {
  const [assessorias, setAssessorias] = useState<Assessoria[]>([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [logoFile, setLogoFile]       = useState<File | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/assessorias").then(r => r.json()).then(data => {
      setAssessorias(data);
      setLoading(false);
    });
  }, []);

  function startEdit(a: Assessoria) {
    setEditingId(a.id ?? null);
    setForm({
      nome: a.nome ?? "", cnpj: a.cnpj ?? "", endereco: a.endereco ?? "",
      email: a.email ?? "", telefone: a.telefone ?? "", logo_url: a.logo_url ?? "",
    });
    setLogoFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setLogoFile(null);
  }

  async function save() {
    if (!form.nome) return;
    setSaving(true);
    let logo_url = form.logo_url;

    if (logoFile) {
      const ext  = logoFile.name.split(".").pop();
      const path = `logos/${form.nome.toLowerCase().replace(/\s+/g, "_")}.${ext}`;
      await supabase.storage.from("assets").upload(path, logoFile, { upsert: true });
      const { data: url } = supabase.storage.from("assets").getPublicUrl(path);
      logo_url = url.publicUrl;
    }

    if (editingId) {
      const res = await fetch("/api/assessorias", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...form, logo_url }),
      });
      const atualizado = await res.json();
      setAssessorias(prev => prev.map(a => a.id === editingId ? atualizado : a));
      setEditingId(null);
    } else {
      const res  = await fetch("/api/assessorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, logo_url }),
      });
      const novo = await res.json();
      setAssessorias(prev => [novo, ...prev]);
    }

    setForm(emptyForm);
    setLogoFile(null);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function remove(id: string) {
    await fetch(`/api/assessorias?id=${id}`, { method: "DELETE" });
    setAssessorias(prev => prev.filter(a => a.id !== id));
    if (editingId === id) cancelEdit();
  }

  const initials = (nome: string) => nome.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink-900">Assessorias</h1>
        <p className="text-ink-500 text-sm mt-1">Cadastre as assessorias e suas informações para os impressos.</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-ink-800">
            {editingId ? "Editar assessoria" : "Nova assessoria"}
          </h2>
          {editingId && (
            <button onClick={cancelEdit} className="text-ink-400 hover:text-ink-700 p-1 rounded-md hover:bg-ink-50">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="col-span-2">
            <label className="text-xs text-ink-500 font-medium block mb-1">Nome da assessoria</label>
            <input className="field-input" value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              placeholder="Ex: Eloi Consultoria Jurídica" />
          </div>
          <div>
            <label className="text-xs text-ink-500 font-medium block mb-1">CNPJ</label>
            <input className="field-input" value={form.cnpj}
              onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))}
              placeholder="00.000.000/0001-00" />
          </div>
          <div>
            <label className="text-xs text-ink-500 font-medium block mb-1">Telefone</label>
            <input className="field-input" value={form.telefone}
              onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
              placeholder="(98) 99999-0000" />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-ink-500 font-medium block mb-1">Endereço</label>
            <input className="field-input" value={form.endereco}
              onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))}
              placeholder="Rua, número, bairro — Cidade/UF" />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-ink-500 font-medium block mb-1">E-mail</label>
            <input className="field-input" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="contato@assessoria.com.br" />
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs text-ink-500 font-medium block mb-1">
            Logo da assessoria <span className="text-ink-300 font-normal">(opcional)</span>
          </label>
          <input ref={logoRef} type="file" accept="image/*" className="hidden"
            onChange={e => setLogoFile(e.target.files?.[0] ?? null)} />
          <button onClick={() => logoRef.current?.click()}
            className={cn("w-full py-2.5 rounded-xl border border-dashed text-sm transition-colors flex items-center justify-center gap-2",
              logoFile ? "border-emerald-300 bg-emerald-50 text-emerald-700" :
              form.logo_url ? "border-brand-200 bg-brand-50/50 text-brand-600" :
              "border-ink-300 text-ink-500 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50/50")}>
            {logoFile
              ? <><CheckCircle className="w-4 h-4" />{logoFile.name}</>
              : form.logo_url
              ? <><CheckCircle className="w-4 h-4" />Logo atual mantida (clique para trocar)</>
              : <><Upload className="w-4 h-4" />Selecionar logo</>}
          </button>
        </div>

        <button onClick={save} disabled={!form.nome || saving}
          className="w-full py-2.5 rounded-xl text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 flex items-center justify-center gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> :
           saved  ? <><CheckCircle className="w-4 h-4" />Salvo!</> :
           editingId ? <><CheckCircle className="w-4 h-4" />Salvar alterações</> :
                    <><Plus className="w-4 h-4" />Adicionar assessoria</>}
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-ink-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />Carregando...
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          {assessorias.length === 0 ? (
            <div className="text-center py-12 text-ink-400 text-sm">Nenhuma assessoria cadastrada.</div>
          ) : assessorias.map((a, i) => (
            <div key={a.id} className={cn(
              "flex items-center gap-3 px-5 py-3.5",
              i < assessorias.length - 1 && "border-b border-ink-100",
              editingId === a.id && "bg-brand-50/40"
            )}>
              <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {a.logo_url
                  ? <img src={a.logo_url} alt="Logo" className="w-full h-full object-cover" />
                  : <span className="text-xs font-bold text-brand-700">{initials(a.nome)}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-900">{a.nome}</p>
                <p className="text-xs text-ink-400">
                  {a.cnpj ? `CNPJ ${a.cnpj}` : ""}{a.endereco ? ` · ${a.endereco}` : ""}
                </p>
              </div>
              <button onClick={() => startEdit(a)}
                className="text-ink-300 hover:text-brand-600 transition-colors p-1">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => a.id && remove(a.id)}
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