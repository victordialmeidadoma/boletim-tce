import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { generateRelatorioDiarioHTML } from "@/lib/printTemplate";
import { gerarQRCodeDataUri, urlPublicaDia } from "@/lib/qrcode";

export async function POST(req: NextRequest) {
  try {
    const { data, assessoria_id } = await req.json();
    if (!data) return NextResponse.json({ error: "data obrigatória" }, { status: 400 });

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
      return NextResponse.json({ error: "Nenhuma menção encontrada para esta data." }, { status: 404 });
    }

    let assessoria = { nome: "TCE-MA" };
    if (assessoria_id) {
      const { data: ass } = await db.from("assessorias").select("*").eq("id", assessoria_id).single();
      if (ass) assessoria = ass;
    } else {
      const { data: ass } = await db.from("assessorias").select("*").limit(1).single();
      if (ass) assessoria = ass;
    }

    const html = generateRelatorioDiarioHTML({ assessoria, mencoes, data, qrCodeDataUri: await (async () => {
      try { return await gerarQRCodeDataUri(urlPublicaDia(data)); } catch { return undefined; }
    })() });

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="diario_${data}.html"`,
      },
    });
  } catch (err) {
    console.error("Erro gerar-relatorio-diario:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}