import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { generateRelatorioMovimentacaoHTML } from "@/lib/printTemplate";
import { Processo } from "@/types";
import { gerarQRCodeDataUri, urlPublicaDia } from "@/lib/qrcode";

export async function POST(req: NextRequest) {
  try {
    const { data } = await req.json();
    if (!data) return NextResponse.json({ error: "data obrigatória" }, { status: 400 });

    const db = createServerClient();

    const { data: relatorio } = await db
      .from("relatorios")
      .select("processos")
      .eq("data", data)
      .single();

    const processos: Processo[] = relatorio?.processos ?? [];

    if (processos.length === 0) {
      return NextResponse.json({ error: "Nenhuma movimentação encontrada para esta data." }, { status: 404 });
    }

    let qrCodeDataUri: string | undefined;
    try {
      qrCodeDataUri = await gerarQRCodeDataUri(urlPublicaDia(data));
    } catch {
      qrCodeDataUri = undefined;
    }

    const html = generateRelatorioMovimentacaoHTML({ processos, data, qrCodeDataUri });

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="movimentacao_${data}.html"`,
      },
    });
  } catch (err) {
    console.error("Erro gerar-relatorio-movimentacao:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}