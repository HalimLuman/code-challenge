alter table profiles
  add column if not exists bio                text check (char_length(bio) <= 280),
  add column if not exists avatar_url         text,
  add column if not exists location           text,
  add column if not exists website            text,
  add column if not exists visibility         text not null default 'public'
                                              check (visibility in ('public', 'connections', 'private')),
  add column if not exists role               text not null default 'user'
                                              check (role in ('user', 'admin')),
  add column if not exists onboarding_complete boolean not null default false,
  add column if not exists birth_year         integer;
