import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { generateBoletimHTML } from "@/lib/printTemplate";
import { MunicipioCruzado, Processo } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { data, municipio_nome, aviso, imagem_url } = await req.json();

    if (!data || !municipio_nome) {
      return NextResponse.json({ error: "data e municipio_nome obrigatórios" }, { status: 400 });
    }

    const db = createServerClient();

    // Fetch boletim
    const { data: boletim } = await db
      .from("boletins")
      .select("municipios")
      .eq("data", data)
      .single();

    // Fetch movimentação
    const { data: relatorio } = await db
      .from("relatorios")
      .select("processos")
      .eq("data", data)
      .single();

    const processosDia: Processo[] = relatorio?.processos ?? [];
    const municipios: MunicipioCruzado[] = boletim?.municipios ?? [];

    // Find this municipio
    const municipioData = municipios.find(
      (m) => m.nome.toLowerCase() === municipio_nome.toLowerCase()
    );

    if (!municipioData) {
      return NextResponse.json({ error: "Município não encontrado no boletim." }, { status: 404 });
    }

    // Inject processos if missing
    const municipioComProcessos: MunicipioCruzado = {
      ...municipioData,
      processos_dia: municipioData.processos_dia?.length
        ? municipioData.processos_dia
        : processosDia.filter((p) => p.municipio === municipioData.nome),
    };

    // Fetch assessoria via municipio cadastrado
    const { data: municipioCad } = await db
      .from("municipios")
      .select("*, assessorias(id, nome, cnpj, endereco, email, logo_url), brasao_url")
      .ilike("nome", municipio_nome)
      .single();

    const assessoria = municipioCad?.assessorias ?? { nome: "TCE-MA" };
    const brasaoUrl = municipioCad?.brasao_url;

    // Fetch gestor principal (prefeito)
    const { data: gestores } = await db
      .from("gestores")
      .select("nome, cargo")
      .eq("municipio_id", municipioCad?.id ?? "")
      .eq("cargo", "Prefeito")
      .limit(1);

    const gestorPrincipal = gestores?.[0];

    const html = generateBoletimHTML({
      assessoria,
      municipio: {
        ...municipioComProcessos,
        resumo_consolidado: municipioComProcessos.resumo_consolidado,
      },
      data,
      aviso: aviso || undefined,
      imagemUrl: imagem_url || undefined,
      brasaoUrl,
      gestorNome: gestorPrincipal?.nome,
      gestorCargo: gestorPrincipal?.cargo,
    });

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="boletim_${municipio_nome}_${data}.html"`,
      },
    });
  } catch (err) {
    console.error("Erro gerar-pdf:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
