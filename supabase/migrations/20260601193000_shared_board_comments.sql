/*
 * 공용 게시판 댓글 공유 테이블
 * - 무적LG마당, 승요인증, 구장투어, twins뉴스 댓글을 기기/브라우저와 무관하게 공유합니다.
 * - 댓글 조회는 공개 게시판 상세에서 보이도록 anon/authenticated 모두 허용합니다.
 * - 작성, 수정, 삭제는 로그인 사용자 본인 댓글에만 허용합니다.
 */

create table if not exists public.board_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.board_posts (id) on delete cascade,
  parent_id uuid references public.board_comments (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  author_display text not null default '',
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint board_comments_content_len_check check (
    char_length(trim(content)) > 0
    and char_length(content) <= 2000
  )
);

comment on table public.board_comments is '무적LG마당·승요인증·구장투어·twins뉴스 게시글 댓글';
comment on column public.board_comments.parent_id is '대댓글 부모 댓글 id. null이면 원 댓글';
comment on column public.board_comments.author_display is '표시 닉네임 — INSERT 때 서버 트리거가 auth 메타데이터에서 채움';

create index if not exists board_comments_post_created_idx
  on public.board_comments (post_id, created_at asc);

create index if not exists board_comments_parent_idx
  on public.board_comments (parent_id);

alter table public.board_comments enable row level security;

drop policy if exists board_comments_select_public_read on public.board_comments;
drop policy if exists board_comments_insert_own on public.board_comments;
drop policy if exists board_comments_update_own on public.board_comments;
drop policy if exists board_comments_delete_own on public.board_comments;

create policy board_comments_select_public_read
  on public.board_comments
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.board_posts p
      where p.id = board_comments.post_id
        and p.board_key in ('freeBoard', 'reviewBoard', 'stadiumTourBoard', 'twinsNewsBoard')
    )
  );

create policy board_comments_insert_own
  on public.board_comments
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.board_posts p
      where p.id = board_comments.post_id
        and p.board_key in ('freeBoard', 'reviewBoard', 'stadiumTourBoard', 'twinsNewsBoard')
    )
  );

create policy board_comments_update_own
  on public.board_comments
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy board_comments_delete_own
  on public.board_comments
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant select on table public.board_comments to anon;
grant select, insert, delete on table public.board_comments to authenticated;
grant update (content) on table public.board_comments to authenticated;

create or replace function public.board_comments_set_author_and_audit()
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
     * 댓글 작성자명은 클라이언트 입력값을 믿지 않고 auth.users 메타데이터에서 확정합니다.
     * 닉네임이 없으면 이메일 앞부분을 사용해 기존 화면 표시 흐름과 맞춥니다.
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
     * 수정 시에는 본문만 바뀌어야 하므로 작성자, 원글, 부모 댓글, 작성일은 보존합니다.
     */
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

comment on function public.board_comments_set_author_and_audit() is '댓글 작성자명 확정 및 수정 시 보호 필드 유지';

drop trigger if exists board_comments_before_insert_author on public.board_comments;
drop trigger if exists board_comments_before_update_audit on public.board_comments;

create trigger board_comments_before_insert_author
  before insert on public.board_comments
  for each row
  execute function public.board_comments_set_author_and_audit();

create trigger board_comments_before_update_audit
  before update on public.board_comments
  for each row
  execute function public.board_comments_set_author_and_audit();

revoke all on function public.board_comments_set_author_and_audit() from public;
