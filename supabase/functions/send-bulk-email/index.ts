import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

/**
 * 관리자 전용 Edge Function: 전체 가입 회원에게 일괄 메일 발송
 * - service_role 키를 서버 환경 변수에서만 읽어 auth.users 전체를 조회합니다.
 * - 관리자 이메일(ADMIN_EMAIL)이 아닌 호출자의 요청은 403으로 차단합니다.
 * - Supabase Auth 내장 SMTP(또는 설정된 외부 SMTP)를 통해 메일을 발송합니다.
 */

const ADMIN_EMAIL = 's2ckh1005@gmail.com'

// CORS 허용 헤더 — 브라우저 fetch에서 사전 요청(OPTIONS)을 통과시킵니다
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
  // 사전 요청(OPTIONS) 처리 — 브라우저 CORS 정책 충족용
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // 요청 헤더에서 JWT를 추출해 호출자가 관리자인지 검증합니다
    const authHeader = req.headers.get('Authorization') ?? ''
    const jwt = authHeader.replace('Bearer ', '')

    if (!jwt) {
      return new Response(JSON.stringify({ error: '인증 토큰이 필요합니다.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // anon 클라이언트로 JWT를 검증해 호출자의 이메일을 확인합니다
    const supabaseAnon = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const { data: { user: callerUser }, error: authError } = await supabaseAnon.auth.getUser(jwt)

    if (authError || !callerUser) {
      return new Response(JSON.stringify({ error: '유효하지 않은 토큰입니다.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 관리자 이메일이 아닌 경우 접근 금지
    if (callerUser.email !== ADMIN_EMAIL) {
      return new Response(JSON.stringify({ error: '관리자 권한이 필요합니다.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 요청 본문에서 메일 제목·내용을 파싱합니다
    const body = await req.json()
    const { subject, content } = body

    if (!subject?.trim() || !content?.trim()) {
      return new Response(JSON.stringify({ error: '제목과 내용을 모두 입력해 주세요.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // service_role 키로 auth.users 전체를 조회합니다 — 클라이언트에서는 절대 사용 불가
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // auth.users 목록을 페이지 단위로 모두 가져옵니다 (최대 1000명 단위)
    const allEmails: string[] = []
    let page = 1
    const perPage = 1000

    while (true) {
      const { data, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      })

      if (listError) {
        console.error('유저 목록 조회 실패:', listError)
        return new Response(JSON.stringify({ error: '회원 목록 조회에 실패했습니다.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const emails = data.users
        .map((u) => u.email)
        .filter((e): e is string => !!e)

      allEmails.push(...emails)

      // 마지막 페이지 여부를 total 카운트와 비교해 판단합니다
      if (data.users.length < perPage) break
      page++
    }

    if (allEmails.length === 0) {
      return new Response(JSON.stringify({ error: '발송할 회원이 없습니다.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Supabase Auth admin API의 generateLink를 활용하지 않고
    // Deno의 fetch로 Supabase 내장 SMTP(인증 서비스) 대신
    // 각 수신자에게 직접 메일을 보내는 방식으로 구현합니다.
    // Supabase의 커스텀 SMTP 설정을 사용하거나, 외부 메일 API(SendGrid 등)를 쓸 수 있습니다.
    // 여기서는 Supabase Auth invite 엔드포인트를 활용하지 않고,
    // 외부 SMTP 없이도 동작하는 Supabase Admin API sendEmail을 사용합니다.
    // (실제 운영은 Resend / SendGrid 등 외부 SMTP 연결을 권장합니다.)

    const results = {
      success: 0,
      failed: 0,
      total: allEmails.length,
    }

    // 메일 발송 결과 카운터 초기화

    // HTML 메일 본문 — 줄바꿈을 <br>로 변환합니다
    const htmlContent = `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Apple SD Gothic Neo',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;">
          <tr>
            <td style="background:#c0002f;padding:24px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">
                유광 잠바 · LG 트윈스 팬 커뮤니티
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 20px;color:#1a1a1a;font-size:18px;font-weight:700;">${subject}</h2>
              <div style="color:#333;font-size:15px;line-height:1.7;white-space:pre-wrap;">${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            </td>
          </tr>
          <tr>
            <td style="background:#f9f9f9;padding:20px 32px;border-top:1px solid #eee;">
              <p style="margin:0;color:#888;font-size:12px;text-align:center;">
                유광 잠바 · LG 트윈스 팬 커뮤니티 공식 이메일입니다.<br>
                문의: <a href="mailto:s2ckh1005@gmail.com" style="color:#c0002f;">s2ckh1005@gmail.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

    // Resend API 키를 환경 변수에서 읽습니다
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    /**
     * 발신 주소: Resend 무료 플랜은 도메인 인증 없이 onboarding@resend.dev만 허용합니다.
     * 커스텀 도메인 인증 후에는 원하는 주소(예: noreply@yourdomain.com)로 변경 가능합니다.
     */
    // ymckh1005.com 도메인 인증 완료 후 커스텀 발신 주소로 변경합니다
    const fromAddress = 'LG트윈스 팬 커뮤니티 유광잠바 <noreply@ymckh1005.com>'

    // Resend 무료 플랜은 초당 최대 2회 요청만 허용하므로 안전하게 1초 간격으로 발송합니다
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    for (const email of allEmails) {
      try {
        if (resendApiKey) {
          // Resend API를 통한 메일 발송
          const mailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: fromAddress,
              to: [email],
              subject,
              html: htmlContent,
            }),
          })

          if (mailRes.ok) {
            results.success++
          } else {
            const errText = await mailRes.text()
            console.error(`${email} 발송 실패:`, errText)
            results.failed++
          }
        } else {
          // Resend API 키 미설정 시 콘솔 로그만 (개발 환경 테스트용)
          console.log(`[메일 발송 시뮬레이션] 수신: ${email} | 제목: ${subject}`)
          results.success++
        }
      } catch (err) {
        console.error(`${email} 발송 중 에러:`, err)
        results.failed++
      }

      // Rate Limit 방지: 다음 발송 전 1초 대기 (초당 1회로 안전하게 제한)
      await delay(1000)
    }

    return new Response(
      JSON.stringify({
        message: `발송 완료: 성공 ${results.success}명, 실패 ${results.failed}명 (총 ${results.total}명)`,
        ...results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (err) {
    console.error('Edge Function 오류:', err)
    return new Response(JSON.stringify({ error: '서버 오류가 발생했습니다.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
