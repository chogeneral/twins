/*
 * =====================================================================
 * 가입인사 게시판 삭제 권한만 추가 — Supabase SQL Editor 실행용
 * =====================================================================
 *
 * 사용 방법:
 * 1. Supabase Dashboard → 프로젝트 → SQL Editor 로 이동합니다.
 * 2. 이 파일 전체를 복사해서 붙여넣고 Run 을 누릅니다.
 * 3. 실행 후 가입인사 페이지를 새로고침하고 삭제하기를 다시 눌러 확인합니다.
 *
 * 왜 필요한가:
 * - 가입인사 테이블에 RLS(Row Level Security)가 켜져 있으면 delete 정책이 없을 때
 *   프런트에서 delete()를 호출해도 실제로 지워지는 행이 0개가 될 수 있습니다.
 * - 아래 정책은 로그인한 사용자가 본인이 작성한 글/댓글만 삭제할 수 있게 합니다.
 */

alter table public.signup_welcome_posts enable row level security;

drop policy if exists signup_welcome_delete_own on public.signup_welcome_posts;

create policy signup_welcome_delete_own
  on public.signup_welcome_posts
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant delete on table public.signup_welcome_posts to authenticated;
