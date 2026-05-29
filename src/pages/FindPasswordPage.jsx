import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './findPasswordPage.css'

/**
 * Supabase resetPasswordForEmail 오류를 사용자 친화 문구로 바꿉니다.
 *
 * 왜 존재: 브라우저 개발자 도구에는 HTTP 상태(예: 429)·영문 메시지만 찍히는 경우가 많아서,
 * 화면에는 동일 원인임을 알 수 있는 한글 설명으로 연결하기 위함입니다.
 * (존재하지 않는 이메일도 성공처럼 응답할 수 있는 정책이 있어, 그 경우는 제네릭 문구로 둡니다.)
 */
function parseResetError(error) {
  if (!error) return '요청 처리 중 오류가 발생했습니다.'

  const msg = `${error.message ?? ''}`.toLowerCase()
  /* status: fetch 응답 코드, code: 일부 클라이언트에서 숫자 코드로 오는 경우 대비 */
  const httpLike = error.status ?? error.code
  /* 콘솔의 POST .../auth/v1/recover → 429 (Too Many Requests) 와 동일한 상황:
     짧은 시간에 재설정 메일 요청이 많을 때 Supabase Auth 가 막는 경우입니다. */
  if (
    httpLike === 429 ||
    msg.includes('429') ||
    msg.includes('rate limit') ||
    msg.includes('too many requests')
  ) {
    return (
      '비밀번호 재설정 메일 발송이 일시적으로 제한되었습니다. 잠시 후 다시 시도해 주세요. ' +
      '연속 테스트로 여러 번 보낸 경우 수십 분 걸릴 수 있습니다.'
    )
  }

  if (msg.includes('invalid email')) return '이메일 형식을 확인해 주세요.'
  return '비밀번호 재설정 메일을 보내지 못했습니다. 이메일을 확인하거나 나중에 다시 시도해 주세요.'
}

export function FindPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  /** 메일 발송 성공 시 안내 표시 — Supabase 설정에 따라 존재하지 않는 주소여도 같은 문구일 수 있음 */
  const [sentToEmail, setSentToEmail] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return

    if (!supabase) {
      setServerError('Supabase 설정(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)을 확인해 주세요.')
      return
    }

    setIsLoading(true)
    setServerError('')

    const redirectTo = `${window.location.origin}/login`

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    })

    setIsLoading(false)

    if (error) {
      setServerError(parseResetError(error))
      return
    }

    /* 인증 제공자 설정에 따라 가입 여부와 관계 없이 같은 응답일 수 있습니다. */
    setSentToEmail(email.trim())
  }

  if (sentToEmail) {
    return (
      <div className="findPasswordPage">
        <div className="findPasswordCard">
          <h1 className="findPasswordTitle">메일을 발송했습니다</h1>
          <p className="findPasswordSuccessBox" role="status">
            <strong>{sentToEmail}</strong>
            로 비밀번호 재설정 안내를 보냈습니다. 받은 편지함과 스팸함을 확인해 주세요.
            메일 속 링크를 눌러 새 비밀번호를 설정한 뒤 로그인 페이지에서 다시 들어오면 됩니다. 링크는 일정 시간 후 만료될 수
            있습니다.
          </p>
          
          <div className="findPasswordFooter">
            <button type="button" className="findPasswordBackBtn" onClick={() => navigate('/login')}>
              로그인으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="findPasswordPage">
      <div className="findPasswordCard">
        <h1 className="findPasswordTitle">비밀번호 찾기</h1>
        <p className="findPasswordLead">
          가입 시 사용한 <strong>이메일(로그인 아이디)</strong>를 입력하면 비밀번호 재설정 링크를 보냅니다.
      
        </p>

        <form className="findPasswordForm" onSubmit={handleSubmit} noValidate>
          <div className="findPasswordField">
            <label className="findPasswordLabel" htmlFor="findPasswordEmail">
              이메일
            </label>
            <input
              id="findPasswordEmail"
              className="findPasswordInput"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setServerError('')
              }}
              autoComplete="email"
              disabled={isLoading}
              required
            />
          </div>

          {serverError ? (
            <p className="findPasswordServerError" role="alert">
              {serverError}
            </p>
          ) : null}

          <button type="submit" className="findPasswordSubmitBtn" disabled={isLoading || !email.trim()}>
            {isLoading ? '발송 중...' : '재설정 메일 보내기'}
          </button>
        </form>

        <div className="findPasswordFooter">
          <button type="button" className="findPasswordBackBtn" onClick={() => navigate('/login')}>
            로그인으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  )
}
