import { cn } from "@/lib/utils";

interface StatCardProps {
  value: number | string;
  label: string;
  accent?: boolean;
  warn?: boolean;
}

export function StatCard({ value, label, accent, warn }: StatCardProps) {
  return (
    <div className={cn(
      "rounded-xl p-4 flex flex-col gap-1",
      accent ? "bg-brand-600 text-white" : "bg-ink-50"
    )}>
      <span className={cn(
        "text-2xl font-semibold tracking-tight",
        accent ? "text-white" : warn ? "text-amber-600" : "text-ink-900"
      )}>
        {value}
      </span>
      <span className={cn(
        "text-xs",
        accent ? "text-brand-200" : "text-ink-400"
      )}>
        {label}
      </span>
    </div>
  );
}
