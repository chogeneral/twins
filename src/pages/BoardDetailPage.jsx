import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { cleanBoardHtmlContent } from '../lib/boardHtmlSanitizer'
import {
  createBoardComment,
  fetchBoardPost,
  fetchBoardComments,
  getBoardComments,
  getBoardPost,
  incrementBoardPostViews,
  isSharedBoardKey,
  removeBoardComment,
  removeBoardPost,
  saveBoardComment,
} from '../lib/boardPostStorage'
import './boardPage.css'
import './signupWelcomeBoard.css'

const boardDetailConfigs = {
  free: {
    boardKey: 'freeBoard',
    listPath: '/free-board',
    eyebrow: '무적LG마당',
    fallbackTitle: '무적LG마당',
  },
  review: {
    boardKey: 'reviewBoard',
    listPath: '/reviews',
    eyebrow: '승요인증',
    fallbackTitle: '승요인증',
  },
  stadiumTour: {
    boardKey: 'stadiumTourBoard',
    listPath: '/stadium-tour',
    eyebrow: '구장투어',
    fallbackTitle: '구장투어',
  },
  twinsNews: {
    boardKey: 'twinsNewsBoard',
    listPath: '/twins-news',
    eyebrow: 'twins뉴스',
    fallbackTitle: 'twins뉴스',
    showCategory: false,
  },
  inquiry: {
    boardKey: 'inquiryBoard',
    listPath: '/inquiry',
    eyebrow: '문의하기',
    fallbackTitle: '문의하기',
    showCategory: false,
    writerOnly: true,
  },
}

export function BoardDetailPage({ boardType }) {
  const config = boardDetailConfigs[boardType]
  const { postId } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading, nickname } = useAuth()
  const [post, setPost] = useState(null)
  const [postLoading, setPostLoading] = useState(Boolean(postId && isSharedBoardKey(config.boardKey)))
  const [comments, setComments] = useState([])
  const [commentDraft, setCommentDraft] = useState('')
  const [commentError, setCommentError] = useState('')
  const [commentsLoading, setCommentsLoading] = useState(Boolean(postId && isSharedBoardKey(config.boardKey)))
  const [replyTarget, setReplyTarget] = useState(null)
  const cleanedPostHtmlContent = useMemo(
    () => cleanBoardHtmlContent(post?.htmlContent ?? ''),
    [post?.htmlContent],
  )
  const [replyDraft, setReplyDraft] = useState('')
  const [replyError, setReplyError] = useState('')
  const [commentIsSecret, setCommentIsSecret] = useState(false)
  const [replyIsSecret, setReplyIsSecret] = useState(false)
  const loginRedirectHref = `/login?redirect=${encodeURIComponent(`${config.listPath}/${postId ?? ''}`)}`
  const authorDisplay = nickname || user?.email?.split('@')[0] || 'member'
  const isInquiryAdmin = config.boardKey === 'inquiryBoard' && user?.email === 's2ckh1005@gmail.com'
  const isPostOwner = Boolean(
    (post?.userId && post.userId === user?.id)
    || (!post?.userId && post?.author && post.author === authorDisplay),
  )
  const canReadPost = !config.writerOnly || !post || isPostOwner || isInquiryAdmin
  const canEditPost = Boolean(user && isPostOwner)

  /*
   * 비밀 댓글 열람 권한을 판별하는 헬퍼입니다.
   * 댓글 작성자 본인, 게시글 작성자, 관리자 세 경우에만 내용을 공개합니다.
   */
  const canReadSecret = (comment) => {
    if (!comment.isSecret) return true
    if (!user) return false
    if (user.id && comment.userId === user.id) return true
    if (post?.userId && post.userId === user.id) return true
    if (user.email === 's2ckh1005@gmail.com') return true
    return false
  }

  useEffect(() => {
    if (authLoading || !user || canReadPost) return
    window.alert('글쓴이만 볼 수 있습니다.')
  }, [authLoading, canReadPost, user])

  useEffect(() => {
    if (!postId) return

    /*
     * 상세 페이지에 들어왔을 때 조회수를 1 올리고, 갱신된 글을 화면에 표시합니다.
     * 공용 게시판은 Supabase에서 조회수를 올리고, 문의하기처럼 로컬 저장소 기반인 게시판은 기존 저장소를 사용합니다.
     */
    let ignore = false
    const timerId = window.setTimeout(async () => {
      setPostLoading(isSharedBoardKey(config.boardKey))
      setCommentsLoading(isSharedBoardKey(config.boardKey))

      try {
        const updatedPost = await incrementBoardPostViews(config.boardKey, postId)
        const nextPost = updatedPost ?? await fetchBoardPost(config.boardKey, postId)
        if (!ignore) {
          /*
           * DB 서버의 RPC 권한이나 네트워크 이슈로 인해 실시간 조회수가 제대로 반영되지 않고 0으로 올 경우,
           * 이미 목록 클릭을 통해 로컬/메모리 캐시에 누적되어 있던 더 높은 조회수 값(cachedPost.views)을 보존합니다.
           * 이를 통해 사용자 화면에서 조회수가 0으로 순간적으로 초기화되어 번쩍이는 오작동 현상을 방어합니다.
           */
          const cachedPost = getBoardPost(config.boardKey, postId)
          if (nextPost && cachedPost && nextPost.views < cachedPost.views) {
            nextPost.views = cachedPost.views
          }
          setPost(nextPost)
        }
      }
      catch {
        if (!ignore) {
          setPost(isSharedBoardKey(config.boardKey) ? null : getBoardPost(config.boardKey, postId))
        }
      }
      finally {
        if (!ignore) setPostLoading(false)
      }

      try {
        const nextComments = await fetchBoardComments(config.boardKey, postId)
        if (!ignore) setComments(nextComments)
      }
      catch {
        if (!ignore) {
          setComments(isSharedBoardKey(config.boardKey) ? [] : getBoardComments(config.boardKey, postId))
        }
      }
      finally {
        if (!ignore) setCommentsLoading(false)
      }
    }, 0)

    return () => {
      ignore = true
      window.clearTimeout(timerId)
    }
  }, [config.boardKey, postId])

  /*
   * 검색엔진 최적화(SEO) 및 네이버·구글 검색 로봇의 효과적인 정보 수집을 돕기 위해 구현한 동적 메타태그 갱신 로직입니다.
   * 게시글 데이터(post)가 성공적으로 로드되면, 기존의 공통 메타태그 정보를 해당 게시글에 맞는 고유 정보로 덮어씌웁니다.
   * - 브라우저 타이틀을 '게시글 제목 | 카테고리명 | 사이트명' 형태로 변경하여 탭에 명확히 표기합니다.
   * - 본문 콘텐츠(HTML 마크업 포함 가능)에서 텍스트만 추출하고 최대 150자까지 잘라 설명(description) 메타태그로 등록합니다.
   * - 오픈그래프(og:) 및 트위터 메타태그도 함께 갱신하여, 링크 공유 시 본문 제목과 요약 내용이 잘 노출되도록 지원합니다.
   * - 특히 구글 검색 노출 최적화(Rich Snippet)를 위해, 개별 게시글 고유의 구조화 데이터(JSON-LD - BlogPosting 스키마)를 head에 동적으로 생성 및 삽입합니다.
   * - 컴포넌트가 언마운트되거나 다른 글로 바뀔 때에는 변경 이전 브라우저 타이틀로 복구하고, 동적 생성된 JSON-LD 스크립트를 깔끔하게 청소합니다.
   */
  useEffect(() => {
    if (!post) return

    const originalTitle = document.title
    document.title = `${post.title} | ${config.eyebrow} | 유광 잠바`

    // HTML 태그를 정규식으로 제거하고 순수 텍스트만 추출하여 150자 내외 요약본을 만듭니다.
    const plainText = post.content || post.htmlContent?.replace(/<[^>]*>/g, '') || ''
    const descriptionText = plainText.trim().slice(0, 150)

    // 동적으로 head 내의 메타 태그를 찾아 속성을 업데이트하고, 없을 경우 새로 생성하여 주입하는 헬퍼 함수입니다.
    const upsertMeta = (selector, createMeta, valueAttribute, value) => {
      let element = document.head.querySelector(selector)
      if (!element) {
        element = createMeta()
        document.head.appendChild(element)
      }
      element.setAttribute(valueAttribute, value)
    }

    upsertMeta('meta[name="description"]', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      return meta
    }, 'content', descriptionText)

    upsertMeta('meta[property="og:title"]', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('property', 'og:title')
      return meta
    }, 'content', `${post.title} | ${config.eyebrow} | 유광 잠바`)

    upsertMeta('meta[property="og:description"]', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('property', 'og:description')
      return meta
    }, 'content', descriptionText)

    upsertMeta('meta[name="twitter:title"]', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('name', 'twitter:title')
      return meta
    }, 'content', `${post.title} | ${config.eyebrow} | 유광 잠바`)

    upsertMeta('meta[name="twitter:description"]', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('name', 'twitter:description')
      return meta
    }, 'content', descriptionText)

    // 구글 검색 로봇이 게시글 정보를 더 정확하게 구문 분석할 수 있도록 JSON-LD 구조화 데이터(BlogPosting)를 주입합니다.
    let schemaScript = document.head.querySelector('script[id="dynamicJsonLdSchema"]')
    if (!schemaScript) {
      schemaScript = document.createElement('script')
      schemaScript.setAttribute('id', 'dynamicJsonLdSchema')
      schemaScript.setAttribute('type', 'application/ld+json')
      document.head.appendChild(schemaScript)
    }

    // 날짜 포맷이 유효한지 확인하고 ISO 표준 형식으로 변환합니다.
    const datePublishedIso = post.date ? new Date(post.date).toISOString() : new Date().toISOString()

    const schemaData = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": post.title,
      "description": descriptionText,
      "author": {
        "@type": "Person",
        "name": post.author || "유광 잠바 회원"
      },
      "datePublished": datePublishedIso,
      "publisher": {
        "@type": "Organization",
        "name": "유광 잠바",
        "logo": {
          "@type": "ImageObject",
          "url": "https://twinsyugwang.jaelab.kr/lgTwinsEmblem.png"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": window.location.href
      }
    }

    schemaScript.textContent = JSON.stringify(schemaData)

    return () => {
      document.title = originalTitle
      if (schemaScript) {
        schemaScript.remove()
      }
    }
  }, [post, config.eyebrow])

  const detailClassName = useMemo(() => (
    [
      'boardPostContent',
      post?.fontFamily ? `boardBlogFont-${post.fontFamily}` : '',
    ].filter(Boolean).join(' ')
  ), [post?.fontFamily])

  const topLevelComments = useMemo(() => {
    const commentsById = new Map(
      comments.map((comment) => [comment.id, { ...comment, replies: [] }]),
    )
    const rootComments = []

    comments.forEach((comment) => {
      const commentNode = commentsById.get(comment.id)
      if (!commentNode) return

      if (comment.parentId && commentsById.has(comment.parentId)) {
        commentsById.get(comment.parentId).replies.push(commentNode)
        return
      }

      rootComments.push(commentNode)
    })

    return rootComments
  }, [comments])

  const refreshComments = async () => {
    if (!postId) return

    setCommentsLoading(isSharedBoardKey(config.boardKey))

    try {
      const nextComments = await fetchBoardComments(config.boardKey, postId)
      setComments(nextComments)
    }
    catch {
      setComments(isSharedBoardKey(config.boardKey) ? [] : getBoardComments(config.boardKey, postId))
    }
    finally {
      setCommentsLoading(false)
    }
  }

  const handleDeleteClick = async () => {
    if (!postId) return

    /*
     * 로컬 저장소 기반 게시판이라 삭제 즉시 복구가 어렵습니다.
     * 사용자가 실수로 누른 경우를 막기 위해 브라우저 확인창으로 한 번 더 의사를 확인합니다.
     */
    const confirmed = window.confirm('글을 삭제하시겠습니까?')
    if (!confirmed) return

    try {
      await removeBoardPost(config.boardKey, postId)
      navigate(config.listPath)
    }
    catch (deleteError) {
      window.alert(deleteError.message ?? '글을 삭제하지 못했습니다.')
    }
  }

  const handleCommentSubmit = async () => {
    if (!postId || !user) return

    const trimmed = commentDraft.trim()
    setCommentError('')

    if (!trimmed) {
      setCommentError('댓글 내용을 입력해 주세요.')
      return
    }

    try {
      await createBoardComment(config.boardKey, postId, {
        userId: user.id,
        authorDisplay,
        content: trimmed,
        isSecret: commentIsSecret,
      })
      setCommentDraft('')
      setCommentIsSecret(false)
      await refreshComments()
    }
    catch (submitError) {
      setCommentError(submitError.message ?? '댓글을 등록하지 못했습니다.')
    }
  }

  const handleReplySubmit = async () => {
    if (!postId || !user || !replyTarget) return

    const trimmed = replyDraft.trim()
    setReplyError('')

    if (!trimmed) {
      setReplyError('대댓글 내용을 입력해 주세요.')
      return
    }

    try {
      await createBoardComment(config.boardKey, postId, {
        parentId: replyTarget.id,
        userId: user.id,
        authorDisplay,
        content: trimmed,
        isSecret: replyIsSecret,
      })
      setReplyTarget(null)
      setReplyDraft('')
      setReplyIsSecret(false)
      await refreshComments()
    }
    catch (submitError) {
      setReplyError(submitError.message ?? '대댓글을 등록하지 못했습니다.')
    }
  }

  const handleCommentEdit = async (comment) => {
    if (!postId || !user || comment.userId !== user.id) return

    const nextContent = window.prompt('댓글을 수정해 주세요.', comment.content)
    if (nextContent === null) return

    const trimmed = nextContent.trim()
    if (!trimmed) {
      window.alert('댓글 내용을 입력해 주세요.')
      return
    }

    try {
      await saveBoardComment(config.boardKey, postId, comment.id, trimmed)
      await refreshComments()
    }
    catch (updateError) {
      window.alert(updateError.message ?? '댓글을 수정하지 못했습니다.')
    }
  }

  const handleCommentDelete = async (comment) => {
    if (!postId || !user || comment.userId !== user.id) return

    const confirmed = window.confirm('댓글을 삭제하시겠습니까? 달린 대댓글도 함께 삭제됩니다.')
    if (!confirmed) return

    try {
      await removeBoardComment(config.boardKey, postId, comment.id)
      await refreshComments()
    }
    catch (deleteError) {
      window.alert(deleteError.message ?? '댓글을 삭제하지 못했습니다.')
    }
  }

  const renderAvatar = (displayName) => (
    <span className="signupWelcomeAvatar" aria-hidden="true">
      {displayName?.trim()?.slice(0, 1) || '팬'}
    </span>
  )

  const renderCommentActions = (comment) => (
    <>
      <button
        type="button"
        className="signupWelcomeReplyTextBtn"
        onClick={() => {
          if (!user) {
            navigate(loginRedirectHref)
            return
          }
          setReplyTarget(comment)
          setReplyDraft('')
          setReplyError('')
        }}
      >
        댓글
      </button>
      {user && comment.userId === user.id && (
        <>
          <button
            type="button"
            className="signupWelcomeEditTextBtn"
            onClick={() => handleCommentEdit(comment)}
          >
            수정
          </button>
          <button
            type="button"
            className="signupWelcomeDeleteTextBtn"
            onClick={() => handleCommentDelete(comment)}
          >
            삭제
          </button>
        </>
      )}
    </>
  )

  const renderCommentRow = (comment, parentAuthorDisplay = '') => {
    const isReadable = canReadSecret(comment)
    return (
      <li key={comment.id} className="signupWelcomeReplyRow">
        <div className="signupWelcomeReplyCard">
          {renderAvatar(comment.authorDisplay)}
          <div className="signupWelcomeLineMeta">
            <span className="signupWelcomeLineNick">{comment.authorDisplay}</span>
            <span aria-hidden="true"> · </span>
            <time className="signupWelcomeLineDt">{comment.createdAt}</time>
            {comment.updatedAt && <span> · 수정됨</span>}
            {comment.isSecret && (
              <span className="boardCommentSecretBadge" aria-label="비밀 댓글">🔒</span>
            )}
          </div>
          <p className={isReadable ? 'signupWelcomeLineBody' : 'signupWelcomeLineBody boardCommentSecretBody'}>
            {!isReadable ? '비밀 댓글입니다.' : (
              <>
                {parentAuthorDisplay && (
                  <span className="signupWelcomeReplyMention">{parentAuthorDisplay}</span>
                )}
                {comment.content}
              </>
            )}
          </p>
          {renderCommentActions(comment)}
        </div>
        {comment.replies.length > 0 && (
          <ul className="signupWelcomeReplyList" aria-label={`${comment.authorDisplay}님 댓글의 대댓글`}>
            {comment.replies.map((reply) => renderCommentRow(reply, comment.authorDisplay))}
          </ul>
        )}
      </li>
    )
  }

  if (config.writerOnly && authLoading) {
    return (
      <article className="boardPage" aria-busy="true">
        <header className="boardHeader">
          <p lang="en" className="boardEyebrow">{config.eyebrow}</p>
          <h1 className="boardTitle">{config.fallbackTitle}</h1>
          <p className="boardDescription">로그인 여부를 확인하는 중입니다.</p>
        </header>
      </article>
    )
  }

  if (config.writerOnly && !user) {
    return <Navigate to={loginRedirectHref} replace />
  }

  if (!canReadPost) {
    return <Navigate to={config.listPath} replace />
  }

  if (postLoading) {
    return (
      <article className="boardPage" aria-busy="true">
        <header className="boardHeader">
          <p lang="en" className="boardEyebrow">{config.eyebrow}</p>
          <h1 className="boardTitle">{config.fallbackTitle}</h1>
          <p className="boardDescription">게시글을 불러오는 중입니다.</p>
        </header>
      </article>
    )
  }

  if (!post) {
    return (
      <article className="boardPage">
        <header className="boardHeader">
          <p lang="en" className="boardEyebrow">{config.eyebrow}</p>
          <h1 className="boardTitle">글을 찾을 수 없습니다</h1>
          <p className="boardDescription">삭제되었거나 현재 브라우저에 저장된 글이 아닙니다.</p>
        </header>
        <button type="button" className="boardWriteCancelBtn" onClick={() => navigate(config.listPath)}>
          목록
        </button>
      </article>
    )
  }

  const postMetaItems = [
    config.showCategory === false ? '' : post.category,
    post.author,
    post.date,
    `조회 ${Number(post.views ?? 0).toLocaleString('ko-KR')}`,
  ].filter(Boolean)

  return (
    <article className="boardPage">
      <header className="boardHeader boardDetailHeader">
        <p lang="en" className="boardEyebrow">{config.eyebrow}</p>
        <h1 className="boardTitle">{post.title}</h1>
        <p className="boardDescription">
          {postMetaItems.join(' · ')}
        </p>
      </header>

      <section className="boardPanel" aria-label={`${post.title} 본문`}>
        {post.htmlContent ? (
          <div
            className={detailClassName}
            style={post.fontSize ? { fontSize: `${post.fontSize}px` } : undefined}
            dangerouslySetInnerHTML={{ __html: cleanedPostHtmlContent }}
          />
        ) : (
          <p className="boardPostPlainContent">{post.content}</p>
        )}

        {post.tags && (
          <p className="boardPostTags">{post.tags}</p>
        )}

        <section className="boardCommentSection" aria-labelledby="boardCommentHeading">
          <h2 id="boardCommentHeading" className="boardCommentTitle">댓글</h2>

          {topLevelComments.length > 0 ? (
            <ul className="signupWelcomeLineList">
              {topLevelComments.map((comment) => (
                <li key={comment.id} className="signupWelcomeLineItem">
                  <div className="signupWelcomeLineRow">
                    {renderAvatar(comment.authorDisplay)}
                    <div className="signupWelcomeLineMeta">
                      <span className="signupWelcomeLineNick">{comment.authorDisplay}</span>
                      <span aria-hidden="true"> · </span>
                      <time className="signupWelcomeLineDt">{comment.createdAt}</time>
                      {comment.updatedAt && <span> · 수정됨</span>}
                      {comment.isSecret && (
                        <span className="boardCommentSecretBadge" aria-label="비밀 댓글">🔒</span>
                      )}
                    </div>
                    <p className={canReadSecret(comment) ? 'signupWelcomeLineBody' : 'signupWelcomeLineBody boardCommentSecretBody'}>
                      {canReadSecret(comment) ? comment.content : '비밀 댓글입니다.'}
                    </p>
                    {renderCommentActions(comment)}
                  </div>
                  {comment.replies.length > 0 && (
                    <ul className="signupWelcomeReplyList" aria-label={`${comment.authorDisplay}님 댓글의 대댓글`}>
                      {comment.replies.map((reply) => renderCommentRow(reply, comment.authorDisplay))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="boardCommentEmpty">
              {commentsLoading ? '댓글을 불러오는 중입니다.' : '첫 댓글을 남겨 보세요.'}
            </p>
          )}

          {user ? (
            <div className="signupWelcomeComposerInner boardCommentComposer">
              <div className="signupWelcomeComposerRow">
                <label htmlFor="boardCommentDraft" className="srOnly">댓글 작성</label>
                <textarea
                  id="boardCommentDraft"
                  className="signupWelcomeTextarea"
                  value={commentDraft}
                  maxLength={2000}
                  placeholder="댓글을 입력해 주세요."
                  onChange={(event) => {
                    setCommentDraft(event.target.value)
                    setCommentError('')
                  }}
                />
                <button
                  type="button"
                  className="signupWelcomeSubmitBtn"
                  disabled={!commentDraft.trim()}
                  onClick={handleCommentSubmit}
                >
                  확인
                </button>
              </div>
              <label className="boardCommentSecretCheck">
                <input
                  type="checkbox"
                  checked={commentIsSecret}
                  onChange={(e) => setCommentIsSecret(e.target.checked)}
                />
                비밀 댓글
              </label>
              {commentError && <p className="signupWelcomeError" role="alert">{commentError}</p>}
            </div>
          ) : (
            <div className="signupWelcomeComposerInner boardCommentComposer">
              <p className="boardCommentEmpty">댓글 작성은 로그인 후 이용할 수 있습니다.</p>
              <button type="button" className="signupWelcomeSubmitBtn" onClick={() => navigate(loginRedirectHref)}>
                로그인
              </button>
            </div>
          )}
        </section>

        <div className="boardWriteActions boardDetailActions">
          <button type="button" className="boardWriteCancelBtn" onClick={() => navigate(config.listPath)}>
            목록
          </button>
          {canEditPost && (
            <div className="boardDetailRightActions">
              <button type="button" className="boardWriteEditBtn" onClick={() => navigate(`${config.listPath}/${postId}/edit`)}>
                수정
              </button>
              <button type="button" className="boardWriteDeleteBtn" onClick={handleDeleteClick}>
                삭제
              </button>
            </div>
          )}
        </div>
      </section>

      {replyTarget && (
        <div
          className="signupWelcomeReplyModalBackdrop"
          onClick={() => setReplyTarget(null)}
        >
          <section
            className="signupWelcomeReplyModalDialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="boardReplyModalTitle"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="signupWelcomeReplyModalHeader">
              <div>
                <p className="signupWelcomeReplyModalEyebrow">reply</p>
                <h2 id="boardReplyModalTitle" className="signupWelcomeReplyModalTitle">댓글달기</h2>
              </div>
              <button
                type="button"
                className="signupWelcomeReplyModalClose"
                aria-label="댓글달기 모달 닫기"
                onClick={() => setReplyTarget(null)}
              >
                ×
              </button>
            </div>

            <div className="signupWelcomeReplyTarget">
              <span className="signupWelcomeLineNick">{replyTarget.authorDisplay}</span>
              <p className="signupWelcomeReplyTargetBody">{replyTarget.content}</p>
            </div>

            <label htmlFor="boardReplyDraft" className="signupWelcomeReplyLabel">댓글 내용</label>
            <textarea
              id="boardReplyDraft"
              className="signupWelcomeReplyTextarea"
              value={replyDraft}
              maxLength={2000}
              placeholder="대댓글을 입력해 주세요."
              onChange={(event) => {
                setReplyDraft(event.target.value)
                setReplyError('')
              }}
            />

            <label className="boardCommentSecretCheck">
              <input
                type="checkbox"
                checked={replyIsSecret}
                onChange={(e) => setReplyIsSecret(e.target.checked)}
              />
              비밀 댓글
            </label>

            <div className="signupWelcomeReplyModalFooter">
              <span className="signupWelcomeConfigHint">최대 2,000자</span>
              <button
                type="button"
                className="signupWelcomeReplySubmitBtn"
                disabled={!replyDraft.trim()}
                onClick={handleReplySubmit}
              >
                등록
              </button>
            </div>

            {replyError && <p className="signupWelcomeError" role="alert">{replyError}</p>}
          </section>
        </div>
      )}
    </article>
  )
}
