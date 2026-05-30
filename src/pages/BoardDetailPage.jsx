import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  addBoardComment,
  deleteBoardComment,
  deleteBoardPost,
  getBoardComments,
  getBoardPost,
  increaseBoardPostViews,
  updateBoardComment,
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
  const [comments, setComments] = useState([])
  const [commentDraft, setCommentDraft] = useState('')
  const [commentError, setCommentError] = useState('')
  const [replyTarget, setReplyTarget] = useState(null)
  const [replyDraft, setReplyDraft] = useState('')
  const [replyError, setReplyError] = useState('')
  const loginRedirectHref = `/login?redirect=${encodeURIComponent(`${config.listPath}/${postId ?? ''}`)}`
  const authorDisplay = nickname || user?.email?.split('@')[0] || 'member'
  const isInquiryAdmin = config.boardKey === 'inquiryBoard' && user?.email === 's2ckh1005@gmail.com'
  const isPostOwner = Boolean(
    (post?.userId && post.userId === user?.id)
    || (!post?.userId && post?.author && post.author === authorDisplay),
  )
  const canReadPost = !config.writerOnly || !post || isPostOwner || isInquiryAdmin
  const canEditPost = !config.writerOnly || isPostOwner

  useEffect(() => {
    if (authLoading || !user || canReadPost) return
    window.alert('글쓴이만 볼 수 있습니다.')
  }, [authLoading, canReadPost, user])

  useEffect(() => {
    if (!postId) return

    /*
     * 상세 페이지에 들어왔을 때 조회수를 1 올리고, 갱신된 글을 화면에 표시합니다.
     * 현재는 로컬 저장소 기반이라 서버 호출 없이 즉시 반영됩니다.
     */
    const timerId = window.setTimeout(() => {
      const updatedPost = increaseBoardPostViews(config.boardKey, postId)
      setPost(updatedPost ?? getBoardPost(config.boardKey, postId))
      setComments(getBoardComments(config.boardKey, postId))
    }, 0)

    return () => window.clearTimeout(timerId)
  }, [config.boardKey, postId])

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

  const refreshComments = () => {
    if (!postId) return
    setComments(getBoardComments(config.boardKey, postId))
  }

  const handleDeleteClick = () => {
    if (!postId) return

    /*
     * 로컬 저장소 기반 게시판이라 삭제 즉시 복구가 어렵습니다.
     * 사용자가 실수로 누른 경우를 막기 위해 브라우저 확인창으로 한 번 더 의사를 확인합니다.
     */
    const confirmed = window.confirm('글을 삭제하시겠습니까?')
    if (!confirmed) return

    deleteBoardPost(config.boardKey, postId)
    navigate(config.listPath)
  }

  const handleCommentSubmit = () => {
    if (!postId || !user) return

    const trimmed = commentDraft.trim()
    setCommentError('')

    if (!trimmed) {
      setCommentError('댓글 내용을 입력해 주세요.')
      return
    }

    addBoardComment(config.boardKey, postId, {
      userId: user.id,
      authorDisplay,
      content: trimmed,
    })
    setCommentDraft('')
    refreshComments()
  }

  const handleReplySubmit = () => {
    if (!postId || !user || !replyTarget) return

    const trimmed = replyDraft.trim()
    setReplyError('')

    if (!trimmed) {
      setReplyError('대댓글 내용을 입력해 주세요.')
      return
    }

    addBoardComment(config.boardKey, postId, {
      parentId: replyTarget.id,
      userId: user.id,
      authorDisplay,
      content: trimmed,
    })
    setReplyTarget(null)
    setReplyDraft('')
    refreshComments()
  }

  const handleCommentEdit = (comment) => {
    if (!postId || comment.userId !== user.id) return

    const nextContent = window.prompt('댓글을 수정해 주세요.', comment.content)
    if (nextContent === null) return

    const trimmed = nextContent.trim()
    if (!trimmed) {
      window.alert('댓글 내용을 입력해 주세요.')
      return
    }

    updateBoardComment(config.boardKey, postId, comment.id, trimmed)
    refreshComments()
  }

  const handleCommentDelete = (comment) => {
    if (!postId || comment.userId !== user.id) return

    const confirmed = window.confirm('댓글을 삭제하시겠습니까? 달린 대댓글도 함께 삭제됩니다.')
    if (!confirmed) return

    deleteBoardComment(config.boardKey, postId, comment.id)
    refreshComments()
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
          setReplyTarget(comment)
          setReplyDraft('')
          setReplyError('')
        }}
      >
        댓글
      </button>
      {comment.userId === user.id && (
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

  const renderCommentRow = (comment, parentAuthorDisplay = '') => (
    <li key={comment.id} className="signupWelcomeReplyRow">
      <div className="signupWelcomeReplyCard">
        {renderAvatar(comment.authorDisplay)}
        <div className="signupWelcomeLineMeta">
          <span className="signupWelcomeLineNick">{comment.authorDisplay}</span>
          <span aria-hidden="true"> · </span>
          <time className="signupWelcomeLineDt">{comment.createdAt}</time>
          {comment.updatedAt && <span> · 수정됨</span>}
        </div>
        <p className="signupWelcomeLineBody">
          {parentAuthorDisplay && (
            <span className="signupWelcomeReplyMention">{parentAuthorDisplay}</span>
          )}
          {comment.content}
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

  if (authLoading) {
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

  if (!user) {
    return <Navigate to={loginRedirectHref} replace />
  }

  if (!canReadPost) {
    return <Navigate to={config.listPath} replace />
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
      <header className="boardHeader">
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
            dangerouslySetInnerHTML={{ __html: post.htmlContent }}
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
                    </div>
                    <p className="signupWelcomeLineBody">{comment.content}</p>
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
            <p className="boardCommentEmpty">첫 댓글을 남겨 보세요.</p>
          )}

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
            {commentError && <p className="signupWelcomeError" role="alert">{commentError}</p>}
          </div>
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
