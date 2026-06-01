/**
 * 무적LG마당(구 자유게시판 경로 `/free-board`): 카테고리 제약이 없는 일반 소통 공간 안내·빈 상태 UI.
 * - 화면 제목·내비 라벨은 팬덤 네이밍「무적LG마당」으로 통일했습니다.
 * - article 하나로 페이지 전체 맥락을 표현했고 목록 블록을 section+h2 레이블로 구획했습니다.
 */

import { useNavigate } from 'react-router-dom'
import { BoardListTable } from '../components/BoardListTable'
import { getBoardPosts } from '../lib/boardPostStorage'
import './boardPage.css'

export function FreeBoardPage() {
  const navigate = useNavigate()
  const freeBoardRows = getBoardPosts('freeBoard')

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
      <section className="boardSeoGuide" aria-labelledby="freeBoardGuideHeading">
        <h2 id="freeBoardGuideHeading" className="boardSeoGuideTitle">
          무적LG마당에서 나누는 이야기
        </h2>
        <p className="boardSeoGuideText">
          무적LG마당은 LG 트윈스 팬들이 경기 전후 이야기, 응원 분위기, 티켓과 직관 준비,
          선수 응원 메시지와 일상적인 팬 이야기를 자유롭게 남기는 커뮤니티 게시판입니다.
        </p>
        <ul className="boardSeoGuideList">
          <li>LG 트윈스 경기 관전평과 응원 후기</li>
          <li>잠실야구장 직관 준비, 티켓, 좌석 관련 정보</li>
          <li>팬들이 함께 나누는 자유 주제와 응원 메시지</li>
        </ul>
      </section>

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
          bottomAction={(
            <button type="button" className="boardWriteLinkBtn" onClick={() => navigate('/free-board/write')}>
              글쓰기
            </button>
          )}
        />
      </section>
    </article>
  )
}
