import { createClient } from '@supabase/supabase-js';

/**
 * Vite 빌드 시점에 주입되는 공개 환경 변수만 사용합니다.
 * URL + anon key는 브라우저에 노출되므로, 민감한 작업은 RLS(Row Level Security)로 막거나
 * 서버(Edge Function 등)에서 service role로 처리하는 것이 안전합니다.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Supabase 대시보드에서 Project Settings → API 에서 확인합니다.
 * 로컬 개발: 프로젝트 루트에 .env 파일을 두고 아래 두 변수를 설정한 뒤 dev 서버를 재시작합니다.
 */
if (!supabaseUrl || !supabaseAnonKey) {
  // 빌드/런타임에서 누락 시 즉시 알 수 있도록 합니다. (프로덕션 배포 전에 반드시 설정)
  console.warn(
    '[Supabase] VITE_SUPABASE_URL 또는 VITE_SUPABASE_ANON_KEY가 비어 있습니다. .env를 확인하세요.',
  );
}

/**
 * 앱 전역에서 하나의 클라이언트만 쓰면 연결·옵션이 일관됩니다.
 * anon key로는 RLS를 통과한 행만 읽기/쓰기 가능합니다.
 */
export const supabase = createClient(
  supabaseUrl ?? '',
  supabaseAnonKey ?? '',
  {
    auth: {
      // 세션을 localStorage에 두어 새로고침 후에도 로그인 유지 (기본값과 동일하지만 의도를 명시)
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);
