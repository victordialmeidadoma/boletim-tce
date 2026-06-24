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
  qrCodeDataUri?: string;
}

const TIPO_LABELS: Record<TipoDiario, string> = {
  PLENO_ACORDAO:               "Pleno — Acórdão",
  PLENO_DECISAO:               "Pleno — Decisão",
  PLENO_PARECER_PREVIO:        "Pleno — Parecer prévio",
  DESPACHO:                    "Despacho",
  CITACAO:                     "Citação",
  FISCALIZACAO_AVISO:          "Fiscalização — Aviso",
  FISCALIZACAO_RESULTADO:      "Fiscalização — Resultado",
  FISCALIZACAO_ACOMPANHAMENTO: "Fiscalização — Acompanhamento",
  FISCALIZACAO:                "Fiscalização",
  PAUTA:                       "Pauta",
  OUTROS:                      "Outros",
};

const TIPO_STYLE: Record<TipoDiario, { bg: string; color: string; border: string }> = {
  PLENO_ACORDAO:               { bg: "#F5F3FF", color: "#4C1D95", border: "#DDD6FE" },
  PLENO_DECISAO:               { bg: "#F5F3FF", color: "#4C1D95", border: "#DDD6FE" },
  PLENO_PARECER_PREVIO:        { bg: "#F5F3FF", color: "#4C1D95", border: "#DDD6FE" },
  DESPACHO:                    { bg: "#F0F9FF", color: "#0C4A6E", border: "#BAE6FD" },
  CITACAO:                     { bg: "#FFF1F2", color: "#881337", border: "#FECDD3" },
  FISCALIZACAO_AVISO:          { bg: "#FFFBEB", color: "#78350F", border: "#FDE68A" },
  FISCALIZACAO_RESULTADO:      { bg: "#FFFBEB", color: "#78350F", border: "#FDE68A" },
  FISCALIZACAO_ACOMPANHAMENTO: { bg: "#FFFBEB", color: "#78350F", border: "#FDE68A" },
  FISCALIZACAO:                { bg: "#FFFBEB", color: "#78350F", border: "#FDE68A" },
  PAUTA:                       { bg: "#F8FAFC", color: "#334155", border: "#CBD5E1" },
  OUTROS:                      { bg: "#F9FAFB", color: "#374151", border: "#E5E7EB" },
};

function field(label: string, value: string | undefined, warn = false): string {
  if (!value) return "";
  return `
    <tr>
      <td style="font-size:10px;color:#94A3B8;padding:3px 0;width:76px;vertical-align:top;font-family:'Inter',system-ui,sans-serif">${label}</td>
      <td style="font-size:11px;color:${warn ? "#92400E" : "#111827"};padding:3px 0;font-weight:${warn ? "600" : "400"};line-height:1.5;font-family:'Inter',system-ui,sans-serif">${value}</td>
    </tr>`;
}

function urgenciaStyle(urgencia?: string): { border: string; bg: string; badge?: string } {
  if (urgencia === "urgencia") return { border: "#FCA5A5", bg: "#FEF2F2", badge: "Urgência" };
  if (urgencia === "atencao")  return { border: "#FCD34D", bg: "#FFFBEB", badge: "Atenção" };
  return { border: "#E2E8F0", bg: "#FAFAFA" };
}

function renderMencao(m: MencaoDiario): string {
  const s = TIPO_STYLE[m.tipo] ?? TIPO_STYLE.OUTROS;
  const label = TIPO_LABELS[m.tipo] ?? m.tipo;
  const resps = m.responsaveis?.join("; ") ?? "";
  const u = urgenciaStyle(m.urgencia);
  return `
  <div style="border:1.5px solid ${u.border};border-radius:6px;overflow:hidden;margin-bottom:10px">
    <div style="display:flex;align-items:center;justify-content:space-between;background:${s.bg};border-bottom:0.5px solid ${s.border};padding:7px 12px">
      <span style="font-size:10px;font-weight:600;color:${s.color};text-transform:uppercase;letter-spacing:.05em;font-family:'Inter',system-ui,sans-serif">${label}</span>
      <div style="display:flex;align-items:center;gap:6px">
        ${u.badge ? `<span style="font-size:9px;font-weight:700;color:${u.border === "#FCA5A5" ? "#991B1B" : "#92400E"};background:#fff;border:0.5px solid ${u.border};border-radius:99px;padding:1px 7px;text-transform:uppercase;letter-spacing:.04em;font-family:'Inter',system-ui,sans-serif">${u.badge}</span>` : ""}
        ${m.proc ? `<span style="font-size:10px;font-family:monospace;color:${s.color};opacity:.7">${m.proc}</span>` : ""}
      </div>
    </div>
    <div style="padding:10px 12px;background:${u.bg}">
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
  const u = urgenciaStyle(p.urgencia);
  return `
  <div style="border:1.5px solid ${u.border};border-radius:6px;overflow:hidden;margin-bottom:12px">
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;border-bottom:0.5px solid #F1F5F9;background:#fff">
      <div style="padding:8px 12px;border-right:0.5px solid #F1F5F9">
        <div style="font-size:9px;color:#94A3B8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px;font-family:'Inter',system-ui,sans-serif">Processo</div>
        <div style="font-size:12px;color:#111;font-weight:500;font-family:monospace">${p.proc}</div>
      </div>
      <div style="padding:8px 12px;border-right:0.5px solid #F1F5F9">
        <div style="font-size:9px;color:#94A3B8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px;font-family:'Inter',system-ui,sans-serif">Exercício</div>
        <div style="font-size:12px;color:#111;font-weight:500;font-family:'Inter',system-ui,sans-serif">${p.exerc}</div>
      </div>
      <div style="padding:8px 12px">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-size:9px;color:#94A3B8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px;font-family:'Inter',system-ui,sans-serif">Assunto</div>
            <div style="font-size:12px;color:#111;font-weight:500;font-family:'Inter',system-ui,sans-serif">${p.assunto}</div>
          </div>
          ${u.badge ? `<span style="font-size:9px;font-weight:700;color:${u.border === "#FCA5A5" ? "#991B1B" : "#92400E"};background:${u.bg};border:0.5px solid ${u.border};border-radius:99px;padding:2px 8px;text-transform:uppercase;letter-spacing:.04em;font-family:'Inter',system-ui,sans-serif">${u.badge}</span>` : ""}
        </div>
      </div>
    </div>
    <div style="padding:10px 12px;background:${u.bg}">
      <div style="font-size:9px;color:#94A3B8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;font-family:'Inter',system-ui,sans-serif">Movimentação</div>
      <div style="font-size:12px;color:#374151;line-height:1.6;font-family:'Inter',system-ui,sans-serif">${p.movimentacao}</div>
      <div style="font-size:10px;color:#94A3B8;margin-top:6px;font-family:'Inter',system-ui,sans-serif">Resp.: ${p.responsavel}</div>
    </div>
  </div>`;
}

export function generateBoletimHTML(opts: PrintOptions): string {
  const { assessoria, municipio, data, aviso, imagemUrl, imagemLegenda, brasaoUrl, gestorNome, gestorCargo, qrCodeDataUri } = opts;
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
  <div style="padding-bottom:20px;margin-bottom:20px;border-bottom:1px solid #E2E8F0">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:20px">

      <!-- Esquerda: brasão pequeno + nome do município grande -->
      <div>
        ${brasaoUrl
          ? `<img src="${brasaoUrl}" style="width:34px;height:34px;object-fit:contain;border-radius:50%;margin-bottom:10px;display:block" alt="Brasão">`
          : `<div style="width:34px;height:34px;border-radius:50%;background:#F1F5F9;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:#64748B;border:0.5px solid #E2E8F0;font-family:'Inter',system-ui,sans-serif;margin-bottom:10px">${muniLabel.substring(0,2).toUpperCase()}</div>`
        }
        <p style="font-size:28px;font-weight:600;color:#111827;font-family:'Inter',system-ui,sans-serif;letter-spacing:-.02em;line-height:1.1">${muniLabel}</p>
        ${gestorNome ? `<p style="font-size:12px;color:#64748B;margin-top:6px;font-family:'Inter',system-ui,sans-serif">${gestorNome}${gestorCargo ? ` · ${gestorCargo}` : ""}</p>` : ""}
      </div>

      <!-- Direita: brasão + logo assessoria, data -->
      <div style="text-align:right;flex-shrink:0">
        <div style="display:flex;align-items:center;justify-content:flex-end;gap:10px;margin-bottom:10px">
          ${brasaoUrl
            ? `<img src="${brasaoUrl}" style="width:34px;height:34px;object-fit:contain;border-radius:50%" alt="Brasão">`
            : ""
          }
          ${assessoria.logo_url
            ? `<img src="${assessoria.logo_url}" style="width:34px;height:34px;object-fit:contain;border-radius:6px" alt="Logo">`
            : ""
          }
        </div>
        <p style="font-size:10px;color:#94A3B8;text-transform:uppercase;letter-spacing:.07em;font-family:'Inter',system-ui,sans-serif">Boletim informativo</p>
        <p style="font-size:11px;color:#64748B;margin-top:3px;font-family:'Inter',system-ui,sans-serif">${dataCapitalizada}</p>
      </div>

    </div>
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
  <div style="border-top:0.5px solid #E2E8F0;padding-top:10px;display:flex;justify-content:space-between;align-items:flex-end;gap:16px">
    <div style="text-align:left">
      <p style="font-size:10px;font-weight:600;color:#374151;font-family:'Inter',system-ui,sans-serif">${assessoria.nome}</p>
      ${assessoria.cnpj ? `<p style="font-size:9px;color:#94A3B8;margin-top:1px;font-family:'Inter',system-ui,sans-serif">CNPJ ${assessoria.cnpj}</p>` : ""}
      ${assessoria.endereco ? `<p style="font-size:9px;color:#94A3B8;font-family:'Inter',system-ui,sans-serif">${assessoria.endereco}</p>` : ""}
      ${assessoria.email ? `<p style="font-size:9px;color:#94A3B8;font-family:'Inter',system-ui,sans-serif">${assessoria.email}</p>` : ""}
    </div>
    <div style="display:flex;align-items:flex-end;gap:10px">
      <div style="text-align:right">
        <p style="font-size:9px;color:#94A3B8;font-family:'Inter',system-ui,sans-serif">Gerado em ${new Date().toLocaleDateString("pt-BR")}</p>
        <p style="font-size:9px;color:#94A3B8;margin-top:1px;font-family:'Inter',system-ui,sans-serif">TCE-MA · Boletim informativo</p>
        ${qrCodeDataUri ? `<p style="font-size:8px;color:#CBD5E1;margin-top:3px;font-family:'Inter',system-ui,sans-serif">Acesse pelo QR code</p>` : ""}
      </div>
      ${qrCodeDataUri ? `<img src="${qrCodeDataUri}" alt="QR code" style="width:52px;height:52px;flex-shrink:0">` : ""}
    </div>
  </div>

</div>
</body>
</html>`;
}


// ───────────────────────────────────────────────────────────
// Documento ÚNICO com TODOS os municípios (uso interno/equipe)
// ───────────────────────────────────────────────────────────

interface PrintCompletoOptions {
  assessoria: Assessoria;
  municipios: MunicipioCruzado[];
  data: string;
  aviso?: string;
}

function renderMuniBlocoCompleto(municipio: MunicipioCruzado): string {
  const muniLabel = municipio.nome.charAt(0) + municipio.nome.slice(1).toLowerCase();
  const hasProcs   = municipio.processos_dia.length > 0;
  const hasMencoes = municipio.mencoes_diario.length > 0;

  return `
  <div style="margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid #E2E8F0">
    <div style="background:#111827;color:#fff;padding:10px 16px;border-radius:6px;margin-bottom:14px">
      <p style="font-size:14px;font-weight:700;font-family:'Inter',system-ui,sans-serif;letter-spacing:-.01em">${muniLabel}</p>
    </div>

    ${hasProcs ? `
    <p style="font-size:9px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;padding-bottom:6px;border-bottom:0.5px solid #F1F5F9;font-family:'Inter',system-ui,sans-serif">Movimentação processual no TCE-MA</p>
    ${municipio.processos_dia.map(renderProcesso).join("")}` : ""}

    ${hasMencoes ? `
    <p style="font-size:9px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;padding-bottom:6px;border-bottom:0.5px solid #F1F5F9;${hasProcs ? "margin-top:18px;" : ""}font-family:'Inter',system-ui,sans-serif">Menções no Diário do TCE-MA</p>
    ${municipio.mencoes_diario.map(renderMencao).join("")}` : ""}

    ${municipio.resumo_consolidado ? `
    <div style="margin-top:14px;background:#EEF2FF;border-radius:6px;padding:10px 13px">
      <p style="font-size:9px;font-weight:700;color:#3730A3;text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px;font-family:'Inter',system-ui,sans-serif">Resumo</p>
      <p style="font-size:11px;color:#3730A3;line-height:1.6;font-family:'Inter',system-ui,sans-serif">${municipio.resumo_consolidado}</p>
    </div>` : ""}
  </div>`;
}

export function generateCompletoHTML(opts: PrintCompletoOptions): string {
  const { assessoria, municipios, data, aviso } = opts;
  const dataFormatada = formatDate(data, "EEEE, dd 'de' MMMM 'de' yyyy");
  const dataCapitalizada = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);
  const initials = assessoria.nome.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();

  const totalProcessos = municipios.reduce((acc, m) => acc + m.processos_dia.length, 0);
  const totalMencoes   = municipios.reduce((acc, m) => acc + m.mencoes_diario.length, 0);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Boletim Informativo Completo — ${data}</title>
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
  <div style="padding-bottom:16px;margin-bottom:20px;border-bottom:1px solid #E2E8F0;display:flex;align-items:center;justify-content:space-between;gap:16px">
    <div style="display:flex;align-items:center;gap:10px">
      ${assessoria.logo_url
        ? `<img src="${assessoria.logo_url}" style="width:28px;height:28px;object-fit:contain;border-radius:5px" alt="Logo">`
        : `<div style="width:28px;height:28px;border-radius:5px;background:#EEF2FF;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#3730A3;border:0.5px solid #C7D2FE;font-family:'Inter',system-ui,sans-serif">${initials}</div>`
      }
      <p style="font-size:13px;font-weight:600;color:#111827;font-family:'Inter',system-ui,sans-serif">${assessoria.nome}</p>
    </div>
    <div style="text-align:right;flex-shrink:0">
      <p style="font-size:10px;color:#94A3B8;text-transform:uppercase;letter-spacing:.07em;font-family:'Inter',system-ui,sans-serif">Boletim informativo completo</p>
      <p style="font-size:11px;color:#64748B;margin-top:3px;font-family:'Inter',system-ui,sans-serif">${dataCapitalizada}</p>
    </div>
  </div>

  <!-- RESUMO GERAL -->
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin:18px 0">
    <div style="background:#F8FAFC;border-radius:6px;padding:10px 12px;text-align:center">
      <p style="font-size:20px;font-weight:700;color:#111827;font-family:'Inter',system-ui,sans-serif">${municipios.length}</p>
      <p style="font-size:9px;color:#94A3B8;text-transform:uppercase;letter-spacing:.05em;font-family:'Inter',system-ui,sans-serif">Municípios</p>
    </div>
    <div style="background:#F8FAFC;border-radius:6px;padding:10px 12px;text-align:center">
      <p style="font-size:20px;font-weight:700;color:#111827;font-family:'Inter',system-ui,sans-serif">${totalProcessos}</p>
      <p style="font-size:9px;color:#94A3B8;text-transform:uppercase;letter-spacing:.05em;font-family:'Inter',system-ui,sans-serif">Processos</p>
    </div>
    <div style="background:#F8FAFC;border-radius:6px;padding:10px 12px;text-align:center">
      <p style="font-size:20px;font-weight:700;color:#111827;font-family:'Inter',system-ui,sans-serif">${totalMencoes}</p>
      <p style="font-size:9px;color:#94A3B8;text-transform:uppercase;letter-spacing:.05em;font-family:'Inter',system-ui,sans-serif">Menções no diário</p>
    </div>
  </div>

  ${aviso ? `
  <div style="background:#FFFBEB;border:0.5px solid #FCD34D;border-radius:6px;padding:11px 14px;margin-bottom:18px">
    <p style="font-size:9px;font-weight:700;color:#92400E;text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px;font-family:'Inter',system-ui,sans-serif">Instrução / aviso</p>
    <p style="font-size:12px;color:#78350F;line-height:1.65;font-family:'Inter',system-ui,sans-serif">${aviso}</p>
  </div>` : ""}

  <!-- CORPO: TODOS OS MUNICÍPIOS EM SEQUÊNCIA -->
  <div style="padding-top:6px">
    ${municipios.map(renderMuniBlocoCompleto).join("")}
  </div>

  <!-- RODAPÉ -->
  <div style="border-top:0.5px solid #E2E8F0;padding-top:10px;display:flex;justify-content:space-between;align-items:flex-start">
    <div style="text-align:left">
      <p style="font-size:10px;font-weight:600;color:#374151;font-family:'Inter',system-ui,sans-serif">${assessoria.nome}</p>
      ${assessoria.cnpj ? `<p style="font-size:9px;color:#94A3B8;margin-top:1px;font-family:'Inter',system-ui,sans-serif">CNPJ ${assessoria.cnpj}</p>` : ""}
      ${assessoria.endereco ? `<p style="font-size:9px;color:#94A3B8;font-family:'Inter',system-ui,sans-serif">${assessoria.endereco}</p>` : ""}
      ${assessoria.email ? `<p style="font-size:9px;color:#94A3B8;font-family:'Inter',system-ui,sans-serif">${assessoria.email}</p>` : ""}
    </div>
    <div style="text-align:right">
      <p style="font-size:9px;color:#94A3B8;font-family:'Inter',system-ui,sans-serif">Gerado em ${new Date().toLocaleDateString("pt-BR")}</p>
      <p style="font-size:9px;color:#94A3B8;margin-top:1px;font-family:'Inter',system-ui,sans-serif">TCE-MA · Documento interno — uso da equipe</p>
    </div>
  </div>

</div>
</body>
</html>`;
}


// ───────────────────────────────────────────────────────────
// Relatório SÓ de movimentação processual (sem diário) — para o chefe
// ───────────────────────────────────────────────────────────

interface PrintMovimentacaoOptions {
  assessoria: Assessoria;
  processos: Processo[];
  data: string;
}

export function generateRelatorioMovimentacaoHTML(opts: PrintMovimentacaoOptions): string {
  const { assessoria, processos, data } = opts;
  const dataFormatada = formatDate(data, "EEEE, dd 'de' MMMM 'de' yyyy");
  const dataCapitalizada = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);
  const initials = assessoria.nome.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();

  const arquivados    = processos.filter(p => p.tipo === "ARQUIVADO").length;
  const requeremAcao  = processos.filter(p => p.tipo !== "ARQUIVADO").length;
  const urgentes      = processos.filter(p => p.urgencia === "urgencia").length;
  const emAtencao     = processos.filter(p => p.urgencia === "atencao").length;

  // group by municipio
  const byMuni: Record<string, Processo[]> = {};
  for (const p of processos) {
    if (!byMuni[p.municipio]) byMuni[p.municipio] = [];
    byMuni[p.municipio].push(p);
  }
  const municipiosOrdenados = Object.entries(byMuni).sort(([, a], [, b]) => {
    const rank = (procs: Processo[]) => procs.some(p => p.urgencia === "urgencia") ? 0 : procs.some(p => p.urgencia === "atencao") ? 1 : 2;
    return rank(a) - rank(b);
  });

  const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Movimentação Processual — ${data}</title>
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
  a { text-decoration: none; }
</style>
</head>
<body>
<button class="print-btn no-print" onclick="window.print()">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
  Imprimir / Salvar PDF
</button>

<div class="page">

  <!-- CABEÇALHO -->
  <div style="padding-bottom:16px;margin-bottom:20px;border-bottom:1px solid #E2E8F0;display:flex;align-items:center;justify-content:space-between;gap:16px">
    <div style="display:flex;align-items:center;gap:10px">
      ${assessoria.logo_url
        ? `<img src="${assessoria.logo_url}" style="width:32px;height:32px;object-fit:contain;border-radius:6px" alt="Logo">`
        : `<div style="width:32px;height:32px;border-radius:6px;background:#EEF2FF;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#3730A3;border:0.5px solid #C7D2FE;font-family:'Inter',system-ui,sans-serif">${initials}</div>`
      }
      <div>
        <p style="font-size:14px;font-weight:600;color:#111827;font-family:'Inter',system-ui,sans-serif">${assessoria.nome}</p>
        <p style="font-size:10px;color:#94A3B8;text-transform:uppercase;letter-spacing:.06em;font-family:'Inter',system-ui,sans-serif;margin-top:1px">Movimentação processual</p>
      </div>
    </div>
    <p style="font-size:11px;color:#64748B;font-family:'Inter',system-ui,sans-serif;flex-shrink:0">${dataCapitalizada}</p>
  </div>

  <!-- RESUMO -->
  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:20px">
    <div style="background:#F8FAFC;border-radius:8px;padding:12px 8px;text-align:center;border:0.5px solid #F1F5F9">
      <p style="font-size:22px;font-weight:700;color:#111827;font-family:'Inter',system-ui,sans-serif;line-height:1">${processos.length}</p>
      <p style="font-size:8.5px;color:#94A3B8;text-transform:uppercase;letter-spacing:.04em;font-family:'Inter',system-ui,sans-serif;margin-top:3px">Processos</p>
    </div>
    <div style="background:#F8FAFC;border-radius:8px;padding:12px 8px;text-align:center;border:0.5px solid #F1F5F9">
      <p style="font-size:22px;font-weight:700;color:#64748B;font-family:'Inter',system-ui,sans-serif;line-height:1">${arquivados}</p>
      <p style="font-size:8.5px;color:#94A3B8;text-transform:uppercase;letter-spacing:.04em;font-family:'Inter',system-ui,sans-serif;margin-top:3px">Arquivados</p>
    </div>
    <div style="background:#EFF6FF;border-radius:8px;padding:12px 8px;text-align:center;border:0.5px solid #DBEAFE">
      <p style="font-size:22px;font-weight:700;color:#1D4ED8;font-family:'Inter',system-ui,sans-serif;line-height:1">${requeremAcao}</p>
      <p style="font-size:8.5px;color:#1D4ED8;text-transform:uppercase;letter-spacing:.04em;font-family:'Inter',system-ui,sans-serif;margin-top:3px">Requerem ação</p>
    </div>
    <div style="background:#FFFBEB;border-radius:8px;padding:12px 8px;text-align:center;border:0.5px solid #FDE68A">
      <p style="font-size:22px;font-weight:700;color:#92400E;font-family:'Inter',system-ui,sans-serif;line-height:1">${emAtencao}</p>
      <p style="font-size:8.5px;color:#92400E;text-transform:uppercase;letter-spacing:.04em;font-family:'Inter',system-ui,sans-serif;margin-top:3px">Atenção</p>
    </div>
    <div style="background:#FEF2F2;border-radius:8px;padding:12px 8px;text-align:center;border:0.5px solid #FCA5A5">
      <p style="font-size:22px;font-weight:700;color:#991B1B;font-family:'Inter',system-ui,sans-serif;line-height:1">${urgentes}</p>
      <p style="font-size:8.5px;color:#991B1B;text-transform:uppercase;letter-spacing:.04em;font-family:'Inter',system-ui,sans-serif;margin-top:3px">Urgência</p>
    </div>
  </div>

  <!-- ÍNDICE -->
  <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:22px">
    ${municipiosOrdenados.map(([muni, procs]) => {
      const hasUrgencia = procs.some(p => p.urgencia === "urgencia");
      const hasAtencao  = procs.some(p => p.urgencia === "atencao");
      const dotColor = hasUrgencia ? "#EF4444" : hasAtencao ? "#F59E0B" : "#CBD5E1";
      const muniLabel = muni.charAt(0) + muni.slice(1).toLowerCase();
      return `<a href="#${slug(muni)}" style="display:inline-flex;align-items:center;gap:5px;background:#F8FAFC;border:0.5px solid #E2E8F0;border-radius:99px;padding:4px 10px;font-size:10px;color:#374151;font-family:'Inter',system-ui,sans-serif">
        <span style="width:6px;height:6px;border-radius:50%;background:${dotColor};display:inline-block;flex-shrink:0"></span>
        ${muniLabel} (${procs.length})
      </a>`;
    }).join("")}
  </div>

  <!-- CORPO -->
  <div>
    ${municipiosOrdenados.map(([muni, procs]) => {
      const muniLabel = muni.charAt(0) + muni.slice(1).toLowerCase();
      const hasUrgencia = procs.some(p => p.urgencia === "urgencia");
      const hasAtencao  = procs.some(p => p.urgencia === "atencao");
      const barColor = hasUrgencia ? "#991B1B" : hasAtencao ? "#92400E" : "#111827";
      return `
      <div id="${slug(muni)}" style="margin-bottom:22px">
        <div style="background:${barColor};color:#fff;padding:9px 14px;border-radius:6px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between">
          <p style="font-size:13px;font-weight:700;font-family:'Inter',system-ui,sans-serif;letter-spacing:-.01em">${muniLabel}</p>
          <p style="font-size:10px;opacity:.75;font-family:'Inter',system-ui,sans-serif">${procs.length} processo${procs.length > 1 ? "s" : ""}</p>
        </div>
        ${procs.map(renderProcesso).join("")}
      </div>`;
    }).join("")}
  </div>

  <!-- RODAPÉ -->
  <div style="border-top:0.5px solid #E2E8F0;padding-top:10px;display:flex;justify-content:space-between;align-items:flex-start">
    <div style="text-align:left">
      <p style="font-size:10px;font-weight:600;color:#374151;font-family:'Inter',system-ui,sans-serif">${assessoria.nome}</p>
      ${assessoria.cnpj ? `<p style="font-size:9px;color:#94A3B8;margin-top:1px;font-family:'Inter',system-ui,sans-serif">CNPJ ${assessoria.cnpj}</p>` : ""}
      ${assessoria.endereco ? `<p style="font-size:9px;color:#94A3B8;font-family:'Inter',system-ui,sans-serif">${assessoria.endereco}</p>` : ""}
    </div>
    <div style="text-align:right">
      <p style="font-size:9px;color:#94A3B8;font-family:'Inter',system-ui,sans-serif">Gerado em ${new Date().toLocaleDateString("pt-BR")}</p>
      <p style="font-size:9px;color:#94A3B8;margin-top:1px;font-family:'Inter',system-ui,sans-serif">TCE-MA · Movimentação processual</p>
    </div>
  </div>

</div>
</body>
</html>`;
}

// ───────────────────────────────────────────────────────────
// Relatório SÓ do Diário (sem movimentação) — para o chefe
// ───────────────────────────────────────────────────────────

interface MencaoComMunicipio extends MencaoDiario {
  municipio: string;
}

interface PrintDiarioOptions {
  assessoria: Assessoria;
  mencoes: MencaoComMunicipio[];
  data: string;
}

export function generateRelatorioDiarioHTML(opts: PrintDiarioOptions): string {
  const { assessoria, mencoes, data } = opts;
  const dataFormatada = formatDate(data, "EEEE, dd 'de' MMMM 'de' yyyy");
  const dataCapitalizada = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);
  const initials = assessoria.nome.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();

  const byMuni: Record<string, MencaoComMunicipio[]> = {};
  for (const m of mencoes) {
    if (!byMuni[m.municipio]) byMuni[m.municipio] = [];
    byMuni[m.municipio].push(m);
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Diário do TCE-MA — ${data}</title>
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
  <div style="padding-bottom:16px;margin-bottom:20px;border-bottom:1px solid #E2E8F0;display:flex;align-items:center;justify-content:space-between;gap:16px">
    <div style="display:flex;align-items:center;gap:10px">
      ${assessoria.logo_url
        ? `<img src="${assessoria.logo_url}" style="width:28px;height:28px;object-fit:contain;border-radius:5px" alt="Logo">`
        : `<div style="width:28px;height:28px;border-radius:5px;background:#EEF2FF;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#3730A3;border:0.5px solid #C7D2FE;font-family:'Inter',system-ui,sans-serif">${initials}</div>`
      }
      <p style="font-size:13px;font-weight:600;color:#111827;font-family:'Inter',system-ui,sans-serif">${assessoria.nome}</p>
    </div>
    <div style="text-align:right;flex-shrink:0">
      <p style="font-size:10px;color:#94A3B8;text-transform:uppercase;letter-spacing:.07em;font-family:'Inter',system-ui,sans-serif">Diário do TCE-MA</p>
      <p style="font-size:11px;color:#64748B;margin-top:3px;font-family:'Inter',system-ui,sans-serif">${dataCapitalizada}</p>
    </div>
  </div>

  <!-- RESUMO -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:18px 0">
    <div style="background:#F8FAFC;border-radius:6px;padding:10px 12px;text-align:center">
      <p style="font-size:20px;font-weight:700;color:#111827;font-family:'Inter',system-ui,sans-serif">${mencoes.length}</p>
      <p style="font-size:9px;color:#94A3B8;text-transform:uppercase;letter-spacing:.05em;font-family:'Inter',system-ui,sans-serif">Menções</p>
    </div>
    <div style="background:#F8FAFC;border-radius:6px;padding:10px 12px;text-align:center">
      <p style="font-size:20px;font-weight:700;color:#111827;font-family:'Inter',system-ui,sans-serif">${Object.keys(byMuni).length}</p>
      <p style="font-size:9px;color:#94A3B8;text-transform:uppercase;letter-spacing:.05em;font-family:'Inter',system-ui,sans-serif">Municípios</p>
    </div>
  </div>

  <!-- CORPO -->
  <div style="padding-top:6px">
    ${Object.entries(byMuni).map(([muni, mens]) => {
      const muniLabel = muni.charAt(0) + muni.slice(1).toLowerCase();
      return `
      <div style="margin-bottom:20px">
        <div style="background:#111827;color:#fff;padding:9px 14px;border-radius:6px;margin-bottom:10px">
          <p style="font-size:13px;font-weight:700;font-family:'Inter',system-ui,sans-serif;letter-spacing:-.01em">${muniLabel}</p>
        </div>
        ${mens.map(renderMencao).join("")}
      </div>`;
    }).join("")}
  </div>

  <!-- RODAPÉ -->
  <div style="border-top:0.5px solid #E2E8F0;padding-top:10px;display:flex;justify-content:space-between;align-items:flex-start">
    <div style="text-align:left">
      <p style="font-size:10px;font-weight:600;color:#374151;font-family:'Inter',system-ui,sans-serif">${assessoria.nome}</p>
      ${assessoria.cnpj ? `<p style="font-size:9px;color:#94A3B8;margin-top:1px;font-family:'Inter',system-ui,sans-serif">CNPJ ${assessoria.cnpj}</p>` : ""}
      ${assessoria.endereco ? `<p style="font-size:9px;color:#94A3B8;font-family:'Inter',system-ui,sans-serif">${assessoria.endereco}</p>` : ""}
    </div>
    <div style="text-align:right">
      <p style="font-size:9px;color:#94A3B8;font-family:'Inter',system-ui,sans-serif">Gerado em ${new Date().toLocaleDateString("pt-BR")}</p>
      <p style="font-size:9px;color:#94A3B8;margin-top:1px;font-family:'Inter',system-ui,sans-serif">TCE-MA · Diário</p>
    </div>
  </div>

</div>
</body>
</html>`;
}