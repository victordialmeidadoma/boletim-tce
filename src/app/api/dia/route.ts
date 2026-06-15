import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const data = searchParams.get("data");

  if (!data) return NextResponse.json({ error: "data param required" }, { status: 400 });

  const db = createServerClient();

  const { data: relatorio } = await db
    .from("relatorios")
    .select("*")
    .eq("data", data)
    .single();

  const { data: boletim } = await db
    .from("boletins")
    .select("*")
    .eq("data", data)
    .single();

  return NextResponse.json({ relatorio, boletim });
}
