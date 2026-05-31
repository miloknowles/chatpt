insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'exercise-images',
  'exercise-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
);

create policy "Users can upload their own exercise images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'exercise-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update their own exercise images"
on storage.objects for update to authenticated
using (
  bucket_id = 'exercise-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'exercise-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete their own exercise images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'exercise-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Anyone can view exercise images"
on storage.objects for select to public
using (bucket_id = 'exercise-images');
