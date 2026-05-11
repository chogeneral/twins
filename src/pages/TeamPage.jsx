/**
 * TEAM(홈): 매거진식 커버 + 픽 리스트 레이아웃입니다.
 * - 레이블·헤드라인·플랫 피드를 Dazed류 에디토리얼 메인 패턴과 맞췄습니다.
 */

import { NavLink } from 'react-router-dom'
import logoLgTwinsEmblem from '../assets/lgTwinsEmblem.png'
import './teamPage.css'

const editorialPicks = [
  {
    to: '/free-board',
    sectionTag: 'BOARD',
    headline: '잠실 잡담부터 밈·중고까지, 자유 채널',
    synopsis: '정책만 지키면 주제 무제한. 첫 글부터 올려 보세요.',
    meta: '자유 게시판',
  },
  {
    to: '/reviews',
    sectionTag: 'STADIUM',
    headline: '좌석, 굿즈, 식음료까지 직관 후기 허브',
    synopsis: '다음 관람 팬을 위한 체크리스트를 글로 남깁니다.',
    meta: '직관후기',
  },
  {
    to: '/qna',
    sectionTag: 'HELP',
    headline: '룰·티켓·교통부터 묻고 채택 답을 모읍니다',
    synopsis: '반복 질문은 검색 가능한 카드로 재구성 예정입니다.',
    meta: '질문 게시판',
  },
]

export function TeamPage() {
  return (
    <article className="teamPage" aria-labelledby="teamHeroTitle">
      <section className="editorialCover" aria-labelledby="teamHeroTitle">
        <div className="editorialCoverInner">
          <header className="editorialCoverIntro">
            <p className="editorialKicker">
              <span className="editorialKickerAccent">COVER</span> · YUGWANG JAMBA
            </p>
            <h1 id="teamHeroTitle" className="editorialHeadline">
              더 프라이드 오브 서울, 잠실의 열기
            </h1>
            <p className="editorialDeck">
              응원복처럼 반짝이는 에너지를 온라인에서도 모읍니다. 팀 소식부터 직관 기록까지, 팬이 남긴 레이어를
              한 매거진 피드처럼 쌓습니다.
            </p>
            <ul className="editorialChipRow" aria-label="운영 상태">
              <li className="editorialChipRowItem">
                <span className="editorialChip editorialChipAccent">2026 시즌 응원 가이드 준비 중</span>
              </li>
              <li className="editorialChipRowItem">
                <span className="editorialChip">공식 안내는 구단 채널을 참고해 주세요</span>
              </li>
            </ul>
          </header>
          <figure className="editorialHeroFigure">
            <img
              className="editorialHeroImg"
              src={logoLgTwinsEmblem}
              width={460}
              height={260}
              alt="LG 트윈스 엠블럼 무적 LG, 서울 프라이드, KBO 리그 문구와 호랑이 문양의 골드 테두리 원형 배지"
              decoding="async"
            />
          </figure>
        </div>
      </section>

      <section className="editorialSection" aria-labelledby="editorialLatestLabel">
        <div className="editorialSectionHeader">
          <h2 id="editorialLatestLabel" className="editorialSectionLabel">
            PICKS · LINKS
          </h2>
          <span className="editorialSectionLine" aria-hidden="true" />
        </div>
        {/* 미리보기 링크는 전체 줄이 클릭 영역이라 모바일에서도 엄지 스윕에 맞습니다 */}
        <ul className="editorialPickList">
          {editorialPicks.map((pick) => (
            <li key={pick.to} className="editorialPickItem">
              <NavLink className="editorialPickRow" to={pick.to}>
                <span className="editorialPickCat">{pick.sectionTag}</span>
                <span className="editorialPickBody">
                  <span className="editorialPickHeadline">{pick.headline}</span>
                  <span className="editorialPickSynopsis">{pick.synopsis}</span>
                </span>
                <span className="editorialPickMeta">{pick.meta}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </section>
    </article>
  )
}
