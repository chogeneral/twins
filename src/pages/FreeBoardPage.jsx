/**
 * 자유게시판: 카테고리 제약이 없는 일반 소통 공간이라는 안내와 빈 상태 UI를 제공합니다.
 * - article 하나로 페이지 전체 맥락을 표현했고 목록 블록을 section+h2 레이블로 구획했습니다.
 */

import './boardPage.css'

export function FreeBoardPage() {
  return (
    <article className="boardPage">
      {/* 페이지 이름과 설명: 내비와 중복되는 짧은 식별을 위해 헤더 그룹으로 묶었습니다 */}
      <header className="boardHeader">
        <p lang="en" className="boardEyebrow">
          community
        </p>
        <h1 className="boardTitle">자유게시판</h1>
        <p className="boardDescription">
          시즌 잡담, 밈, 중고 거래(정책 준수) 등 자유로운 이야기를 나누는 공간입니다.
        </p>
      </header>

      <section
        className="boardPanel"
        aria-labelledby="freeBoardListHeading"
      >
        <h2 id="freeBoardListHeading" className="srOnly">
          게시글 목록
        </h2>
        <div className="emptyState" aria-live="polite">
          {/* 목록 블록이 비었을 때의 소제목을 h3으로 두어 헤더 트리를 유지했습니다 */}
          <h3 className="emptyTitle">아직 등록된 글이 없습니다</h3>
          <p className="emptyBody">
            백엔드 또는 목 데이터를 연결하면 카드 형태 목록 컴포넌트가 이 영역을 채웁니다.
          </p>
        </div>
      </section>
    </article>
  )
}
