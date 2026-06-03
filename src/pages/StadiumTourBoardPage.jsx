/**
 * 구장 투어 게시판: 잠실·원정 구장 방문기와 좌석/동선 정보를 공유하는 공간입니다.
 * - 기존 자유게시판 계열과 같은 목록 컴포넌트를 사용해 글쓰기·상세 이동 흐름을 통일했습니다.
 */

import { useNavigate } from 'react-router-dom'
import { BoardListTable } from '../components/BoardListTable'
import { useBoardPosts } from '../hooks/useBoardPosts'
import './boardPage.css'

export function StadiumTourBoardPage() {
  const navigate = useNavigate()
  const { rows: stadiumTourRows, loading, error } = useBoardPosts('stadiumTourBoard')

  return (
    <article className="boardPage">
      <header className="boardHeader">

        <h1 className="boardTitle">구장투어</h1>
        <p className="boardDescription">
          각 구장에 여행 할 곳, 호텔, 먹거리 정보를 공유하는 공간입니다.
        </p>
      </header>

      {/*
       * 구장투어 페이지가 단순한 빈 게시판으로 보이지 않도록,
       * 구글이 페이지의 정보 목적을 이해할 수 있는 구장 방문 안내 문맥을 실제 본문에 배치합니다.
       */}
      <section className="boardSeoGuide" aria-labelledby="stadiumTourGuideHeading">
        <h2 id="stadiumTourGuideHeading" className="boardSeoGuideTitle">
          야구장 방문과 원정 구장 정보를 함께 모으는 공간
        </h2>
        <p className="boardSeoGuideText">
          구장투어는 잠실야구장을 비롯한 KBO 구장 방문 후기, 좌석 시야, 교통 동선,
          주변 맛집과 숙소 정보를 LG 트윈스 팬들이 함께 정리하는 게시판입니다.
        </p>
        <ul className="boardSeoGuideList">
          <li>대중교통, 주차, 입장 동선 등 방문 팁</li>
          <li>구장 주변 먹거리, 숙소, 여행 정보</li>
        </ul>
      </section>

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
          boardKey="stadiumTourBoard"
          hideEmptyState={loading || Boolean(error)}
          bottomAction={(
            <button type="button" className="boardWriteLinkBtn" onClick={() => navigate('/stadium-tour/write')}>
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
