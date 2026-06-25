import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { generateCompletoHTML } from "@/lib/printTemplate";
import { montarMunicipiosCruzados } from "@/lib/montarBoletim";
import { gerarQRCodeDataUri, urlPublicaDia } from "@/lib/qrcode";

async function gerar(data: string, aviso?: string, assessoria_id?: string) {
  if (!data) return { error: "data obrigatória", status: 400 };

  const db = createServerClient();
  const municipios = await montarMunicipiosCruzados(db, data);

  if (municipios.length === 0) {
    return { error: "Nenhuma movimentação ou menção encontrada para esta data.", status: 404 };
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

  const html = generateCompletoHTML({ assessoria, municipios, data, aviso: aviso || undefined, qrCodeDataUri });
  return { html };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const data = searchParams.get("data") ?? "";
    const aviso = searchParams.get("aviso") ?? undefined;
    const assessoria_id = searchParams.get("assessoria_id") ?? undefined;

    const result = await gerar(data, aviso, assessoria_id);
    if ("error" in result) {
      return new NextResponse(`<p style="font-family:sans-serif;padding:2rem">${result.error}</p>`, {
        status: result.status,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    return new NextResponse(result.html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  } catch (err) {
    console.error("Erro gerar-completo (GET):", err);
    return new NextResponse(`<p style="font-family:sans-serif;padding:2rem">Erro: ${String(err)}</p>`, {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { data, aviso, assessoria_id } = await req.json();
    const result = await gerar(data, aviso, assessoria_id);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return new NextResponse(result.html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="boletim_completo_${data}.html"`,
      },
    });
  } catch (err) {
    console.error("Erro gerar-completo (POST):", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
