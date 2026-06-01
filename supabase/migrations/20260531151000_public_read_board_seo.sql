/*
 * 게시판 검색 노출용 공개 읽기 정책
 * - 검색엔진과 비로그인 방문자가 게시판 목록·상세를 읽을 수 있어야 네이버/구글에 페이지가 노출됩니다.
 * - 댓글도 상세 페이지 일부이므로 공개 게시판 댓글은 함께 읽을 수 있어야 합니다.
 * - 글쓰기·수정·삭제 권한은 기존 authenticated 정책을 그대로 사용해 로그인 사용자에게만 허용합니다.
 * - 문의하기(inquiryBoard)는 개인정보성 문의가 들어갈 수 있으므로 공개 읽기 대상에서 제외합니다.
 */

alter table if exists public.board_posts enable row level security;

drop policy if exists board_posts_select_public_read on public.board_posts;

create policy board_posts_select_public_read
  on public.board_posts
  for select
  to anon, authenticated
  using (
    board_key in ('freeBoard', 'reviewBoard', 'stadiumTourBoard', 'twinsNewsBoard')
  );

grant select on table public.board_posts to anon;

do $$
begin
  if to_regclass('public.board_comments') is not null then
    /*
     * 댓글 테이블은 댓글 공유 마이그레이션을 적용한 뒤에 생길 수 있습니다.
     * 공개 게시판 상세에서 댓글까지 보이도록, 테이블이 있는 경우에만 공개 조회 정책을 갱신합니다.
     */
    alter table public.board_comments enable row level security;

    drop policy if exists board_comments_select_public_read on public.board_comments;

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

    grant select on table public.board_comments to anon;
  end if;
end
$$;

alter table if exists public.signup_welcome_posts enable row level security;

drop policy if exists signup_welcome_select_public_read on public.signup_welcome_posts;

create policy signup_welcome_select_public_read
  on public.signup_welcome_posts
  for select
  to anon, authenticated
  using (true);

grant select on table public.signup_welcome_posts to anon;
