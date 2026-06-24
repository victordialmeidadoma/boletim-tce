import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { montarMunicipiosCruzados } from "@/lib/montarBoletim";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const data = searchParams.get("data");

  if (!data) {
    return NextResponse.json({ error: "data obrigatória" }, { status: 400 });
  }

  const db = createServerClient();
  const municipios = await montarMunicipiosCruzados(db, data);

  if (municipios.length === 0) {
    return NextResponse.json({ error: "Nenhuma informação encontrada." }, { status: 404 });
  }

  return NextResponse.json({ data, municipios });
}
