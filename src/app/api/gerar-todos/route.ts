import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { generateBoletimHTML } from "@/lib/printTemplate";
import { MunicipioCruzado, Processo } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { data, assessoria_id, aviso, imagem_url, imagem_legenda } = await req.json();

    if (!data) return NextResponse.json({ error: "data obrigatória" }, { status: 400 });

    const db = createServerClient();

    // Fetch boletim do dia
    const { data: boletim, error: bErr } = await db
      .from("boletins")
      .select("*")
      .eq("data", data)
      .single();

    if (bErr || !boletim) {
      return NextResponse.json({ error: "Boletim não encontrado para esta data." }, { status: 404 });
    }

    // Fetch movimentações do dia
    const { data: relatorio } = await db
      .from("relatorios")
      .select("processos")
      .eq("data", data)
      .single();

    const processosDia: Processo[] = relatorio?.processos ?? [];

    // Fetch assessoria
    let assessoria = { nome: "TCE-MA", cnpj: "", endereco: "", email: "", logo_url: "" };
    if (assessoria_id) {
      const { data: ass } = await db
        .from("assessorias")
        .select("*")
        .eq("id", assessoria_id)
        .single();
      if (ass) assessoria = ass;
    }

    const municipios: MunicipioCruzado[] = boletim.municipios ?? [];

    // Gera um HTML por município
    const htmlFiles: { nome: string; html: string }[] = municipios.map((m) => {
      // Injeta processos_dia do relatorio caso estejam vazios no boletim
      const municipioComProcessos: MunicipioCruzado = {
        ...m,
        processos_dia: m.processos_dia?.length
          ? m.processos_dia
          : processosDia.filter((p) => p.municipio === m.nome),
      };

      const html = generateBoletimHTML({
        assessoria,
        municipio: municipioComProcessos,
        data,
        aviso: aviso || undefined,
        imagemUrl: imagem_url || undefined,
        imagemLegenda: imagem_legenda || undefined,
      });

      const nomeArquivo = m.nome
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "_");

      return { nome: `boletim_${nomeArquivo}_${data}.html`, html };
    });

    if (htmlFiles.length === 0) {
      return NextResponse.json({ error: "Nenhum município encontrado no boletim." }, { status: 404 });
    }

    // Return as JSON with base64-encoded HTMLs — client zips them
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
