/*
 * 게시판 관련 테이블 화면용 번호 저장
 * - uuid id는 시스템 고유키로 유지하고, 사용자가 보는 순번은 별도 *_no 컬럼에 저장합니다.
 * - 번호는 게시판별/게시글별로 다시 1부터 시작하지 않고, 각 테이블 전체 기준으로 1, 2, 3, 4... 이어집니다.
 * - 삭제된 글/댓글 번호는 다시 당겨 쓰지 않습니다. 예: 1, 2, 4
 * - 동시에 작성해도 번호가 겹치지 않도록 advisory lock을 사용합니다.
 */

alter table if exists public.board_posts
  add column if not exists post_no bigint;

alter table if exists public.board_comments
  add column if not exists comment_no bigint;

alter table if exists public.signup_welcome_posts
  add column if not exists welcome_no bigint;

comment on column public.board_posts.post_no is '전체 게시글 기준 화면용 번호';
comment on column public.board_comments.comment_no is '전체 댓글 기준 화면용 번호';
comment on column public.signup_welcome_posts.welcome_no is '가입인사 전체 기준 화면용 번호';

drop index if exists public.board_posts_board_post_no_uidx;
drop index if exists public.board_comments_post_comment_no_uidx;
drop index if exists public.signup_welcome_posts_welcome_no_uidx;

with numbered_posts as (
  select
    id,
    row_number() over (order by created_at asc, id asc) as next_no
  from public.board_posts
)
update public.board_posts p
set post_no = numbered_posts.next_no
from numbered_posts
where p.id = numbered_posts.id;

with numbered_comments as (
  select
    id,
    row_number() over (order by created_at asc, id asc) as next_no
  from public.board_comments
)
update public.board_comments c
set comment_no = numbered_comments.next_no
from numbered_comments
where c.id = numbered_comments.id;

with numbered_welcome_posts as (
  select
    id,
    row_number() over (order by created_at asc, id asc) as next_no
  from public.signup_welcome_posts
)
update public.signup_welcome_posts w
set welcome_no = numbered_welcome_posts.next_no
from numbered_welcome_posts
where w.id = numbered_welcome_posts.id;

create unique index if not exists board_posts_post_no_uidx
  on public.board_posts (post_no)
  where post_no is not null;

create unique index if not exists board_comments_comment_no_uidx
  on public.board_comments (comment_no)
  where comment_no is not null;

create unique index if not exists signup_welcome_posts_welcome_no_uidx
  on public.signup_welcome_posts (welcome_no)
  where welcome_no is not null;

create or replace function public.board_posts_assign_post_no()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  /*
   * 게시판 종류와 무관하게 board_posts 테이블 전체에서 다음 번호를 부여합니다.
   * 클라이언트가 post_no를 보내도 신뢰하지 않고 DB에서 항상 다시 정합니다.
   */
  perform pg_advisory_xact_lock(hashtext('board_posts'));

  select coalesce(max(post_no), 0) + 1
    into new.post_no
  from public.board_posts;

  return new;
end;
$$;

create or replace function public.board_comments_assign_comment_no()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  /*
   * 어느 게시글의 댓글인지와 무관하게 board_comments 테이블 전체에서 다음 번호를 부여합니다.
   * 클라이언트가 comment_no를 보내도 신뢰하지 않고 DB에서 항상 다시 정합니다.
   */
  perform pg_advisory_xact_lock(hashtext('board_comments'));

  select coalesce(max(comment_no), 0) + 1
    into new.comment_no
  from public.board_comments;

  return new;
end;
$$;

create or replace function public.signup_welcome_assign_welcome_no()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  /*
   * 가입인사 테이블은 원글과 댓글을 같은 테이블에 저장하므로 전체 행 기준 번호를 남깁니다.
   * 클라이언트가 welcome_no를 보내도 신뢰하지 않고 DB에서 항상 다시 정합니다.
   */
  perform pg_advisory_xact_lock(hashtext('signup_welcome_posts'));

  select coalesce(max(welcome_no), 0) + 1
    into new.welcome_no
  from public.signup_welcome_posts;

  return new;
end;
$$;

drop trigger if exists board_posts_before_insert_post_no on public.board_posts;
drop trigger if exists board_comments_before_insert_comment_no on public.board_comments;
drop trigger if exists signup_welcome_before_insert_welcome_no on public.signup_welcome_posts;

create trigger board_posts_before_insert_post_no
  before insert on public.board_posts
  for each row
  execute function public.board_posts_assign_post_no();

create trigger board_comments_before_insert_comment_no
  before insert on public.board_comments
  for each row
  execute function public.board_comments_assign_comment_no();

create trigger signup_welcome_before_insert_welcome_no
  before insert on public.signup_welcome_posts
  for each row
  execute function public.signup_welcome_assign_welcome_no();

revoke all on function public.board_posts_assign_post_no() from public;
revoke all on function public.board_comments_assign_comment_no() from public;
revoke all on function public.signup_welcome_assign_welcome_no() from public;

create or replace view public.board_posts_numbered as
select
  /*
   * PostgreSQL은 기존 테이블의 컬럼 순서를 안전하게 앞으로 옮기는 ALTER 문을 제공하지 않습니다.
   * Supabase Table Editor에서 번호를 맨 앞에 보고 싶을 때는 이 View를 열면 됩니다.
   */
  post_no,
  id,
  board_key,
  user_id,
  category,
  title,
  content,
  html_content,
  font_family,
  font_size,
  author_display,
  views,
  created_at,
  updated_at
from public.board_posts
order by post_no desc;

create or replace view public.board_comments_numbered as
select
  comment_no,
  id,
  post_id,
  parent_id,
  user_id,
  author_display,
  content,
  created_at,
  updated_at
from public.board_comments
order by comment_no desc;

create or replace view public.signup_welcome_posts_numbered as
select
  welcome_no,
  id,
  user_id,
  parent_id,
  content,
  author_display,
  created_at
from public.signup_welcome_posts
order by welcome_no desc;

grant select on public.board_posts_numbered to anon, authenticated;
grant select on public.board_comments_numbered to anon, authenticated;
grant select on public.signup_welcome_posts_numbered to anon, authenticated;
