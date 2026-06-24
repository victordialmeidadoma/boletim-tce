"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2, FileText, AlertTriangle } from "lucide-react";
import { MunicipioCruzado } from "@/types";
import { MunicipioSection } from "@/components/ui/MunicipioSection";
import { formatWeekday } from "@/lib/utils";

export default function PublicoDiaPage() {
  const params = useParams<{ data: string }>();
  const [municipios, setMunicipios] = useState<MunicipioCruzado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const data = params.data;

  useEffect(() => {
    fetch(`/api/publico-dia?data=${data}`)
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json();
          throw new Error(body.error || "Erro ao carregar");
        }
        return r.json();
      })
      .then((d) => setMunicipios(d.municipios))
      .catch((e) => setError(String(e.message ?? e)))
      .finally(() => setLoading(false));
  }, [data]);

  return (
    <div className="min-h-screen bg-ink-50 flex items-start justify-center px-4 py-10">
      <div className="max-w-2xl w-full">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <FileText className="w-5 h-5 text-brand-600" />
          <span className="text-sm font-semibold text-ink-700">Movimentação processual — TCE-MA</span>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16 text-ink-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />Carregando...
          </div>
        )}

        {!loading && error && (
          <div className="bg-amber-50 rounded-xl px-4 py-3 text-sm text-amber-700 flex items-center gap-3 justify-center">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            Nenhuma informação encontrada para esta data.
          </div>
        )}

        {!loading && municipios.length > 0 && (
          <>
            <p className="text-center text-xs text-ink-400 uppercase tracking-widest mb-6">
              {formatWeekday(data)}
            </p>
            {municipios.map((m) => (
              <MunicipioSection key={m.nome} municipio={m} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
