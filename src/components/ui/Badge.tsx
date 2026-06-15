import { cn } from "@/lib/utils";
import { TipoProvidencia, UrgenciaProcesso } from "@/types";

const tipoConfig: Record<TipoProvidencia, { label: string; className: string }> = {
  ARQUIVADO: {
    label: "Arquivado",
    className: "bg-ink-100 text-ink-600",
  },
  FAZER_MANIFESTACAO: {
    label: "Fazer manifestação",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  RECURSO_RECONSIDERACAO: {
    label: "Recurso de reconsideração",
    className: "bg-brand-50 text-brand-700 border border-brand-200",
  },
  VISITAR_MP: {
    label: "Visitar MP de Contas",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  OUTROS: {
    label: "Outros",
    className: "bg-ink-100 text-ink-500",
  },
};

export function TipoBadge({ tipo }: { tipo: TipoProvidencia }) {
  const config = tipoConfig[tipo] ?? tipoConfig.OUTROS;
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", config.className)}>
      {config.label}
    </span>
  );
}

export function UrgenciaIndicator({ urgencia }: { urgencia: UrgenciaProcesso }) {
  return (
    <span
      className={cn("inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5", {
        "bg-red-500": urgencia === "critica",
        "bg-amber-400": urgencia === "atencao",
        "bg-ink-300": urgencia === "normal",
      })}
    />
  );
}
