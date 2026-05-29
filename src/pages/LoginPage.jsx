import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './loginPage.css'

function parseLoginError(error) {
  if (!error) return ''
  if (error.message?.includes('Invalid login credentials')) return '이메일 또는 비밀번호가 올바르지 않습니다.'
  if (error.message?.includes('Email not confirmed')) return '이메일 인증이 완료되지 않았습니다. 메일함을 확인해 주세요.'
  if (error.message?.includes('rate limit')) return '잠시 후 다시 시도해 주세요.'
  return '로그인 중 오류가 발생했습니다. 다시 시도해 주세요.'
}

/**
 * 로그인 성공 후 이동할 내부 경로만 허용합니다.
 * 외부 URL·프로토콜 포함 문자열(`//evil` 등) 은 거절해 오픈 리디렉션 가능성을 낮춥니다.
 */
function sanitizeInternalRedirect(raw) {
  if (raw == null || typeof raw !== 'string') return null
  const v = raw.trim()
  if (!v.startsWith('/') || v.length < 2) return null
  /* `//evil.com` 같이 프로토콜 상대 URL 방지 */
  if (v.startsWith('//')) return null
  if (v.includes('://')) return null
  if (v.includes('\\')) return null
  return v
}

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return

    setIsLoading(true)
    setServerError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    setIsLoading(false)

    if (error) {
      setServerError(parseLoginError(error))
      return
    }

    const nextPath = sanitizeInternalRedirect(searchParams.get('redirect'))
    navigate(nextPath ?? '/')
  }

  return (
    <div className="loginPage">
      <div className="loginCard">
        <h1 className="loginTitle">로그인</h1>

        <form className="loginForm" onSubmit={handleSubmit} noValidate>
          <div className="loginField">
            <label className="loginLabel" htmlFor="loginEmail">
              이메일
            </label>
            <input
              id="loginEmail"
              className="loginInput"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setServerError('') }}
              autoComplete="email"
              disabled={isLoading}
              required
            />
          </div>

          <div className="loginField">
            <label className="loginLabel" htmlFor="loginPassword">
              비밀번호
            </label>
            <input
              id="loginPassword"
              className="loginInput"
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setServerError('') }}
              autoComplete="current-password"
              disabled={isLoading}
              required
            />
          </div>

          {serverError && (
            <p className="loginServerError" role="alert">
              {serverError}
            </p>
          )}

          <button
            type="submit"
            className="loginSubmitBtn"
            disabled={isLoading || !email || !password}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="loginActions">
          <button
            type="button"
            className="loginActionBtn"
            onClick={() => navigate('/signup')}
          >
            회원가입
          </button>
          <span className="loginActionDivider" aria-hidden="true" />
          <button
            type="button"
            className="loginActionBtn"
            onClick={() => navigate('/find-id')}
          >
            아이디 찾기
          </button>
          <span className="loginActionDivider" aria-hidden="true" />
          <button
            type="button"
            className="loginActionBtn"
            onClick={() => navigate('/find-password')}
          >
            비밀번호 찾기
          </button>
        </div>
      </div>
    </div>
  )
}
