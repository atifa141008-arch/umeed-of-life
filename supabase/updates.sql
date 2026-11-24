-- Run this ONLY if you already ran the earlier schema.sql (adds phone/city/address + Google name on sign-up)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, phone, city, address)
  values (new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.email,
    nullif(new.raw_user_meta_data->>'phone',''),
    nullif(new.raw_user_meta_data->>'city',''),
    nullif(new.raw_user_meta_data->>'address',''));
  return new;
end $$;
