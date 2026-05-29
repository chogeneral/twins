import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import logoLgTwinsEmblem from '../assets/lgTwinsEmblem.png'
import { useAuth } from '../hooks/useAuth'
import './appShell.css'

/**
 * 앱 공통 골격: 상단 헤더·내비·모바일 메뉴를 한데 묶습니다.
 * - 헤더 로고·타이틀 영역 전체가 `NavLink`로 메인(`/`)과 연결되어 클릭 시 루트 메인 페이지로 이동합니다.
 * - 사이트 전역에서는 본문에만 h1 을 두기 위해 로고 래퍼는 span 입니다(img alt 는 장식이라 비움 — 링크의 aria-label 이 역할 전달).
 * - 시각 레이아웃은 Dazed Korea(https://dazedkorea.com/)식 매거진 내비를 참고했고, 브랜드 PNG는 사용자 제공 에셋만 사용합니다.
 * - 내비는 링크 모음이라 ul/li 로 감싸 스크린리더가 목록 패턴으로 읽도록 했습니다.
 * - 우하단 퀵메뉴: 구장정보 이동과 위로 스크롤을 제공합니다. 라벨은 버튼 아래 한글 캡션입니다.
 * - 840px 이하에서는 데스크톱 가로 내비를 숨기고 햄버거로 오른쪽 사이드 드로어(전면 딤 + 패널 슬라이드)를 엽니다.
 * - 같은 브레이크포인트에서 헤더 유틸(문의·로그인 등)은 드로어 상단 「계정 · 서비스」에만 두고 헤더에는 햄버거만 노출합니다.
 * - 로그인 시 드로어 상단 줄은 닉네임·문의·로그아웃을 한 줄에 두고, 줄 오른쪽 끝은 닫기(X)입니다.
 */

/** 퀵메뉴「구장」— 탑뷰 다이아몬드와 외야 호로 야구 필드를 나타냅니다. `siteQuickMenuSvgStadium` 으로 다른 버튼보다 크게 둡니다. */
function IconStadiumField() {
  return (
    <svg className="siteQuickMenuSvg siteQuickMenuSvgStadium" viewBox="0 0 24 24" aria-hidden="true">
      {/* 홈→1·2·3루 직선 후 포 섬으로 외야 호를 닫습니다 */}
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 20 L17 14 L12 8 L7 14 Q12 5 17 14 L12 20"
      />
      <circle cx="12" cy="14" r="1" fill="none" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  )
}

/** 맨 위 스크롤 액션에 흔히 쓰는 위쪽 꺾쇠 형태입니다. */
function IconChevronUp() {
  return (
    <svg className="siteQuickMenuSvg" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 15l-6-6-6 6"
      />
    </svg>
  )
}

function SiteQuickMenu() {
  const navigate = useNavigate()

  /* 퀵메뉴 — 구장정보 전용 페이지로 이동합니다 */
  const goStadiumVenue = () => {
    navigate('/stadium-info')
  }

  /* 긴 게시글 등에서 맨 위로 — main 에 포커스를 주어 키보드 사용자도 흐름을 이어 갑니다 */
  const goTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    const mainEl = document.getElementById('mainContent')
    mainEl?.focus({ preventScroll: true })
  }

  return (
    <nav className="siteQuickMenu" aria-label="퀵 메뉴">
      <div className="siteQuickMenuInner">
        <div className="siteQuickMenuItem">
          {/* aria-labelledby 로 보이는 라벨과 버튼 역할을 스크린리더가 한 덩어리로 읽게 합니다 */}
          <button
            type="button"
            className="siteQuickMenuFab"
            onClick={goStadiumVenue}
            aria-labelledby="qmLabelStadium"
          >
            <IconStadiumField />
          </button>
          <span id="qmLabelStadium" className="siteQuickMenuItemLabel">
            구장정보
          </span>
        </div>
        <div className="siteQuickMenuItem">
          <button type="button" className="siteQuickMenuFab" onClick={goTop} aria-labelledby="qmLabelTop">
            <IconChevronUp />
          </button>
          <span id="qmLabelTop" className="siteQuickMenuItemLabel">
            위로 가기
          </span>
        </div>
      </div>
    </nav>
  )
}

export function AppShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const navigate = useNavigate()
  const { user, loading, nickname, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const homePath = '/'

  /**
   * 주요 메뉴 순서 — TEAM 직후「응원가」, 이어서 신규 유입용「가입인사」를 둡니다.
   */
  const navItems = [
    { to: '/team', label: 'Team' },
    { to: '/teamsong', label: '응원가' },
    { to: '/qna', label: '가입인사' },
    { to: '/free-board', label: '무적LG마당' },
    { to: '/reviews', label: '승요인증' },
    { to: '/stadium-tour', label: '구장투어' },
  ]

  const closeMobileNav = () => setMobileNavOpen(false)

  const menuExpandedLabel = mobileNavOpen ? '메뉴 닫기' : '메뉴 열기'

  /* 드로어가 열린 동안 본문 스크롤이 뒤에서 움직이지 않도록 막음 — 모바일에서 배경이 밀리는 느낌을 줄입니다 */
  useEffect(() => {
    if (!mobileNavOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mobileNavOpen])

  /* 키보드 사용자가 Esc 로 드로어를 닫을 수 있게 함(행동 패턴이 뒷배경 클릭·닫기 버튼과 동일) */
  useEffect(() => {
    if (!mobileNavOpen) return
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMobileNavOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mobileNavOpen])

  return (
    <div
      className={['appShell', mobileNavOpen ? 'appShellMobileNavOpen' : ''].filter(Boolean).join(' ')}
    >
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
              {/* width/height 는 에셋 원본 비율 힌트(CLS 완화); 실제 픽셀 크기는 appShell.css 의 clamp·object-fit 으로 뷰포트에 맞게 줄여도 비율이 깨지지 않음 */}
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

          <div className="headerUtils">
            {/* 840px 미만에서는 숨김(appShell.css) — 같은 내용은 모바일 드로어 mobileNavUtilsSection 에만 둡니다 */}
            <div className="headerUtilsDesktopCluster">
              {loading ? (
                <button
                  type="button"
                  className="headerLoginBtn"
                  aria-label="문의하기"
                  onClick={() => navigate('/stadium-info#stadiumInquiry')}
                >
                  문의하기
                </button>
              ) : user ? (
                <>
                  {/* 로그인 상태: 오른쪽 유틸 앞에 닉네임만 표시 */}
                  <strong className="headerWelcomeNickname">{nickname}</strong>
                  <button
                    type="button"
                    className="headerLoginBtn"
                    aria-label="문의하기"
                    onClick={() => navigate('/stadium-info#stadiumInquiry')}
                  >
                    문의하기
                  </button>
                  <button
                    type="button"
                    className="headerLoginBtn"
                    aria-label="로그아웃"
                    onClick={handleSignOut}
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="headerLoginBtn"
                    aria-label="문의하기"
                    onClick={() => navigate('/stadium-info#stadiumInquiry')}
                  >
                    문의하기
                  </button>
                  <button
                    type="button"
                    className="headerLoginBtn"
                    aria-label="회원가입"
                    onClick={() => navigate('/signup')}
                  >
                    회원가입
                  </button>
                  <button
                    type="button"
                    className="headerLoginBtn"
                    aria-label="로그인"
                    onClick={() => navigate('/login')}
                  >
                    로그인
                  </button>
                </>
              )}
            </div>

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
        aria-label="페이지 및 계정 메뉴"
      >
        <div className="mobileNavDrawerBody">
          <div className="mobileNavUtilsSection" aria-label="계정 및 바로가기">
            {/* 로그인 여부와 관계없이 유틸은 상단 한 줄(닫기 X 와 같은 높이)에 두어 로그인 후 레이아웃과 통일 */}
            <div className="mobileNavDrawerTopBar">
              <div className="mobileNavDrawerTopBarMain">
                {!loading && user ? (
                  <>
                    {/* 모바일 드로어 상단: 닉네임만 표시 후 문의·로그아웃 */}
                    <p className="mobileDrawerWelcome mobileDrawerWelcomeInTopBar">
                      <strong>{nickname}</strong>
                    </p>
                    <button
                      type="button"
                      className="mobileNavTopBarBtn"
                      aria-label="문의하기"
                      onClick={() => {
                        navigate('/stadium-info#stadiumInquiry')
                        closeMobileNav()
                      }}
                    >
                      문의하기
                    </button>
                    <button
                      type="button"
                      className="mobileNavTopBarBtn"
                      aria-label="로그아웃"
                      onClick={async () => {
                        await handleSignOut()
                        closeMobileNav()
                      }}
                    >
                      로그아웃
                    </button>
                  </>
                ) : loading ? (
                  <button
                    type="button"
                    className="mobileNavTopBarBtn"
                    aria-label="문의하기"
                    onClick={() => {
                      navigate('/stadium-info#stadiumInquiry')
                      closeMobileNav()
                    }}
                  >
                    문의하기
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="mobileNavTopBarBtn"
                      aria-label="문의하기"
                      onClick={() => {
                        navigate('/stadium-info#stadiumInquiry')
                        closeMobileNav()
                      }}
                    >
                      문의하기
                    </button>
                    <button
                      type="button"
                      className="mobileNavTopBarBtn"
                      aria-label="회원가입"
                      onClick={() => {
                        navigate('/signup')
                        closeMobileNav()
                      }}
                    >
                      회원가입
                    </button>
                    <button
                      type="button"
                      className="mobileNavTopBarBtn"
                      aria-label="로그인"
                      onClick={() => {
                        navigate('/login')
                        closeMobileNav()
                      }}
                    >
                      로그인
                    </button>
                  </>
                )}
              </div>
              <button
                type="button"
                className="mobileNavCloseBtn"
                onClick={closeMobileNav}
                aria-label="메뉴 닫기"
              >
                <span aria-hidden="true">
                  ×
                </span>
              </button>
            </div>
          </div>

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
        </div>
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
                30년 골수 엘지팬이 만든 팬 롬페이지 입니다.
              </p>
            </div>
            <div className="footerColumn">
              {/* 보이는 ‘메뉴’ 제목은 빼고, 스크린리더에는 nav 에만 역할 이름을 부여합니다 */}
              <nav className="footerColumnNav" aria-label="주요 페이지">
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
          </div>

          <hr className="footerDivider" />

          <div className="footerLegal">
            <p className="footerCopyright">
              © {new Date().getFullYear()} 유광 잠바는 30년차 엘지 팬이 만든것으로 LG 트윈스 프로야구 구단과 무관합니다.
            </p>
          </div>
        </div>
      </footer>

      <SiteQuickMenu />
    </div>
  )
}
