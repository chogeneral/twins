import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { deleteBoardPost, getBoardPost, increaseBoardPostViews } from '../lib/boardPostStorage'
import './boardPage.css'

const boardDetailConfigs = {
  free: {
    boardKey: 'freeBoard',
    listPath: '/free-board',
    eyebrow: 'community',
    fallbackTitle: '무적LG마당',
  },
  review: {
    boardKey: 'reviewBoard',
    listPath: '/reviews',
    eyebrow: 'win proof',
    fallbackTitle: '승요인증',
  },
  stadiumTour: {
    boardKey: 'stadiumTourBoard',
    listPath: '/stadium-tour',
    eyebrow: 'stadium tour',
    fallbackTitle: '구장투어',
  },
}

export function BoardDetailPage({ boardType }) {
  const config = boardDetailConfigs[boardType]
  const { postId } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [post, setPost] = useState(null)
  const loginRedirectHref = `/login?redirect=${encodeURIComponent(`${config.listPath}/${postId ?? ''}`)}`

  useEffect(() => {
    if (!postId) return

    /*
     * 상세 페이지에 들어왔을 때 조회수를 1 올리고, 갱신된 글을 화면에 표시합니다.
     * 현재는 로컬 저장소 기반이라 서버 호출 없이 즉시 반영됩니다.
     */
    const timerId = window.setTimeout(() => {
      const updatedPost = increaseBoardPostViews(config.boardKey, postId)
      setPost(updatedPost ?? getBoardPost(config.boardKey, postId))
    }, 0)

    return () => window.clearTimeout(timerId)
  }, [config.boardKey, postId])

  const detailClassName = useMemo(() => (
    [
      'boardPostContent',
      post?.fontFamily ? `boardBlogFont-${post.fontFamily}` : '',
    ].filter(Boolean).join(' ')
  ), [post?.fontFamily])

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

  return (
    <article className="boardPage">
      <header className="boardHeader">
        <p lang="en" className="boardEyebrow">{config.eyebrow}</p>
        <h1 className="boardTitle">{post.title}</h1>
        <p className="boardDescription">
          {post.category} · {post.author} · {post.date} · 조회 {Number(post.views ?? 0).toLocaleString('ko-KR')}
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

        <div className="boardWriteActions boardDetailActions">
          <button type="button" className="boardWriteCancelBtn" onClick={() => navigate(config.listPath)}>
            목록
          </button>
          <div className="boardDetailRightActions">
            <button type="button" className="boardWriteEditBtn" onClick={() => navigate(`${config.listPath}/${postId}/edit`)}>
              수정
            </button>
            <button type="button" className="boardWriteDeleteBtn" onClick={handleDeleteClick}>
              삭제
            </button>
          </div>
        </div>
      </section>
    </article>
  )
}
