-- Storage bucket for Flow Card attachments
insert into storage.buckets (id, name, public)
values ('flow-attachments', 'flow-attachments', true)
on conflict (id) do update set public = excluded.public;

-- Public read access to objects in this bucket
create policy "Public read flow attachments"
on storage.objects
for select
to public
using (bucket_id = 'flow-attachments');

-- Authenticated users can upload
create policy "Authenticated upload flow attachments"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'flow-attachments');

-- Authenticated users can update (e.g., overwrite metadata)
create policy "Authenticated update flow attachments"
on storage.objects
for update
to authenticated
using (bucket_id = 'flow-attachments');

-- Authenticated users can delete
create policy "Authenticated delete flow attachments"
on storage.objects
for delete
to authenticated
using (bucket_id = 'flow-attachments');

-- Attachments metadata table
create table if not exists public.flow_card_attachments (
  id uuid primary key default gen_random_uuid(),
  flow_card_id uuid not null references public.flow_cards(id) on delete cascade,
  uploaded_by_id uuid null,
  file_name text not null,
  mime_type text not null,
  bucket_id text not null default 'flow-attachments',
  object_path text not null,
  public_url text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_flow_card_attachments_flow_card_id
on public.flow_card_attachments(flow_card_id);

alter table public.flow_card_attachments enable row level security;

create policy "flow_card_attachments_select_authenticated"
on public.flow_card_attachments
for select
to authenticated
using (auth.uid() is not null);

create policy "flow_card_attachments_insert_authenticated"
on public.flow_card_attachments
for insert
to authenticated
with check (auth.uid() is not null);

create policy "flow_card_attachments_delete_authenticated"
on public.flow_card_attachments
for delete
to authenticated
using (auth.uid() is not null);
