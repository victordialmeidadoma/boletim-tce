import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase";
import { SYSTEM_BOLETIM } from "@/lib/prompts";
import { Boletim, Relatorio } from "@/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { diarioTexto } = await req.json();
    if (!diarioTexto) {
      return NextResponse.json({ error: "Forneça o texto do diário." }, { status: 400 });
    }

    const db = createServerClient();
    const today = new Date().toISOString().split("T")[0];

    // Fetch today's relatorio
    const { data: relatorio } = await db
      .from("relatorios")
      .select("*")
      .eq("data", today)
      .single();

    const contexto = relatorio
      ? `PROCESSOS QUE MOVIMENTARAM HOJE:\n${JSON.stringify((relatorio as Relatorio).processos, null, 2)}`
      : "Nenhum relatório matinal disponível. Use apenas as menções do diário.";

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SYSTEM_BOLETIM,
      messages: [
        {
          role: "user",
          content: `${contexto}\n\nMENÇÕES DO DIÁRIO DO TCE-MA HOJE:\n${diarioTexto}\n\nGere o boletim vespertino.`,
        },
      ],
    });

    const raw = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as Anthropic.TextBlock).text)
      .join("");

    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed: Boletim = JSON.parse(clean);

    const { data: saved, error } = await db
      .from("boletins")
      .upsert(
        {
          data: today,
          movimentacao_id: relatorio?.id ?? null,
          municipios: parsed.municipios,
          municipios_sem_processo: parsed.municipios_sem_processo,
          total_municipios: parsed.total_municipios,
          diario_texto: diarioTexto,
        },
        { onConflict: "data" }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ...parsed, id: saved.id });
  } catch (err) {
    console.error("Erro boletim:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
