-- Run this in your Supabase SQL editor

-- Assessorias (escritórios/consultorias)
create table if not exists assessorias (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  cnpj text,
  endereco text,
  email text,
  telefone text,
  logo_url text,
  municipios text[] not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Relatórios de movimentação processual
create table if not exists relatorios (
  id uuid default gen_random_uuid() primary key,
  data date not null unique,
  total integer not null default 0,
  arquivados integer not null default 0,
  requerem_acao integer not null default 0,
  visitar_mp integer not null default 0,
  processos jsonb not null default '[]',
  raw_text text,
  created_at timestamptz default now()
);

-- Boletins informativos
create table if not exists boletins (
  id uuid default gen_random_uuid() primary key,
  data date not null unique,
  relatorio_id uuid references relatorios(id),
  municipios jsonb not null default '[]',
  municipios_sem_processo jsonb not null default '[]',
  total_municipios integer not null default 0,
  diario_texto text,
  created_at timestamptz default now()
);

-- Storage bucket para logos e imagens dos boletins
insert into storage.buckets (id, name, public)
values ('assets', 'assets', true)
on conflict (id) do nothing;

-- Índices
create index if not exists relatorios_data_idx on relatorios(data desc);
create index if not exists boletins_data_idx on boletins(data desc);
create index if not exists assessorias_nome_idx on assessorias(nome);

-- RLS (ajuste para autenticação quando necessário)
alter table relatorios   enable row level security;
alter table boletins     enable row level security;
alter table assessorias  enable row level security;

create policy "Allow all relatorios"  on relatorios  for all using (true);
create policy "Allow all boletins"    on boletins    for all using (true);
create policy "Allow all assessorias" on assessorias for all using (true);

-- Storage policy pública para assets
create policy "Public assets read"  on storage.objects for select using (bucket_id = 'assets');
create policy "Public assets write" on storage.objects for insert with check (bucket_id = 'assets');
create policy "Public assets update" on storage.objects for update using (bucket_id = 'assets');
