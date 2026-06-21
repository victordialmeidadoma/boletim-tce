import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { generateCompletoHTML } from "@/lib/printTemplate";
import { MunicipioCruzado, Processo } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { data, aviso, assessoria_id } = await req.json();

    if (!data) {
      return NextResponse.json({ error: "data obrigatória" }, { status: 400 });
    }

    const db = createServerClient();

    const { data: boletim } = await db
      .from("boletins")
      .select("municipios")
      .eq("data", data)
      .single();

    const { data: relatorio } = await db
      .from("relatorios")
      .select("processos")
      .eq("data", data)
      .single();

    const processosDia: Processo[] = relatorio?.processos ?? [];
    const municipios: MunicipioCruzado[] = (boletim?.municipios ?? []).map((m: MunicipioCruzado) => ({
      ...m,
      processos_dia: m.processos_dia?.length
        ? m.processos_dia
        : processosDia.filter((p) => p.municipio === m.nome),
    }));

    if (municipios.length === 0) {
      return NextResponse.json({ error: "Nenhum município encontrado no boletim." }, { status: 404 });
    }

    let assessoria = { nome: "TCE-MA" };
    if (assessoria_id) {
      const { data: ass } = await db.from("assessorias").select("*").eq("id", assessoria_id).single();
      if (ass) assessoria = ass;
    } else {
      // fallback: usa a primeira assessoria cadastrada
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
