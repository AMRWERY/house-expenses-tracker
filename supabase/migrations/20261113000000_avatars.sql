-- Profile pictures: one private file per person, named by their user id.
-- Only the Nuxt server (secret key) reads and writes it, through /api/avatar; the bucket has no public access.
-- (The server also creates this bucket on first use, so running this migration is optional.)
insert into storage.buckets (id, name, public, file_size_limit)
values ('avatars', 'avatars', false, 307200)
on conflict (id) do nothing;
