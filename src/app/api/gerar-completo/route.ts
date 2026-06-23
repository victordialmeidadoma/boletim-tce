import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { generateCompletoHTML } from "@/lib/printTemplate";
import { montarMunicipiosCruzados } from "@/lib/montarBoletim";

export async function POST(req: NextRequest) {
  try {
    const { data, aviso, assessoria_id } = await req.json();

    if (!data) {
      return NextResponse.json({ error: "data obrigatória" }, { status: 400 });
    }

    const db = createServerClient();
    const municipios = await montarMunicipiosCruzados(db, data);

    if (municipios.length === 0) {
      return NextResponse.json({ error: "Nenhuma movimentação ou menção encontrada para esta data." }, { status: 404 });
    }

    let assessoria = { nome: "TCE-MA" };
    if (assessoria_id) {
      const { data: ass } = await db.from("assessorias").select("*").eq("id", assessoria_id).single();
      if (ass) assessoria = ass;
    } else {
      const { data: ass } = await db.from("assessorias").select("*").limit(1).single();
      if (ass) assessoria = ass;
    }

    const html = generateCompletoHTML({
      assessoria,
      municipios,
      data,
      aviso: aviso || undefined,
    });

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="boletim_completo_${data}.html"`,
      },
    });
  } catch (err) {
    console.error("Erro gerar-completo:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}