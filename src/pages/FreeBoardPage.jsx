/**
 * 무적LG마당(구 자유게시판 경로 `/free-board`): 카테고리 제약이 없는 일반 소통 공간 안내·빈 상태 UI.
 * - 화면 제목·내비 라벨은 팬덤 네이밍「무적LG마당」으로 통일했습니다.
 * - article 하나로 페이지 전체 맥락을 표현했고 목록 블록을 section+h2 레이블로 구획했습니다.
 */

import { Navigate, useNavigate } from 'react-router-dom'
import { BoardListTable } from '../components/BoardListTable'
import { useAuth } from '../hooks/useAuth'
import { getBoardPosts } from '../lib/boardPostStorage'
import './boardPage.css'

const freeBoardPath = '/free-board'

export function FreeBoardPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const loginRedirectHref = `/login?redirect=${encodeURIComponent(freeBoardPath)}`

  if (authLoading) {
    return (
      <article className="boardPage" aria-busy="true">
        <header className="boardHeader">
          <p lang="en" className="boardEyebrow">community</p>
          <h1 className="boardTitle">무적LG마당</h1>
          <p className="boardDescription">로그인 여부를 확인하는 중입니다.</p>
        </header>
      </article>
    )
  }

  if (!user) {
    return <Navigate to={loginRedirectHref} replace />
  }

  const freeBoardRows = getBoardPosts('freeBoard')

  return (
    <article className="boardPage">
      {/* 페이지 이름과 설명: 내비와 중복되는 짧은 식별을 위해 헤더 그룹으로 묶었습니다 */}
      <header className="boardHeader">
        <p lang="en" className="boardEyebrow">
          community
        </p>
        <h1 className="boardTitle">무적LG마당</h1>
        <p className="boardDescription">
        무적LG마당은 무적LG팬들이 자유롭게 이야기를 나누는 공간입니다.
        </p>
      </header>

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
