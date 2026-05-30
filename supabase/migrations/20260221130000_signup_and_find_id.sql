/*
 * =====================================================================
 * 회원가입 · 아이디 찾기 · 비밀번호 찾기 · 가입인사 게시판 (Supabase SQL 한 번 적용 패키지)
 * =====================================================================
 *
 * [실행되는 SQL 대상]
 * 1) 회원가입: auth.users 에 쌓이는 nickname·phone 을 public.member_accounts 에 동기화
 * 2) 아이디 찾기: find_login_identifier RPC (닉네임+휴대폰 → 마스킹 이메일)
 * 3) 가입인사 한줄 게시판: public.signup_welcome_posts 테이블·RLS·작성자명 트리거
 *
 * [비밀번호 찾기]
 * - 별도 테이블·함수가 필요 없습니다. 클라이언트의 resetPasswordForEmail 이
 *   Supabase Auth 의 이메일 발송 플로우를 사용합니다.
 * - 파일 맨 아래 주석 블록에 대시보드에서 꼭 맞춰야 할 URL·템플릿 설정을 적어 두었습니다.
 *
 * 적용: Dashboard → SQL Editor → 본 파일 전체 실행 또는 supabase db push
 *
 * 참고: `supabase/migrations/20260520120000_signup_welcome_posts.sql` 과 내용이 겹치며,
 * CLI 마이그레이션 순서 또는 이미 과거 패키지만 적용한 DB 호환용으로 병행 두었습니다(중복 실행은 idempotent).
 */

-- ---------------------------------------------------------------------
-- 1) 회원 식별용 공개 테이블 (프런트 Supabase 회원가입 필드와 대응)
--    클라이언트는 anon 으로 이 테이블을 직접 스캔할 수 없고,
--    본인 로그인 시에만(select 자기 id) 확인 가능합니다.
-- ---------------------------------------------------------------------
create table if not exists public.member_accounts (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.member_accounts is '회원가입 시점 닉네임·휴대폰 — auth.users raw_user_meta_data 와 트리거로 동기화';

create index if not exists member_accounts_nickname_phone_idx
  on public.member_accounts (
    nickname,
    phone
  );

alter table public.member_accounts enable row level security;

drop policy if exists member_accounts_select_own on public.member_accounts;

create policy member_accounts_select_own
  on public.member_accounts
  for select
  to authenticated
  using (auth.uid() = id);

grant select on table public.member_accounts to authenticated;

-- ---------------------------------------------------------------------
-- 2) auth.users 신규/메타 수정 시 member_accounts 에 반영
-- ---------------------------------------------------------------------
create or replace function public.member_accounts_sync_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.member_accounts (id, nickname, phone)
  values (
    new.id,
    trim(coalesce(new.raw_user_meta_data->>'nickname', '')),
    trim(coalesce(new.raw_user_meta_data->>'phone', ''))
  )
  on conflict (id) do update set
    nickname = excluded.nickname,
    phone = excluded.phone,
    updated_at = now();

  return new;
end;
$$;

comment on function public.member_accounts_sync_from_auth() is 'auth.users insert/update 시 닉네임·휴대폰을 member_accounts 에 upsert';

drop trigger if exists member_accounts_after_auth_insert on auth.users;

create trigger member_accounts_after_auth_insert
  after insert on auth.users
  for each row
  execute function public.member_accounts_sync_from_auth();

drop trigger if exists member_accounts_after_auth_meta_update on auth.users;

create trigger member_accounts_after_auth_meta_update
  after update of raw_user_meta_data on auth.users
  for each row
  when (old.raw_user_meta_data is distinct from new.raw_user_meta_data)
  execute function public.member_accounts_sync_from_auth();

-- 함수·트리거는 서비스 용도라 일반 역할에는 실행 권한을 넓히지 않음
revoke all on function public.member_accounts_sync_from_auth() from public;

-- ---------------------------------------------------------------------
-- 3) 이미 가입돼 있는 계정 메타 복구 (마이그레이션 적용 전 사용자)
-- ---------------------------------------------------------------------
insert into public.member_accounts (id, nickname, phone)
select
  u.id,
  trim(coalesce(u.raw_user_meta_data->>'nickname', '')),
  trim(coalesce(u.raw_user_meta_data->>'phone', ''))
from auth.users u
on conflict (id) do update set
  nickname = excluded.nickname,
  phone = excluded.phone,
  updated_at = now();

-- ---------------------------------------------------------------------
-- 4) 아이디 찾기 RPC — member_accounts + auth.users 이메일 조회 후 마스킹
--    (메타 테이블에 행이 아직 없을 때를 대비해 raw_user_meta_data 폴백)
-- ---------------------------------------------------------------------
create or replace function public.find_login_identifier(p_nickname text, p_phone text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  uemail text;
  local_part text;
  domain_part text;
  nick text;
  ph text;
begin
  nick := trim(coalesce(p_nickname, ''));
  ph := trim(coalesce(p_phone, ''));

  if length(nick) < 2 or length(ph) < 10 then
    return null;
  end if;

  select u.email into uemail
  from auth.users u
  left join public.member_accounts m on m.id = u.id
  where (
      m.id is not null
      and trim(m.nickname) = nick
      and trim(m.phone) = ph
    )
    or (
      m.id is null
      and trim(coalesce(u.raw_user_meta_data->>'nickname', '')) = nick
      and trim(coalesce(u.raw_user_meta_data->>'phone', '')) = ph
    )
  limit 1;

  if uemail is null then
    return null;
  end if;

  local_part := split_part(uemail, '@', 1);
  domain_part := nullif(split_part(uemail, '@', 2), '');

  if domain_part is null then
    return left(uemail, 2) || '***';
  end if;

  if length(local_part) <= 2 then
    return '**@' || domain_part;
  end if;

  return substring(local_part from 1 for 2) || '***@' || domain_part;
end;
$$;

comment on function public.find_login_identifier(text, text) is '닉네임+휴대폰 일치 시 가입 이메일 로컬부 마스킹 반환';

revoke all on function public.find_login_identifier(text, text) from public;

grant execute on function public.find_login_identifier(text, text) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- 5) 가입인사 한줄 게시판 — `/qna` 페이지용 public.signup_welcome_posts
--    로그인 사용자 작성·전체 로그인 사용자 목록 조회 · author_display 는 트리거로 고정
-- ---------------------------------------------------------------------
create table if not exists public.signup_welcome_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  parent_id uuid references public.signup_welcome_posts (id) on delete cascade,
  content text not null,
  author_display text not null default '',
  created_at timestamptz not null default now(),
  constraint signup_welcome_content_len check (
    char_length(trim(content)) > 0
    and char_length(content) <= 2000
  )
);

alter table public.signup_welcome_posts
  add column if not exists parent_id uuid references public.signup_welcome_posts (id) on delete cascade;

comment on table public.signup_welcome_posts is '가입인사 한줄 게시판 게시글 (로그인 사용자만 작성·전체 로그인 사용자 조회)';
comment on column public.signup_welcome_posts.author_display is '표시 닉네임 — 트리거가 auth 사용자 메타에서 채움';
comment on column public.signup_welcome_posts.parent_id is '답글 대상 원글 id — null 이면 원글';

create index if not exists signup_welcome_posts_created_at_desc_idx
  on public.signup_welcome_posts (created_at desc);

create index if not exists signup_welcome_posts_parent_created_at_idx
  on public.signup_welcome_posts (parent_id, created_at asc);

alter table public.signup_welcome_posts enable row level security;

drop policy if exists signup_welcome_select_authenticated on public.signup_welcome_posts;
drop policy if exists signup_welcome_insert_own on public.signup_welcome_posts;
drop policy if exists signup_welcome_update_own on public.signup_welcome_posts;
drop policy if exists signup_welcome_delete_own on public.signup_welcome_posts;

create policy signup_welcome_select_authenticated
  on public.signup_welcome_posts
  for select
  to authenticated
  using (true);

create policy signup_welcome_insert_own
  on public.signup_welcome_posts
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy signup_welcome_update_own
  on public.signup_welcome_posts
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy signup_welcome_delete_own
  on public.signup_welcome_posts
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, delete on table public.signup_welcome_posts to authenticated;
grant update (content) on table public.signup_welcome_posts to authenticated;

create or replace function public.signup_welcome_set_author_display()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  nick text;
  em text;
begin
  /*
   * 새 행의 user_id 는 RLS 로 본인만 넣을 수 있지만,
   * 트리거에서 다시 한 번 사용자 메타를 읽어 표시 이름을 고정합니다.
   * 서비스 롤 소유 SECURITY DEFINER 이므로 auth.users 조회 가능.
   */
  select
    coalesce(trim(u.raw_user_meta_data ->> 'nickname'), ''),
    u.email
    into nick, em
  from auth.users u
  where u.id = new.user_id;

  if nick is null or nick = '' then
    new.author_display := split_part(coalesce(em, ''), '@', 1);
    if trim(coalesce(new.author_display, '')) = '' then
      new.author_display := 'member';
    end if;
  else
    new.author_display := nick;
  end if;

  return new;
end;
$$;

comment on function public.signup_welcome_set_author_display() is 'signup_welcome_posts INSERT 전 author_display 채우기';

drop trigger if exists signup_welcome_before_insert_author on public.signup_welcome_posts;

create trigger signup_welcome_before_insert_author
  before insert on public.signup_welcome_posts
  for each row
  execute function public.signup_welcome_set_author_display();

revoke all on function public.signup_welcome_set_author_display() from public;

/*
 * =====================================================================
 * 6) 비밀번호 찾기 — DB 객체 없음 (Supabase Auth 이메일 링크)
 * =====================================================================
 *
 * 프런트: supabase.auth.resetPasswordForEmail(email, { redirectTo: .../find-password?mode=reset })
 *
 * 대시보드에서 설정:
 * · Authentication → URL Configuration (Site URL, Redirect URLs 에 /find-password?mode=reset 허용)
 * · Email Templates → Reset/Recover Password 에 {{ .ConfirmationURL }} 등 링크 포함
 *
 * 저장소 supabase/README.md 에 단계 요약이 있습니다.
 */

