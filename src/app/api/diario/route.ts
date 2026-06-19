import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { PROMPT_DIARIO } from "@/lib/geminiPrompts";
import { PublicacaoDiario } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Envie o PDF do diário." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY não configurada." }, { status: 500 });
    }

    // Convert PDF to base64
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    // Call Gemini API directly (no SDK needed)
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: "application/pdf",
                    data: base64,
                  },
                },
                { text: PROMPT_DIARIO },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      throw new Error(`Gemini error: ${err}`);
    }

    const geminiData = await geminiRes.json();
    const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    const today = parsed.data ?? new Date().toISOString().split("T")[0];
    const publicacoes: PublicacaoDiario[] = parsed.publicacoes ?? [];

    // Save to Supabase - upsert by data+proc+tipo
    const db = createServerClient();

    // Delete existing for this date first to avoid duplicates
    await db.from("publicacoes_diario").delete().eq("data", today);

    // Insert all
    const rows = publicacoes.map((p) => ({
      data:            today,
      tipo:            p.tipo,
      proc:            p.proc ?? null,
      natureza:        p.natureza ?? null,
      especie:         p.especie ?? null,
      exercicio:       p.exercicio ?? null,
      entidade:        p.entidade ?? null,
      municipio:       p.municipio ?? null,
      responsaveis:    p.responsaveis ?? [],
      relator:         p.relator ?? null,
      prazo:           p.prazo ?? null,
      parecer_mp:      p.parecer_mp ?? null,
      decisao:         p.decisao ?? null,
      descricao:       p.descricao ?? null,
      texto_original:  p.texto_original ?? null,
    }));

    const { error } = await db.from("publicacoes_diario").insert(rows);
    if (error) throw error;

    // Auto-generate boletim
    await gerarBoletimAutomatico(db, today, publicacoes);

    return NextResponse.json({
      ok: true,
      data: today,
      total: publicacoes.length,
      municipios: [...new Set(publicacoes.map(p => p.municipio).filter(Boolean))],
    });
  } catch (err) {
    console.error("Erro processar diário:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

async function gerarBoletimAutomatico(db: ReturnType<typeof createServerClient>, today: string, publicacoes: PublicacaoDiario[]) {
  // Fetch municipios cadastrados
  const { data: municipiosCad } = await db.from("municipios").select("id, nome");
  const { data: relatorio }     = await db.from("relatorios").select("processos").eq("data", today).single();
  const processosDia            = relatorio?.processos ?? [];

  // Group by municipio
  const byMuni: Record<string, PublicacaoDiario[]> = {};
  for (const pub of publicacoes) {
    if (!pub.municipio) continue;
    if (!byMuni[pub.municipio]) byMuni[pub.municipio] = [];
    byMuni[pub.municipio].push(pub);
  }

  // Build municipios array for boletim
  const municipiosBoletim = Object.entries(byMuni).map(([nome, pubs]) => ({
    nome,
    processos_dia: processosDia.filter((p: { municipio: string }) =>
      p.municipio?.toUpperCase() === nome.toUpperCase()
    ),
    mencoes_diario: pubs.map(p => ({
      tipo:         p.tipo,
      proc:         p.proc,
      natureza:     p.natureza,
      especie:      p.especie,
      exercicio:    p.exercicio,
      entidade:     p.entidade,
      responsaveis: p.responsaveis,
      relator:      p.relator,
      prazo:        p.prazo,
      parecer_mp:   p.parecer_mp,
      decisao:      p.decisao,
      descricao:    p.descricao,
    })),
    resumo_consolidado: "",
  }));

  const municipiosSemProcesso = municipiosBoletim
    .filter(m => m.processos_dia.length === 0)
    .map(m => m.nome);

  await db.from("boletins").upsert({
    data:                    today,
    municipios:              municipiosBoletim,
    municipios_sem_processo: municipiosSemProcesso,
    total_municipios:        municipiosBoletim.length,
  }, { onConflict: "data" });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const data             = searchParams.get("data");
  const municipio        = searchParams.get("municipio");
  const proc             = searchParams.get("proc");

  const db = createServerClient();
  let query = db
    .from("publicacoes_diario")
    .select("*")
    .order("tipo")
    .order("proc");

  if (data)       query = query.eq("data", data);
  if (municipio)  query = query.ilike("municipio", `%${municipio}%`);
  if (proc)       query = query.ilike("proc", `%${proc}%`);

  const { data: rows, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(rows);
}
