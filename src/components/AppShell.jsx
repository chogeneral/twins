import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import logoLgTwinsEmblem from '../assets/lgTwinsEmblem.png'
import './appShell.css'

/**
 * 앱 공통 골격: 상단 헤더·내비·모바일 메뉴를 한데 묶습니다.
 * - 헤더 로고·타이틀 영역 전체가 `NavLink`로 메인(`/`)과 연결되어 클릭 시 루트 메인 페이지로 이동합니다.
 * - 사이트 전역에서는 본문에만 h1 을 두기 위해 로고 래퍼는 span 입니다(img alt 는 장식이라 비움 — 링크의 aria-label 이 역할 전달).
 * - 시각 레이아웃은 Dazed Korea(https://dazedkorea.com/)식 매거진 내비를 참고했고, 브랜드 PNG는 사용자 제공 에셋만 사용합니다.
 * - 내비는 링크 모음이라 ul/li 로 감싸 스크린리더가 목록 패턴으로 읽도록 했습니다.
 */

export function AppShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const homePath = '/'

  const navItems = [
    { to: '/team', label: 'TEAM' },
    { to: '/free-board', label: '자유게시판' },
    { to: '/reviews', label: '직관후기' },
    { to: '/qna', label: '질문게시판' },
  ]

  const closeMobileNav = () => setMobileNavOpen(false)

  const menuExpandedLabel = mobileNavOpen ? '메뉴 닫기' : '메뉴 열기'

  return (
    <div className="appShell">
      <a className="skipToMain" href="#mainContent">
        본문 바로가기
      </a>
      <header className="siteHeader">
        <div className="siteHeaderInner">
          <NavLink
            className={({ isActive }) =>
              ['brandLockup', isActive ? 'brandLockupActive' : ''].filter(Boolean).join(' ')
            }
            to={homePath}
            end
            onClick={closeMobileNav}
            aria-label="유광 잠바 메인으로 이동"
          >
            <span className="brandLogoWrap">
              <img
                className="brandLogoImg"
                src={logoLgTwinsEmblem}
                width={120}
                height={56}
                alt=""
                decoding="async"
              />
            </span>
            <span className="brandText">
              <span className="brandTitle">유광 잠바</span>
              <span className="brandSubtitle">LG 트윈스 팬 커뮤니티</span>
            </span>
          </NavLink>

          <nav className="desktopNav" aria-label="주요 메뉴">
            <ul className="desktopNavList">
              {navItems.map((item) => (
                <li key={item.to} className="desktopNavItem">
                  <NavLink
                    to={item.to}
                    end={item.to === homePath}
                    className={({ isActive }) =>
                      isActive ? 'navLink navLinkActive' : 'navLink'
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <button
            type="button"
            className="menuToggle"
            aria-expanded={mobileNavOpen}
            aria-controls="mobileNavPanel"
            aria-label={menuExpandedLabel}
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            <span className="menuBar" aria-hidden="true" />
            <span className="menuBar" aria-hidden="true" />
            <span className="menuBar" aria-hidden="true" />
          </button>
        </div>
      </header>

      {mobileNavOpen ? (
        <button
          type="button"
          className="mobileNavBackdrop"
          aria-label="메뉴 닫기"
          onClick={closeMobileNav}
        />
      ) : null}

      <nav
        id="mobileNavPanel"
        className={mobileNavOpen ? 'mobileNav mobileNavOpen' : 'mobileNav'}
        aria-hidden={!mobileNavOpen}
        aria-label="모바일 주요 메뉴"
      >
        <ul className="mobileNavList">
          {navItems.map((item) => (
            <li key={item.to} className="mobileNavItem">
              <NavLink
                to={item.to}
                end={item.to === homePath}
                className={({ isActive }) =>
                  isActive ? 'mobileNavLink mobileNavLinkActive' : 'mobileNavLink'
                }
                onClick={closeMobileNav}
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <main className="mainSurface" id="mainContent" tabIndex={-1}>
        <Outlet />
      </main>

      <footer className="siteFooter">
        <div className="footerShell">
          <div className="footerColumns">
            <div className="footerColumn footerColumnBrand">
              <p className="footerSiteName">유광 잠바</p>
              <p className="footerSiteTagline">LG 트윈스 팬 커뮤니티</p>
              <p className="footerSiteLead">
                비공식 데모 페이지입니다. 공식 일정·발표는 LG 트윈스 구단 및 KBO 공식 채널을 확인해 주세요.
              </p>
            </div>
            <div className="footerColumn">
              <p className="footerColumnTitle" id="footerMenuLabel">
                메뉴
              </p>
              <nav className="footerColumnNav" aria-labelledby="footerMenuLabel">
                <ul className="footerLinkList">
                  {navItems.map((item) => (
                    <li key={`footer-${item.to}`} className="footerLinkItem">
                      <NavLink
                        className={({ isActive }) =>
                          isActive ? 'footerPageLink footerPageLinkActive' : 'footerPageLink'
                        }
                        to={item.to}
                        end={item.to === homePath}
                      >
                        {item.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
            <div className="footerColumn">
              <p className="footerColumnTitle" id="footerGuideLabel">
                안내
              </p>
              <nav className="footerColumnNav" aria-labelledby="footerGuideLabel">
                <ul className="footerLinkList">
                  <li className="footerLinkItem">
                    <a className="footerPageLink" href="#mainContent">
                      본문 바로가기
                    </a>
                  </li>
                  <li className="footerLinkItem">
                    <span className="footerPageLink footerPageLinkDisabled" aria-disabled="true">
                      이용약관 (준비 중)
                    </span>
                  </li>
                  <li className="footerLinkItem">
                    <span className="footerPageLink footerPageLinkDisabled" aria-disabled="true">
                      개인정보처리방침 (준비 중)
                    </span>
                  </li>
                </ul>
              </nav>
            </div>
          </div>

          <hr className="footerDivider" />

          <div className="footerLegal">
            <p className="footerCopyright">
              © {new Date().getFullYear()} 유광 잠바. 비공식 팬 사이트로, LG 트윈스·프로야구 구단과 무관합니다.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
