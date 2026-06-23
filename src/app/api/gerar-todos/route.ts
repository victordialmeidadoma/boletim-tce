import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { generateBoletimHTML } from "@/lib/printTemplate";
import { montarMunicipiosCruzados } from "@/lib/montarBoletim";

export async function POST(req: NextRequest) {
  try {
    const { data, assessoria_id, aviso, imagem_url, imagem_legenda } = await req.json();

    if (!data) return NextResponse.json({ error: "data obrigatória" }, { status: 400 });

    const db = createServerClient();
    const municipios = await montarMunicipiosCruzados(db, data);

    if (municipios.length === 0) {
      return NextResponse.json({ error: "Nenhuma movimentação ou menção encontrada para esta data." }, { status: 404 });
    }

    let assessoriaDefault = { nome: "TCE-MA" };
    if (assessoria_id) {
      const { data: ass } = await db.from("assessorias").select("*").eq("id", assessoria_id).single();
      if (ass) assessoriaDefault = ass;
    }

    const htmlFiles: { nome: string; html: string }[] = [];

    for (const m of municipios) {
      // Busca assessoria e brasão específicos deste município cadastrado
      const { data: municipioCad } = await db
        .from("municipios")
        .select("*, assessorias(id, nome, cnpj, endereco, email, logo_url)")
        .ilike("nome", m.nome)
        .single();

      const assessoria = municipioCad?.assessorias ?? assessoriaDefault;
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
        municipio: { ...m, nome: municipioCad?.nome ?? m.nome },
        data,
        aviso: aviso || undefined,
        imagemUrl: imagem_url || undefined,
        imagemLegenda: imagem_legenda || undefined,
        brasaoUrl,
        gestorNome: gestorPrincipal?.nome,
        gestorCargo: gestorPrincipal?.cargo,
      });

      const nomeArquivo = m.nome
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "_");

      htmlFiles.push({ nome: `boletim_${nomeArquivo}_${data}.html`, html });
    }

    const files = htmlFiles.map((f) => ({
      nome: f.nome,
      conteudo: Buffer.from(f.html, "utf-8").toString("base64"),
    }));

    return NextResponse.json({
      total: files.length,
      data,
      municipios: municipios.map((m) => m.nome),
      files,
    });
  } catch (err) {
    console.error("Erro gerar-todos:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}