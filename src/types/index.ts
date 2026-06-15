export type TipoProvidencia =
  | "ARQUIVADO"
  | "FAZER_MANIFESTACAO"
  | "RECURSO_RECONSIDERACAO"
  | "VISITAR_MP"
  | "OUTROS";

export type UrgenciaProcesso = "normal" | "atencao" | "critica";

export interface Processo {
  ordem: number;
  proc: string;
  exerc: string;
  assunto: string;
  municipio: string;
  responsavel: string;
  movimentacao: string;
  providencia: string;
  tipo: TipoProvidencia;
  urgencia: UrgenciaProcesso;
}

export interface Relatorio {
  id?: string;
  data: string;
  total: number;
  arquivados: number;
  requerem_acao: number;
  visitar_mp: number;
  processos: Processo[];
  raw_text?: string;
  created_at?: string;
}

export type TipoDiario =
  | "PLENO_ACORDAO"
  | "PLENO_DECISAO"
  | "PLENO_PARECER_PREVIO"
  | "DESPACHO"
  | "CITACAO"
  | "FISCALIZACAO_AVISO"
  | "FISCALIZACAO_RESULTADO"
  | "PAUTA"
  | "OUTROS";

export interface MencaoDiario {
  tipo: TipoDiario;
  proc: string;
  natureza?: string;
  especie?: string;
  exercicio?: string;
  entidade?: string;
  responsaveis?: string[];
  relator?: string;
  prazo?: string;
  parecer_mp?: string;
  decisao?: string;
  descricao: string;
}

export interface MunicipioCruzado {
  nome: string;
  processos_dia: Processo[];
  mencoes_diario: MencaoDiario[];
  resumo_consolidado: string;
}

export interface Boletim {
  id?: string;
  data: string;
  relatorio_id?: string;
  municipios: MunicipioCruzado[];
  municipios_sem_processo: string[];
  total_municipios: number;
  diario_texto?: string;
  created_at?: string;
}
