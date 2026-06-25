import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { generateBoletimHTML } from "@/lib/printTemplate";
import { montarMunicipiosCruzados } from "@/lib/montarBoletim";
import { gerarQRCodeDataUri, urlPublicaBoletim } from "@/lib/qrcode";

async function gerar(data: string, municipio_nome: string, aviso?: string, imagem_url?: string) {
  if (!data || !municipio_nome) {
    return { error: "data e municipio_nome obrigatórios", status: 400 };
  }

  const db = createServerClient();
  const municipios = await montarMunicipiosCruzados(db, data);

  const municipioData = municipios.find(
    (m) => m.nome.toUpperCase() === municipio_nome.toUpperCase()
  );

  if (!municipioData) {
    return { error: "Nenhuma informação encontrada para este município nesta data.", status: 404 };
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
  const nomeFinal = municipioCad?.nome ?? municipioData.nome;

  let qrCodeDataUri: string | undefined;
  try {
    qrCodeDataUri = await gerarQRCodeDataUri(urlPublicaBoletim(nomeFinal, data));
  } catch {
    qrCodeDataUri = undefined;
  }

  const html = generateBoletimHTML({
    assessoria,
    municipio: { ...municipioData, nome: nomeFinal },
    data,
    aviso: aviso || undefined,
    imagemUrl: imagem_url || undefined,
    brasaoUrl,
    gestorNome: gestorPrincipal?.nome,
    gestorCargo: gestorPrincipal?.cargo,
    qrCodeDataUri,
  });

  return { html };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const data = searchParams.get("data") ?? "";
    const municipio_nome = searchParams.get("municipio_nome") ?? "";
    const aviso = searchParams.get("aviso") ?? undefined;
    const imagem_url = searchParams.get("imagem_url") ?? undefined;

    const result = await gerar(data, municipio_nome, aviso, imagem_url);
    if ("error" in result) {
      return new NextResponse(`<p style="font-family:sans-serif;padding:2rem">${result.error}</p>`, {
        status: result.status,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    return new NextResponse(result.html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  } catch (err) {
    console.error("Erro gerar-pdf (GET):", err);
    return new NextResponse(`<p style="font-family:sans-serif;padding:2rem">Erro: ${String(err)}</p>`, {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { data, municipio_nome, aviso, imagem_url } = await req.json();
    const result = await gerar(data, municipio_nome, aviso, imagem_url);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return new NextResponse(result.html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="boletim_${municipio_nome}_${data}.html"`,
      },
    });
  } catch (err) {
    console.error("Erro gerar-pdf (POST):", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
