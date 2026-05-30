/*
 * =====================================================================
 * 가입인사 한줄 게시판 — public.signup_welcome_posts
 * =====================================================================
 *
 * 참고: 동일 DDL 이 `20260221130000_signup_and_find_id.sql` 통합 패키지에 포함되어 있습니다.
 * SQL Editor 에서 한 번에 붙여넣으려면 그 파일 하나만 실행해도 됩니다.
 * 본 파일은 supabase_migration 적용 순서·과거 브랜치 호환을 위해 분리합니다.
 *
 * 목적:
 * - 로그인한 회원만 `/qna` 가입인사 게시판에 한 줄 글을 남길 수 있게 함
 * - 모든 로그인 사용자는 목록 조회 가능 (커뮤니티 전체 공유)
 *
 * 작성자 표시 이름(author_display)은 INSERT 시 SECURITY DEFINER 트리거가
 * auth.users 의 닉네임(없으면 이메일 로컬부)으로 채워 클라이언트 조작을 막음
 *
 * 적용: Dashboard → SQL Editor 에서 실행 또는 supabase db push
 */

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
