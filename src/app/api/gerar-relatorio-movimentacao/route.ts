import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { generateRelatorioMovimentacaoHTML } from "@/lib/printTemplate";
import { Processo } from "@/types";
import { gerarQRCodeDataUri, urlPublicaDia } from "@/lib/qrcode";

async function gerar(data: string) {
  if (!data) return { error: "data obrigatória", status: 400 };

  const db = createServerClient();
  const { data: relatorio } = await db
    .from("relatorios")
    .select("processos")
    .eq("data", data)
    .single();

  const processos: Processo[] = relatorio?.processos ?? [];

  if (processos.length === 0) {
    return { error: "Nenhuma movimentação encontrada para esta data.", status: 404 };
  }

  let qrCodeDataUri: string | undefined;
  try {
    qrCodeDataUri = await gerarQRCodeDataUri(urlPublicaDia(data));
  } catch {
    qrCodeDataUri = undefined;
  }

  const html = generateRelatorioMovimentacaoHTML({ processos, data, qrCodeDataUri });
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
    console.error("Erro gerar-relatorio-movimentacao (GET):", err);
    return new NextResponse(`<p style="font-family:sans-serif;padding:2rem">Erro: ${String(err)}</p>`, {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { data } = await req.json();
    const result = await gerar(data);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return new NextResponse(result.html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="movimentacao_${data}.html"`,
      },
    });
  } catch (err) {
    console.error("Erro gerar-relatorio-movimentacao (POST):", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
