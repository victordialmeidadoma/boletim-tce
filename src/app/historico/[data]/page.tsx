"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, FileText, Newspaper } from "lucide-react";
import { Relatorio, MunicipioCruzado } from "@/types";
import { ProcessoCard } from "@/components/ui/ProcessoCard";
import { MunicipioSection } from "@/components/ui/MunicipioSection";
import { formatWeekday } from "@/lib/utils";

export default function DiaPage() {
  const { data } = useParams<{ data: string }>();
  const router = useRouter();
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
  const [municipios, setMunicipios] = useState<MunicipioCruzado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/dia?data=${data}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.relatorio) setRelatorio(d.relatorio);
        if (d.municipios) setMunicipios(d.municipios);
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

      {relatorio && relatorio.processos.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xs font-medium text-ink-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />Movimentação processual
          </h2>
          <div className="bg-white rounded-2xl shadow-card px-5 py-2">
            {relatorio.processos.map((p) => (
              <ProcessoCard key={p.proc + p.ordem} processo={p} />
            ))}
          </div>
        </section>
      )}

      {municipios.length > 0 && (
        <section>
          <h2 className="text-xs font-medium text-ink-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
            <Newspaper className="w-3.5 h-3.5" />Boletim informativo
          </h2>
          {municipios.map((m) => (
            <MunicipioSection key={m.nome} municipio={m} />
          ))}
        </section>
      )}

      {!relatorio?.processos?.length && municipios.length === 0 && (
        <p className="text-sm text-ink-400 text-center py-10">Nenhuma informação registrada neste dia.</p>
      )}
    </div>
  );
}