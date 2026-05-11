/**
 * 질문게시판: 규칙·모더레이션 힌트를 상단 설명으로 넣어 Q&A 성격을 분명히 했습니다.
 * - 접근성 측면에서 동일한 article/section/h 계층을 다른 게시판과 맞춥니다.
 */

import './boardPage.css'

export function QuestionBoardPage() {
  return (
    <article className="boardPage">
      <header className="boardHeader">
        <p lang="en" className="boardEyebrow">
          Q&A
        </p>
        <h1 className="boardTitle">질문게시판</h1>
        <p className="boardDescription">
          티켓링크, 교통편, 룰이 궁금할 때 검색 가능한 형태로 답변을 모아두는 공간입니다.
        </p>
      </header>

      <section className="boardPanel" aria-labelledby="qnaBoardListHeading">
        <h2 id="qnaBoardListHeading" className="srOnly">
          질문 목록
        </h2>
        <div className="emptyState" aria-live="polite">
          <h3 className="emptyTitle">질문을 올려 보세요</h3>
          <p className="emptyBody">
            채택 답변·태그 기능을 추가하면 반복 질문을 줄이는 구조를 만들 수 있습니다.
          </p>
        </div>
      </section>
    </article>
  )
}
