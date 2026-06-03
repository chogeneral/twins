/**
 * 무적LG마당(구 자유게시판 경로 `/free-board`): 카테고리 제약이 없는 일반 소통 공간 안내·빈 상태 UI.
 * - 화면 제목·내비 라벨은 팬덤 네이밍「무적LG마당」으로 통일했습니다.
 * - article 하나로 페이지 전체 맥락을 표현했고 목록 블록을 section+h2 레이블로 구획했습니다.
 */

import { useNavigate } from 'react-router-dom'
import { BoardListTable } from '../components/BoardListTable'
import { useBoardPosts } from '../hooks/useBoardPosts'
import './boardPage.css'

export function FreeBoardPage() {
  const navigate = useNavigate()
  const { rows: freeBoardRows, loading, error } = useBoardPosts('freeBoard')

  return (
    <article className="boardPage">
      {/* 페이지 이름과 설명: 내비와 중복되는 짧은 식별을 위해 헤더 그룹으로 묶었습니다 */}
      <header className="boardHeader">
       
        <h1 className="boardTitle">무적 LG마당</h1>
        <p className="boardDescription">
        무적 LG마당은 무적 LG팬들이 자유롭게 이야기를 나누는 공간입니다.
        </p>
      </header>

      {/*
       * 게시글이 아직 없을 때도 구글이 빈 목록만 있는 Soft 404 페이지로 오해하지 않도록,
       * 이 게시판에서 실제로 다루는 주제와 이용 맥락을 사용자에게도 보이는 안내 콘텐츠로 제공합니다.
       */}


      <section
        className="boardPanel"
        aria-labelledby="freeBoardListHeading"
      >
        <h2 id="freeBoardListHeading" className="srOnly">
          게시글 목록
        </h2>
        <BoardListTable
          rows={freeBoardRows}
          caption="무적LG마당 게시글 목록"
          detailBasePath="/free-board"
          boardKey="freeBoard"
          hideEmptyState={loading || Boolean(error)}
          bottomAction={(
            <button type="button" className="boardWriteLinkBtn" onClick={() => navigate('/free-board/write')}>
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
