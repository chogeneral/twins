/**
 * twins뉴스 게시판: LG 트윈스 관련 소식과 기사 링크를 모아 보는 공간입니다.
 * - 기존 공통 게시판 목록 컴포넌트를 그대로 사용하되, 뉴스는 분류가 필요 없어서 구분 컬럼을 숨깁니다.
 */

import { useNavigate } from 'react-router-dom'
import { BoardListTable } from '../components/BoardListTable'
import { useBoardPosts } from '../hooks/useBoardPosts'
import './boardPage.css'

export function TwinsNewsBoardPage() {
  const navigate = useNavigate()
  const { rows: twinsNewsRows, loading, error } = useBoardPosts('twinsNewsBoard')

  return (
    <article className="boardPage">
      <header className="boardHeader">
        
        <h1 className="boardTitle">twins뉴스</h1>
        <p className="boardDescription">
          LG 트윈스 관련 뉴스, 경기 소식, 인터뷰를 함께 공유하는 공간입니다.
        </p>
      </header>

      {/*
       * 뉴스 게시판은 글이 없는 초기 상태에서도 페이지 목적이 분명해야 색인 가치가 생기므로,
       * 어떤 LG 트윈스 소식을 모아 보는 곳인지 설명하는 고정 본문을 제공합니다.
       */}


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
          boardKey="twinsNewsBoard"
          hideEmptyState={loading || Boolean(error)}
          bottomAction={(
            <button type="button" className="boardWriteLinkBtn" onClick={() => navigate('/twins-news/write')}>
              글쓰기
            </button>
          )}
        />
        {loading && <p className="boardDataState">게시글을 불러오는 중입니다.</p>}
        {error && <p className="boardDataState" role="alert">{error}</p>}
      </section>
    </article>
  )
}
