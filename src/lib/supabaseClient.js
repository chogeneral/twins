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
  console.warn(
    '[Supabase] VITE_SUPABASE_URL 또는 VITE_SUPABASE_ANON_KEY가 비어 있습니다. .env를 확인하세요.',
  );
}

/* 환경 변수 누락 시 createClient 호출 자체를 막아 런타임 에러를 방지합니다 */
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
