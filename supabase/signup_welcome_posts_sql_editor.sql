/*
 * =====================================================================
 * 가입인사 게시판 + 답글 기능 — Supabase SQL Editor 단독 실행용
 * =====================================================================
 *
 * 사용 방법:
 * 1. Supabase Dashboard → 프로젝트 → SQL Editor 로 이동합니다.
 * 2. 이 파일 전체를 복사해서 붙여넣고 Run 을 누릅니다.
 * 3. 실행 후 웹 페이지를 새로고침하면 가입인사 목록/작성/답글 저장이 동작합니다.
 *
 * 왜 별도 파일로 만들었나:
 * - 화면에 "signup_welcome_posts 테이블이 없다"는 오류가 나면, 원격 Supabase DB에
 *   아직 게시판 테이블이 만들어지지 않은 상태입니다.
 * - 이 SQL은 기존 DB에 여러 번 실행해도 최대한 안전하도록 if not exists, drop policy if exists 를 사용합니다.
 */

create extension if not exists pgcrypto;

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

/*
 * 이미 원글 기능만 먼저 만든 DB에도 답글 컬럼을 추가합니다.
 * parent_id 가 null 이면 원글, 값이 있으면 해당 id 글에 달린 답글입니다.
 */
alter table public.signup_welcome_posts
  add column if not exists parent_id uuid references public.signup_welcome_posts (id) on delete cascade;

comment on table public.signup_welcome_posts is '가입인사 한줄 게시판 게시글과 답글';
comment on column public.signup_welcome_posts.user_id is '작성자 auth.users id';
comment on column public.signup_welcome_posts.parent_id is '답글 대상 글 id — null 이면 원글';
comment on column public.signup_welcome_posts.content is '가입인사 또는 답글 내용';
comment on column public.signup_welcome_posts.author_display is '표시 닉네임 — 트리거가 auth 사용자 메타에서 채움';

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
   * 클라이언트에서 닉네임을 직접 보내게 하면 다른 이름으로 조작할 수 있습니다.
   * 그래서 INSERT 직전에 auth.users 메타데이터에서 닉네임을 다시 읽어 author_display 를 서버에서 확정합니다.
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

comment on function public.signup_welcome_set_author_display() is '가입인사 글/답글 INSERT 전 author_display 채우기';

drop trigger if exists signup_welcome_before_insert_author on public.signup_welcome_posts;

create trigger signup_welcome_before_insert_author
  before insert on public.signup_welcome_posts
  for each row
  execute function public.signup_welcome_set_author_display();

revoke all on function public.signup_welcome_set_author_display() from public;
