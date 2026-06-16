import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { Boletim } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { municipios, municipios_sem_processo } = body;

    const db = createServerClient();
    const today = new Date().toISOString().split("T")[0];

    const { data: relatorio } = await db
      .from("relatorios")
      .select("id")
      .eq("data", today)
      .single();

    const { data: saved, error } = await db
      .from("boletins")
      .upsert(
        {
          data: today,
          relatorio_id: relatorio?.id ?? null,
          municipios: municipios ?? [],
          municipios_sem_processo: municipios_sem_processo ?? [],
          total_municipios: (municipios ?? []).length,
        },
        { onConflict: "data" }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ...saved });
  } catch (err) {
    console.error("Erro boletim:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
