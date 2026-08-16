-- Métadonnées de capture pour l'extension PromptNest. Migration réexécutable sans danger.
alter table public.prompts add column if not exists source_url text;
alter table public.prompts add column if not exists page_title text;
alter table public.prompts add column if not exists selected_text text;
alter table public.prompts add column if not exists personal_note text;
create index if not exists prompts_user_created_idx on public.prompts(user_id, created_at desc);
