/*
 * =====================================================================
 * 무적LG마당 · 승요인증 게시판 (Supabase SQL Editor 실행용)
 * =====================================================================
 *
 * 사용 방법:
 * 1. Supabase Dashboard → 프로젝트 → SQL Editor 로 이동합니다.
 * 2. 이 파일 전체를 복사해서 붙여넣고 Run 을 누릅니다.
 * 3. 프런트에서 localStorage 대신 public.board_posts 를 바라보도록 바꾸면
 *    글쓰기·수정·삭제·목록·상세 조회를 Supabase 기준으로 처리할 수 있습니다.
 *
 * 설계 이유:
 * - freeBoard(무적LG마당)와 reviewBoard(승요인증)는 화면 구조가 같아서
 *   테이블을 나누지 않고 board_key 컬럼으로 구분합니다.
 * - RLS 정책으로 로그인 사용자는 모두 조회 가능하고, 작성자 본인만
 *   글쓰기·수정·삭제가 가능하게 제한합니다.
 * - author_display 는 클라이언트 값이 아니라 auth.users 메타데이터에서
 *   서버 트리거가 채워 닉네임 조작을 막습니다.
 */

create table if not exists public.board_posts (
  id uuid primary key default gen_random_uuid(),
  board_key text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null,
  title text not null,
  content text not null default '',
  html_content text,
  font_family text,
  font_size text,
  author_display text not null default '',
  views integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint board_posts_board_key_check check (
    board_key in ('freeBoard', 'reviewBoard')
  ),
  constraint board_posts_title_len_check check (
    char_length(trim(title)) > 0
    and char_length(title) <= 80
  ),
  constraint board_posts_category_len_check check (
    char_length(trim(category)) > 0
    and char_length(category) <= 40
  ),
  constraint board_posts_content_len_check check (
    char_length(content) <= 20000
    and coalesce(nullif(trim(content), ''), nullif(trim(coalesce(html_content, '')), '')) is not null
  ),
  constraint board_posts_views_check check (views >= 0)
);

comment on table public.board_posts is '무적LG마당·승요인증 게시글';
comment on column public.board_posts.board_key is 'freeBoard 또는 reviewBoard — 같은 게시글 구조를 게시판별로 구분';
comment on column public.board_posts.user_id is '작성자 auth.users.id — RLS에서 본인 글 수정·삭제 판단 기준';
comment on column public.board_posts.html_content is 'TipTap 에디터 HTML — 이미지·링크 카드·라인 스타일을 보존';
comment on column public.board_posts.author_display is '표시 닉네임 — INSERT 때 서버 트리거가 auth 메타데이터에서 채움';

/*
 * 이미 테이블을 일부 만들어 둔 DB에서도 누락 컬럼을 보강합니다.
 * create table if not exists 는 기존 테이블 구조를 바꾸지 않기 때문에
 * add column if not exists 를 함께 둬 재실행 안전성을 높입니다.
 */
alter table public.board_posts
  add column if not exists html_content text,
  add column if not exists font_family text,
  add column if not exists font_size text,
  add column if not exists author_display text not null default '',
  add column if not exists views integer not null default 0,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists board_posts_board_created_idx
  on public.board_posts (board_key, created_at desc);

create index if not exists board_posts_user_created_idx
  on public.board_posts (user_id, created_at desc);

alter table public.board_posts enable row level security;

drop policy if exists board_posts_select_authenticated on public.board_posts;
drop policy if exists board_posts_insert_own on public.board_posts;
drop policy if exists board_posts_update_own on public.board_posts;
drop policy if exists board_posts_delete_own on public.board_posts;

create policy board_posts_select_authenticated
  on public.board_posts
  for select
  to authenticated
  using (true);

create policy board_posts_insert_own
  on public.board_posts
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy board_posts_update_own
  on public.board_posts
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy board_posts_delete_own
  on public.board_posts
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, delete on table public.board_posts to authenticated;
grant update (
  category,
  title,
  content,
  html_content,
  font_family,
  font_size
) on table public.board_posts to authenticated;

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
     */
    if (
      new.category,
      new.title,
      new.content,
      new.html_content,
      new.font_family,
      new.font_size
    ) is distinct from (
      old.category,
      old.title,
      old.content,
      old.html_content,
      old.font_family,
      old.font_size
    ) then
      new.views := old.views;
    end if;

    new.updated_at := now();
  end if;

  return new;
end;
$$;

comment on function public.board_posts_set_author_and_audit() is '게시글 작성자명 확정 및 수정 시 보호 필드 유지';

drop trigger if exists board_posts_before_insert_author on public.board_posts;
drop trigger if exists board_posts_before_update_audit on public.board_posts;

create trigger board_posts_before_insert_author
  before insert on public.board_posts
  for each row
  execute function public.board_posts_set_author_and_audit();

create trigger board_posts_before_update_audit
  before update on public.board_posts
  for each row
  execute function public.board_posts_set_author_and_audit();

revoke all on function public.board_posts_set_author_and_audit() from public;

create or replace function public.increment_board_post_views(p_post_id uuid)
returns public.board_posts
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_row public.board_posts;
begin
  /*
   * 상세 페이지 진입 시 조회수를 올릴 때 쓰는 RPC 입니다.
   * 클라이언트가 직접 update 로 views 를 마음대로 바꾸지 않도록 별도 함수로 1씩만 증가시킵니다.
   */
  update public.board_posts
  set views = views + 1
  where id = p_post_id
  returning * into updated_row;

  return updated_row;
end;
$$;

comment on function public.increment_board_post_views(uuid) is '게시글 상세 진입 시 조회수 1 증가';

revoke all on function public.increment_board_post_views(uuid) from public;
grant execute on function public.increment_board_post_views(uuid) to authenticated;

/*
 * =====================================================================
 * 프런트에서 사용할 기본 쿼리 예시
 * =====================================================================
 */

-- 목록 조회
-- select id, board_key, category, title, author_display, created_at, views
-- from public.board_posts
-- where board_key = 'freeBoard'
-- order by created_at desc
-- limit 10
-- offset 0;

-- 상세 조회
-- select *
-- from public.board_posts
-- where id = '게시글_UUID';

-- 글쓰기
-- insert into public.board_posts (
--   board_key,
--   user_id,
--   category,
--   title,
--   content,
--   html_content,
--   font_family,
--   font_size
-- )
-- values (
--   'freeBoard',
--   auth.uid(),
--   '자유게시판',
--   '제목',
--   '목록 미리보기용 텍스트',
--   '<p>본문 HTML</p>',
--   'default',
--   '16'
-- )
-- returning *;

-- 수정
-- update public.board_posts
-- set
--   category = '응원',
--   title = '수정한 제목',
--   content = '수정한 목록 미리보기용 텍스트',
--   html_content = '<p>수정한 본문 HTML</p>',
--   font_family = 'default',
--   font_size = '16'
-- where id = '게시글_UUID'
-- returning *;

-- 삭제
-- delete from public.board_posts
-- where id = '게시글_UUID';
