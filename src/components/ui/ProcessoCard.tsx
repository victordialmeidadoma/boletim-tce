"use client";
import { Processo } from "@/types";
import { TipoBadge, UrgenciaIndicator } from "./Badge";
import { cn } from "@/lib/utils";

export function ProcessoCard({ processo }: { processo: Processo }) {
  const isAction = processo.tipo !== "ARQUIVADO";

  return (
    <div className={cn(
      "group relative py-4 px-1 border-b border-ink-100 last:border-0",
      "hover:bg-ink-50/50 transition-colors rounded-lg px-3 -mx-3"
    )}>
      <div className="flex gap-3">
        <UrgenciaIndicator urgencia={processo.urgencia} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-mono text-ink-400">{processo.proc}</span>
            <span className="text-xs text-ink-300">·</span>
            <span className="text-xs text-ink-400">Exerc. {processo.exerc}</span>
            <TipoBadge tipo={processo.tipo} />
          </div>

          <p className="text-sm font-medium text-ink-800 mb-0.5">
            {processo.municipio} — {processo.assunto}
          </p>

          <p className="text-sm text-ink-500 leading-relaxed">{processo.movimentacao}</p>

          {isAction && processo.providencia && (
            <div className="mt-2 flex gap-2 items-start">
              <span className="text-ink-300 text-xs mt-0.5">→</span>
              <p className="text-sm text-ink-700 font-medium">{processo.providencia}</p>
            </div>
          )}

          <p className="text-xs text-ink-400 mt-2">
            Resp.: {processo.responsavel}
          </p>
        </div>
      </div>
    </div>
  );
}
