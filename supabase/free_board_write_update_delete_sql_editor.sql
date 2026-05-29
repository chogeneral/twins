/*
 * =====================================================================
 * 무적LG마당 글쓰기 · 수정 · 삭제 권한 추가 — Supabase SQL Editor 실행용
 * =====================================================================
 *
 * 사용 방법:
 * 1. Supabase Dashboard → 프로젝트 → SQL Editor 로 이동합니다.
 * 2. 이 파일 전체를 복사해서 붙여넣고 Run 을 누릅니다.
 * 3. 실행 후 무적LG마당 목록/글쓰기/상세 페이지를 새로고침하고
 *    글쓰기·수정·삭제를 다시 확인합니다.
 *
 * 왜 필요한가:
 * - 게시판 테이블에 RLS(Row Level Security)가 켜져 있으면 insert/update/delete 정책이 없을 때
 *   프런트에서 쿼리를 호출해도 실제로 추가·수정·삭제되는 행이 0개가 될 수 있습니다.
 * - 아래 정책은 로그인한 사용자가 무적LG마당 글을 읽고,
 *   본인이 작성한 글만 작성·수정·삭제할 수 있게 제한합니다.
 * - freeBoard와 reviewBoard를 같은 테이블에서 관리하므로 board_key = 'freeBoard' 조건을 둡니다.
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
  constraint board_posts_content_len_check check (
    char_length(content) <= 20000
    and coalesce(nullif(trim(content), ''), nullif(trim(coalesce(html_content, '')), '')) is not null
  )
);

/*
 * 이미 board_posts 테이블을 만들었지만 컬럼 일부가 빠져 있는 경우를 대비합니다.
 * SQL Editor에서 여러 번 실행해도 실패하지 않도록 add column if not exists를 사용합니다.
 */
alter table public.board_posts
  add column if not exists html_content text,
  add column if not exists font_family text,
  add column if not exists font_size text,
  add column if not exists author_display text not null default '',
  add column if not exists views integer not null default 0,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists board_posts_free_board_created_idx
  on public.board_posts (created_at desc)
  where board_key = 'freeBoard';

alter table public.board_posts enable row level security;

drop policy if exists free_board_select_authenticated on public.board_posts;
drop policy if exists free_board_insert_own on public.board_posts;
drop policy if exists free_board_update_own on public.board_posts;
drop policy if exists free_board_delete_own on public.board_posts;

create policy free_board_select_authenticated
  on public.board_posts
  for select
  to authenticated
  using (board_key = 'freeBoard');

create policy free_board_insert_own
  on public.board_posts
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and board_key = 'freeBoard'
  );

create policy free_board_update_own
  on public.board_posts
  for update
  to authenticated
  using (
    auth.uid() = user_id
    and board_key = 'freeBoard'
  )
  with check (
    auth.uid() = user_id
    and board_key = 'freeBoard'
  );

create policy free_board_delete_own
  on public.board_posts
  for delete
  to authenticated
  using (
    auth.uid() = user_id
    and board_key = 'freeBoard'
  );

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
  /*
   * 작성자명은 클라이언트에서 보내는 값을 믿지 않고 auth.users에서 다시 가져옵니다.
   * 이렇게 해야 개발자도구로 author_display를 조작해도 DB에는 실제 로그인 계정의 닉네임만 저장됩니다.
   */
  if tg_op = 'INSERT' then
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
     * 수정할 때 작성자·작성일·조회수는 보존합니다.
     * 사용자는 제목/카테고리/본문만 수정해야 하므로 보호 필드는 이전 값으로 되돌립니다.
     */
    new.user_id := old.user_id;
    new.board_key := old.board_key;
    new.author_display := old.author_display;
    new.created_at := old.created_at;

    /*
     * 본문 수정에서는 조회수를 기존 값으로 되돌립니다.
     * 나중에 조회수 증가 RPC를 붙일 때 views만 바뀌는 업데이트는 통과할 수 있도록
     * 본문 관련 컬럼이 바뀐 경우에만 views를 보호합니다.
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

drop trigger if exists board_posts_before_insert_author on public.board_posts;
drop trigger if exists board_posts_before_update_author on public.board_posts;
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

/*
 * =====================================================================
 * 무적LG마당 프런트 쿼리 예시
 * =====================================================================
 */

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
--   and board_key = 'freeBoard'
-- returning *;

-- 삭제
-- delete from public.board_posts
-- where id = '게시글_UUID'
--   and board_key = 'freeBoard';
