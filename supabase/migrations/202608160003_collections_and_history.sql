-- Migration pour les collections et l'historique des révisions dans PromptVault / PromptNest

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check(char_length(name) between 1 and 60),
  color text default '#6366f1',
  icon text default '📁',
  created_at timestamptz not null default now(),
  unique(user_id, name)
);

alter table public.prompts add column if not exists collection_id uuid references public.collections(id) on delete set null;

create table if not exists public.prompt_revisions (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null,
  category_name text not null default 'Général',
  tags text[] not null default '{}',
  note text,
  created_at timestamptz not null default now()
);

create index if not exists prompt_revisions_prompt_idx on public.prompt_revisions(prompt_id, created_at desc);

alter table public.collections enable row level security;
alter table public.prompt_revisions enable row level security;

create policy "own collections" on public.collections for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "own revisions" on public.prompt_revisions for all using(user_id=auth.uid()) with check(user_id=auth.uid());

alter publication supabase_realtime add table public.collections, public.prompt_revisions;
