/*
 * 게시판 관련 테이블 화면용 번호 저장
 * - uuid id는 시스템 고유키로 유지하고, 사용자가 보는 순번은 별도 *_no 컬럼에 저장합니다.
 * - 번호는 게시판별/게시글별로 다시 1부터 시작하지 않고, 각 테이블 전체 기준으로 1, 2, 3, 4... 이어집니다.
 * - 삭제된 글/댓글 번호는 다시 당겨 쓰지 않습니다. 예: 1, 2, 4
 * - 동시에 작성해도 번호가 겹치지 않도록 advisory lock을 사용합니다.
 */

-- ================================================================================================
-- [컬럼 추가] 화면용 번호 컬럼
-- ================================================================================================

alter table if exists public.board_posts
  add column if not exists post_no bigint;

alter table if exists public.board_comments
  add column if not exists comment_no bigint;

alter table if exists public.signup_welcome_posts
  add column if not exists welcome_no bigint;

-- ================================================================================================
-- [컬럼 추가] 게시글·댓글 부가 기능 컬럼
-- ================================================================================================

-- board_posts: 공지사항 여부
alter table if exists public.board_posts
  add column if not exists is_notice boolean not null default false;

-- board_comments: 비밀 댓글 여부
alter table if exists public.board_comments
  add column if not exists is_secret boolean not null default false;

-- signup_welcome_posts: 비밀 답글 여부 (가입인사 게시판의 답글에도 동일하게 적용)
alter table if exists public.signup_welcome_posts
  add column if not exists is_secret boolean not null default false;

-- ================================================================================================
-- [코멘트]
-- ================================================================================================

comment on column public.board_posts.post_no          is '전체 게시글 기준 화면용 번호';
comment on column public.board_comments.comment_no    is '전체 댓글 기준 화면용 번호';
comment on column public.signup_welcome_posts.welcome_no is '가입인사 전체 기준 화면용 번호';
comment on column public.board_posts.is_notice        is '공지사항 여부 (상단 고정)';
comment on column public.board_comments.is_secret     is '비밀 댓글 여부 (작성자·글 작성자·관리자만 열람 가능)';
comment on column public.signup_welcome_posts.is_secret is '가입인사 비밀 답글 여부 (작성자·원글 작성자·관리자만 열람 가능)';

-- ================================================================================================
-- [인덱스] 기존 인덱스 삭제 후 재생성
-- ================================================================================================

drop index if exists public.board_posts_board_post_no_uidx;
drop index if exists public.board_comments_post_comment_no_uidx;
drop index if exists public.signup_welcome_posts_welcome_no_uidx;

-- 기존 번호 일괄 채우기
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

-- ================================================================================================
-- [트리거 함수] 화면용 번호 자동 부여
-- ================================================================================================

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

-- ================================================================================================
-- [트리거] 번호 부여 트리거 등록
-- ================================================================================================

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

-- ================================================================================================
-- [트리거 함수] 게시글 작성자명 확정 및 수정 보호 (is_notice 포함)
-- ================================================================================================

create or replace function public.board_posts_set_author_and_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  nick text;
  em text;
begin
  if tg_op = 'INSERT' then
    /*
     * 작성자명은 클라이언트에서 전달받지 않고 auth.users 에서 다시 읽습니다.
     * 이렇게 해야 개발자도구로 author_display 를 바꿔 보내도 DB에는 신뢰 가능한 값만 저장됩니다.
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

    new.created_at := coalesce(new.created_at, now());
    new.updated_at := coalesce(new.updated_at, new.created_at);
    new.views := coalesce(new.views, 0);
  end if;

  if tg_op = 'UPDATE' then
    /*
     * 수정 시에는 작성자·작성일·조회수를 보존합니다.
     * 수정 화면에서 본문만 바꾸는 용도이므로, 사용자가 숨은 필드를 조작해도
     * 소유권이나 조회수 데이터가 바뀌지 않도록 트리거에서 되돌립니다.
     */
    new.user_id := old.user_id;
    new.author_display := old.author_display;
    new.created_at := old.created_at;

    /*
     * 일반 수정은 본문 관련 컬럼만 바꾸도록 권한을 제한했고, 조회수는 RPC가 views만 갱신합니다.
     * 따라서 본문 수정일 때는 views를 기존 값으로 되돌리고, views만 바뀌는 RPC 호출은 그대로 통과시킵니다.
     * is_notice 필드도 포함하여, 공지 여부 수정 시 조회수가 보존되도록 합니다.
     */
    if (
      new.category,
      new.title,
      new.content,
      new.html_content,
      new.font_family,
      new.font_size,
      new.is_notice
    ) is distinct from (
      old.category,
      old.title,
      old.content,
      old.html_content,
      old.font_family,
      old.font_size,
      old.is_notice
    ) then
      new.views := old.views;
    end if;

    new.updated_at := now();
  end if;

  return new;
end;
$$;

comment on function public.board_posts_set_author_and_audit() is '게시글 작성자명 확정 및 수정 시 보호 필드 유지';

-- ================================================================================================
-- [권한] is_notice 컬럼 수정 권한 부여
-- ================================================================================================

grant update (
  category,
  title,
  content,
  html_content,
  font_family,
  font_size,
  is_notice
) on table public.board_posts to authenticated;

-- ================================================================================================
-- [뷰] Supabase Table Editor에서 번호를 맨 앞에 보기 위한 편의 뷰
-- CREATE OR REPLACE VIEW는 기존 뷰 컬럼 구조가 바뀌면 오류가 납니다.
-- 컬럼 추가·순서 변경이 있으므로 DROP 후 재생성하는 방식을 사용합니다.
-- ================================================================================================

drop view if exists public.board_posts_numbered;
drop view if exists public.board_comments_numbered;
drop view if exists public.signup_welcome_posts_numbered;

create view public.board_posts_numbered as
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
  is_notice,
  created_at,
  updated_at
from public.board_posts
order by post_no desc;

create view public.board_comments_numbered as
select
  comment_no,
  id,
  post_id,
  parent_id,
  user_id,
  author_display,
  content,
  is_secret,
  created_at,
  updated_at
from public.board_comments
order by comment_no desc;

create view public.signup_welcome_posts_numbered as
select
  welcome_no,
  id,
  user_id,
  parent_id,
  content,
  is_secret,
  author_display,
  created_at
from public.signup_welcome_posts
order by welcome_no desc;

grant select on public.board_posts_numbered to anon, authenticated;
grant select on public.board_comments_numbered to anon, authenticated;
grant select on public.signup_welcome_posts_numbered to anon, authenticated;

-- ================================================================================================
-- [RPC] 상세 페이지 진입 시 클라이언트 조작 없이 서버 측에서 안전하게 조회수를 1 올리고 반환합니다.
-- ================================================================================================

create or replace function public.increment_board_post_views(p_post_id uuid)
returns public.board_posts
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_row public.board_posts;
begin
  update public.board_posts
  set views = views + 1
  where id = p_post_id
  returning * into updated_row;

  return updated_row;
end;
$$;

comment on function public.increment_board_post_views(uuid) is '게시글 상세 진입 시 조회수 1 증가';

-- 비로그인(anon) 사용자도 상세 페이지 진입 시 조회수가 누락되지 않도록 로그인 사용자(authenticated)와 함께 실행 권한을 부여합니다.
revoke all on function public.increment_board_post_views(uuid) from public;
grant execute on function public.increment_board_post_views(uuid) to anon, authenticated;
