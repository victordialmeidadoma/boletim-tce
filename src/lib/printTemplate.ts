import { MunicipioCruzado, MencaoDiario, TipoDiario, Processo } from "@/types";
import { formatDate } from "@/lib/utils";

interface Assessoria {
  nome: string;
  cnpj?: string;
  endereco?: string;
  email?: string;
  telefone?: string;
  logo_url?: string;
}

interface PrintOptions {
  assessoria: Assessoria;
  municipio: MunicipioCruzado;
  data: string;
  aviso?: string;
  imagemUrl?: string;
  imagemLegenda?: string;
}

const TIPO_LABELS: Record<TipoDiario, string> = {
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

const TIPO_STYLE: Record<TipoDiario, { bg: string; color: string; border: string }> = {
  PLENO_ACORDAO:          { bg: "#F5F3FF", color: "#4C1D95", border: "#DDD6FE" },
  PLENO_DECISAO:          { bg: "#F5F3FF", color: "#4C1D95", border: "#DDD6FE" },
  PLENO_PARECER_PREVIO:   { bg: "#F5F3FF", color: "#4C1D95", border: "#DDD6FE" },
  DESPACHO:               { bg: "#F0F9FF", color: "#0C4A6E", border: "#BAE6FD" },
  CITACAO:                { bg: "#FFF1F2", color: "#881337", border: "#FECDD3" },
  FISCALIZACAO_AVISO:     { bg: "#FFFBEB", color: "#78350F", border: "#FDE68A" },
  FISCALIZACAO_RESULTADO: { bg: "#FFFBEB", color: "#78350F", border: "#FDE68A" },
  PAUTA:                  { bg: "#F8FAFC", color: "#334155", border: "#CBD5E1" },
  OUTROS:                 { bg: "#F9FAFB", color: "#374151", border: "#E5E7EB" },
};

const BADGE_STYLE: Record<string, string> = {
  ARQUIVADO:              "background:#F3F4F6;color:#6B7280;border:0.5px solid #D1D5DB",
  FAZER_MANIFESTACAO:     "background:#FFFBEB;color:#92400E;border:0.5px solid #FCD34D",
  RECURSO_RECONSIDERACAO: "background:#EEF2FF;color:#3730A3;border:0.5px solid #C7D2FE",
  VISITAR_MP:             "background:#ECFDF5;color:#065F46;border:0.5px solid #6EE7B7",
  OUTROS:                 "background:#F3F4F6;color:#6B7280;border:0.5px solid #D1D5DB",
};
const BADGE_LABELS: Record<string, string> = {
  ARQUIVADO:              "Arquivado",
  FAZER_MANIFESTACAO:     "Fazer manifestação",
  RECURSO_RECONSIDERACAO: "Recurso de reconsideração",
  VISITAR_MP:             "Visitar MP de Contas",
  OUTROS:                 "Outros",
};

function field(label: string, value: string | undefined, warn = false): string {
  if (!value) return "";
  return `
    <tr>
      <td style="font-size:10px;color:#6B7280;padding:3px 0;width:72px;vertical-align:top">${label}</td>
      <td style="font-size:11px;color:${warn ? "#92400E" : "#111827"};padding:3px 0;font-weight:${warn ? "700" : "400"};line-height:1.45">${value}</td>
    </tr>`;
}

function renderMencao(m: MencaoDiario): string {
  const s = TIPO_STYLE[m.tipo] ?? TIPO_STYLE.OUTROS;
  const label = TIPO_LABELS[m.tipo] ?? m.tipo;
  const resps = m.responsaveis?.join("; ") ?? "";
  return `
  <div style="border:0.5px solid #E5E7EB;border-radius:5px;overflow:hidden;margin-bottom:10px">
    <div style="background:${s.bg};border-bottom:0.5px solid ${s.border};padding:7px 11px;display:flex;align-items:center;justify-content:space-between">
      <span style="font-size:11px;font-weight:700;color:${s.color};text-transform:uppercase;letter-spacing:.04em">${label}</span>
      ${m.proc ? `<span style="font-size:10px;font-family:monospace;color:${s.color};opacity:.7">${m.proc}</span>` : ""}
    </div>
    <div style="padding:10px 11px;background:#fff">
      <table style="width:100%;border-collapse:collapse">
        ${field("Entidade", m.entidade)}
        ${m.natureza ? field("Natureza", `${m.natureza}${m.especie ? ` — ${m.especie}` : ""}`) : ""}
        ${field("Exercício", m.exercicio)}
        ${resps ? field(resps.includes(";") ? "Responsáveis" : "Responsável", resps) : ""}
        ${field("Relator", m.relator)}
        ${field("Prazo", m.prazo, true)}
        ${field("Parecer MP", m.parecer_mp)}
      </table>
      ${m.decisao ? `
        <div style="margin-top:8px;padding-top:8px;border-top:0.5px solid #F3F4F6">
          <p style="font-size:9px;color:#9CA3AF;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">Dispositivo</p>
          <p style="font-size:11px;color:#111827;line-height:1.55">${m.decisao}</p>
        </div>` : ""}
      ${m.descricao && !m.decisao ? `
        <div style="margin-top:8px;padding-top:8px;border-top:0.5px solid #F3F4F6">
          <p style="font-size:11px;color:#374151;line-height:1.55">${m.descricao}</p>
        </div>` : ""}
    </div>
  </div>`;
}

function renderProcesso(p: Processo): string {
  const bStyle = BADGE_STYLE[p.tipo] ?? BADGE_STYLE.OUTROS;
  const bLabel = BADGE_LABELS[p.tipo] ?? p.tipo;
  const urgColor = p.urgencia === "critica" ? "#EF4444" : p.urgencia === "atencao" ? "#F59E0B" : "#D1D5DB";
  const hasAction = p.tipo !== "ARQUIVADO" && p.providencia;
  return `
  <div style="border:0.5px solid #E5E7EB;border-radius:5px;padding:11px 13px;margin-bottom:10px;border-left:3px solid ${urgColor}">
    <div style="display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-bottom:5px">
      <span style="font-size:10px;font-family:monospace;color:#6B7280;background:#F9FAFB;padding:1px 6px;border-radius:3px">${p.proc}</span>
      <span style="font-size:10px;color:#9CA3AF">Exerc. ${p.exerc}</span>
      <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;${bStyle}">${bLabel}</span>
    </div>
    <p style="font-size:13px;font-weight:700;color:#111827;margin-bottom:4px;font-family:Georgia,serif">${p.municipio} — ${p.assunto}</p>
    <p style="font-size:11px;color:#4B5563;line-height:1.55">${p.movimentacao}</p>
    ${hasAction ? `<p style="font-size:11px;color:#111827;font-weight:700;margin-top:6px">→ ${p.providencia}</p>` : ""}
    <p style="font-size:10px;color:#9CA3AF;margin-top:5px">Resp.: ${p.responsavel}</p>
  </div>`;
}

export function generateBoletimHTML(opts: PrintOptions): string {
  const { assessoria, municipio, data, aviso, imagemUrl, imagemLegenda } = opts;
  const dataFormatada = formatDate(data, "EEEE, dd 'de' MMMM 'de' yyyy");
  const dataCapitalizada = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);
  const initials = assessoria.nome.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

  const hasProcs = municipio.processos_dia.length > 0;
  const hasMencoes = municipio.mencoes_diario.length > 0;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Boletim Informativo — ${municipio.nome} — ${data}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, 'Times New Roman', serif; font-size: 12px; color: #111827; background: #fff; }
  @page { size: A4; margin: 18mm 16mm 16mm; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  .page { max-width: 720px; margin: 0 auto; padding: 0; }
</style>
</head>
<body>
<div class="page">

  <div style="border-bottom:2px solid #111827;padding-bottom:14px;margin-bottom:0">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px">
      <div style="display:flex;align-items:center;gap:12px">
        ${assessoria.logo_url
          ? `<img src="${assessoria.logo_url}" style="width:52px;height:52px;object-fit:contain;border-radius:6px" alt="Logo">`
          : `<div style="width:52px;height:52px;border-radius:6px;background:#EEF2FF;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#4338CA;border:0.5px solid #C7D2FE">${initials}</div>`
        }
        <div>
          <p style="font-size:16px;font-weight:700;color:#111827;font-family:Georgia,serif">${assessoria.nome}</p>
          ${assessoria.cnpj ? `<p style="font-size:10px;color:#6B7280;margin-top:2px">CNPJ ${assessoria.cnpj}</p>` : ""}
          ${assessoria.endereco ? `<p style="font-size:10px;color:#6B7280">${assessoria.endereco}</p>` : ""}
          ${assessoria.email ? `<p style="font-size:10px;color:#6B7280">${assessoria.email}</p>` : ""}
        </div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <p style="font-size:10px;font-weight:700;color:#4338CA;text-transform:uppercase;letter-spacing:.08em">Boletim informativo</p>
        <p style="font-size:11px;color:#6B7280;margin-top:3px">${dataCapitalizada}</p>
      </div>
    </div>
  </div>

  <div style="background:#111827;color:#fff;padding:11px 16px;margin-top:0">
    <p style="font-size:14px;font-weight:700;font-family:Georgia,serif">${municipio.nome.charAt(0) + municipio.nome.slice(1).toLowerCase()}</p>
    ${municipio.processos_dia[0]?.responsavel
      ? `<p style="font-size:10px;opacity:.65;margin-top:2px">Gestor responsável: ${municipio.processos_dia[0].responsavel}</p>`
      : ""}
  </div>

  <div style="padding:16px 0">

    ${aviso ? `
    <div style="background:#FFFBEB;border:0.5px solid #FCD34D;border-radius:5px;padding:11px 13px;margin-bottom:16px">
      <p style="font-size:9px;font-weight:700;color:#92400E;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">Instrução / aviso</p>
      <p style="font-size:12px;color:#78350F;line-height:1.6">${aviso}</p>
    </div>` : ""}

    ${imagemUrl ? `
    <div style="margin-bottom:16px;border:0.5px solid #E5E7EB;border-radius:5px;overflow:hidden">
      <img src="${imagemUrl}" style="width:100%;display:block" alt="Imagem do comunicado">
      ${imagemLegenda ? `<p style="font-size:10px;color:#6B7280;padding:7px 11px;text-align:center;border-top:0.5px solid #E5E7EB;font-style:italic">${imagemLegenda}</p>` : ""}
    </div>` : ""}

    ${hasProcs ? `
    <p style="font-size:10px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px;padding-bottom:5px;border-bottom:0.5px solid #E5E7EB">Movimentação processual no TCE-MA</p>
    ${municipio.processos_dia.map(renderProcesso).join("")}` : ""}

    ${hasMencoes ? `
    <p style="font-size:10px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px;padding-bottom:5px;border-bottom:0.5px solid #E5E7EB;${hasProcs ? "margin-top:18px" : ""}">Menções no Diário do TCE-MA</p>
    ${municipio.mencoes_diario.map(renderMencao).join("")}` : ""}

    ${municipio.resumo_consolidado ? `
    <div style="margin-top:16px;background:#EEF2FF;border-radius:5px;padding:11px 13px">
      <p style="font-size:9px;font-weight:700;color:#3730A3;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">Resumo</p>
      <p style="font-size:11px;color:#3730A3;line-height:1.6">${municipio.resumo_consolidado}</p>
    </div>` : ""}

  </div>

  <div style="border-top:0.5px solid #E5E7EB;padding-top:8px;display:flex;justify-content:space-between;align-items:center">
    <span style="font-size:9px;color:#9CA3AF">${assessoria.nome} · Gerado em ${new Date().toLocaleDateString("pt-BR")}</span>
    <span style="font-size:9px;color:#9CA3AF">TCE-MA · Boletim informativo</span>
  </div>

</div>
</body>
</html>`;
}
