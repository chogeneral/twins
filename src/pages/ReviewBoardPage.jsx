/**
 * 승요인증: 승리·현장 인증 등 팬들이 사진·글로 남기는 전용 탭입니다.
 * - 무적LG마당(`FreeBoardPage`)과 동일한 헤더/목록 뼈대로 일관된 문서 접근 패턴을 유지했습니다.
 */

import { Navigate, useNavigate } from 'react-router-dom'
import { BoardListTable } from '../components/BoardListTable'
import { useAuth } from '../hooks/useAuth'
import { getBoardPosts } from '../lib/boardPostStorage'
import './boardPage.css'

const reviewBoardPath = '/reviews'

export function ReviewBoardPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const loginRedirectHref = `/login?redirect=${encodeURIComponent(reviewBoardPath)}`

  if (authLoading) {
    return (
      <article className="boardPage" aria-busy="true">
        <header className="boardHeader">
          <p lang="en" className="boardEyebrow">win proof</p>
          <h1 className="boardTitle">승요인증</h1>
          <p className="boardDescription">로그인 여부를 확인하는 중입니다.</p>
        </header>
      </article>
    )
  }

  if (!user) {
    return <Navigate to={loginRedirectHref} replace />
  }

  const reviewBoardRows = getBoardPosts('reviewBoard')

  return (
    <article className="boardPage">
      <header className="boardHeader">
        <p lang="en" className="boardEyebrow">
          win proof
        </p>
        <h1 className="boardTitle">승요인증</h1>
        <p className="boardDescription">
          경기 승리 순간, 응원 현장, 기념 사진 등 승요 인증을 남기고 서로 공유해 주세요.
        </p>
      </header>

      <section
        className="boardPanel"
        aria-labelledby="sungyoBoardListHeading"
      >
        <h2 id="sungyoBoardListHeading" className="srOnly">
          승요인증 목록
        </h2>
        <BoardListTable
          rows={reviewBoardRows}
          caption="승요인증 게시글 목록"
          detailBasePath="/reviews"
          bottomAction={(
            <button type="button" className="boardWriteLinkBtn" onClick={() => navigate('/reviews/write')}>
              글쓰기
            </button>
          )}
        />
      </section>
    </article>
  )
}
