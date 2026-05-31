/*
 * 게시판 검색 노출용 공개 읽기 정책
 * - 검색엔진과 비로그인 방문자가 게시판 목록·상세를 읽을 수 있어야 네이버/구글에 페이지가 노출됩니다.
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

alter table if exists public.signup_welcome_posts enable row level security;

drop policy if exists signup_welcome_select_public_read on public.signup_welcome_posts;

create policy signup_welcome_select_public_read
  on public.signup_welcome_posts
  for select
  to anon, authenticated
  using (true);

grant select on table public.signup_welcome_posts to anon;
