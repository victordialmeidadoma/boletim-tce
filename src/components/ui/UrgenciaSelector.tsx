"use client";
import { UrgenciaProcesso } from "@/types";
import { cn } from "@/lib/utils";
import { AlertTriangle, AlertCircle } from "lucide-react";

interface Props {
  value: UrgenciaProcesso;
  onChange: (v: UrgenciaProcesso) => void;
  className?: string;
}

const OPTIONS: { value: UrgenciaProcesso; label: string; activeClass: string; icon?: React.ElementType }[] = [
  { value: "normal",   label: "Normal",   activeClass: "bg-ink-100 text-ink-700 border-ink-300" },
  { value: "atencao",  label: "Atenção",  activeClass: "bg-amber-100 text-amber-800 border-amber-400", icon: AlertCircle },
  { value: "urgencia", label: "Urgência", activeClass: "bg-red-100 text-red-700 border-red-400",       icon: AlertTriangle },
];

export function UrgenciaSelector({ value, onChange, className }: Props) {
  return (
    <div className={cn("flex gap-1.5", className)}>
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors",
              active ? opt.activeClass : "bg-white text-ink-400 border-ink-200 hover:border-ink-300"
            )}
          >
            {Icon && <Icon className="w-3 h-3" />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}