import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase";
import { SYSTEM_RELATORIO } from "@/lib/prompts";
import { Relatorio } from "@/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const text = formData.get("text") as string | null;
    const file = formData.get("file") as File | null;

    if (!text && !file) {
      return NextResponse.json({ error: "Forneça texto ou PDF." }, { status: 400 });
    }

    let content: Anthropic.MessageParam["content"];

    if (file) {
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      content = [
        {
          type: "text" as const,
          text: "Analise este documento de movimentações processuais e retorne o JSON conforme instruído.",
        },
        {
          type: "text" as const,
          text: `[PDF em base64: ${base64.substring(0, 100)}...]`,
        },
      ];
    } else {
      content = text!;
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SYSTEM_RELATORIO,
      messages: [{ role: "user", content }],
    });

    const raw = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as Anthropic.TextBlock).text)
      .join("");

    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed: Relatorio = JSON.parse(clean);
    parsed.raw_text = text || `[PDF: ${file?.name}]`;

    const db = createServerClient();
    const today = new Date().toISOString().split("T")[0];

    const { data: saved, error } = await db
      .from("relatorios")
      .upsert(
        {
          data: today,
          total: parsed.total,
          arquivados: parsed.arquivados,
          requerem_acao: parsed.requerem_acao,
          visitar_mp: parsed.visitar_mp,
          processos: parsed.processos,
          raw_text: parsed.raw_text,
        },
        { onConflict: "data" }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ...parsed, id: saved.id });
  } catch (err) {
    console.error("Erro analisar:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
