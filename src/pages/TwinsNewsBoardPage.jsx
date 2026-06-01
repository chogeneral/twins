/**
 * twins뉴스 게시판: LG 트윈스 관련 소식과 기사 링크를 모아 보는 공간입니다.
 * - 기존 공통 게시판 목록 컴포넌트를 그대로 사용하되, 뉴스는 분류가 필요 없어서 구분 컬럼을 숨깁니다.
 */

import { useNavigate } from 'react-router-dom'
import { BoardListTable } from '../components/BoardListTable'
import { getBoardPosts } from '../lib/boardPostStorage'
import './boardPage.css'

export function TwinsNewsBoardPage() {
  const navigate = useNavigate()
  const twinsNewsRows = getBoardPosts('twinsNewsBoard')

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
      <section className="boardSeoGuide" aria-labelledby="twinsNewsGuideHeading">
        <h2 id="twinsNewsGuideHeading" className="boardSeoGuideTitle">
          LG 트윈스 소식과 팬들이 주목한 뉴스를 모아보세요
        </h2>
        <p className="boardSeoGuideText">
          twins뉴스는 LG 트윈스 경기 소식, 선수 인터뷰, 구단 발표, 팬들이 함께 읽고 싶은
          야구 뉴스를 공유하며 의견을 나누는 게시판입니다.
        </p>
        <ul className="boardSeoGuideList">
          <li>LG 트윈스 경기 결과와 주요 이슈</li>
          <li>선수 인터뷰, 구단 소식, 미디어 기사 공유</li>
          <li>팬들이 함께 이야기하고 싶은 트윈스 뉴스</li>
        </ul>
      </section>

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
