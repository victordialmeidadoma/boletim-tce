"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Relatorio, Boletim } from "@/types";
import { ProcessoCard } from "@/components/ui/ProcessoCard";
import { MunicipioSection } from "@/components/ui/MunicipioSection";
import { StatCard } from "@/components/ui/StatCard";
import { formatWeekday } from "@/lib/utils";

export default function DiaPage() {
  const { data } = useParams<{ data: string }>();
  const router = useRouter();
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
  const [boletim, setBoletim] = useState<Boletim | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/dia?data=${data}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.relatorio) setRelatorio(d.relatorio);
        if (d.boletim) setBoletim(d.boletim);
        setLoading(false);
      });
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-ink-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Carregando...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao histórico
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink-900 capitalize">{formatWeekday(data)}</h1>
      </div>

      {relatorio && (
        <section className="mb-10">
          <h2 className="text-xs font-medium text-ink-400 uppercase tracking-widest mb-4">Movimentação processual</h2>
          <div className="grid grid-cols-4 gap-3 mb-6">
            <StatCard value={relatorio.total} label="Processos" />
            <StatCard value={relatorio.arquivados} label="Arquivados" />
            <StatCard value={relatorio.requerem_acao} label="Ações" warn={relatorio.requerem_acao > 0} />
            <StatCard value={relatorio.visitar_mp} label="Visitar MP" />
          </div>
          <div className="bg-white rounded-2xl shadow-card px-5 py-2">
            {relatorio.processos.map((p) => (
              <ProcessoCard key={p.proc + p.ordem} processo={p} />
            ))}
          </div>
        </section>
      )}

      {boletim && (
        <section>
          <h2 className="text-xs font-medium text-ink-400 uppercase tracking-widest mb-4">Boletim informativo</h2>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <StatCard value={boletim.total_municipios} label="Municípios com menções" accent />
            <StatCard value={boletim.municipios_sem_processo?.length ?? 0} label="Somente no diário" />
          </div>
          {boletim.municipios.map((m) => (
            <MunicipioSection key={m.nome} municipio={m} />
          ))}
        </section>
      )}
    </div>
  );
}
