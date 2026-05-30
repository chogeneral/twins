/*
 * =====================================================================
 * 무적LG마당 · 승요인증 · 구장투어 · twins뉴스 · 문의하기 · 가입인사 · 마이페이지 전체 권한 추가 — Supabase SQL Editor 실행용
 * =====================================================================
 *
 * 사용 방법:
 * 1. Supabase Dashboard → 프로젝트 → SQL Editor 로 이동합니다.
 * 2. 이 파일 전체를 복사해서 붙여넣고 Run 을 누릅니다.
 * 3. 실행 후 무적LG마당/승요인증/구장투어/twins뉴스/문의하기/가입인사/마이페이지를 새로고침하고
 *    목록·글쓰기·상세·댓글·등록·수정·삭제·회원정보 수정을 다시 확인합니다.
 *
 * 왜 필요한가:
 * - 게시판 테이블에 RLS(Row Level Security)가 켜져 있으면 insert/update/delete 정책이 없을 때
 *   프런트에서 쿼리를 호출해도 실제로 추가·수정·삭제되는 행이 0개가 될 수 있습니다.
 * - 아래 정책은 로그인한 사용자가 무적LG마당/승요인증/구장투어/twins뉴스/가입인사 글과 댓글을 읽고,
 *   본인이 작성한 글과 댓글만 작성·수정·삭제할 수 있게 제한합니다.
 * - 문의하기는 예외로 관리자만 전체 목록을 보고, 일반 사용자는 본인이 작성한 문의 목록·상세·댓글만 볼 수 있습니다.
 * - freeBoard, reviewBoard, stadiumTourBoard, twinsNewsBoard, inquiryBoard를 같은 테이블에서 관리하므로
 *   게시판별 RLS 정책에서 board_key 조건을 명확히 둡니다.
 * - 가입인사는 짧은 한줄 글과 댓글을 같은 signup_welcome_posts 테이블에서 parent_id로 구분합니다.
 */

create extension if not exists pgcrypto;

/*
 * =====================================================================
 * 마이페이지 회원 정보 동기화
 * =====================================================================
 *
 * 마이페이지는 supabase.auth.updateUser()로 auth.users의 raw_user_meta_data를 수정합니다.
 * 이 트리거는 변경된 닉네임·휴대폰을 public.member_accounts에도 복사해 아이디 찾기 기능과 같은 값을 보게 합니다.
 */

create table if not exists public.member_accounts (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.member_accounts is '회원가입·마이페이지 수정 시점 닉네임·휴대폰 — auth.users raw_user_meta_data 와 트리거로 동기화';

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

create or replace function public.member_accounts_sync_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  /*
   * 닉네임·휴대폰은 인증 사용자 메타데이터를 원본으로 삼습니다.
   * public.member_accounts를 직접 수정하지 않고 auth 업데이트를 기준으로 동기화해야 로그인 세션과 아이디 찾기 데이터가 어긋나지 않습니다.
   */
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

revoke all on function public.member_accounts_sync_from_auth() from public;

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
    board_key in ('freeBoard', 'reviewBoard', 'stadiumTourBoard', 'twinsNewsBoard', 'inquiryBoard')
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
 * 과거에 freeBoard/reviewBoard만 허용하는 check 제약으로 만들어 둔 DB도
 * 구장투어, twins뉴스, 문의하기까지 저장할 수 있게 기존 제약을 새 정의로 교체합니다.
 */
alter table public.board_posts
  drop constraint if exists board_posts_board_key_check;

alter table public.board_posts
  add constraint board_posts_board_key_check check (
    board_key in ('freeBoard', 'reviewBoard', 'stadiumTourBoard', 'twinsNewsBoard', 'inquiryBoard')
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

create index if not exists board_posts_review_board_created_idx
  on public.board_posts (created_at desc)
  where board_key = 'reviewBoard';

create index if not exists board_posts_stadium_tour_created_idx
  on public.board_posts (created_at desc)
  where board_key = 'stadiumTourBoard';

create index if not exists board_posts_twins_news_created_idx
  on public.board_posts (created_at desc)
  where board_key = 'twinsNewsBoard';

create index if not exists board_posts_inquiry_created_idx
  on public.board_posts (created_at desc)
  where board_key = 'inquiryBoard';

create index if not exists board_posts_inquiry_user_created_idx
  on public.board_posts (user_id, created_at desc)
  where board_key = 'inquiryBoard';

alter table public.board_posts enable row level security;

drop policy if exists free_board_select_authenticated on public.board_posts;
drop policy if exists free_board_insert_own on public.board_posts;
drop policy if exists free_board_update_own on public.board_posts;
drop policy if exists free_board_delete_own on public.board_posts;
drop policy if exists review_board_select_authenticated on public.board_posts;
drop policy if exists review_board_insert_own on public.board_posts;
drop policy if exists review_board_update_own on public.board_posts;
drop policy if exists review_board_delete_own on public.board_posts;
drop policy if exists stadium_tour_select_authenticated on public.board_posts;
drop policy if exists stadium_tour_insert_own on public.board_posts;
drop policy if exists stadium_tour_update_own on public.board_posts;
drop policy if exists stadium_tour_delete_own on public.board_posts;
drop policy if exists twins_news_select_authenticated on public.board_posts;
drop policy if exists twins_news_insert_own on public.board_posts;
drop policy if exists twins_news_update_own on public.board_posts;
drop policy if exists twins_news_delete_own on public.board_posts;
drop policy if exists inquiry_board_select_admin on public.board_posts;
drop policy if exists inquiry_board_select_admin_or_own on public.board_posts;
drop policy if exists inquiry_board_insert_own on public.board_posts;
drop policy if exists inquiry_board_update_admin on public.board_posts;
drop policy if exists inquiry_board_update_own on public.board_posts;
drop policy if exists inquiry_board_delete_admin on public.board_posts;
drop policy if exists inquiry_board_delete_own on public.board_posts;

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

create policy review_board_select_authenticated
  on public.board_posts
  for select
  to authenticated
  using (board_key = 'reviewBoard');

create policy review_board_insert_own
  on public.board_posts
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and board_key = 'reviewBoard'
  );

create policy review_board_update_own
  on public.board_posts
  for update
  to authenticated
  using (
    auth.uid() = user_id
    and board_key = 'reviewBoard'
  )
  with check (
    auth.uid() = user_id
    and board_key = 'reviewBoard'
  );

create policy review_board_delete_own
  on public.board_posts
  for delete
  to authenticated
  using (
    auth.uid() = user_id
    and board_key = 'reviewBoard'
  );

create policy stadium_tour_select_authenticated
  on public.board_posts
  for select
  to authenticated
  using (board_key = 'stadiumTourBoard');

create policy stadium_tour_insert_own
  on public.board_posts
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and board_key = 'stadiumTourBoard'
  );

create policy stadium_tour_update_own
  on public.board_posts
  for update
  to authenticated
  using (
    auth.uid() = user_id
    and board_key = 'stadiumTourBoard'
  )
  with check (
    auth.uid() = user_id
    and board_key = 'stadiumTourBoard'
  );

create policy stadium_tour_delete_own
  on public.board_posts
  for delete
  to authenticated
  using (
    auth.uid() = user_id
    and board_key = 'stadiumTourBoard'
  );

create policy twins_news_select_authenticated
  on public.board_posts
  for select
  to authenticated
  using (board_key = 'twinsNewsBoard');

create policy twins_news_insert_own
  on public.board_posts
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and board_key = 'twinsNewsBoard'
  );

create policy twins_news_update_own
  on public.board_posts
  for update
  to authenticated
  using (
    auth.uid() = user_id
    and board_key = 'twinsNewsBoard'
  )
  with check (
    auth.uid() = user_id
    and board_key = 'twinsNewsBoard'
  );

create policy twins_news_delete_own
  on public.board_posts
  for delete
  to authenticated
  using (
    auth.uid() = user_id
    and board_key = 'twinsNewsBoard'
  );

create policy inquiry_board_select_admin_or_own
  on public.board_posts
  for select
  to authenticated
  using (
    board_key = 'inquiryBoard'
    and (
      auth.jwt() ->> 'email' = 's2ckh1005@gmail.com'
      or auth.uid() = user_id
    )
  );

create policy inquiry_board_insert_own
  on public.board_posts
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and board_key = 'inquiryBoard'
  );

create policy inquiry_board_update_own
  on public.board_posts
  for update
  to authenticated
  using (
    board_key = 'inquiryBoard'
    and auth.uid() = user_id
  )
  with check (
    board_key = 'inquiryBoard'
    and auth.uid() = user_id
  );

create policy inquiry_board_delete_own
  on public.board_posts
  for delete
  to authenticated
  using (
    board_key = 'inquiryBoard'
    and auth.uid() = user_id
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
 * 게시판 댓글 · 대댓글
 * =====================================================================
 *
 * parent_id가 null이면 댓글, 값이 있으면 해당 댓글의 대댓글입니다.
 * post_id가 삭제되면 댓글도 함께 삭제되고, 부모 댓글을 삭제하면 대댓글도 함께 삭제됩니다.
 */

create table if not exists public.board_post_comments (
  id uuid primary key default gen_random_uuid(),
  board_key text not null,
  post_id uuid not null references public.board_posts (id) on delete cascade,
  parent_id uuid references public.board_post_comments (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null,
  author_display text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint board_post_comments_board_key_check check (
    board_key in ('freeBoard', 'reviewBoard', 'stadiumTourBoard', 'twinsNewsBoard', 'inquiryBoard')
  ),
  constraint board_post_comments_content_len_check check (
    char_length(trim(content)) > 0
    and char_length(content) <= 2000
  )
);

alter table public.board_post_comments
  drop constraint if exists board_post_comments_board_key_check;

alter table public.board_post_comments
  add constraint board_post_comments_board_key_check check (
    board_key in ('freeBoard', 'reviewBoard', 'stadiumTourBoard', 'twinsNewsBoard', 'inquiryBoard')
  );

create index if not exists board_post_comments_post_created_idx
  on public.board_post_comments (post_id, created_at asc);

create index if not exists board_post_comments_parent_created_idx
  on public.board_post_comments (parent_id, created_at asc);

create index if not exists board_post_comments_inquiry_post_created_idx
  on public.board_post_comments (post_id, created_at asc)
  where board_key = 'inquiryBoard';

alter table public.board_post_comments enable row level security;

drop policy if exists board_comments_select_authenticated on public.board_post_comments;
drop policy if exists board_comments_insert_own on public.board_post_comments;
drop policy if exists board_comments_update_own on public.board_post_comments;
drop policy if exists board_comments_delete_own on public.board_post_comments;
drop policy if exists board_comments_select_authenticated_or_inquiry_owner on public.board_post_comments;
drop policy if exists board_comments_insert_own_or_inquiry_participant on public.board_post_comments;

create policy board_comments_select_authenticated_or_inquiry_owner
  on public.board_post_comments
  for select
  to authenticated
  using (
    board_key <> 'inquiryBoard'
    or auth.jwt() ->> 'email' = 's2ckh1005@gmail.com'
    or exists (
      select 1
      from public.board_posts p
      where p.id = board_post_comments.post_id
        and p.board_key = 'inquiryBoard'
        and p.user_id = auth.uid()
    )
  );

create policy board_comments_insert_own_or_inquiry_participant
  on public.board_post_comments
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and board_key in ('freeBoard', 'reviewBoard', 'stadiumTourBoard', 'twinsNewsBoard', 'inquiryBoard')
    and exists (
      select 1
      from public.board_posts p
      where p.id = board_post_comments.post_id
        and p.board_key = board_post_comments.board_key
        and (
          board_post_comments.board_key <> 'inquiryBoard'
          or p.user_id = auth.uid()
          or auth.jwt() ->> 'email' = 's2ckh1005@gmail.com'
        )
    )
  );

create policy board_comments_update_own
  on public.board_post_comments
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and board_key in ('freeBoard', 'reviewBoard', 'stadiumTourBoard', 'twinsNewsBoard', 'inquiryBoard')
  );

create policy board_comments_delete_own
  on public.board_post_comments
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, delete on table public.board_post_comments to authenticated;
grant update (content) on table public.board_post_comments to authenticated;

create or replace function public.board_post_comments_set_author_and_audit()
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
     * 댓글 작성자명도 게시글과 동일하게 auth.users에서 확정합니다.
     * 클라이언트가 보내는 표시명을 믿지 않아 닉네임 조작을 막습니다.
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
  end if;

  if tg_op = 'UPDATE' then
    /*
     * 댓글 수정은 내용만 허용하고, 소유권·게시글 연결·작성일은 보존합니다.
     */
    new.board_key := old.board_key;
    new.post_id := old.post_id;
    new.parent_id := old.parent_id;
    new.user_id := old.user_id;
    new.author_display := old.author_display;
    new.created_at := old.created_at;
    new.updated_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists board_comments_before_insert_author on public.board_post_comments;
drop trigger if exists board_comments_before_update_audit on public.board_post_comments;

create trigger board_comments_before_insert_author
  before insert on public.board_post_comments
  for each row
  execute function public.board_post_comments_set_author_and_audit();

create trigger board_comments_before_update_audit
  before update on public.board_post_comments
  for each row
  execute function public.board_post_comments_set_author_and_audit();

revoke all on function public.board_post_comments_set_author_and_audit() from public;

/*
 * =====================================================================
 * 가입인사 글 · 댓글
 * =====================================================================
 *
 * parent_id가 null이면 가입인사 원글, 값이 있으면 해당 글에 달린 댓글입니다.
 * 원글을 삭제하면 연결된 댓글도 함께 삭제되도록 parent_id에 on delete cascade를 둡니다.
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

/*
 * 원글 기능만 먼저 만든 DB에도 댓글 parent_id 컬럼을 추가합니다.
 * 이미 컬럼이 있는 경우에는 건너뛰므로 SQL Editor에서 반복 실행해도 안전합니다.
 */
alter table public.signup_welcome_posts
  add column if not exists parent_id uuid references public.signup_welcome_posts (id) on delete cascade;

comment on table public.signup_welcome_posts is '가입인사 한줄 게시판 게시글과 댓글';
comment on column public.signup_welcome_posts.user_id is '작성자 auth.users id';
comment on column public.signup_welcome_posts.parent_id is '댓글 대상 글 id — null 이면 원글';
comment on column public.signup_welcome_posts.content is '가입인사 또는 댓글 내용';
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
   * 작성자명은 클라이언트에서 보내지 않고 auth.users에서 다시 가져옵니다.
   * 이렇게 해야 개발자도구로 author_display를 조작해도 실제 로그인 계정의 닉네임만 저장됩니다.
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
  end if;

  if tg_op = 'UPDATE' then
    /*
     * 가입인사 수정은 내용만 허용하고 작성자·부모 글·작성일은 보존합니다.
     * 프런트가 content만 보내더라도 DB 트리거에서 한 번 더 보호해 데이터 변조를 막습니다.
     */
    new.user_id := old.user_id;
    new.parent_id := old.parent_id;
    new.author_display := old.author_display;
    new.created_at := old.created_at;
  end if;

  return new;
end;
$$;

drop trigger if exists signup_welcome_before_insert_author on public.signup_welcome_posts;
drop trigger if exists signup_welcome_before_update_audit on public.signup_welcome_posts;

create trigger signup_welcome_before_insert_author
  before insert on public.signup_welcome_posts
  for each row
  execute function public.signup_welcome_set_author_display();

create trigger signup_welcome_before_update_audit
  before update on public.signup_welcome_posts
  for each row
  execute function public.signup_welcome_set_author_display();

revoke all on function public.signup_welcome_set_author_display() from public;

/*
 * =====================================================================
 * 무적LG마당 프런트 쿼리 예시 — 목록 · 상세 · 글쓰기 · 수정 · 삭제
 * =====================================================================
 */

-- 목록
-- select id, board_key, category, title, author_display, created_at, views
-- from public.board_posts
-- where board_key = 'freeBoard'
-- order by created_at desc
-- limit 10
-- offset 0;

-- 상세
-- select *
-- from public.board_posts
-- where id = '게시글_UUID'
--   and board_key = 'freeBoard';

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

/*
 * =====================================================================
 * 승요인증 프런트 쿼리 예시 — 목록 · 상세 · 글쓰기 · 수정 · 삭제
 * =====================================================================
 */

-- 목록
-- select id, board_key, category, title, content, html_content, author_display, created_at, views
-- from public.board_posts
-- where board_key = 'reviewBoard'
-- order by created_at desc
-- limit 10
-- offset 0;

-- 상세
-- select *
-- from public.board_posts
-- where id = '게시글_UUID'
--   and board_key = 'reviewBoard';

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
--   'reviewBoard',
--   auth.uid(),
--   '직관',
--   '승요인증 제목',
--   '목록 미리보기용 텍스트',
--   '<p>승요인증 본문 HTML</p>',
--   'default',
--   '16'
-- )
-- returning *;

-- 수정
-- update public.board_posts
-- set
--   category = '사진',
--   title = '수정한 승요인증 제목',
--   content = '수정한 목록 미리보기용 텍스트',
--   html_content = '<p>수정한 승요인증 본문 HTML</p>',
--   font_family = 'default',
--   font_size = '16'
-- where id = '게시글_UUID'
--   and board_key = 'reviewBoard'
-- returning *;

-- 삭제
-- delete from public.board_posts
-- where id = '게시글_UUID'
--   and board_key = 'reviewBoard';

/*
 * =====================================================================
 * 구장투어 프런트 쿼리 예시 — 목록 · 상세 · 글쓰기 · 수정 · 삭제
 * =====================================================================
 */

-- 목록
-- select id, board_key, category, title, author_display, created_at, views
-- from public.board_posts
-- where board_key = 'stadiumTourBoard'
-- order by created_at desc
-- limit 10
-- offset 0;

-- 상세
-- select *
-- from public.board_posts
-- where id = '게시글_UUID'
--   and board_key = 'stadiumTourBoard';

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
--   'stadiumTourBoard',
--   auth.uid(),
--   '잠실야구장',
--   '구장투어 제목',
--   '목록 미리보기용 텍스트',
--   '<p>구장투어 본문 HTML</p>',
--   'default',
--   '16'
-- )
-- returning *;

-- 수정
-- update public.board_posts
-- set
--   category = '고척야구장',
--   title = '수정한 구장투어 제목',
--   content = '수정한 목록 미리보기용 텍스트',
--   html_content = '<p>수정한 구장투어 본문 HTML</p>',
--   font_family = 'default',
--   font_size = '16'
-- where id = '게시글_UUID'
--   and board_key = 'stadiumTourBoard'
-- returning *;

-- 삭제
-- delete from public.board_posts
-- where id = '게시글_UUID'
--   and board_key = 'stadiumTourBoard';

/*
 * =====================================================================
 * twins뉴스 프런트 쿼리 예시 — 목록 · 상세 · 글쓰기 · 수정 · 삭제 · 댓글
 * =====================================================================
 */

-- 목록
-- select id, board_key, title, author_display, created_at, views
-- from public.board_posts
-- where board_key = 'twinsNewsBoard'
-- order by created_at desc
-- limit 10
-- offset 0;

-- 상세
-- select *
-- from public.board_posts
-- where id = '게시글_UUID'
--   and board_key = 'twinsNewsBoard';

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
--   'twinsNewsBoard',
--   auth.uid(),
--   '뉴스',
--   'twins뉴스 제목',
--   '목록 미리보기용 텍스트',
--   '<p>twins뉴스 본문 HTML</p>',
--   'default',
--   '16'
-- )
-- returning *;

-- 수정
-- update public.board_posts
-- set
--   category = '뉴스',
--   title = '수정한 twins뉴스 제목',
--   content = '수정한 목록 미리보기용 텍스트',
--   html_content = '<p>수정한 twins뉴스 본문 HTML</p>',
--   font_family = 'default',
--   font_size = '16'
-- where id = '게시글_UUID'
--   and board_key = 'twinsNewsBoard'
-- returning *;

-- 삭제
-- delete from public.board_posts
-- where id = '게시글_UUID'
--   and board_key = 'twinsNewsBoard';

-- 댓글 목록
-- select id, board_key, post_id, parent_id, user_id, content, author_display, created_at, updated_at
-- from public.board_post_comments
-- where post_id = '게시글_UUID'
--   and board_key = 'twinsNewsBoard'
-- order by created_at asc;

-- 댓글 글쓰기
-- insert into public.board_post_comments (
--   board_key,
--   post_id,
--   user_id,
--   content
-- )
-- values (
--   'twinsNewsBoard',
--   '게시글_UUID',
--   auth.uid(),
--   'twins뉴스 댓글 내용'
-- )
-- returning *;

-- 대댓글 글쓰기
-- insert into public.board_post_comments (
--   board_key,
--   post_id,
--   parent_id,
--   user_id,
--   content
-- )
-- values (
--   'twinsNewsBoard',
--   '게시글_UUID',
--   '부모_댓글_UUID',
--   auth.uid(),
--   'twins뉴스 대댓글 내용'
-- )
-- returning *;

-- 댓글 수정
-- update public.board_post_comments
-- set content = '수정한 twins뉴스 댓글 내용'
-- where id = '댓글_UUID'
--   and board_key = 'twinsNewsBoard'
-- returning *;

-- 댓글 삭제
-- delete from public.board_post_comments
-- where id = '댓글_UUID'
--   and board_key = 'twinsNewsBoard'
-- returning id;

/*
 * =====================================================================
 * 문의하기 프런트 쿼리 예시 — 목록 · 상세 · 글쓰기 · 댓글 · 수정 · 삭제
 * =====================================================================
 *
 * 전체 목록은 프런트에서 관리자만 보이게 하고, 일반 사용자는 본인이 작성한 문의 목록만 봅니다.
 * 상세 조회는 관리자 또는 글쓴이 본인만 가능하며, 수정/삭제는 글쓴이 본인만 허용합니다.
 */

-- 관리자 전용 목록
-- select id, board_key, title, author_display, created_at, views
-- from public.board_posts
-- where board_key = 'inquiryBoard'
-- order by created_at desc
-- limit 9
-- offset 0;
--
-- 글쓴이 본인 문의 목록
-- select id, board_key, title, author_display, created_at, views
-- from public.board_posts
-- where board_key = 'inquiryBoard'
--   and user_id = auth.uid()
-- order by created_at desc
-- limit 9
-- offset 0;

-- 상세 조회
-- 관리자 또는 글쓴이 본인만 결과가 반환됩니다.
-- select
--   id,
--   board_key,
--   user_id,
--   title,
--   content,
--   html_content,
--   font_family,
--   font_size,
--   author_display,
--   views,
--   created_at,
--   updated_at
-- from public.board_posts
-- where id = '게시글_UUID'
--   and board_key = 'inquiryBoard'
-- limit 1;

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
--   'inquiryBoard',
--   auth.uid(),
--   '문의',
--   '문의 제목',
--   '목록 미리보기용 텍스트',
--   '<p>문의 본문 HTML</p>',
--   'default',
--   '16'
-- )
-- returning *;

-- 댓글 목록
-- 관리자 또는 문의 글쓴이 본인만 문의 댓글을 볼 수 있습니다.
-- select id, board_key, post_id, parent_id, user_id, content, author_display, created_at, updated_at
-- from public.board_post_comments
-- where post_id = '게시글_UUID'
--   and board_key = 'inquiryBoard'
-- order by created_at asc;

-- 댓글 글쓰기
-- 문의 댓글은 문의 글쓴이 본인 또는 관리자만 등록할 수 있습니다.
-- insert into public.board_post_comments (
--   board_key,
--   post_id,
--   user_id,
--   content
-- )
-- values (
--   'inquiryBoard',
--   '게시글_UUID',
--   auth.uid(),
--   '문의 댓글 내용'
-- )
-- returning *;

-- 대댓글 글쓰기
-- insert into public.board_post_comments (
--   board_key,
--   post_id,
--   parent_id,
--   user_id,
--   content
-- )
-- values (
--   'inquiryBoard',
--   '게시글_UUID',
--   '부모_댓글_UUID',
--   auth.uid(),
--   '문의 대댓글 내용'
-- )
-- returning *;

-- 댓글 수정
-- 댓글 작성자 본인만 내용 수정이 가능합니다.
-- update public.board_post_comments
-- set content = '수정한 문의 댓글 내용'
-- where id = '댓글_UUID'
--   and board_key = 'inquiryBoard'
--   and user_id = auth.uid()
-- returning *;

-- 댓글 삭제
-- 댓글 작성자 본인만 삭제가 가능합니다.
-- delete from public.board_post_comments
-- where id = '댓글_UUID'
--   and board_key = 'inquiryBoard'
--   and user_id = auth.uid()
-- returning id;

-- 글쓴이 전용 수정
-- update public.board_posts
-- set
--   category = '문의',
--   title = '수정한 문의 제목',
--   content = '수정한 목록 미리보기용 텍스트',
--   html_content = '<p>수정한 문의 본문 HTML</p>',
--   font_family = 'default',
--   font_size = '16'
-- where id = '게시글_UUID'
--   and board_key = 'inquiryBoard'
--   and user_id = auth.uid()
-- returning *;

-- 글쓴이 전용 삭제
-- delete from public.board_posts
-- where id = '게시글_UUID'
--   and board_key = 'inquiryBoard'
--   and user_id = auth.uid();

/*
 * =====================================================================
 * 댓글 · 대댓글 프런트 쿼리 예시 — 다섯 게시판 공통
 * =====================================================================
 */

-- 댓글 목록
-- select id, board_key, post_id, parent_id, user_id, content, author_display, created_at, updated_at
-- from public.board_post_comments
-- where post_id = '게시글_UUID'
-- order by created_at asc;

-- 댓글 글쓰기
-- insert into public.board_post_comments (
--   board_key,
--   post_id,
--   user_id,
--   content
-- )
-- values (
--   'freeBoard', -- reviewBoard, stadiumTourBoard, twinsNewsBoard 또는 inquiryBoard
--   '게시글_UUID',
--   auth.uid(),
--   '댓글 내용'
-- )
-- returning *;

-- 대댓글 글쓰기
-- insert into public.board_post_comments (
--   board_key,
--   post_id,
--   parent_id,
--   user_id,
--   content
-- )
-- values (
--   'freeBoard', -- reviewBoard, stadiumTourBoard, twinsNewsBoard 또는 inquiryBoard
--   '게시글_UUID',
--   '부모_댓글_UUID',
--   auth.uid(),
--   '대댓글 내용'
-- )
-- returning *;

-- 댓글 수정
-- update public.board_post_comments
-- set content = '수정한 댓글 내용'
-- where id = '댓글_UUID'
-- returning *;

-- 댓글 삭제
-- delete from public.board_post_comments
-- where id = '댓글_UUID';

/*
 * =====================================================================
 * 가입인사 프런트 쿼리 예시 — 목록 · 등록 · 댓글 · 수정 · 삭제
 * =====================================================================
 */

-- 가입인사 목록
-- select id, user_id, parent_id, content, author_display, created_at
-- from public.signup_welcome_posts
-- order by created_at desc
-- limit 300;

-- 가입인사 등록
-- insert into public.signup_welcome_posts (
--   user_id,
--   content
-- )
-- values (
--   auth.uid(),
--   '가입인사 내용'
-- )
-- returning *;

-- 가입인사 댓글 등록
-- insert into public.signup_welcome_posts (
--   user_id,
--   parent_id,
--   content
-- )
-- values (
--   auth.uid(),
--   '원글_UUID',
--   '댓글 내용'
-- )
-- returning *;

-- 가입인사 수정
-- update public.signup_welcome_posts
-- set content = '수정한 가입인사 또는 댓글 내용'
-- where id = '가입인사_또는_댓글_UUID'
-- returning *;

-- 가입인사 삭제
-- delete from public.signup_welcome_posts
-- where id = '가입인사_또는_댓글_UUID'
-- returning id;

/*
 * =====================================================================
 * 마이페이지 프런트 쿼리 예시 — 내 정보 조회 · 수정
 * =====================================================================
 *
 * 중요:
 * - 마이페이지 수정은 public.member_accounts를 직접 update하지 않습니다.
 * - 프런트에서는 supabase.auth.updateUser()로 auth.users의 user_metadata를 수정합니다.
 * - 위쪽 member_accounts_after_auth_meta_update 트리거가 실행되면서 member_accounts에 자동 반영됩니다.
 * - 이렇게 해야 로그인 세션의 닉네임/휴대폰과 아이디 찾기용 member_accounts 값이 서로 어긋나지 않습니다.
 */

-- 내 정보 조회
-- select id, nickname, phone, created_at, updated_at
-- from public.member_accounts
-- where id = auth.uid();

-- 마이페이지 닉네임/휴대폰 수정은 프런트에서 아래 형태로 실행합니다.
-- SQL Editor에서 직접 실행하는 update 문이 아니라, Supabase Auth API 호출입니다.
-- const { error } = await supabase.auth.updateUser({
--   data: {
--     nickname: '수정한닉네임',
--     phone: '010-1234-5678'
--   }
-- })

-- 마이페이지 비밀번호까지 함께 수정할 때도 Auth API로 처리합니다.
-- const { error } = await supabase.auth.updateUser({
--   password: 'newPassword123',
--   data: {
--     nickname: '수정한닉네임',
--     phone: '010-1234-5678'
--   }
-- })

-- 수정 후 동기화 확인
-- select id, nickname, phone, updated_at
-- from public.member_accounts
-- where id = auth.uid();
