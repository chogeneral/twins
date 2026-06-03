/**
 * 승요인증: 승리·현장 인증 등 팬들이 사진·글로 남기는 전용 탭입니다.
 * - 무적LG마당(`FreeBoardPage`)과 동일한 헤더/목록 뼈대로 일관된 문서 접근 패턴을 유지했습니다.
 */

import { useNavigate } from 'react-router-dom'
import { BoardListTable } from '../components/BoardListTable'
import { useBoardPosts } from '../hooks/useBoardPosts'
import './boardPage.css'

export function ReviewBoardPage() {
  const navigate = useNavigate()
  const { rows: reviewBoardRows, loading, error } = useBoardPosts('reviewBoard')

  return (
    <article className="boardPage">
      <header className="boardHeader">
       
        <h1 className="boardTitle">승요인증</h1>
        <p className="boardDescription">
          경기 승리 순간, 응원 현장, 기념 사진 등 승요 인증을 남기고 서로 공유해 주세요.
        </p>
      </header>

      {/*
       * 승요인증 목록이 비어 있어도 페이지 자체의 주제가 검색엔진과 방문자에게 명확히 전달되도록,
       * 인증 게시판에서 기대할 수 있는 콘텐츠 유형을 본문에 고정 안내로 노출합니다.
       */}


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
          boardKey="reviewBoard"
          showCategory={false}
          hideEmptyState={loading || Boolean(error)}
          bottomAction={(
            <button type="button" className="boardWriteLinkBtn" onClick={() => navigate('/reviews/write')}>
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
