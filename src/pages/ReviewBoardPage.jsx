/**
 * 직관후기: 현장 분위기·좌석·편의시설 같은 후기 특화 안내 텍스트를 넣었습니다.
 * - 자유게시판과 동일한 헤더/목록 뼈대로 일관된 문서 접근 패턴을 유지했습니다.
 */

import './boardPage.css'

export function ReviewBoardPage() {
  return (
    <article className="boardPage">
      <header className="boardHeader">
        <p lang="en" className="boardEyebrow">
          live experience
        </p>
        <h1 className="boardTitle">직관후기</h1>
        <p className="boardDescription">
          라인업, 날씨, 굿즈, 식음료까지 현장 정보를 다음 방문 팬에게 전해 주세요.
        </p>
      </header>

      <section
        className="boardPanel"
        aria-labelledby="reviewBoardListHeading"
      >
        <h2 id="reviewBoardListHeading" className="srOnly">
          직관 후기 목록
        </h2>
        <div className="emptyState" aria-live="polite">
          <h3 className="emptyTitle">첫 번째 후기를 남겨 주세요</h3>
          <p className="emptyBody">
            사진 업로드를 추가할 계획이라면 카드 높이를 고정하거나 비율 박스로 설계하면 안정적입니다.
          </p>
        </div>
      </section>
    </article>
  )
}
