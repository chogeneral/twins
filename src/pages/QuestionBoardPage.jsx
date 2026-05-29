/**
 * 가입인사(구 `/qna` 경로 유지): 한 줄 게시판입니다.
 * - 상단: 등록된 인사 글 목록(최신순), 하단: textarea + 확인으로 새 글을 공개합니다.
 * - 목록·작성 저장은 Supabase `signup_welcome_posts` 테이블을 사용합니다(마이그레이션 필요).
 *
 * 접근 통제:
 * - 비로그인 사용자가 이 경로로 들오면 즉시 `/login?redirect=/qna` 로 보냅니다.
 *   로그인 성공 후 `LoginPage`가 같은 `redirect` 쿼리를 읽어 가입인사로 되돌아갑니다.
 * - 따라서 「내비에서 가입인사 클릭 → 로그인 → 자동으로 가입인사」 흐름이 자연스럽게 됩니다.
 *
 * 접근성: 다른 게시판과 동일한 article / section / h 계층을 유지하고,
 * 새 글 영역에는 스크린리더용 숨김 제목(srOnly)을 두었습니다.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'

import './boardPage.css'
import './signupWelcomeBoard.css'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'

/** 게시판 경로 상수 — 로그인 후 되돌아올 때와 Navigate에 동일 문자열 사용 */
const qnaBoardPath = '/qna'

/** DB check 제약(길이)과 동일하게 맞춰 입력 상한 안내용 */
const maxContentLength = 2000

/**
 * 표시 포맷: 한국어 로컬에 맞춰 짧게 날짜·시간을 붙였습니다.
 * - 서버 타임존은 Supabase 기본 UTC이며 브라우저가 사용자 로컴로 바꿉니다.
 */
function formatPostedAt(isoString) {
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(isoString))
  }
  catch {
    return ''
  }
}

/** DB check 위반 코드 — 글 길이 제약 등 */
const pgCheckViolation = '23514'

/**
 * `signup_welcome_posts` 테이블이 없을 때 Postgres `42P01` 대신 PostgREST 가
 *「schema cache」「could not find the table」등 다른 문구만 주는 경우가 많습니다.
 * 그런 경우에도 마이그레이션 안내로 분기해, 사용자가 네트워크 문제로만 오해하지 않게 합니다.
 */
function isMissingSignupWelcomeTable(error) {
  if (!error) return false

  const code = String(error.code ?? '')
  const blob = [error.message, error.details, error.hint]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (code === '42P01') return true
  if (blob.includes('does not exist')) return true
  if (blob.includes('schema cache')) return true
  if (blob.includes('could not find the table')) return true
  /*
   * PostgREST 버전별로 코드만 오고 본문에 relation 문자열이 섞이는 패턴입니다.
   * (무작정 모든 PGRST 를 테이블 누락으로 보면 안 되므로 relation 과 함께만 매칭)
   */
  if (/^pgrst/i.test(code) && blob.includes('relation')) return true

  return false
}

const migrationHintMessage =
  '가입인사 게시판용 테이블이 아직 Supabase 에 없습니다. Dashboard → SQL Editor 에서 저장소 '
  + '`supabase/migrations/20260221130000_signup_and_find_id.sql` 전체를 실행하면 회원 기능과 함께 적용되며, '
  + '가입인사만 따로 필요하면 `20260520120000_signup_welcome_posts.sql` 만 실행하면 됩니다. '
  + 'CLI 는 `npm run db:push` 후 페이지 새로 고침해 주세요.'

export function QuestionBoardPage() {
  const { user, loading: authLoading } = useAuth()
  /** 로그인한 경우에만 Supabase 에서 채워지는 게시 목록입니다 */
  const [posts, setPosts] = useState([])
  const [listLoading, setListLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [listError, setListError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [replyModalPost, setReplyModalPost] = useState(null)
  const [replyDraft, setReplyDraft] = useState('')
  const [replySubmitting, setReplySubmitting] = useState(false)
  const [replyError, setReplyError] = useState('')
  const [deletingPostId, setDeletingPostId] = useState('')
  const [deleteError, setDeleteError] = useState('')

  const loginRedirectHref = useMemo(
    () => `/login?redirect=${encodeURIComponent(qnaBoardPath)}`,
    [],
  )

  const topLevelPosts = useMemo(() => {
    const postsById = new Map(
      posts.map((post) => [post.id, { ...post, replies: [] }]),
    )
    const rootPosts = []

    posts.forEach((post) => {
      const postNode = postsById.get(post.id)
      if (!postNode) return

      if (post.parent_id && postsById.has(post.parent_id)) {
        postsById.get(post.parent_id).replies.push(postNode)
        return
      }

      if (!post.parent_id) {
        rootPosts.push(postNode)
      }
    })

    /*
     * 원글은 Supabase 조회 최신순을 그대로 쓰고, 답글은 대화 흐름을 읽기 쉽도록 오래된 순서로 정렬합니다.
     * 댓글에도 답글을 달 수 있으므로 자식 replies 를 재귀적으로 정렬해 모든 단계의 읽는 순서를 맞춥니다.
     */
    const sortReplies = (replies) => {
      replies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      replies.forEach((reply) => sortReplies(reply.replies))
    }

    rootPosts.forEach((post) => sortReplies(post.replies))
    return rootPosts
  }, [posts])

  const handleReplyModalClose = useCallback(() => {
    setReplyModalPost(null)
    setReplyDraft('')
    setReplyError('')
  }, [])

  const loadPosts = useCallback(async () => {
    if (!supabase || !user) {
      setPosts([])
      setListLoading(false)
      return
    }

    setListLoading(true)
    setListError('')

    const { data, error } = await supabase
      .from('signup_welcome_posts')
      .select('id, user_id, parent_id, content, author_display, created_at')
      .order('created_at', { ascending: false })
      .limit(300)

    setListLoading(false)

    if (error) {
      /*
       * 마이그레이션 미적용·스키마 캐시에 테이블 없음 등은 네트워크와 구분하는 편이
       * 디버깅 시간을 크게 줄입니다.
       */
      setPosts([])
      setListError(
        isMissingSignupWelcomeTable(error)
          ? migrationHintMessage
          : '목록을 불러오지 못했습니다. 네트워크·`.env` 의 URL·키·dev 서버 재시작 여부를 확인 후 다시 시도해 주세요.',
      )
      return
    }

    setPosts(data ?? [])
  }, [user])

  /*
   * 인증 상태가 사용자로 확정된 뒤에만 목록을 가져와,
   * 비로그인 구간에서는 불필요한 호출과 깜박임을 줄였습니다.
   */
  useEffect(() => {
    if (authLoading) return
    if (!user) return

    /*
     * React Hooks 린트가 effect 본문에서 곧바로 상태 갱신이 일어나는 호출을 제한합니다.
     * 짧은 타이머로 목록 로딩을 예약해 렌더 완료 뒤 외부 데이터 동기화가 시작되게 했습니다.
     */
    const timerId = window.setTimeout(() => {
      void loadPosts()
    }, 0)

    return () => window.clearTimeout(timerId)
  }, [authLoading, user, loadPosts])

  useEffect(() => {
    if (!replyModalPost) return

    const onKeyDown = (event) => {
      if (event.key === 'Escape') handleReplyModalClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [replyModalPost, handleReplyModalClose])

  const handleConfirmClick = async () => {
    if (!supabase || !user) return

    const trimmed = draft.trim()
    setSubmitError('')

    if (!trimmed) {
      /*
       * 비어 있는 제출 방지 — 토스트 대신 같은 폼 아래 빨간 문구로 키보드 이용자에게도 즉시 읽히게 함
       */
      setSubmitError('내용을 입력한 뒤 확인을 눌러 주세요.')
      return
    }

    setSubmitting(true)

    /* user_id 만 전달하면 author_display는 DB 트리거가 채워 조작 불가 노출 이름을 고정함 */
    const { error } = await supabase.from('signup_welcome_posts').insert({
      user_id: user.id,
      content: trimmed,
    })

    setSubmitting(false)

    if (error) {
      if (isMissingSignupWelcomeTable(error)) {
        setSubmitError(migrationHintMessage)
        return
      }
      if (error.code === pgCheckViolation) {
        setSubmitError(`글 길이는 공백 제외 내용 기준 최대 ${maxContentLength}자까지 입력할 수 있습니다.`)
        return
      }
      setSubmitError(
        '등록하지 못했습니다. `.env` 의 Supabase URL·anon 키가 맞는지, dev 서버를 재시작했는지 확인해 주세요.',
      )
      return
    }

    /* 성공 후 입력 필드 초기화 + 목록 갱신 — 사용자가 즉시 본인 글을 확인하도록 했음 */
    setDraft('')
    void loadPosts()
  }

  const handleReplyClick = (post) => {
    setReplyModalPost(post)
    setReplyDraft('')
    setReplyError('')
  }

  const handleReplySubmit = async () => {
    if (!supabase || !user || !replyModalPost) return

    const trimmed = replyDraft.trim()
    setReplyError('')

    if (!trimmed) {
      /*
       * 모달 안에서 바로 오류를 보여 주어 사용자가 어느 입력을 고쳐야 하는지 놓치지 않게 합니다.
       * alert 대신 role="alert" 문구를 쓰면 스크린리더와 키보드 사용자에게도 같은 피드백이 전달됩니다.
       */
      setReplyError('답글 내용을 입력한 뒤 등록해 주세요.')
      return
    }

    setReplySubmitting(true)

    const { error } = await supabase.from('signup_welcome_posts').insert({
      user_id: user.id,
      parent_id: replyModalPost.id,
      content: trimmed,
    })

    setReplySubmitting(false)

    if (error) {
      if (isMissingSignupWelcomeTable(error)) {
        setReplyError(migrationHintMessage)
        return
      }
      if (error.code === pgCheckViolation) {
        setReplyError(`답글 길이는 공백 제외 내용 기준 최대 ${maxContentLength}자까지 입력할 수 있습니다.`)
        return
      }
      setReplyError('답글을 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.')
      return
    }

    handleReplyModalClose()
    void loadPosts()
  }

  const handleDeleteClick = async (post) => {
    if (!supabase || !user || !post) return

    /*
     * 삭제는 되돌리기 어렵고 원글 삭제 시 연결된 답글도 함께 지워집니다.
     * 그래서 바로 삭제하지 않고 한 번 확인해 실수 클릭으로 대화가 사라지는 일을 줄입니다.
     */
    const confirmed = window.confirm('이 글을 삭제하시겠습니까? 달린 답글도 함께 삭제됩니다.')
    if (!confirmed) return

    setDeleteError('')
    setDeletingPostId(post.id)

    const { data: deletedPost, error } = await supabase
      .from('signup_welcome_posts')
      .delete()
      .eq('id', post.id)
      .eq('user_id', user.id)
      .select('id')
      .maybeSingle()

    setDeletingPostId('')

    if (error) {
      if (isMissingSignupWelcomeTable(error)) {
        setDeleteError(migrationHintMessage)
        return
      }

      setDeleteError('삭제하지 못했습니다. 본인이 작성한 글인지 확인 후 다시 시도해 주세요.')
      return
    }

    if (!deletedPost) {
      setDeleteError('삭제 권한 SQL이 아직 Supabase에 적용되지 않았습니다. delete 정책 SQL을 실행해 주세요.')
      return
    }

    void loadPosts()
  }

  if (authLoading) {
    return (
      <article className="boardPage" aria-busy="true">
        <header className="boardHeader">
          <p lang="en" className="boardEyebrow">
            welcome
          </p>
          <h1 className="boardTitle">가입인사</h1>
          <p className="boardDescription">
            로그인 여부와 게시판 데이터를 불러오는 중입니다.
          </p>
        </header>
        <p className="signupWelcomeLoading">잠시만 기다려 주세요…</p>
      </article>
    )
  }

  /*
   * 비로그인 시 이 컴포넌트 내용 전체 대신 즉시 로그인 페이지로 치환합니다.
   * `replace` 를 써 뒤로 가기 스택을 남겨 헷갈리지 않도록 했습니다.
   */
  if (!user) {
    return <Navigate to={loginRedirectHref} replace />
  }

  const renderPostActions = (post) => (
    <>
      <button
        type="button"
        className="signupWelcomeReplyTextBtn"
        aria-label={`${post.author_display}님 글에 답글달기`}
        onClick={() => handleReplyClick(post)}
      >
        댓글
      </button>
      {post.user_id === user.id && (
        <button
          type="button"
          className="signupWelcomeDeleteTextBtn"
          disabled={deletingPostId === post.id}
          onClick={() => void handleDeleteClick(post)}
        >
          {deletingPostId === post.id ? '삭제 중…' : '삭제'}
        </button>
      )}
    </>
  )

  const renderAvatar = (displayName) => (
    <span className="signupWelcomeAvatar" aria-hidden="true">
      {displayName?.trim()?.slice(0, 1) || '팬'}
    </span>
  )

  const renderReplyRow = (reply, parentAuthorDisplay) => (
    <li key={reply.id} className="signupWelcomeReplyRow">
      <div className="signupWelcomeReplyCard">
        {renderAvatar(reply.author_display)}
        <div className="signupWelcomeLineMeta">
          <span className="signupWelcomeLineNick">{reply.author_display}</span>
          <span aria-hidden="true"> · </span>
          <time dateTime={reply.created_at} className="signupWelcomeLineDt">
            {formatPostedAt(reply.created_at)}
          </time>
        </div>
        <p className="signupWelcomeLineBody">
          {parentAuthorDisplay && (
            <span className="signupWelcomeReplyMention">{parentAuthorDisplay}</span>
          )}
          {reply.content}
        </p>
        {renderPostActions(reply)}
      </div>
      {reply.replies.length > 0 && (
        <ul className="signupWelcomeReplyList" aria-label={`${reply.author_display}님 댓글의 답글`}>
          {reply.replies.map((childReply) => renderReplyRow(childReply, reply.author_display))}
        </ul>
      )}
    </li>
  )

  return (
    <article className="boardPage">
      <header className="boardHeader">
        <p lang="en" className="boardEyebrow">
          welcome
        </p>
        <h1 className="boardTitle">가입인사</h1>
        <p className="boardDescription">
          커뮤니티에 처음 오신 엘린이 분들이 힌줄로 짧게 인사를 나누는 공간입니다.
        </p>
      </header>

      <section className="boardPanel" aria-labelledby="signupWelcomeBoardListHeading">
        <h2 id="signupWelcomeBoardListHeading" className="srOnly">
          가입인사 목록
        </h2>

        {listLoading && (
          <p className="signupWelcomeLoading" aria-live="polite">
            목록을 불러오는 중입니다…
          </p>
        )}

        {listError && (
          <p className="signupWelcomeError" role="alert">
            {listError}
          </p>
        )}

        {deleteError && (
          <p className="signupWelcomeError" role="alert">
            {deleteError}
          </p>
        )}

        {!listLoading && !listError && topLevelPosts.length === 0 && (
          <div className="emptyState" aria-live="polite">
            <h3 className="emptyTitle">첫 인사를 남겨 보세요</h3>
            <p className="emptyBody">아래 칸에 인사 한 줄을 쓰고 확인을 누르면 여기에 표시됩니다.</p>
          </div>
        )}

        {topLevelPosts.length > 0 && (
          <ul className="signupWelcomeLineList" aria-busy={listLoading ? 'true' : 'false'}>
            {topLevelPosts.map((row) => (
              <li key={row.id} className="signupWelcomeLineItem">
                <div className="signupWelcomeLineRow">
                  {renderAvatar(row.author_display)}
                  <div className="signupWelcomeLineMeta">
                    <span className="signupWelcomeLineNick">{row.author_display}</span>
                    <span aria-hidden="true"> · </span>
                    <time dateTime={row.created_at} className="signupWelcomeLineDt">
                      {formatPostedAt(row.created_at)}
                    </time>
                  </div>
                  <p className="signupWelcomeLineBody">{row.content}</p>
                  {renderPostActions(row)}
                </div>
                {row.replies.length > 0 && (
                  <ul className="signupWelcomeReplyList" aria-label={`${row.author_display}님 글의 답글`}>
                    {row.replies.map((reply) => renderReplyRow(reply, row.author_display))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="signupWelcomeComposerSection" aria-labelledby="signupWelcomeComposerHeading">
        <h2 id="signupWelcomeComposerHeading" className="srOnly">
          새 가입 인사 작성
        </h2>

        {!supabase && (
          <p className="signupWelcomeConfigHint" role="alert">
            Supabase 환경 변수가 비어 있습니다. 로컬 `.env`에 VITE_SUPABASE_URL·VITE_SUPABASE_ANON_KEY를 설정해야 글이
            저장됩니다.
          </p>
        )}

        {/* 텍스트 영역 오른쪽(좁은 폭에서는 아래 줄) 에 확인 버튼을 두어 한눈에 입력·등록 동선을 맞췄습니다 */}
        <div className="signupWelcomeComposerInner">
          <div className="signupWelcomeComposerRow">
            <label htmlFor="signupWelcomeDraft" className="srOnly">
              인사 글 작성
            </label>
            <textarea
              id="signupWelcomeDraft"
              className="signupWelcomeTextarea"
              value={draft}
              maxLength={maxContentLength}
              disabled={!supabase || submitting}
              placeholder="한 줄로 가볍게 인사를 적어 보세요."
              aria-describedby="signupWelcomeCharHint"
              onChange={(event) => {
                setDraft(event.target.value)
                setSubmitError('')
              }}
            />
            <button
              type="button"
              className="signupWelcomeSubmitBtn"
              disabled={!supabase || submitting || !draft.trim()}
              onClick={() => void handleConfirmClick()}
            >
              {submitting ? '등록 중…' : '확인'}
            </button>
          </div>
          <span id="signupWelcomeCharHint" className="signupWelcomeConfigHint">
            최대 {maxContentLength.toLocaleString()}자이하로 입력해주세요
          </span>
          {submitError && (
            <p className="signupWelcomeError" role="alert">
              {submitError}
            </p>
          )}
        </div>
      </section>

      {replyModalPost && (
        <div
          className="signupWelcomeReplyModalBackdrop"
          onClick={handleReplyModalClose}
        >
          <section
            className="signupWelcomeReplyModalDialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="signupWelcomeReplyModalTitle"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="signupWelcomeReplyModalHeader">
              <div>
                <p className="signupWelcomeReplyModalEyebrow">reply</p>
                <h2 id="signupWelcomeReplyModalTitle" className="signupWelcomeReplyModalTitle">
                  답글달기
                </h2>
              </div>
              <button
                type="button"
                className="signupWelcomeReplyModalClose"
                aria-label="답글달기 모달 닫기"
                onClick={handleReplyModalClose}
              >
                ×
              </button>
            </div>

            <div className="signupWelcomeReplyTarget">
              <span className="signupWelcomeLineNick">{replyModalPost.author_display}</span>
              <p className="signupWelcomeReplyTargetBody">{replyModalPost.content}</p>
            </div>

            <label htmlFor="signupWelcomeReplyDraft" className="signupWelcomeReplyLabel">
              답글 내용
            </label>
            <textarea
              id="signupWelcomeReplyDraft"
              className="signupWelcomeReplyTextarea"
              value={replyDraft}
              maxLength={maxContentLength}
              disabled={replySubmitting}
              placeholder="따뜻한 답글을 남겨 보세요."
              onChange={(event) => {
                setReplyDraft(event.target.value)
                setReplyError('')
              }}
            />

            <div className="signupWelcomeReplyModalFooter">
              <span className="signupWelcomeConfigHint">
                최대 {maxContentLength.toLocaleString()}자
              </span>
              <button
                type="button"
                className="signupWelcomeReplySubmitBtn"
                disabled={replySubmitting || !replyDraft.trim()}
                onClick={() => void handleReplySubmit()}
              >
                {replySubmitting ? '등록 중…' : '등록'}
              </button>
            </div>

            {replyError && (
              <p className="signupWelcomeError" role="alert">
                {replyError}
              </p>
            )}
          </section>
        </div>
      )}
    </article>
  )
}
