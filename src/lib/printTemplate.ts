import { MunicipioCruzado, MencaoDiario, TipoDiario, Processo } from "@/types";
import { formatDate } from "@/lib/utils";

interface Assessoria {
  nome: string;
  cnpj?: string;
  endereco?: string;
  email?: string;
  logo_url?: string;
}

interface PrintOptions {
  assessoria: Assessoria;
  municipio: MunicipioCruzado;
  data: string;
  aviso?: string;
  imagemUrl?: string;
  imagemLegenda?: string;
  brasaoUrl?: string;
  gestorNome?: string;
  gestorCargo?: string;
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

function field(label: string, value: string | undefined, warn = false): string {
  if (!value) return "";
  return `
    <tr>
      <td style="font-size:10px;color:#94A3B8;padding:3px 0;width:76px;vertical-align:top;font-family:'Inter',system-ui,sans-serif">${label}</td>
      <td style="font-size:11px;color:${warn ? "#92400E" : "#111827"};padding:3px 0;font-weight:${warn ? "600" : "400"};line-height:1.5;font-family:'Inter',system-ui,sans-serif">${value}</td>
    </tr>`;
}

function renderMencao(m: MencaoDiario): string {
  const s = TIPO_STYLE[m.tipo] ?? TIPO_STYLE.OUTROS;
  const label = TIPO_LABELS[m.tipo] ?? m.tipo;
  const resps = m.responsaveis?.join("; ") ?? "";
  return `
  <div style="border:0.5px solid #E2E8F0;border-radius:6px;overflow:hidden;margin-bottom:10px">
    <div style="display:flex;align-items:center;justify-content:space-between;background:${s.bg};border-bottom:0.5px solid ${s.border};padding:7px 12px">
      <span style="font-size:10px;font-weight:600;color:${s.color};text-transform:uppercase;letter-spacing:.05em;font-family:'Inter',system-ui,sans-serif">${label}</span>
      ${m.proc ? `<span style="font-size:10px;font-family:monospace;color:${s.color};opacity:.7">${m.proc}</span>` : ""}
    </div>
    <div style="padding:10px 12px;background:#fff">
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
        <div style="margin-top:8px;padding-top:8px;border-top:0.5px solid #F1F5F9">
          <p style="font-size:9px;color:#94A3B8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px;font-family:'Inter',system-ui,sans-serif">Dispositivo</p>
          <p style="font-size:11px;color:#111827;line-height:1.6;font-family:'Inter',system-ui,sans-serif">${m.decisao}</p>
        </div>` : ""}
      ${m.descricao && !m.decisao ? `
        <div style="margin-top:8px;padding-top:8px;border-top:0.5px solid #F1F5F9">
          <p style="font-size:11px;color:#374151;line-height:1.6;font-family:'Inter',system-ui,sans-serif">${m.descricao}</p>
        </div>` : ""}
    </div>
  </div>`;
}

function renderProcesso(p: Processo): string {
  return `
  <div style="border:0.5px solid #E2E8F0;border-radius:6px;overflow:hidden;margin-bottom:12px">
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;border-bottom:0.5px solid #F1F5F9">
      <div style="padding:8px 12px;border-right:0.5px solid #F1F5F9">
        <div style="font-size:9px;color:#94A3B8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px;font-family:'Inter',system-ui,sans-serif">Processo</div>
        <div style="font-size:12px;color:#111;font-weight:500;font-family:monospace">${p.proc}</div>
      </div>
      <div style="padding:8px 12px;border-right:0.5px solid #F1F5F9">
        <div style="font-size:9px;color:#94A3B8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px;font-family:'Inter',system-ui,sans-serif">Exercício</div>
        <div style="font-size:12px;color:#111;font-weight:500;font-family:'Inter',system-ui,sans-serif">${p.exerc}</div>
      </div>
      <div style="padding:8px 12px">
        <div style="font-size:9px;color:#94A3B8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px;font-family:'Inter',system-ui,sans-serif">Assunto</div>
        <div style="font-size:12px;color:#111;font-weight:500;font-family:'Inter',system-ui,sans-serif">${p.assunto}</div>
      </div>
    </div>
    <div style="padding:10px 12px;background:#FAFAFA">
      <div style="font-size:9px;color:#94A3B8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;font-family:'Inter',system-ui,sans-serif">Movimentação</div>
      <div style="font-size:12px;color:#374151;line-height:1.6;font-family:'Inter',system-ui,sans-serif">${p.movimentacao}</div>
      <div style="font-size:10px;color:#94A3B8;margin-top:6px;font-family:'Inter',system-ui,sans-serif">Resp.: ${p.responsavel}</div>
    </div>
  </div>`;
}

export function generateBoletimHTML(opts: PrintOptions): string {
  const { assessoria, municipio, data, aviso, imagemUrl, imagemLegenda, brasaoUrl, gestorNome, gestorCargo } = opts;
  const dataFormatada = formatDate(data, "EEEE, dd 'de' MMMM 'de' yyyy");
  const dataCapitalizada = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);
  const initials = assessoria.nome.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();
  const muniLabel = municipio.nome.charAt(0) + municipio.nome.slice(1).toLowerCase();

  const hasProcs = municipio.processos_dia.length > 0;
  const hasMencoes = municipio.mencoes_diario.length > 0;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Boletim Informativo — ${muniLabel} — ${data}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', system-ui, sans-serif; font-size: 12px; color: #111827; background: #fff; }
  @page { size: A4; margin: 16mm 16mm 14mm; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none !important; }
  }
  .page { max-width: 720px; margin: 0 auto; }
  .print-btn { position: fixed; bottom: 24px; right: 24px; background: #111827; color: #fff; border: none; border-radius: 8px; padding: 10px 20px; font-size: 13px; font-weight: 500; cursor: pointer; font-family: 'Inter', system-ui, sans-serif; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(0,0,0,.15); }
  .print-btn:hover { background: #374151; }
</style>
</head>
<body>
<button class="print-btn no-print" onclick="window.print()">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
  Imprimir / Salvar PDF
</button>

<div class="page">

  <!-- CABEÇALHO -->
  <div style="border-bottom:2px solid #111827;padding-bottom:16px;margin-bottom:0">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px">
      <div style="display:flex;align-items:center;gap:14px">
        ${assessoria.logo_url
          ? `<img src="${assessoria.logo_url}" style="width:52px;height:52px;object-fit:contain;border-radius:8px" alt="Logo">`
          : `<div style="width:52px;height:52px;border-radius:8px;background:#EEF2FF;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;color:#3730A3;border:0.5px solid #C7D2FE;font-family:'Inter',system-ui,sans-serif">${initials}</div>`
        }
        <div style="width:0.5px;height:52px;background:#E2E8F0;flex-shrink:0"></div>
        ${brasaoUrl
          ? `<img src="${brasaoUrl}" style="width:52px;height:52px;object-fit:contain;border-radius:50%" alt="Brasão">`
          : `<div style="width:52px;height:52px;border-radius:50%;background:#F1F5F9;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:#64748B;border:0.5px solid #E2E8F0;font-family:'Inter',system-ui,sans-serif">${muniLabel.substring(0,2).toUpperCase()}</div>`
        }
        <div>
          <p style="font-size:15px;font-weight:700;color:#111827;font-family:'Inter',system-ui,sans-serif;letter-spacing:-.01em">${assessoria.nome}</p>
          ${assessoria.cnpj ? `<p style="font-size:10px;color:#64748B;margin-top:2px;font-family:'Inter',system-ui,sans-serif">CNPJ ${assessoria.cnpj}</p>` : ""}
          ${assessoria.endereco ? `<p style="font-size:10px;color:#64748B;font-family:'Inter',system-ui,sans-serif">${assessoria.endereco}</p>` : ""}
        </div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <p style="font-size:10px;font-weight:700;color:#4338CA;text-transform:uppercase;letter-spacing:.08em;font-family:'Inter',system-ui,sans-serif">Boletim informativo</p>
        <p style="font-size:11px;color:#64748B;margin-top:4px;font-family:'Inter',system-ui,sans-serif">${dataCapitalizada}</p>
      </div>
    </div>
  </div>

  <!-- BANNER MUNICÍPIO + GESTOR -->
  <div style="background:#111827;color:#fff;padding:12px 18px;display:flex;align-items:center;justify-content:space-between">
    <div>
      <p style="font-size:15px;font-weight:700;font-family:'Inter',system-ui,sans-serif;letter-spacing:-.01em">${muniLabel}</p>
      ${gestorNome ? `<p style="font-size:11px;opacity:.6;margin-top:2px;font-family:'Inter',system-ui,sans-serif">${gestorNome}</p>` : ""}
    </div>
    ${gestorCargo ? `<p style="font-size:11px;opacity:.5;font-family:'Inter',system-ui,sans-serif">${gestorCargo}</p>` : ""}
  </div>

  <!-- CORPO -->
  <div style="padding:18px 0">

    ${aviso ? `
    <div style="background:#FFFBEB;border:0.5px solid #FCD34D;border-radius:6px;padding:11px 14px;margin-bottom:18px">
      <p style="font-size:9px;font-weight:700;color:#92400E;text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px;font-family:'Inter',system-ui,sans-serif">Instrução / aviso</p>
      <p style="font-size:12px;color:#78350F;line-height:1.65;font-family:'Inter',system-ui,sans-serif">${aviso}</p>
    </div>` : ""}

    ${imagemUrl ? `
    <div style="margin-bottom:18px;border:0.5px solid #E2E8F0;border-radius:6px;overflow:hidden">
      <img src="${imagemUrl}" style="width:100%;display:block" alt="Imagem do comunicado">
      ${imagemLegenda ? `<p style="font-size:10px;color:#64748B;padding:7px 12px;text-align:center;border-top:0.5px solid #E2E8F0;font-style:italic;font-family:'Inter',system-ui,sans-serif">${imagemLegenda}</p>` : ""}
    </div>` : ""}

    ${hasProcs ? `
    <p style="font-size:9px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;padding-bottom:6px;border-bottom:0.5px solid #F1F5F9;font-family:'Inter',system-ui,sans-serif">Movimentação processual no TCE-MA</p>
    ${municipio.processos_dia.map(renderProcesso).join("")}` : ""}

    ${hasMencoes ? `
    <p style="font-size:9px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;padding-bottom:6px;border-bottom:0.5px solid #F1F5F9;${hasProcs ? "margin-top:20px;" : ""}font-family:'Inter',system-ui,sans-serif">Menções no Diário do TCE-MA</p>
    ${municipio.mencoes_diario.map(renderMencao).join("")}` : ""}

    ${municipio.resumo_consolidado ? `
    <div style="margin-top:18px;background:#EEF2FF;border-radius:6px;padding:12px 14px">
      <p style="font-size:9px;font-weight:700;color:#3730A3;text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px;font-family:'Inter',system-ui,sans-serif">Resumo</p>
      <p style="font-size:11px;color:#3730A3;line-height:1.65;font-family:'Inter',system-ui,sans-serif">${municipio.resumo_consolidado}</p>
    </div>` : ""}

  </div>

  <!-- RODAPÉ -->
  <div style="border-top:0.5px solid #E2E8F0;padding-top:8px;display:flex;justify-content:space-between;align-items:center">
    <span style="font-size:9px;color:#94A3B8;font-family:'Inter',system-ui,sans-serif">${assessoria.nome} · Gerado em ${new Date().toLocaleDateString("pt-BR")}</span>
    <span style="font-size:9px;color:#94A3B8;font-family:'Inter',system-ui,sans-serif">TCE-MA · Boletim informativo</span>
  </div>

</div>
</body>
</html>`;
}
