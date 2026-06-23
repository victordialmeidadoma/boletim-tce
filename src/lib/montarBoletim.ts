import { createServerClient } from "@/lib/supabase";
import { MunicipioCruzado, Processo, MencaoDiario } from "@/types";

export async function montarMunicipiosCruzados(
  db: ReturnType<typeof createServerClient>,
  data: string
): Promise<MunicipioCruzado[]> {
  const { data: relatorio } = await db
    .from("relatorios")
    .select("processos")
    .eq("data", data)
    .single();

  const processos: Processo[] = relatorio?.processos ?? [];

  const { data: mencoesRows } = await db
    .from("mencoes_diario_manual")
    .select("*")
    .eq("data", data);

  const byMuni: Record<string, MencaoDiario[]> = {};
  const resumos: Record<string, string> = {};

  for (const r of mencoesRows ?? []) {
    const key = r.municipio?.toUpperCase();
    if (!key) continue;
    if (!byMuni[key]) byMuni[key] = [];
    byMuni[key].push({
      tipo: r.tipo,
      proc: r.proc,
      natureza: r.natureza,
      especie: r.especie,
      exercicio: r.exercicio,
      entidade: r.entidade,
      responsaveis: r.responsaveis,
      relator: r.relator,
      prazo: r.prazo,
      parecer_mp: r.parecer_mp,
      decisao: r.decisao,
      descricao: r.descricao,
    });
    if (r.resumo_consolidado) resumos[key] = r.resumo_consolidado;
  }

  const todosMunicipios = new Set<string>([
    ...processos.map((p) => p.municipio?.toUpperCase()).filter(Boolean),
    ...Object.keys(byMuni),
  ]);

  return Array.from(todosMunicipios).map((nome) => ({
    nome,
    processos_dia: processos.filter((p) => p.municipio?.toUpperCase() === nome),
    mencoes_diario: byMuni[nome] ?? [],
    resumo_consolidado: resumos[nome] ?? "",
  }));
}
