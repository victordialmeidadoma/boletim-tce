import { MencaoDiario, MunicipioCruzado, TipoDiario } from "@/types";
import { TipoBadge } from "./Badge";
import { Building2, User, Calendar, Clock, Gavel, FileWarning, Bell, ClipboardList, FileSearch, FileText, X, AlertTriangle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const TIPO_CONFIG: Record<TipoDiario, { label: string; icon: React.ElementType; className: string }> = {
  PLENO_ACORDAO:               { label: "Pleno — Acórdão",            icon: Gavel,         className: "bg-purple-50 text-purple-800 border-purple-200" },
  PLENO_DECISAO:               { label: "Pleno — Decisão",            icon: Gavel,         className: "bg-purple-50 text-purple-800 border-purple-200" },
  PLENO_PARECER_PREVIO:        { label: "Pleno — Parecer prévio",     icon: Gavel,         className: "bg-purple-50 text-purple-800 border-purple-200" },
  DESPACHO:                    { label: "Despacho",                   icon: FileText,      className: "bg-sky-50 text-sky-800 border-sky-200" },
  CITACAO:                     { label: "Citação",                    icon: FileWarning,   className: "bg-red-50 text-red-800 border-red-200" },
  FISCALIZACAO_AVISO:          { label: "Fiscalização — Aviso",       icon: Bell,          className: "bg-amber-50 text-amber-800 border-amber-200" },
  FISCALIZACAO_RESULTADO:      { label: "Fiscalização — Resultado",   icon: FileSearch,    className: "bg-amber-50 text-amber-800 border-amber-200" },
  FISCALIZACAO_ACOMPANHAMENTO: { label: "Fiscalização — Acompanhamento", icon: FileSearch, className: "bg-amber-50 text-amber-800 border-amber-200" },
  FISCALIZACAO:                { label: "Fiscalização",               icon: FileSearch,    className: "bg-amber-50 text-amber-800 border-amber-200" },
  PAUTA:                       { label: "Pauta",                      icon: ClipboardList, className: "bg-slate-50 text-slate-700 border-slate-200" },
  OUTROS:                      { label: "Outros",                     icon: FileText,      className: "bg-slate-50 text-slate-600 border-slate-200" },
};

function UrgenciaBadge({ urgencia }: { urgencia?: string }) {
  if (urgencia === "urgencia") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
        <AlertTriangle className="w-3 h-3" />Urgência
      </span>
    );
  }
  if (urgencia === "atencao") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
        <AlertCircle className="w-3 h-3" />Atenção
      </span>
    );
  }
  return null;
}

function MencaoCard({ m, onRemove }: { m: MencaoDiario; onRemove?: () => void }) {
  const cfg = TIPO_CONFIG[m.tipo] ?? TIPO_CONFIG.OUTROS;
  const Icon = cfg.icon;
  const borderClass = m.urgencia === "urgencia" ? "border-red-300" : m.urgencia === "atencao" ? "border-amber-300" : "border-slate-100";

  return (
    <div className={cn("border rounded-lg overflow-hidden mb-3 last:mb-0", borderClass)}>
      <div className={cn("flex items-center gap-2 px-3 py-2 border-b border-current/10", cfg.className)}>
        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="text-xs font-semibold">{cfg.label}</span>
        <div className="ml-auto flex items-center gap-2">
          <UrgenciaBadge urgencia={m.urgencia} />
          {m.proc && <span className="text-xs font-mono opacity-70">{m.proc}</span>}
        </div>
        {onRemove && (
          <button onClick={onRemove} className="ml-2 opacity-60 hover:opacity-100 transition-opacity" title="Remover">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="px-3 py-2.5 space-y-1.5 bg-white">
        {m.entidade && <Row icon={<Building2 className="w-3 h-3" />} label="Entidade" value={m.entidade} />}
        {m.natureza && <Row icon={<FileText className="w-3 h-3" />} label="Natureza" value={`${m.natureza}${m.especie ? ` — ${m.especie}` : ""}`} />}
        {m.exercicio && <Row icon={<Calendar className="w-3 h-3" />} label="Exercício" value={m.exercicio} />}
        {m.responsaveis && m.responsaveis.length > 0 && (
          <Row icon={<User className="w-3 h-3" />} label={m.responsaveis.length > 1 ? "Responsáveis" : "Responsável"} value={m.responsaveis.join("; ")} />
        )}
        {m.relator && <Row icon={<User className="w-3 h-3" />} label="Relator" value={m.relator} />}
        {m.prazo && <Row icon={<Clock className="w-3 h-3" />} label="Prazo" value={m.prazo} accent="warn" />}
        {m.parecer_mp && <Row icon={<FileText className="w-3 h-3" />} label="Parecer MP" value={m.parecer_mp} />}
        {m.decisao && (
          <div className="mt-2 pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-0.5">Dispositivo</p>
            <p className="text-xs text-slate-800 leading-relaxed">{m.decisao}</p>
          </div>
        )}
        {m.descricao && !m.decisao && (
          <div className="mt-1.5 pt-1.5 border-t border-slate-100">
            <p className="text-xs text-slate-600 leading-relaxed">{m.descricao}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: "warn" }) {
  return (
    <div className="flex gap-2 items-start">
      <span className="text-slate-300 mt-0.5 flex-shrink-0">{icon}</span>
      <span className="text-xs text-slate-400 flex-shrink-0 w-20">{label}</span>
      <span className={cn("text-xs leading-snug", accent === "warn" ? "text-amber-700 font-medium" : "text-slate-700")}>{value}</span>
    </div>
  );
}

interface Props {
  municipio: MunicipioCruzado;
  onRemoveMencao?: (idx: number) => void;
}

export function MunicipioSection({ municipio, onRemoveMencao }: Props) {
  return (
    <div className="border border-ink-100 rounded-xl overflow-hidden mb-4">
      <div className="flex items-center gap-2 px-4 py-3 bg-ink-50 border-b border-ink-100">
        <Building2 className="w-4 h-4 text-ink-400" />
        <h3 className="text-sm font-semibold text-ink-800">{municipio.nome}</h3>
        <span className="ml-auto text-xs text-ink-400">
          {municipio.mencoes_diario.length} {municipio.mencoes_diario.length === 1 ? "menção" : "menções"}
        </span>
      </div>
      <div className="divide-y divide-ink-100">
        {municipio.processos_dia.length > 0 && (
          <div className="px-4 py-3">
            <p className="text-xs font-medium text-ink-400 uppercase tracking-wide mb-2">Processos do dia</p>
            <div className="space-y-1.5">
              {municipio.processos_dia.map((p, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono text-ink-500">{p.proc}</span>
                  <span className="text-xs text-ink-400">{p.assunto}</span>
                  <TipoBadge tipo={p.tipo} />
                  <UrgenciaBadge urgencia={p.urgencia} />
                </div>
              ))}
            </div>
          </div>
        )}
        {municipio.mencoes_diario.length > 0 && (
          <div className="px-4 py-3">
            <p className="text-xs font-medium text-ink-400 uppercase tracking-wide mb-3">Menções no diário</p>
            {municipio.mencoes_diario.map((m, i) => (
              <MencaoCard key={i} m={m} onRemove={onRemoveMencao ? () => onRemoveMencao(i) : undefined} />
            ))}
          </div>
        )}
        {municipio.resumo_consolidado && (
          <div className="px-4 py-3 bg-brand-50/50">
            <p className="text-xs text-brand-700 leading-relaxed">{municipio.resumo_consolidado}</p>
          </div>
        )}
      </div>
    </div>
  );
}