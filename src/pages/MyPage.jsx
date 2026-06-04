import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useOutletContext } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import './signupPage.css'
import './myPage.css'

// 관리자 이메일 — 이 계정에만 전체 회원 메일 발송 UI가 노출됩니다
const ADMIN_EMAIL = 's2ckh1005@gmail.com'

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
  const { commentedPosts, postsLoading, fetchCommentedPosts, hasNewComment } = useOutletContext()

  /*
   * 마이페이지에 들어가면 알림이 즉시 초기화되므로, 진입 시점의 새 댓글 유무 상태를
   * 보존하여 화면의 "아이디" 라벨 옆에 N 배지를 지속적으로 노출하기 위해 로컬 상태로 정의합니다.
   */
  const [hasNewCommentAtMount] = useState(hasNewComment)

  const [form, setForm] = useState({
    nickname: '',
    phone: '',
    password: '',
    passwordConfirm: '',
  })
  const [touched, setTouched] = useState({})
  const [errors, setErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // 관리자 전용: 전체 회원 메일 발송 모달 상태
  const [bulkMailOpen, setBulkMailOpen] = useState(false)
  const [mailSubject, setMailSubject] = useState('')
  const [mailContent, setMailContent] = useState('')
  const [mailSending, setMailSending] = useState(false)
  const [mailResult, setMailResult] = useState('')
  const [mailError, setMailError] = useState('')
  const bulkMailDialogRef = useRef(null)

  // 현재 로그인 사용자가 관리자인지 여부
  const isAdmin = user?.email === ADMIN_EMAIL

  useEffect(() => {
    if (!user) return
    let isMounted = true

    queueMicrotask(() => {
      if (!isMounted) return

      /*
       * 먼저 세션 메타데이터로 화면을 빠르게 채우고, 아래 RPC에서 암호화 저장된 휴대폰 번호를 본인에게만 복호화해 다시 반영합니다.
       * 기존 DB 마이그레이션을 아직 적용하지 않은 환경도 깨지지 않도록, RPC 실패 시에는 메타데이터 기반 표시를 그대로 유지합니다.
       */
      setForm({
        nickname: user.user_metadata?.nickname ?? '',
        phone: formatPhone(user.user_metadata?.phone ?? ''),
        password: '',
        passwordConfirm: '',
      })
      setTouched({})
      setErrors({})
      setServerError('')
      setSuccessMessage('')
    })

    const loadEncryptedContactProfile = async () => {
      if (!supabase) return

      setProfileLoading(true)
      const { data, error } = await supabase.rpc('get_own_member_contact_profile')

      if (!isMounted) return

      setProfileLoading(false)

      if (error) return

      const profile = Array.isArray(data) ? data[0] : data
      if (!profile) return

      setForm((prev) => ({
        ...prev,
        nickname: profile.nickname ?? prev.nickname,
        phone: formatPhone(profile.phone ?? prev.phone),
        password: '',
        passwordConfirm: '',
      }))
    }

    loadEncryptedContactProfile()

    return () => {
      isMounted = false
    }
  }, [user])

  /*
   * 마이페이지 진입 시 부모 레이아웃에서 로드해 둔 댓글 목록을 최신화하기 위해 API 페치를 다시 실행하고,
   * 사용자가 모든 알림을 확인한 것으로 간주하여 마지막 확인 시간(last_viewed_comments_at)을
   * 로컬 스토리지 및 DB 유저 메타데이터에 반영합니다.
   * 또한 즉시 헤더 닉네임의 알림 배지(N 아이콘)가 소멸하도록 이벤트를 발송합니다.
   */
  useEffect(() => {
    if (!user) return

    const clearNoticeAndUpdate = async () => {
      fetchCommentedPosts()

      const now = new Date().toISOString()
      localStorage.setItem('last_viewed_comments_at', now)
      window.dispatchEvent(new Event('commentRead'))

      try {
        await supabase.auth.updateUser({
          data: {
            ...user.user_metadata,
            last_viewed_comments_at: now
          }
        })
      } catch (err) {
        console.error('댓글 확인 업데이트 실패:', err)
      }
    }

    clearNoticeAndUpdate()
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
      /*
       * 수정 화면은 사용자가 입력한 휴대폰 번호를 그대로 검증합니다.
       * 저장 직전 DB trigger가 phone을 암호화 메타데이터로 바꾸므로 클라이언트 세션에는 평문 저장을 의존하지 않습니다.
       */
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

  /**
   * 전체 회원 메일 발송 — Edge Function(send-bulk-email)을 호출합니다.
   * 클라이언트 세션의 JWT를 Authorization 헤더로 전달해 서버 측에서 관리자 여부를 재검증합니다.
   */
  const handleBulkMailSend = async () => {
    if (!supabase || !user) return

    if (!mailSubject.trim() || !mailContent.trim()) {
      setMailError('제목과 내용을 모두 입력해 주세요.')
      return
    }

    setMailSending(true)
    setMailError('')
    setMailResult('')

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const jwt = sessionData?.session?.access_token

      if (!jwt) {
        setMailError('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.')
        setMailSending(false)
        return
      }

      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-bulk-email`

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ subject: mailSubject, content: mailContent }),
      })

      const result = await response.json()

      if (!response.ok) {
        setMailError(result.error ?? '메일 발송에 실패했습니다.')
      } else {
        setMailResult(result.message ?? '발송 완료!')
        setMailSubject('')
        setMailContent('')
      }
    } catch (err) {
      console.error('메일 발송 오류:', err)
      setMailError('네트워크 오류가 발생했습니다.')
    } finally {
      setMailSending(false)
    }
  }

  /**
   * 메일 발송 모달을 닫을 때 입력 내용과 결과 메시지를 초기화합니다.
   */
  const handleBulkMailClose = () => {
    setBulkMailOpen(false)
    setMailSubject('')
    setMailContent('')
    setMailError('')
    setMailResult('')
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
      {/* 관리자 전용 전체 회원 메일 발송 모달 */}
      {isAdmin && bulkMailOpen && (
        <div
          className="bulkMailBackdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulkMailTitle"
          onClick={(e) => { if (e.target === e.currentTarget) handleBulkMailClose() }}
          onKeyDown={(e) => { if (e.key === 'Escape') handleBulkMailClose() }}
          tabIndex={-1}
          ref={bulkMailDialogRef}
        >
          <div className="bulkMailDialog">
            <div className="bulkMailHeader">
              <div>
                <p className="bulkMailEyebrow">ADMIN ONLY</p>
                <h2 id="bulkMailTitle" className="bulkMailTitle">전체 회원 메일 발송</h2>
              </div>
              <button
                type="button"
                className="bulkMailCloseBtn"
                aria-label="닫기"
                onClick={handleBulkMailClose}
                disabled={mailSending}
              >
                ✕
              </button>
            </div>

            <p className="bulkMailDesc">
              현재 가입된 <strong>모든 회원</strong>의 이메일로 메시지를 발송합니다.
            </p>

            <div className="bulkMailField">
              <label className="bulkMailLabel" htmlFor="bulkMailSubject">메일 제목</label>
              <input
                id="bulkMailSubject"
                className="bulkMailInput"
                type="text"
                placeholder="ex) 유광 잠바 공지사항"
                value={mailSubject}
                onChange={(e) => { setMailSubject(e.target.value); setMailError(''); setMailResult('') }}
                disabled={mailSending}
                maxLength={200}
              />
            </div>

            <div className="bulkMailField">
              <label className="bulkMailLabel" htmlFor="bulkMailContent">메일 내용</label>
              <textarea
                id="bulkMailContent"
                className="bulkMailTextarea"
                placeholder="회원들에게 전달할 내용을 입력해 주세요."
                value={mailContent}
                onChange={(e) => { setMailContent(e.target.value); setMailError(''); setMailResult('') }}
                disabled={mailSending}
                rows={8}
              />
            </div>

            {mailError && (
              <p className="bulkMailError" role="alert">{mailError}</p>
            )}
            {mailResult && (
              <p className="bulkMailSuccess" role="status">{mailResult}</p>
            )}

            <div className="bulkMailFooter">
              <button
                type="button"
                className="bulkMailCancelBtn"
                onClick={handleBulkMailClose}
                disabled={mailSending}
              >
                취소
              </button>
              <button
                type="button"
                id="bulkMailSendBtn"
                className="bulkMailSendBtn"
                onClick={handleBulkMailSend}
                disabled={mailSending || !mailSubject.trim() || !mailContent.trim()}
              >
                {mailSending ? '발송 중...' : '✉ 전체 발송'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="signupCard myPageCard">
        <div className="myPageHeader">
          <h1 className="signupTitle">마이페이지</h1>
          <p className="myPageHint">아이디와 회원 정보를 확인하고 수정할 수 있습니다.</p>
          {/* 관리자 계정에만 전체 회원 메일 발송 버튼을 노출합니다 */}
          {isAdmin && (
            <button
              type="button"
              id="adminBulkMailBtn"
              className="adminBulkMailBtn"
              onClick={() => setBulkMailOpen(true)}
            >
              ✉ 전체 회원 메일 발송
            </button>
          )}
        </div>

        {/* 댓글이 달린 게시글 목록을 표시하는 추가 영역입니다. */}
        <div className="myPageCommentedSection">
          <h2 className="myPageSubTitle">댓글 달린 게시글 목록</h2>
          {postsLoading ? null : commentedPosts.length === 0 ? (
            <p className="myPageListHint">댓글이 달린 게시글이 없습니다.</p>
          ) : (
            <div className="myPagePostList">
              {commentedPosts.map((post) => {
                let boardName = ''
                let boardPath = ''
                switch (post.board_key) {
                  case 'freeBoard':
                    boardName = '무적LG마당'
                    boardPath = `/free-board/${post.id}`
                    break
                  case 'reviewBoard':
                    boardName = '승요인증'
                    boardPath = `/reviews/${post.id}`
                    break
                  case 'stadiumTourBoard':
                    boardName = '구장투어'
                    boardPath = `/stadium-tour/${post.id}`
                    break
                  case 'twinsNewsBoard':
                    boardName = 'twins뉴스'
                    boardPath = `/twins-news/${post.id}`
                    break
                  default:
                    boardName = '게시판'
                    boardPath = '/'
                }

                return (
                  <div key={post.id} className="myPagePostItem" onClick={() => navigate(boardPath)}>
                    <div className="myPagePostMeta">
                      <span className="myPagePostBoard">{boardName}</span>
                      {post.category && <span className="myPagePostCategory">{post.category}</span>}
                    </div>
                    <div className="myPagePostTitleGroup">
                      <span className="myPagePostTitle">{post.title}</span>
                      <span className="myPagePostCommentCount">[{post.board_comments.length}]</span>
                    </div>
                    <span className="myPagePostDate">
                      {new Date(post.created_at).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      })}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <form className="signupForm" onSubmit={handleSubmit} noValidate>
          <div className="signupField">
            <label className="signupLabel" htmlFor="myPageEmail">
              아이디
              {hasNewCommentAtMount && <span className="nicknameBadge">N</span>}
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
            disabled={isSaving || profileLoading}
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
            disabled={isSaving || profileLoading}
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
              disabled={isSaving || profileLoading || !isFormValid()}
            >
              {isSaving ? '수정 중...' : profileLoading ? '정보 확인 중...' : '정보 수정'}
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
