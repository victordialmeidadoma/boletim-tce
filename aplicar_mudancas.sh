#!/bin/bash
set -e
echo "Aplicando mudanças no projeto Boletim TCE-MA..."

mkdir -p src/app/api/diario-manual
mkdir -p src/app/api/gerar-relatorio-movimentacao
mkdir -p src/app/api/gerar-relatorio-diario
mkdir -p src/app/dashboard/diario-manual

# ─────────────────────────────────────────────
# 1. API: diario-manual (CRUD de menções manuais)
# ─────────────────────────────────────────────
cat > src/app/api/diario-manual/route.ts << 'EOF'
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const data = searchParams.get("data");
  const db = createServerClient();

  let query = db.from("mencoes_diario_manual").select("*").order("created_at");
  if (data) query = query.eq("data", data);

  const { data: rows, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const db = createServerClient();
  const body = await req.json();
  const { data, error } = await db.from("mencoes_diario_manual").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const db = createServerClient();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { error } = await db.from("mencoes_diario_manual").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
EOF
echo "✓ api/diario-manual/route.ts"

# ─────────────────────────────────────────────
# 2. API: gerar-relatorio-movimentacao
# ─────────────────────────────────────────────
cat > src/app/api/gerar-relatorio-movimentacao/route.ts << 'EOF'
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { generateRelatorioMovimentacaoHTML } from "@/lib/printTemplate";
import { Processo } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { data, assessoria_id } = await req.json();
    if (!data) return NextResponse.json({ error: "data obrigatória" }, { status: 400 });

    const db = createServerClient();

    const { data: relatorio } = await db
      .from("relatorios")
      .select("processos")
      .eq("data", data)
      .single();

    const processos: Processo[] = relatorio?.processos ?? [];

    if (processos.length === 0) {
      return NextResponse.json({ error: "Nenhuma movimentação encontrada para esta data." }, { status: 404 });
    }

    let assessoria = { nome: "TCE-MA" };
    if (assessoria_id) {
      const { data: ass } = await db.from("assessorias").select("*").eq("id", assessoria_id).single();
      if (ass) assessoria = ass;
    } else {
      const { data: ass } = await db.from("assessorias").select("*").limit(1).single();
      if (ass) assessoria = ass;
    }

    const html = generateRelatorioMovimentacaoHTML({ assessoria, processos, data });

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="movimentacao_${data}.html"`,
      },
    });
  } catch (err) {
    console.error("Erro gerar-relatorio-movimentacao:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
EOF
echo "✓ api/gerar-relatorio-movimentacao/route.ts"

# ─────────────────────────────────────────────
# 3. API: gerar-relatorio-diario
# ─────────────────────────────────────────────
cat > src/app/api/gerar-relatorio-diario/route.ts << 'EOF'
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { generateRelatorioDiarioHTML } from "@/lib/printTemplate";

export async function POST(req: NextRequest) {
  try {
    const { data, assessoria_id } = await req.json();
    if (!data) return NextResponse.json({ error: "data obrigatória" }, { status: 400 });

    const db = createServerClient();

    const { data: rows } = await db
      .from("mencoes_diario_manual")
      .select("*")
      .eq("data", data);

    const mencoes = (rows ?? []).map((r) => ({
      tipo: r.tipo,
      proc: r.proc,
      natureza: r.natureza,
      especie: r.especie,
      exercicio: r.exercicio,
      entidade: r.entidade,
      responsaveis: r.responsaveis,
      relator: r.relator,
      prazo: r.prazo,
      parecer_mp: r.parecer_mp,
      decisao: r.decisao,
      descricao: r.descricao,
      municipio: r.municipio,
    }));

    if (mencoes.length === 0) {
      return NextResponse.json({ error: "Nenhuma menção encontrada para esta data." }, { status: 404 });
    }

    let assessoria = { nome: "TCE-MA" };
    if (assessoria_id) {
      const { data: ass } = await db.from("assessorias").select("*").eq("id", assessoria_id).single();
      if (ass) assessoria = ass;
    } else {
      const { data: ass } = await db.from("assessorias").select("*").limit(1).single();
      if (ass) assessoria = ass;
    }

    const html = generateRelatorioDiarioHTML({ assessoria, mencoes, data });

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="diario_${data}.html"`,
      },
    });
  } catch (err) {
    console.error("Erro gerar-relatorio-diario:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
EOF
echo "✓ api/gerar-relatorio-diario/route.ts"

# ─────────────────────────────────────────────
# 4. Sidebar atualizada
# ─────────────────────────────────────────────
cat > src/components/layout/Sidebar.tsx << 'EOF'
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scale, FileText, Newspaper, History, Building2, Users, BookOpen, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

const navDiario = [
  { href: "/dashboard",               label: "Movimentação processual", icon: FileText  },
  { href: "/dashboard/diario-manual", label: "Diário do TCE-MA",        icon: BookOpen  },
  { href: "/dashboard/boletim",       label: "Boletim informativo",     icon: Newspaper },
  { href: "/historico",               label: "Histórico",               icon: History   },
];

const navCadastro = [
  { href: "/cadastro/assessorias", label: "Assessorias", icon: Briefcase },
  { href: "/cadastro/municipios",  label: "Municípios",  icon: Building2 },
  { href: "/cadastro/gestores",    label: "Gestores",    icon: Users     },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 flex-shrink-0 flex flex-col border-r border-ink-100 bg-white min-h-screen">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-ink-100">
        <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0">
          <Scale className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink-900 leading-none">TCE-MA</p>
          <p className="text-xs text-ink-400 mt-0.5">Boletim informativo</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-xs text-ink-300 px-3 pb-1 pt-1">Diário</p>
        {navDiario.map(({ href, label, icon: Icon }) => (
          <NavItem key={href} href={href} label={label} icon={Icon} active={pathname === href} />
        ))}
        <p className="text-xs text-ink-300 px-3 pb-1 pt-3">Cadastros</p>
        {navCadastro.map(({ href, label, icon: Icon }) => (
          <NavItem key={href} href={href} label={label} icon={Icon} active={pathname === href} />
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-ink-100">
        <p className="text-xs text-ink-400">TCE-MA · Boletim informativo</p>
      </div>
    </aside>
  );
}

function NavItem({ href, label, icon: Icon, active }: {
  href: string; label: string; icon: React.ElementType; active: boolean;
}) {
  return (
    <Link href={href} className={cn(
      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
      active ? "bg-brand-50 text-brand-700 font-medium" : "text-ink-500 hover:text-ink-800 hover:bg-ink-50"
    )}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      {label}
    </Link>
  );
}
EOF
echo "✓ components/layout/Sidebar.tsx"

echo ""
echo "Parte 1 concluída. Agora rode a parte 2 (cole o próximo bloco)."
