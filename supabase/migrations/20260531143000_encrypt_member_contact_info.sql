/*
 * 회원 연락처 개인정보 보호 강화
 * - Supabase Auth 이메일은 로그인/비밀번호 재설정에 필요한 인증 식별자라 Auth 내부 값을 제거하거나 암호화하지 않습니다.
 * - 앱에서 동기화해 쓰는 public.member_accounts에는 이메일·휴대폰 번호를 암호화해 저장합니다.
 * - 아이디 찾기에서 휴대폰 번호를 검색해야 하므로, 원문 대신 비밀키 기반 HMAC 해시를 별도로 저장해 비교합니다.
 */

create extension if not exists pgcrypto;

create schema if not exists app_private;

create table if not exists app_private.contact_crypto_secret (
  id text primary key,
  secret text not null,
  created_at timestamptz not null default now()
);

insert into app_private.contact_crypto_secret (id, secret)
values ('active', encode(gen_random_bytes(32), 'hex'))
on conflict (id) do nothing;

revoke all on schema app_private from public;
revoke all on table app_private.contact_crypto_secret from public;

create or replace function app_private.contact_secret()
returns text
language sql
security definer
set search_path = app_private, public
as $$
  select secret
  from app_private.contact_crypto_secret
  where id = 'active'
$$;

revoke all on function app_private.contact_secret() from public;

create or replace function app_private.normalize_contact_value(p_value text)
returns text
language sql
immutable
as $$
  select trim(coalesce(p_value, ''))
$$;

revoke all on function app_private.normalize_contact_value(text) from public;

create or replace function app_private.contact_encrypt(p_value text)
returns text
language plpgsql
security definer
set search_path = app_private, public, extensions
as $$
declare
  normalized_value text;
begin
  normalized_value := app_private.normalize_contact_value(p_value);

  if normalized_value = '' then
    return '';
  end if;

  return armor(
    pgp_sym_encrypt(
      normalized_value,
      app_private.contact_secret(),
      'cipher-algo=aes256, compress-algo=1'
    )
  );
end;
$$;

revoke all on function app_private.contact_encrypt(text) from public;

create or replace function app_private.contact_decrypt(p_cipher text)
returns text
language plpgsql
security definer
set search_path = app_private, public, extensions
as $$
declare
  normalized_cipher text;
begin
  normalized_cipher := app_private.normalize_contact_value(p_cipher);

  if normalized_cipher = '' then
    return '';
  end if;

  return pgp_sym_decrypt(dearmor(normalized_cipher), app_private.contact_secret());
exception
  when others then
    return '';
end;
$$;

revoke all on function app_private.contact_decrypt(text) from public;

create or replace function app_private.contact_lookup_hash(p_value text)
returns text
language plpgsql
security definer
set search_path = app_private, public, extensions
as $$
declare
  normalized_value text;
begin
  normalized_value := app_private.normalize_contact_value(p_value);

  if normalized_value = '' then
    return '';
  end if;

  /*
   * 휴대폰 번호는 아이디 찾기에서 검색 조건으로 쓰입니다.
   * 무작위 IV를 쓰는 암호문은 매번 달라져 인덱스 검색에 맞지 않으므로, 원문을 저장하지 않고 서버 비밀키로 HMAC 해시만 별도 보관합니다.
   */
  return encode(hmac(normalized_value, app_private.contact_secret(), 'sha256'), 'hex');
end;
$$;

revoke all on function app_private.contact_lookup_hash(text) from public;

create or replace function app_private.mask_contact_email(p_email text)
returns text
language plpgsql
immutable
as $$
declare
  normalized_email text;
  local_part text;
  domain_part text;
begin
  normalized_email := trim(coalesce(p_email, ''));

  if normalized_email = '' then
    return '';
  end if;

  local_part := split_part(normalized_email, '@', 1);
  domain_part := nullif(split_part(normalized_email, '@', 2), '');

  if domain_part is null then
    return left(normalized_email, 2) || '***';
  end if;

  if length(local_part) <= 2 then
    return '**@' || domain_part;
  end if;

  return substring(local_part from 1 for 2) || '***@' || domain_part;
end;
$$;

revoke all on function app_private.mask_contact_email(text) from public;

create or replace function app_private.mask_contact_phone(p_phone text)
returns text
language sql
immutable
as $$
  select case
    when trim(coalesce(p_phone, '')) = '' then ''
    when length(regexp_replace(p_phone, '\D', '', 'g')) >= 11 then
      substring(regexp_replace(p_phone, '\D', '', 'g') from 1 for 3)
      || '-****-'
      || substring(regexp_replace(p_phone, '\D', '', 'g') from 8 for 4)
    else '***-****-****'
  end
$$;

revoke all on function app_private.mask_contact_phone(text) from public;

alter table public.member_accounts
  add column if not exists email_encrypted text not null default '',
  add column if not exists email_masked text not null default '',
  add column if not exists phone_encrypted text not null default '',
  add column if not exists phone_lookup_hash text not null default '',
  add column if not exists phone_masked text not null default '';

comment on column public.member_accounts.email_encrypted is '앱 회원 연락처 이메일 암호문 — Auth 이메일 원본은 Supabase 인증에 필요해 별도 보존됨';
comment on column public.member_accounts.email_masked is '관리·조회 화면에서 원문 대신 표시할 수 있는 마스킹 이메일';
comment on column public.member_accounts.phone_encrypted is '휴대폰 번호 암호문';
comment on column public.member_accounts.phone_lookup_hash is '아이디 찾기 검색용 휴대폰 HMAC 해시';
comment on column public.member_accounts.phone_masked is '원문 노출 없이 표시할 수 있는 마스킹 휴대폰 번호';

create index if not exists member_accounts_nickname_phone_lookup_hash_idx
  on public.member_accounts (nickname, phone_lookup_hash);

create or replace function public.member_accounts_protect_auth_contact_metadata()
returns trigger
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
  metadata jsonb;
  raw_phone text;
begin
  metadata := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  raw_phone := app_private.normalize_contact_value(metadata ->> 'phone');

  if raw_phone <> '' then
    /*
     * 프런트는 입력 검증과 Supabase signUp/updateUser 흐름을 그대로 사용합니다.
     * DB 진입 직전에 평문 phone을 암호문·마스킹 값으로 바꾸고 원문 키는 제거해 Auth 메타데이터에 휴대폰 번호가 남지 않게 합니다.
     */
    metadata := metadata - 'phone' - 'phoneEncrypted' - 'phoneMasked';
    metadata := jsonb_set(metadata, '{phoneEncrypted}', to_jsonb(app_private.contact_encrypt(raw_phone)), true);
    metadata := jsonb_set(metadata, '{phoneMasked}', to_jsonb(app_private.mask_contact_phone(raw_phone)), true);
  end if;

  new.raw_user_meta_data := metadata;
  return new;
end;
$$;

comment on function public.member_accounts_protect_auth_contact_metadata() is 'auth 사용자 메타데이터의 휴대폰 평문을 저장 직전 암호문으로 치환';

revoke all on function public.member_accounts_protect_auth_contact_metadata() from public;

drop trigger if exists member_accounts_before_auth_contact_insert on auth.users;

create trigger member_accounts_before_auth_contact_insert
  before insert on auth.users
  for each row
  execute function public.member_accounts_protect_auth_contact_metadata();

drop trigger if exists member_accounts_before_auth_contact_meta_update on auth.users;

create trigger member_accounts_before_auth_contact_meta_update
  before update of raw_user_meta_data on auth.users
  for each row
  when (old.raw_user_meta_data is distinct from new.raw_user_meta_data)
  execute function public.member_accounts_protect_auth_contact_metadata();

create or replace function public.member_accounts_sync_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
  raw_phone text;
  encrypted_phone text;
  decrypted_phone text;
begin
  raw_phone := app_private.normalize_contact_value(new.raw_user_meta_data ->> 'phone');
  encrypted_phone := app_private.normalize_contact_value(new.raw_user_meta_data ->> 'phoneEncrypted');
  decrypted_phone := coalesce(nullif(raw_phone, ''), app_private.contact_decrypt(encrypted_phone));

  if raw_phone <> '' then
    encrypted_phone := app_private.contact_encrypt(raw_phone);
  end if;

  insert into public.member_accounts (
    id,
    nickname,
    phone,
    email_encrypted,
    email_masked,
    phone_encrypted,
    phone_lookup_hash,
    phone_masked
  )
  values (
    new.id,
    trim(coalesce(new.raw_user_meta_data ->> 'nickname', '')),
    '',
    app_private.contact_encrypt(new.email),
    app_private.mask_contact_email(new.email),
    encrypted_phone,
    app_private.contact_lookup_hash(decrypted_phone),
    app_private.mask_contact_phone(decrypted_phone)
  )
  on conflict (id) do update set
    nickname = excluded.nickname,
    phone = '',
    email_encrypted = excluded.email_encrypted,
    email_masked = excluded.email_masked,
    phone_encrypted = excluded.phone_encrypted,
    phone_lookup_hash = excluded.phone_lookup_hash,
    phone_masked = excluded.phone_masked,
    updated_at = now();

  return new;
end;
$$;

comment on function public.member_accounts_sync_from_auth() is 'auth.users insert/update 시 닉네임과 암호화된 연락처를 member_accounts 에 upsert';

revoke all on function public.member_accounts_sync_from_auth() from public;

update auth.users u
set raw_user_meta_data = jsonb_set(
  jsonb_set(
    coalesce(u.raw_user_meta_data, '{}'::jsonb) - 'phone' - 'phoneEncrypted' - 'phoneMasked',
    '{phoneEncrypted}',
    to_jsonb(app_private.contact_encrypt(u.raw_user_meta_data ->> 'phone')),
    true
  ),
  '{phoneMasked}',
  to_jsonb(app_private.mask_contact_phone(u.raw_user_meta_data ->> 'phone')),
  true
)
where app_private.normalize_contact_value(u.raw_user_meta_data ->> 'phone') <> '';

with legacy_contact as (
  select coalesce(
    nullif(app_private.normalize_contact_value(m.phone), ''),
    nullif(app_private.contact_decrypt(m.phone_encrypted), ''),
    nullif(app_private.normalize_contact_value(u.raw_user_meta_data ->> 'phone'), ''),
    nullif(app_private.contact_decrypt(u.raw_user_meta_data ->> 'phoneEncrypted'), ''),
    ''
  ) as phone_plain,
  coalesce(u.email, '') as email,
  m.id
  from public.member_accounts m
  join auth.users u on u.id = m.id
)
update public.member_accounts m
set
  phone = '',
  email_encrypted = app_private.contact_encrypt(legacy_contact.email),
  email_masked = app_private.mask_contact_email(legacy_contact.email),
  phone_encrypted = case
    when legacy_contact.phone_plain = '' then ''
    else app_private.contact_encrypt(legacy_contact.phone_plain)
  end,
  phone_lookup_hash = app_private.contact_lookup_hash(legacy_contact.phone_plain),
  phone_masked = app_private.mask_contact_phone(legacy_contact.phone_plain),
  updated_at = now()
from legacy_contact
where legacy_contact.id = m.id;

insert into public.member_accounts (
  id,
  nickname,
  phone,
  email_encrypted,
  email_masked,
  phone_encrypted,
  phone_lookup_hash,
  phone_masked
)
select
  u.id,
  trim(coalesce(u.raw_user_meta_data ->> 'nickname', '')),
  '',
  app_private.contact_encrypt(u.email),
  app_private.mask_contact_email(u.email),
  app_private.contact_encrypt(app_private.contact_decrypt(u.raw_user_meta_data ->> 'phoneEncrypted')),
  app_private.contact_lookup_hash(app_private.contact_decrypt(u.raw_user_meta_data ->> 'phoneEncrypted')),
  app_private.mask_contact_phone(app_private.contact_decrypt(u.raw_user_meta_data ->> 'phoneEncrypted'))
from auth.users u
where not exists (
  select 1
  from public.member_accounts m
  where m.id = u.id
)
on conflict (id) do nothing;

create or replace function public.find_login_identifier(p_nickname text, p_phone text)
returns text
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
  uemail text;
  nick text;
  ph text;
  phone_hash text;
begin
  nick := trim(coalesce(p_nickname, ''));
  ph := trim(coalesce(p_phone, ''));

  if length(nick) < 2 or length(ph) < 10 then
    return null;
  end if;

  phone_hash := app_private.contact_lookup_hash(ph);

  select u.email into uemail
  from auth.users u
  left join public.member_accounts m on m.id = u.id
  where trim(coalesce(m.nickname, u.raw_user_meta_data ->> 'nickname', '')) = nick
    and (
      m.phone_lookup_hash = phone_hash
      or app_private.normalize_contact_value(m.phone) = ph
      or app_private.normalize_contact_value(u.raw_user_meta_data ->> 'phone') = ph
      or app_private.contact_lookup_hash(app_private.contact_decrypt(u.raw_user_meta_data ->> 'phoneEncrypted')) = phone_hash
    )
  limit 1;

  if uemail is null then
    return null;
  end if;

  return app_private.mask_contact_email(uemail);
end;
$$;

comment on function public.find_login_identifier(text, text) is '닉네임+휴대폰 해시 일치 시 가입 이메일 로컬부 마스킹 반환';

revoke all on function public.find_login_identifier(text, text) from public;
grant execute on function public.find_login_identifier(text, text) to anon, authenticated, service_role;

create or replace function public.get_own_member_contact_profile()
returns table (
  nickname text,
  phone text,
  email text
)
language plpgsql
security definer
set search_path = public, app_private
as $$
begin
  return query
  select
    coalesce(nullif(trim(m.nickname), ''), trim(coalesce(u.raw_user_meta_data ->> 'nickname', ''))) as nickname,
    coalesce(
      nullif(app_private.contact_decrypt(m.phone_encrypted), ''),
      nullif(app_private.normalize_contact_value(u.raw_user_meta_data ->> 'phone'), ''),
      nullif(app_private.contact_decrypt(u.raw_user_meta_data ->> 'phoneEncrypted'), ''),
      ''
    ) as phone,
    coalesce(u.email, '') as email
  from auth.users u
  left join public.member_accounts m on m.id = u.id
  where u.id = auth.uid();
end;
$$;

comment on function public.get_own_member_contact_profile() is '로그인 사용자의 연락처를 본인 화면 표시용으로만 복호화해 반환';

revoke all on function public.get_own_member_contact_profile() from public;
grant execute on function public.get_own_member_contact_profile() to authenticated;
