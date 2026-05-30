import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import './signupPage.css'
import './myPage.css'

const RULES = {
  nickname: (value) => {
    const trimmed = value.trim()
    if (trimmed.length < 2) return '닉네임은 2자 이상이어야 합니다.'
    if (trimmed.length > 10) return '닉네임은 10자 이하여야 합니다.'
    return ''
  },
  phone: (value) => /^010-\d{4}-\d{4}$/.test(value) ? '' : '010-0000-0000 형식으로 입력해 주세요.',
  password: (value) => {
    if (!value) return ''
    if (value.length < 8) return '비밀번호는 8자 이상이어야 합니다.'
    if (!/[a-zA-Z]/.test(value)) return '영문자를 포함해야 합니다.'
    if (!/\d/.test(value)) return '숫자를 포함해야 합니다.'
    return ''
  },
  passwordConfirm: (value, password) => {
    if (!password) return ''
    return value !== password ? '비밀번호가 일치하지 않습니다.' : ''
  },
}

function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (digits.length < 4) return digits
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

function parseProfileError(error) {
  if (!error) return ''
  if (error.message?.includes('Password should be')) return '비밀번호가 너무 짧습니다.'
  if (error.message?.includes('rate limit')) return '잠시 후 다시 시도해 주세요.'
  return '회원 정보를 수정하지 못했습니다. 잠시 후 다시 시도해 주세요.'
}

export function MyPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [form, setForm] = useState({
    nickname: '',
    phone: '',
    password: '',
    passwordConfirm: '',
  })
  const [touched, setTouched] = useState({})
  const [errors, setErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [serverError, setServerError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (!user) return

    /*
     * 가입 시 저장한 auth 메타데이터를 폼의 기준값으로 사용합니다.
     * member_accounts는 트리거 동기화용 테이블이라 화면에서는 로그인 세션이 가진 최신 값을 먼저 보여 줍니다.
     */
    setForm({
      nickname: user.user_metadata?.nickname ?? '',
      phone: user.user_metadata?.phone ?? '',
      password: '',
      passwordConfirm: '',
    })
    setTouched({})
    setErrors({})
    setServerError('')
    setSuccessMessage('')
  }, [user])

  const validate = (name, value, nextForm = form) => {
    if (name === 'passwordConfirm') return RULES.passwordConfirm(value, nextForm.password)
    return RULES[name]?.(value) ?? ''
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    const nextValue = name === 'phone' ? formatPhone(value) : value
    const nextForm = { ...form, [name]: nextValue }

    setForm(nextForm)
    setServerError('')
    setSuccessMessage('')

    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validate(name, nextValue, nextForm) }))
    }

    if (name === 'password' && touched.passwordConfirm) {
      setErrors((prev) => ({
        ...prev,
        passwordConfirm: RULES.passwordConfirm(nextForm.passwordConfirm, nextValue),
      }))
    }
  }

  const handleBlur = (event) => {
    const { name, value } = event.target
    setTouched((prev) => ({ ...prev, [name]: true }))
    setErrors((prev) => ({ ...prev, [name]: validate(name, value) }))
  }

  const getAllErrors = () => ({
    nickname: RULES.nickname(form.nickname),
    phone: RULES.phone(form.phone),
    password: RULES.password(form.password),
    passwordConfirm: RULES.passwordConfirm(form.passwordConfirm, form.password),
  })

  const isFormValid = () => Object.values(getAllErrors()).every((message) => message === '')

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!supabase || !user) return

    const allErrors = getAllErrors()
    setTouched({
      nickname: true,
      phone: true,
      password: Boolean(form.password),
      passwordConfirm: Boolean(form.password),
    })
    setErrors(allErrors)
    setServerError('')
    setSuccessMessage('')

    if (Object.values(allErrors).some((message) => message !== '')) return

    const nextMetadata = {
      ...(user.user_metadata ?? {}),
      nickname: form.nickname.trim(),
      phone: form.phone,
    }
    const updatePayload = {
      data: nextMetadata,
    }

    /*
     * 비밀번호는 입력한 경우에만 updateUser에 포함합니다.
     * 빈 문자열을 보내면 의도치 않은 인증 오류가 날 수 있어 프로필 수정과 비밀번호 수정을 분리해 처리합니다.
     */
    if (form.password) {
      updatePayload.password = form.password
    }

    setIsSaving(true)
    const { error } = await supabase.auth.updateUser(updatePayload)
    setIsSaving(false)

    if (error) {
      setServerError(parseProfileError(error))
      return
    }

    setForm((prev) => ({
      ...prev,
      password: '',
      passwordConfirm: '',
    }))
    setTouched({})
    setErrors({})
    setSuccessMessage('회원 정보가 수정되었습니다.')
  }

  if (authLoading) {
    return (
      <div className="signupPage">
        <div className="signupCard">
          <h1 className="signupTitle">마이페이지</h1>
          <p className="myPageHint">회원 정보를 불러오는 중입니다.</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login?redirect=%2Fmypage" replace />
  }

  return (
    <div className="signupPage">
      <div className="signupCard myPageCard">
        <div className="myPageHeader">
          <h1 className="signupTitle">마이페이지</h1>
          <p className="myPageHint">아이디와 회원 정보를 확인하고 수정할 수 있습니다.</p>
        </div>

        <form className="signupForm" onSubmit={handleSubmit} noValidate>
          <div className="signupField">
            <label className="signupLabel" htmlFor="myPageEmail">
              아이디
            </label>
            <input
              id="myPageEmail"
              className="signupInput myPageReadonlyInput"
              type="email"
              value={user.email ?? ''}
              readOnly
            />
          </div>

          <MyPageField
            id="myPageNickname"
            label="닉네임"
            name="nickname"
            type="text"
            placeholder="2~10자로 입력해 주세요"
            value={form.nickname}
            error={touched.nickname ? errors.nickname : ''}
            onChange={handleChange}
            onBlur={handleBlur}
            autoComplete="username"
            disabled={isSaving}
          />

          <MyPageField
            id="myPagePhone"
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
            disabled={isSaving}
          />

          <MyPageField
            id="myPagePassword"
            label="새 비밀번호"
            name="password"
            type="password"
            placeholder="변경할 때만 입력해 주세요"
            value={form.password}
            error={touched.password ? errors.password : ''}
            onChange={handleChange}
            onBlur={handleBlur}
            autoComplete="new-password"
            disabled={isSaving}
          />

          <MyPageField
            id="myPagePasswordConfirm"
            label="새 비밀번호 확인"
            name="passwordConfirm"
            type="password"
            placeholder="새 비밀번호를 다시 입력해 주세요"
            value={form.passwordConfirm}
            error={touched.passwordConfirm ? errors.passwordConfirm : ''}
            onChange={handleChange}
            onBlur={handleBlur}
            autoComplete="new-password"
            disabled={isSaving || !form.password}
          />

          {serverError && (
            <p className="signupServerError" role="alert">
              {serverError}
            </p>
          )}

          {successMessage && (
            <p className="myPageSuccess" role="status">
              {successMessage}
            </p>
          )}

          <div className="myPageActions">
            <button
              type="button"
              className="myPageCancelBtn"
              disabled={isSaving}
              onClick={() => navigate('/')}
            >
              취소
            </button>
            <button
              type="submit"
              className="signupSubmitBtn myPageSubmitBtn"
              disabled={isSaving || !isFormValid()}
            >
              {isSaving ? '수정 중...' : '정보 수정'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function MyPageField({
  id,
  label,
  name,
  type,
  placeholder,
  value,
  error,
  onChange,
  onBlur,
  autoComplete,
  inputMode,
  disabled,
}) {
  const hasError = error && error.length > 0

  return (
    <div className="signupField">
      <label className="signupLabel" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={`signupInput ${hasError ? 'signupInputError' : value && !hasError ? 'signupInputValid' : ''}`}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        autoComplete={autoComplete}
        inputMode={inputMode}
        disabled={disabled}
      />
      {hasError && <span className="signupError">{error}</span>}
    </div>
  )
}
