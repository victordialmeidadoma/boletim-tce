import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { montarMunicipiosCruzados } from "@/lib/montarBoletim";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const municipio = searchParams.get("municipio");
  const data = searchParams.get("data");

  if (!municipio || !data) {
    return NextResponse.json({ error: "municipio e data obrigatórios" }, { status: 400 });
  }

  const db = createServerClient();
  const municipios = await montarMunicipiosCruzados(db, data);
  const municipioData = municipios.find(
    (m) => m.nome.toUpperCase() === municipio.toUpperCase()
  );

  if (!municipioData) {
    return NextResponse.json({ error: "Nenhuma informação encontrada." }, { status: 404 });
  }

  return NextResponse.json(municipioData);
}