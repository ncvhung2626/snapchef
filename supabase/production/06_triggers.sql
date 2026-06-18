-- Audit updated_at on new tables

drop trigger if exists reports_updated_at on public.reports;
create trigger reports_updated_at before update on public.reports
  for each row execute function public.set_updated_at();

drop trigger if exists reels_updated_at on public.reels;
create trigger reels_updated_at before update on public.reels
  for each row execute function public.set_updated_at();

drop trigger if exists meal_plans_updated_at on public.meal_plans;
create trigger meal_plans_updated_at before update on public.meal_plans
  for each row execute function public.set_updated_at();

drop trigger if exists user_preferences_updated_at on public.user_preferences;
create trigger user_preferences_updated_at before update on public.user_preferences
  for each row execute function public.set_updated_at();

-- Seed recipe categories (optional)
insert into public.recipe_categories (slug, name, sort_order)
values
  ('breakfast', 'Bữa sáng', 1),
  ('lunch', 'Bữa trưa', 2),
  ('dinner', 'Bữa tối', 3),
  ('dessert', 'Tráng miệng', 4),
  ('healthy', 'Healthy', 5)
on conflict (slug) do nothing;
