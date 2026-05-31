alter table public.user_exercise_types
  add column if not exists display_color text;

alter table public.user_exercise_body_regions
  add column if not exists display_color text;
