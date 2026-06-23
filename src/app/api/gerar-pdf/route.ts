import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { generateBoletimHTML } from "@/lib/printTemplate";
import { montarMunicipiosCruzados } from "@/lib/montarBoletim";

export async function POST(req: NextRequest) {
  try {
    const { data, municipio_nome, aviso, imagem_url } = await req.json();

    if (!data || !municipio_nome) {
      return NextResponse.json({ error: "data e municipio_nome obrigatórios" }, { status: 400 });
    }

    const db = createServerClient();
    const municipios = await montarMunicipiosCruzados(db, data);

    const municipioData = municipios.find(
      (m) => m.nome.toUpperCase() === municipio_nome.toUpperCase()
    );

    if (!municipioData) {
      return NextResponse.json({ error: "Nenhuma informação encontrada para este município nesta data." }, { status: 404 });
    }

    const { data: municipioCad } = await db
      .from("municipios")
      .select("*, assessorias(id, nome, cnpj, endereco, email, logo_url)")
      .ilike("nome", municipio_nome)
      .single();

    const assessoria = municipioCad?.assessorias ?? { nome: "TCE-MA" };
    const brasaoUrl = municipioCad?.brasao_url;

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
        ...municipioData,
        nome: municipioCad?.nome ?? municipioData.nome,
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