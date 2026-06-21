import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const text = formData.get("text") as string | null;

    if (!text) {
      return NextResponse.json({ error: "Forneça o texto das movimentações." }, { status: 400 });
    }

    const today = new Date().toISOString().split("T")[0];
    const db = createServerClient();

    const { data: saved, error } = await db
      .from("relatorios")
      .upsert(
        {
          data: today,
          total: 0,
          arquivados: 0,
          requerem_acao: 0,
          visitar_mp: 0,
          processos: [],
          raw_text: text,
        },
        { onConflict: "data" }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      id: saved.id,
      data: today,
      total: 0,
      arquivados: 0,
      requerem_acao: 0,
      visitar_mp: 0,
      processos: [],
    });
  } catch (err) {
    console.error("Erro analisar:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
