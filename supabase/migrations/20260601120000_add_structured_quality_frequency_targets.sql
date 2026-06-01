alter table public.user_quality_states
  add column if not exists training_frequency_count integer,
  add column if not exists training_frequency_period text;

alter table public.user_quality_states
  drop constraint if exists user_quality_states_training_frequency_period_check,
  add constraint user_quality_states_training_frequency_period_check
    check (
      training_frequency_period is null
      or training_frequency_period in ('day', 'week')
    );

alter table public.user_quality_states
  drop constraint if exists user_quality_states_training_frequency_pair_check,
  add constraint user_quality_states_training_frequency_pair_check
    check (
      (
        training_frequency_count is null
        and training_frequency_period is null
      )
      or (
        training_frequency_count is not null
        and training_frequency_period is not null
      )
    );

alter table public.user_quality_states
  drop constraint if exists user_quality_states_training_frequency_count_check,
  add constraint user_quality_states_training_frequency_count_check
    check (
      training_frequency_count is null
      or training_frequency_count between 1 and 7
    );

alter table public.user_quality_states
  drop constraint if exists user_quality_states_training_frequency_daily_count_check;

alter table public.user_quality_states
  drop column if exists training_frequency_target;
