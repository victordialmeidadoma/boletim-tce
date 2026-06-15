import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET() {
  try {
    const db = createServerClient();

    const { data: relatorios, error: r1 } = await db
      .from("relatorios")
      .select("id, data, total, arquivados, requerem_acao, visitar_mp, created_at")
      .order("data", { ascending: false })
      .limit(30);

    const { data: boletins, error: r2 } = await db
      .from("boletins")
      .select("id, data, total_municipios, created_at")
      .order("data", { ascending: false })
      .limit(30);

    if (r1 || r2) throw r1 || r2;

    // Merge by date
    const byDate: Record<string, { relatorio?: (typeof relatorios)[0]; boletim?: (typeof boletins)[0] }> = {};

    for (const r of relatorios || []) {
      byDate[r.data] = { ...byDate[r.data], relatorio: r };
    }
    for (const b of boletins || []) {
      byDate[b.data] = { ...byDate[b.data], boletim: b };
    }

    const entries = Object.entries(byDate)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([data, v]) => ({ data, ...v }));

    return NextResponse.json(entries);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
