create extension if not exists pgcrypto;

create table if not exists public.administradores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  email text not null unique,
  nome text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.alunos (
  id uuid primary key default gen_random_uuid(),
  nome_completo text not null,
  data_nascimento date,
  telefone text not null,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.anamneses (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null unique references public.alunos(id) on delete cascade,
  objetivo_principal text,
  experiencia_anterior text,
  frequencia_semanal text,
  atividades_atuais text,
  lesoes_limitacoes text,
  condicoes_saude text,
  restricoes_medicas text,
  observacoes_relevantes text,
  rotina_trabalho text,
  qualidade_sono text,
  habitos_relevantes text,
  peso numeric(5,1),
  altura_cm integer,
  outras_medidas text,
  consentimento_privacidade boolean not null default false,
  respostas_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_alunos_nome on public.alunos (nome_completo);
create index if not exists idx_alunos_telefone on public.alunos (telefone);
create index if not exists idx_anamneses_aluno_id on public.anamneses (aluno_id);
create index if not exists idx_anamneses_respostas_json on public.anamneses using gin (respostas_json);

alter table public.administradores enable row level security;
alter table public.alunos enable row level security;
alter table public.anamneses enable row level security;

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_administradores_updated_at
before update on public.administradores
for each row execute procedure public.handle_updated_at();

create trigger trg_alunos_updated_at
before update on public.alunos
for each row execute procedure public.handle_updated_at();

create trigger trg_anamneses_updated_at
before update on public.anamneses
for each row execute procedure public.handle_updated_at();

create policy "Administradores podem consultar dados completos"
on public.administradores
for all
using (
  auth.uid() is not null
  and exists (
    select 1 from public.administradores a
    where a.user_id = auth.uid()
  )
)
with check (
  auth.uid() is not null
  and exists (
    select 1 from public.administradores a
    where a.user_id = auth.uid()
  )
);

create policy "Administradores podem ler alunos"
on public.alunos
for select
to authenticated
using (
  exists (
    select 1 from public.administradores a
    where a.user_id = auth.uid()
  )
);

create policy "Administradores podem inserir alunos"
on public.alunos
for insert
to authenticated
with check (
  exists (
    select 1 from public.administradores a
    where a.user_id = auth.uid()
  )
);

create policy "Administradores podem atualizar alunos"
on public.alunos
for update
to authenticated
using (
  exists (
    select 1 from public.administradores a
    where a.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.administradores a
    where a.user_id = auth.uid()
  )
);

create policy "Administradores podem ler anamneses"
on public.anamneses
for select
to authenticated
using (
  exists (
    select 1 from public.administradores a
    where a.user_id = auth.uid()
  )
);

create policy "Administradores podem inserir anamneses"
on public.anamneses
for insert
to authenticated
with check (
  exists (
    select 1 from public.administradores a
    where a.user_id = auth.uid()
  )
);

create policy "Administradores podem atualizar anamneses"
on public.anamneses
for update
to authenticated
using (
  exists (
    select 1 from public.administradores a
    where a.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.administradores a
    where a.user_id = auth.uid()
  )
);

create policy "Publico pode inserir aluno anonimo"
on public.alunos
for insert
with check (
  auth.uid() is null
  and nome_completo is not null
  and telefone is not null
  and length(nome_completo) >= 2
  and length(telefone) >= 8
);

create policy "Publico pode inserir anamnese anonima"
on public.anamneses
for insert
with check (
  auth.uid() is null
  and consentimento_privacidade = true
  and exists (
    select 1 from public.alunos a
    where a.id = aluno_id
      and a.telefone is not null
  )
);

create policy "Usuarios anonimos nao consultam registros"
on public.alunos
for select
using (false);

create policy "Usuarios anonimos nao consultam anamneses"
on public.anamneses
for select
using (false);

create policy "Usuarios anonimos nao atualizam registros"
on public.alunos
for update
using (false);

create policy "Usuarios anonimos nao atualizam anamneses"
on public.anamneses
for update
using (false);

create policy "Usuarios anonimos nao deletam registros"
on public.alunos
for delete
using (false);

create policy "Usuarios anonimos nao deletam anamneses"
on public.anamneses
for delete
using (false);
