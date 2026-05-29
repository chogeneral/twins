import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './findIdPage.css'

/**
 * 회원가입(SignupPage)과 동일한 하이픈 규칙으로 입력값을 맞춥니다.
 * DB 의 raw_user_meta_data.phone 과 형식이 같아야 find_login_identifier RPC 가 매칭됩니다.
 */
function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (digits.length < 4) return digits
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

/**
 * Supabase PostgREST / RPC 에서 자주 나오는 오류를 사용자 문구로 바꿉니다.
 * 함수 미적용 시에는 마이그레이션 안내로 유도합니다.
 */
function parseFindIdRpcError(error) {
  if (!error) return '조회 중 오류가 발생했습니다. 다시 시도해 주세요.'
  const msg = `${error.message ?? ''} ${error.details ?? ''}`
  if (
    error.code === 'PGRST202'
    || error.code === '42883'
    || msg.toLowerCase().includes('function')
    || msg.includes('find_login_identifier')
  ) {
    return '아이디 찾기 기능이 아직 데이터베이스에 등록되지 않았습니다. Supabase SQL Editor 에서 supabase/migrations 의 SQL 을 실행해 주세요. (supabase/README.md 참고)'
  }
  return '조회 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
}

export function FindIdPage() {
  const navigate = useNavigate()
  const [nickname, setNickname] = useState('')
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  /** RPC 가 돌려준 마스킹 이메일 문자열 — 있으면 성공 영역 표시 */
  const [maskedEmail, setMaskedEmail] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const nick = nickname.trim()
    if (!supabase) {
      setServerError('Supabase 설정(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)을 확인해 주세요.')
      return
    }
    if (nick.length < 2 || phone.trim().length < 10) return

    setIsLoading(true)
    setServerError('')
    setMaskedEmail('')

    const { data, error } = await supabase.rpc('find_login_identifier', {
      p_nickname: nick,
      p_phone: phone.trim(),
    })

    setIsLoading(false)

    if (error) {
      setServerError(parseFindIdRpcError(error))
      return
    }

    if (data && String(data).length > 0) {
      setMaskedEmail(String(data))
      return
    }

    setServerError('닉네임·휴대폰 정보가 일치하는 계정을 찾을 수 없습니다. 입력을 확인해 주세요.')
  }

  return (
    <div className="findIdPage">
      <div className="findIdCard">
        <h1 className="findIdTitle">아이디 찾기</h1>
        <p className="findIdLead">
          이 사이트의 로그인 아이디는 <strong>가입 시 등록한 이메일</strong>입니다. 가입 시 입력한 닉네임과 휴대폰 번호로 조회하면 마스킹된 이메일을 알려 드립니다.
        </p>

        {maskedEmail ? (
          <>
            <p className="findIdResultBox" role="status">
              등록된 로그인 아이디(이메일)는
              {' '}
              <span className="findIdResultEmail">{maskedEmail}</span>
              {' '}
              입니다. 전체 주소는 본인만 알 수 있도록 일부만 표시합니다.
            </p>
            <div className="findIdFooter">
              <button
                type="button"
                className="findIdBackBtn"
                onClick={() => {
                  setMaskedEmail('')
                  setNickname('')
                  setPhone('')
                  setServerError('')
                }}
              >
                다시 찾기
              </button>
            </div>
          </>
        ) : (
          <form className="findIdForm" onSubmit={handleSubmit} noValidate>
            <div className="findIdField">
              <label className="findIdLabel" htmlFor="findIdNickname">
                닉네임
              </label>
              <input
                id="findIdNickname"
                className="findIdInput"
                type="text"
                name="nickname"
                placeholder="회원가입 시 닉네임"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value)
                  setServerError('')
                }}
                autoComplete="username"
                disabled={isLoading}
                required
                minLength={2}
                maxLength={10}
              />
            </div>

            <div className="findIdField">
              <label className="findIdLabel" htmlFor="findIdPhone">
                휴대폰 번호
              </label>
              <input
                id="findIdPhone"
                className="findIdInput"
                type="tel"
                name="phone"
                placeholder="010-0000-0000"
                value={phone}
                onChange={(e) => {
                  setPhone(formatPhone(e.target.value))
                  setServerError('')
                }}
                autoComplete="tel"
                inputMode="numeric"
                disabled={isLoading}
                required
              />
            </div>

            {serverError && (
              <p className="findIdServerError" role="alert">
                {serverError}
              </p>
            )}

            <button
              type="submit"
              className="findIdSubmitBtn"
              disabled={isLoading || nickname.trim().length < 2 || phone.replace(/\D/g, '').length < 10}
            >
              {isLoading ? '조회 중...' : '아이디 찾기'}
            </button>
          </form>
        )}

        <div className="findIdFooter">
          <button
            type="button"
            className="findIdBackBtn"
            onClick={() => navigate('/login')}
          >
            로그인으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  )
}
