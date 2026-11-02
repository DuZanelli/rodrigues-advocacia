-- =========================================================
-- Rodrigues Advocacia — banco de dados do login e dos casos
-- Cole tudo isto no Supabase > SQL Editor > New query e clique em "Run".
-- =========================================================

-- 1) Perfis: nome e tipo de cada conta (cliente ou advogado)
create table if not exists public.perfis (
  id    uuid primary key references auth.users(id) on delete cascade,
  nome  text not null default '',
  email text not null default '',
  tipo  text not null default 'cliente' check (tipo in ('cliente', 'advogado'))
);

-- Toda conta criada pelo site nasce como CLIENTE
create or replace function public.criar_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfis (id, nome, email, tipo)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), new.email, 'cliente');
  return new;
end; $$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario after insert on auth.users
  for each row execute function public.criar_perfil();

-- Diz se quem está logado é advogado
create or replace function public.eh_advogado()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfis where id = auth.uid() and tipo = 'advogado');
$$;

-- 2) Casos
create table if not exists public.casos (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null references public.perfis(id) on delete cascade,
  numero      text,
  titulo      text not null,
  area        text,
  status      text not null default 'andamento' check (status in ('andamento', 'encerrado')),
  resultado   text,
  data_inicio date,
  data_fim    date,
  advogado    text,
  descricao   text,
  andamentos  jsonb not null default '[]'::jsonb,
  criado_em   timestamptz not null default now()
);

-- 3) Regras de segurança
--    Cliente: só vê o próprio perfil e os próprios casos, e não altera nada.
--    Advogado: vê todos os clientes e casos, e cria/edita casos.
alter table public.perfis enable row level security;
alter table public.casos  enable row level security;

drop policy if exists "ver perfis" on public.perfis;
create policy "ver perfis" on public.perfis for select
  using (id = auth.uid() or public.eh_advogado());

drop policy if exists "ver casos" on public.casos;
create policy "ver casos" on public.casos for select
  using (cliente_id = auth.uid() or public.eh_advogado());

drop policy if exists "advogado cria casos" on public.casos;
create policy "advogado cria casos" on public.casos for insert
  with check (public.eh_advogado());

drop policy if exists "advogado edita casos" on public.casos;
create policy "advogado edita casos" on public.casos for update
  using (public.eh_advogado()) with check (public.eh_advogado());

drop policy if exists "advogado apaga casos" on public.casos;
create policy "advogado apaga casos" on public.casos for delete
  using (public.eh_advogado());

-- =========================================================
-- COMO TRANSFORMAR UMA CONTA EM ADVOGADO
-- 1. O advogado cria a conta normalmente pelo site (aba "Sou cliente" > Criar conta).
-- 2. Rode a linha abaixo trocando o e-mail:
--
--   update public.perfis set tipo = 'advogado' where email = 'advogado@seuescritorio.com.br';
-- =========================================================
