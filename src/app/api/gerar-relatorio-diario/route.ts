import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { generateRelatorioDiarioHTML } from "@/lib/printTemplate";
import { gerarQRCodeDataUri, urlPublicaDia } from "@/lib/qrcode";

async function gerar(data: string, assessoria_id?: string) {
  if (!data) return { error: "data obrigatória", status: 400 };

  const db = createServerClient();
  const { data: rows } = await db
    .from("mencoes_diario_manual")
    .select("*")
    .eq("data", data);

  const mencoes = (rows ?? []).map((r) => ({
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
    municipio: r.municipio,
    urgencia: r.urgencia ?? "normal",
  }));

  if (mencoes.length === 0) {
    return { error: "Nenhuma menção encontrada para esta data.", status: 404 };
  }

  let assessoria = { nome: "TCE-MA" };
  if (assessoria_id) {
    const { data: ass } = await db.from("assessorias").select("*").eq("id", assessoria_id).single();
    if (ass) assessoria = ass;
  } else {
    const { data: ass } = await db.from("assessorias").select("*").limit(1).single();
    if (ass) assessoria = ass;
  }

  let qrCodeDataUri: string | undefined;
  try {
    qrCodeDataUri = await gerarQRCodeDataUri(urlPublicaDia(data));
  } catch {
    qrCodeDataUri = undefined;
  }

  const html = generateRelatorioDiarioHTML({ assessoria, mencoes, data, qrCodeDataUri });
  return { html };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const data = searchParams.get("data") ?? "";
    const result = await gerar(data);

    if ("error" in result) {
      return new NextResponse(`<p style="font-family:sans-serif;padding:2rem">${result.error}</p>`, {
        status: result.status,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    return new NextResponse(result.html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  } catch (err) {
    console.error("Erro gerar-relatorio-diario (GET):", err);
    return new NextResponse(`<p style="font-family:sans-serif;padding:2rem">Erro: ${String(err)}</p>`, {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { data, assessoria_id } = await req.json();
    const result = await gerar(data, assessoria_id);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return new NextResponse(result.html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="diario_${data}.html"`,
      },
    });
  } catch (err) {
    console.error("Erro gerar-relatorio-diario (POST):", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
