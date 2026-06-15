# Boletim Informativo TCE-MA

Sistema de acompanhamento processual com dois módulos diários:
- **Movimentação processual**: importação e análise das movimentações do TCE-MA
- **Boletim informativo**: cruzamento com menções do Diário do TCE-MA, por município

## Stack
- **Next.js 14** (App Router)
- **Supabase** (PostgreSQL)
- **Anthropic Claude** (extração e análise)
- **Tailwind CSS**
- **Vercel** (deploy)

---

## Setup local

```bash
git clone <seu-repo>
cd peritum
npm install
cp .env.local.example .env.local  # preencha as chaves
```

### Variáveis de ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
ANTHROPIC_API_KEY=sk-ant-...
```

### Banco (Supabase)

No painel → SQL Editor → execute `supabase-schema.sql`.

```bash
npm run dev
# http://localhost:3000
```

---

## Deploy no Vercel

```bash
git init && git add . && git commit -m "init"
git remote add origin https://github.com/seu-usuario/boletim-tce
git push -u origin main
```

Importe no Vercel, adicione as 4 variáveis de ambiente, deploy.

---

## Como usar

### Manhã — Movimentação processual
1. Acesse **Movimentação processual**
2. Arraste o PDF do sistema TCE-MA ou cole o texto
3. Clique em **Gerar movimentação processual**
4. Salvo automaticamente no Supabase

### Tarde — Boletim informativo
1. Acesse **Boletim informativo**
2. Preencha as menções do Diário do TCE-MA por município
3. Clique em **Salvar boletim**
4. Cruzamento automático com a movimentação processual do dia

### Histórico
Consulta e revisão de qualquer dia anterior.

---

## Estrutura

```
src/
├── app/
│   ├── api/
│   │   ├── analisar/     # POST: processa movimentações (PDF ou texto)
│   │   ├── boletim/      # POST: salva boletim informativo
│   │   ├── historico/    # GET: lista histórico
│   │   └── dia/          # GET: busca dados por data
│   ├── dashboard/
│   │   ├── page.tsx      # Movimentação processual
│   │   └── boletim/      # Boletim informativo
│   └── historico/        # Histórico + detalhe por data
├── components/
│   ├── ui/
│   └── layout/
├── lib/
│   ├── supabase.ts
│   ├── prompts.ts
│   └── utils.ts
└── types/
```
