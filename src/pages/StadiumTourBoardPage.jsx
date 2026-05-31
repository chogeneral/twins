/**
 * 구장 투어 게시판: 잠실·원정 구장 방문기와 좌석/동선 정보를 공유하는 공간입니다.
 * - 기존 자유게시판 계열과 같은 목록 컴포넌트를 사용해 글쓰기·상세 이동 흐름을 통일했습니다.
 */

import { useNavigate } from 'react-router-dom'
import { BoardListTable } from '../components/BoardListTable'
import { getBoardPosts } from '../lib/boardPostStorage'
import './boardPage.css'

export function StadiumTourBoardPage() {
  const navigate = useNavigate()
  const stadiumTourRows = getBoardPosts('stadiumTourBoard')

  return (
    <article className="boardPage">
      <header className="boardHeader">
      
        <h1 className="boardTitle">구장투어</h1>
        <p className="boardDescription">
          각 구장에 여행 할 곳, 호텔, 먹거리 정보를 공유하는 공간입니다.
        </p>
      </header>

      <section
        className="boardPanel stadiumTourBoardPanel"
        aria-labelledby="stadiumTourBoardListHeading"
      >
        <h2 id="stadiumTourBoardListHeading" className="srOnly">
          구장투어 게시글 목록
        </h2>
        <BoardListTable
          rows={stadiumTourRows}
          caption="구장투어 게시글 목록"
          detailBasePath="/stadium-tour"
          bottomAction={(
            <button type="button" className="boardWriteLinkBtn" onClick={() => navigate('/stadium-tour/write')}>
              글쓰기
            </button>
          )}
        />
      </section>
    </article>
  )
}
