/**
 * 사이트 진입 메인: 루트 URL 전용 랜딩입니다.
 * - 히어로 시각은 팀 엠블럼 대신 사용자 제공 `lglogo.png` 로고로 브랜드 인지를 분리했습니다.
 * - 한 화면 안에 h1은 이 컴포넌트 한 곳만 두어 문서 개요를 명확히 했습니다.
 */

import { NavLink } from 'react-router-dom'
import logoLgBrand from '../assets/lglogo.png'
import './homePage.css'

const homeQuickLinks = [
  { to: '/team', label: 'TEAM', desc: '커버 스토리와 커뮤니티 픽', accent: true },
  { to: '/free-board', label: '자유게시판', desc: '잡담·밈·자유 주제' },
  { to: '/reviews', label: '직관후기', desc: '현장 정보·좌석·굿즈 후기' },
  { to: '/qna', label: '질문게시판', desc: '룰·티켓·교통 Q&A' },
]

export function HomePage() {
  return (
    <article className="homePage" aria-labelledby="homeHeroTitle">
      <section className="homeHero">
        <figure className="homeHeroFigure">
          <img
            className="homeHeroImg"
            src={logoLgBrand}
            width={200}
            alt="LG 브랜드 로고"
            decoding="async"
          />
        </figure>
        <div className="homeHeroContent">
          <p className="homeKicker">
            <span className="homeKickerAccent">WELCOME</span> · 유광 잠바
          </p>
          <h1 id="homeHeroTitle" className="homeTitle">
          우리의 심장은 늘 잠실에서 뛴다
          </h1>
          <p className="homeLead">
          승리의 기쁨도, 아쉬운 패배도 우리는 언제나 같은 자리에서 트윈스를 응원합니다.
          </p>
        </div>
      </section>

      <section className="homeShortcuts" aria-labelledby="homeShortcutsHeading">
        <p className="homeSectionLabel" id="homeShortcutsHeading">
          바로 가기
        </p>
        <ul className="homeShortcutGrid">
          {homeQuickLinks.map((item) => (
            <li key={item.to} className="homeShortcutCell">
              {/* 카드 전체를 링크로 두어 모바일에서도 넓은 탭 영역을 확보했습니다 */}
              <NavLink className="homeShortcutCard" to={item.to} end={item.to === '/team'}>
                <span className={item.accent ? 'homeShortcutTag homeShortcutTagAccent' : 'homeShortcutTag'}>
                  SECTION
                </span>
                <span className="homeShortcutLabel">{item.label}</span>
                <span className="homeShortcutDesc">{item.desc}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </section>
    </article>
  )
}
