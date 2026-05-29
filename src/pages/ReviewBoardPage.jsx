/**
 * 승요인증: 승리·현장 인증 등 팬들이 사진·글로 남기는 전용 탭입니다.
 * - 무적 LG 마당(`FreeBoardPage`)과 동일한 헤더/목록 뼈대로 일관된 문서 접근 패턴을 유지했습니다.
 */

import './boardPage.css'

export function ReviewBoardPage() {
  return (
    <article className="boardPage">
      <header className="boardHeader">
        <p lang="en" className="boardEyebrow">
          win proof
        </p>
        <h1 className="boardTitle">승요인증</h1>
        <p className="boardDescription">
          경기 승리 순간, 응원 현장, 기념 사진 등 승요 인증을 남기고 서로 공유해 주세요.
        </p>
      </header>

      <section
        className="boardPanel"
        aria-labelledby="sungyoBoardListHeading"
      >
        <h2 id="sungyoBoardListHeading" className="srOnly">
          승요인증 목록
        </h2>
        <div className="emptyState" aria-live="polite">
          <h3 className="emptyTitle">첫 번째 승요 인증을 남겨 주세요</h3>
          <p className="emptyBody">
            사진 업로드를 추가할 계획이라면 카드 높이를 고정하거나 비율 박스로 설계하면 안정적입니다.
          </p>
        </div>
      </section>
    </article>
  )
}
