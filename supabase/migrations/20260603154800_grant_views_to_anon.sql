-- 비로그인(anon) 사용자도 상세 페이지 진입 시 조회수가 정상적으로 증가하도록 increment_board_post_views RPC 실행 권한을 부여합니다.
grant execute on function public.increment_board_post_views(uuid) to anon, authenticated;
