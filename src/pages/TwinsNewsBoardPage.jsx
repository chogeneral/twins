/**
 * twins뉴스 게시판: LG 트윈스 관련 소식과 기사 링크를 모아 보는 공간입니다.
 * - 기존 공통 게시판 목록 컴포넌트를 그대로 사용하되, 뉴스는 분류가 필요 없어서 구분 컬럼을 숨깁니다.
 */

import { Navigate, useNavigate } from 'react-router-dom'
import { BoardListTable } from '../components/BoardListTable'
import { useAuth } from '../hooks/useAuth'
import { getBoardPosts } from '../lib/boardPostStorage'
import './boardPage.css'

const twinsNewsBoardPath = '/twins-news'

export function TwinsNewsBoardPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const loginRedirectHref = `/login?redirect=${encodeURIComponent(twinsNewsBoardPath)}`

  if (authLoading) {
    return (
      <article className="boardPage" aria-busy="true">
        <header className="boardHeader">
      
          <h1 className="boardTitle">twins뉴스</h1>
          <p className="boardDescription">로그인 여부를 확인하는 중입니다.</p>
        </header>
      </article>
    )
  }

  if (!user) {
    return <Navigate to={loginRedirectHref} replace />
  }

  const twinsNewsRows = getBoardPosts('twinsNewsBoard')

  return (
    <article className="boardPage">
      <header className="boardHeader">
        
        <h1 className="boardTitle">twins뉴스</h1>
        <p className="boardDescription">
          LG 트윈스 관련 뉴스, 경기 소식, 인터뷰를 함께 공유하는 공간입니다.
        </p>
      </header>

      <section
        className="boardPanel"
        aria-labelledby="twinsNewsBoardListHeading"
      >
        <h2 id="twinsNewsBoardListHeading" className="srOnly">
          twins뉴스 게시글 목록
        </h2>
        <BoardListTable
          rows={twinsNewsRows}
          caption="twins뉴스 게시글 목록"
          detailBasePath="/twins-news"
          showCategory={false}
          bottomAction={(
            <button type="button" className="boardWriteLinkBtn" onClick={() => navigate('/twins-news/write')}>
              글쓰기
            </button>
          )}
        />
      </section>
    </article>
  )
}
