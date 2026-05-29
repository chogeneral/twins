import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './signupPage.css'

const RULES = {
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : '유효한 이메일 주소를 입력해 주세요.',
  nickname: (v) => {
    if (v.length < 2) return '닉네임은 2자 이상이어야 합니다.'
    if (v.length > 10) return '닉네임은 10자 이하여야 합니다.'
    return ''
  },
  phone: (v) => /^010-\d{4}-\d{4}$/.test(v) ? '' : '010-0000-0000 형식으로 입력해 주세요.',
  password: (v) => {
    if (v.length < 8) return '비밀번호는 8자 이상이어야 합니다.'
    if (!/[a-zA-Z]/.test(v)) return '영문자를 포함해야 합니다.'
    if (!/\d/.test(v)) return '숫자를 포함해야 합니다.'
    return ''
  },
  passwordConfirm: (v, password) => v !== password ? '비밀번호가 일치하지 않습니다.' : '',
}

/* Supabase 에러 코드를 사용자 친화적 메시지로 변환 */
function parseSupabaseError(error) {
  if (!error) return ''
  if (error.message?.includes('User already registered')) return '이미 사용 중인 이메일입니다.'
  if (error.message?.includes('Invalid email')) return '유효하지 않은 이메일입니다.'
  if (error.message?.includes('Password should be')) return '비밀번호가 너무 짧습니다.'
  if (error.message?.includes('rate limit')) return '잠시 후 다시 시도해 주세요.'
  return '회원가입 중 오류가 발생했습니다. 다시 시도해 주세요.'
}

/* 휴대폰 번호 입력 시 자동 하이픈 삽입 */
function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (digits.length < 4) return digits
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

export function SignupPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    email: '',
    nickname: '',
    phone: '',
    password: '',
    passwordConfirm: '',
  })

  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const validate = (name, value, currentForm) => {
    if (name === 'passwordConfirm') {
      return RULES.passwordConfirm(value, currentForm.password)
    }
    return RULES[name]?.(value) ?? ''
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    const next = name === 'phone' ? formatPhone(value) : value
    const nextForm = { ...form, [name]: next }
    setForm(nextForm)
    setServerError('')
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validate(name, next, nextForm) }))
    }
    if (name === 'password' && touched.passwordConfirm) {
      setErrors((prev) => ({
        ...prev,
        passwordConfirm: RULES.passwordConfirm(nextForm.passwordConfirm, next),
      }))
    }
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
    setErrors((prev) => ({ ...prev, [name]: validate(name, value, form) }))
  }

  const isFormValid = () =>
    Object.keys(RULES).every((key) => validate(key, form[key] ?? '', form) === '') &&
    Object.values(form).every((v) => v !== '')

  const handleSubmit = async (e) => {
    e.preventDefault()

    /* 모든 필드 touched 처리 후 에러 재검증 */
    const allTouched = Object.fromEntries(Object.keys(form).map((k) => [k, true]))
    const allErrors = Object.fromEntries(
      Object.keys(RULES).map((k) => [k, validate(k, form[k], form)])
    )
    setTouched(allTouched)
    setErrors(allErrors)
    if (Object.values(allErrors).some((msg) => msg !== '')) return

    setIsLoading(true)
    setServerError('')

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          nickname: form.nickname,
          phone: form.phone,
        },
      },
    })

    setIsLoading(false)

    if (error) {
      setServerError(parseSupabaseError(error))
      return
    }

    setIsSuccess(true)
  }

  if (isSuccess) {
    return (
      <div className="signupPage">
        <div className="signupCard">
          <div className="signupSuccessBox">
            <p className="signupSuccessIcon" aria-hidden="true">✉</p>
            <h1 className="signupSuccessTitle">인증 메일을 보냈습니다</h1>
            <p className="signupSuccessDesc">
              <strong>{form.email}</strong>로 발송된 인증 링크를 클릭하면 가입이 완료됩니다.
              스팸함도 확인해 주세요.
            </p>
            <button
              type="button"
              className="signupSubmitBtn"
              onClick={() => navigate('/login')}
            >
              로그인 페이지로 이동
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="signupPage">
      <div className="signupCard">
        <h1 className="signupTitle">회원가입</h1>

        <form className="signupForm" onSubmit={handleSubmit} noValidate>
          <SignupField
            id="signupEmail"
            label="이메일"
            name="email"
            type="email"
            placeholder="example@email.com"
            value={form.email}
            error={touched.email ? errors.email : ''}
            onChange={handleChange}
            onBlur={handleBlur}
            autoComplete="email"
            disabled={isLoading}
          />

          <SignupField
            id="signupNickname"
            label="닉네임"
            name="nickname"
            type="text"
            placeholder="2~10자로 입력해 주세요"
            value={form.nickname}
            error={touched.nickname ? errors.nickname : ''}
            onChange={handleChange}
            onBlur={handleBlur}
            autoComplete="username"
            disabled={isLoading}
          />

          <SignupField
            id="signupPhone"
            label="휴대폰 번호"
            name="phone"
            type="tel"
            placeholder="010-0000-0000"
            value={form.phone}
            error={touched.phone ? errors.phone : ''}
            onChange={handleChange}
            onBlur={handleBlur}
            autoComplete="tel"
            inputMode="numeric"
            disabled={isLoading}
          />

          <SignupField
            id="signupPassword"
            label="비밀번호"
            name="password"
            type="password"
            placeholder="영문+숫자 포함 8자 이상"
            value={form.password}
            error={touched.password ? errors.password : ''}
            onChange={handleChange}
            onBlur={handleBlur}
            autoComplete="new-password"
            disabled={isLoading}
          />

          <SignupField
            id="signupPasswordConfirm"
            label="비밀번호 확인"
            name="passwordConfirm"
            type="password"
            placeholder="비밀번호를 다시 입력해 주세요"
            value={form.passwordConfirm}
            error={touched.passwordConfirm ? errors.passwordConfirm : ''}
            onChange={handleChange}
            onBlur={handleBlur}
            autoComplete="new-password"
            disabled={isLoading}
          />

          {serverError && (
            <p className="signupServerError" role="alert">
              {serverError}
            </p>
          )}

          <button
            type="submit"
            className="signupSubmitBtn"
            disabled={!isFormValid() || isLoading}
          >
            {isLoading ? '가입 중...' : '가입하기'}
          </button>
        </form>

        <div className="signupFooter">
          <span className="signupFooterText">이미 계정이 있으신가요?</span>
          <button
            type="button"
            className="signupLoginLink"
            onClick={() => navigate('/login')}
          >
            로그인
          </button>
        </div>
      </div>
    </div>
  )
}

function SignupField({ id, label, name, type, placeholder, value, error, onChange, onBlur, autoComplete, inputMode, disabled }) {
  const hasError = error && error.length > 0
  const isValid = !hasError && value.length > 0

  return (
    <div className="signupField">
      <label className="signupLabel" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={['signupInput', hasError ? 'signupInputError' : '', isValid ? 'signupInputValid' : ''].filter(Boolean).join(' ')}
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        autoComplete={autoComplete}
        inputMode={inputMode}
        disabled={disabled}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${id}Error` : undefined}
        required
      />
      {hasError && (
        <span id={`${id}Error`} className="signupError" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
