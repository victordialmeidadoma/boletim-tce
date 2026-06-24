"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2, Building2, AlertTriangle } from "lucide-react";
import { MunicipioCruzado } from "@/types";
import { MunicipioSection } from "@/components/ui/MunicipioSection";
import { formatWeekday } from "@/lib/utils";

export default function PublicoMunicipioPage() {
  const params = useParams<{ municipio: string; data: string }>();
  const [municipio, setMunicipio] = useState<MunicipioCruzado | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const municipioNome = decodeURIComponent(params.municipio);
  const data = params.data;

  useEffect(() => {
    fetch(`/api/publico?municipio=${encodeURIComponent(municipioNome)}&data=${data}`)
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json();
          throw new Error(body.error || "Erro ao carregar");
        }
        return r.json();
      })
      .then(setMunicipio)
      .catch((e) => setError(String(e.message ?? e)))
      .finally(() => setLoading(false));
  }, [municipioNome, data]);

  return (
    <div className="min-h-screen bg-ink-50 flex items-start justify-center px-4 py-10">
      <div className="max-w-2xl w-full">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <Building2 className="w-5 h-5 text-brand-600" />
          <span className="text-sm font-semibold text-ink-700">Boletim informativo — TCE-MA</span>
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

        {!loading && municipio && (
          <>
            <p className="text-center text-xs text-ink-400 uppercase tracking-widest mb-1">
              {formatWeekday(data)}
            </p>
            <h1 className="text-center text-2xl font-semibold text-ink-900 mb-6">
              {municipio.nome.charAt(0) + municipio.nome.slice(1).toLowerCase()}
            </h1>
            <MunicipioSection municipio={municipio} />
          </>
        )}
      </div>
    </div>
  );
}
