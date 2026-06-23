import { TipoDiario } from "@/types";

export const TIPO_LABELS: Record<TipoDiario, string> = {
  PLENO_ACORDAO:          "Pleno — Acórdão",
  PLENO_DECISAO:          "Pleno — Decisão",
  PLENO_PARECER_PREVIO:   "Pleno — Parecer prévio",
  DESPACHO:               "Despacho",
  CITACAO:                "Citação",
  FISCALIZACAO_AVISO:     "Fiscalização — Aviso",
  FISCALIZACAO_RESULTADO: "Fiscalização — Resultado",
  PAUTA:                  "Pauta",
  OUTROS:                 "Outros",
};

export const TIPO_COLOR: Record<TipoDiario, string> = {
  PLENO_ACORDAO:          "bg-purple-50 text-purple-700 border-purple-200",
  PLENO_DECISAO:          "bg-purple-50 text-purple-700 border-purple-200",
  PLENO_PARECER_PREVIO:   "bg-purple-50 text-purple-700 border-purple-200",
  DESPACHO:               "bg-sky-50 text-sky-700 border-sky-200",
  CITACAO:                "bg-red-50 text-red-700 border-red-200",
  FISCALIZACAO_AVISO:     "bg-amber-50 text-amber-700 border-amber-200",
  FISCALIZACAO_RESULTADO: "bg-amber-50 text-amber-700 border-amber-200",
  PAUTA:                  "bg-slate-50 text-slate-700 border-slate-200",
  OUTROS:                 "bg-ink-50 text-ink-500 border-ink-200",
};

export const FIELDS_BY_TYPE: Record<TipoDiario, string[]> = {
  PLENO_ACORDAO:          ["entidade","natureza","especie","exercicio","responsaveis","relator","decisao"],
  PLENO_DECISAO:          ["entidade","natureza","especie","exercicio","responsaveis","relator","decisao"],
  PLENO_PARECER_PREVIO:   ["entidade","natureza","especie","exercicio","responsaveis","relator","decisao"],
  DESPACHO:               ["entidade","responsaveis","descricao"],
  CITACAO:                ["entidade","natureza","exercicio","responsaveis","relator","prazo","descricao"],
  FISCALIZACAO_AVISO:     ["entidade","descricao"],
  FISCALIZACAO_RESULTADO: ["entidade","descricao"],
  PAUTA:                  ["entidade","natureza","especie","exercicio","responsaveis","relator","parecer_mp"],
  OUTROS:                 ["entidade","descricao"],
};

/**
 * Estrutura de categoria → subtipos, para o formulário em dois dropdowns.
 */
export interface CategoriaDef {
  label: string;
  subtipos: { value: TipoDiario; label: string }[];
}

export const CATEGORIAS: CategoriaDef[] = [
  {
    label: "Pleno",
    subtipos: [
      { value: "PLENO_ACORDAO",        label: "Acórdão" },
      { value: "PLENO_DECISAO",        label: "Decisão" },
      { value: "PLENO_PARECER_PREVIO", label: "Parecer prévio" },
    ],
  },
  {
    label: "Fiscalização",
    subtipos: [
      { value: "FISCALIZACAO_AVISO",     label: "Aviso" },
      { value: "FISCALIZACAO_RESULTADO", label: "Resultado" },
    ],
  },
  {
    label: "Outras publicações",
    subtipos: [
      { value: "DESPACHO", label: "Despacho" },
      { value: "CITACAO",  label: "Citação" },
      { value: "PAUTA",    label: "Pauta" },
      { value: "OUTROS",   label: "Outros" },
    ],
  },
];

/** Dado um TipoDiario, encontra a categoria a que ele pertence. */
export function categoriaDoTipo(tipo: TipoDiario | ""): string {
  if (!tipo) return "";
  for (const cat of CATEGORIAS) {
    if (cat.subtipos.some((s) => s.value === tipo)) return cat.label;
  }
  return "";
}