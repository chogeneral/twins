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
 * - 1093px 이하에서는 데스크톱 가로 내비를 숨기고 햄버거로 오른쪽 사이드 드로어(전면 딤 + 패널 슬라이드)를 엽니다.
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

/** 퀵메뉴「응원가」— 음표 형태로 응원가 페이지 이동 목적을 직관적으로 드러냅니다. */
function IconCheerSong() {
  return (
    <svg className="siteQuickMenuSvg" viewBox="0 0 24 24" aria-hidden="true">
      {/* 음표 머리와 기둥을 한 번에 그려 작은 원형 버튼 안에서도 선명하게 보이게 했습니다 */}
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 18.5a2.5 2.5 0 1 1-1.4-2.25V6.5l9-2v9.75A2.5 2.5 0 1 1 15.2 12V7.35L9 8.72v9.78Z"
      />
    </svg>
  )
}

/** 퀵메뉴「TEAM」— 야구선수 실루엣과 배트를 단순화해 팀 페이지 성격을 직관적으로 보여줍니다. */
function IconTeam() {
  return (
    <svg className="siteQuickMenuSvg" viewBox="0 0 24 24" aria-hidden="true">
      {/* 머리·몸통·배트를 최소 선으로 표현해 작은 퀵메뉴 버튼 안에서도 야구선수로 읽히게 했습니다 */}
      <circle cx="10" cy="6" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 8.4v4.1l-2.8 3.3M10.2 12.2l3 3.7M7.8 10.4l-2.6 1.8M11.4 9.8l3 1.8M15.2 3.8l4.4 7.6"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        d="M6.2 19h4.2M12.8 19h4.4"
      />
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

  /* 퀵메뉴 — 응원가 목록으로 바로 이동해 자주 쓰는 메뉴 접근 단계를 줄입니다 */
  const goTeamSong = () => {
    navigate('/teamsong')
  }

  /* 퀵메뉴 — 팀 소개와 기록 페이지로 바로 이동합니다 */
  const goTeam = () => {
    navigate('/team')
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
          <button
            type="button"
            className="siteQuickMenuFab"
            onClick={goTeam}
            aria-labelledby="qmLabelTeam"
          >
            <IconTeam />
          </button>
          <span id="qmLabelTeam" className="siteQuickMenuItemLabel">
            TEAM
          </span>
        </div>
        <div className="siteQuickMenuItem">
          <button
            type="button"
            className="siteQuickMenuFab"
            onClick={goTeamSong}
            aria-labelledby="qmLabelTeamSong"
          >
            <IconCheerSong />
          </button>
          <span id="qmLabelTeamSong" className="siteQuickMenuItemLabel">
            응원가
          </span>
        </div>
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

/**
 * 모바일 해상도 전용 하단 고정 메뉴 컴포넌트입니다.
 * - 사용자의 요청에 따라 8개 메뉴를 2줄 행 구조(bottomFixedMenuRow)로 나누어 마크업을 수립하였습니다.
 * - CSS 반응형 다단 스케일링을 통해 1174px ~ 790px 에서는 1줄로 병합되고, 790px 이하 좁은 모바일 화면에서는 정갈하게 2줄로 접히도록 지원합니다.
 * - 각 메뉴의 정체성에 부합하는 대표 이모지 아이콘을 수록하였습니다.
 * - NavLink를 사용해 현재 머물고 있는 활성화된 메뉴 탭의 색상이 돋보이도록 처리하였습니다.
 * - 전역 규칙에 따라 변수명과 스타일 컴포넌트 구조는 카멜 케이스(camelCase)를 준수합니다.
 */
function BottomFixedMenu() {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    /**
     * 사용자의 스크롤 조작에 따라 하단 메뉴바를 유기적으로 노출하거나 숨기기 위한 스크롤 핸들러 함수입니다.
     * 스크롤 이벤트를 감지하여 현재 윈도우 스크롤 위치와 이전 위치값을 대조 분석합니다.
     * 브라우저의 페인팅 성능 저하를 방지하기 위해 passive: true 옵션을 주어 렌더링 스레드의 부하를 줄였습니다.
     */
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      // 브라우저 뷰포트 크기와 전체 문서 높이를 활용하여 최하단 스크롤 가능 한계점을 측정합니다.
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight

      /**
       * 사용자가 페이지 맨 위(10rem 이하 상당의 최상단 공간)에 도달해 있거나,
       * 푸터가 완전히 노출되는 페이지 최하단(최대 스크롤 한계점 마진 10px 이내)에 진입한 경우에는
       * 하단 고정 바가 화면 바깥으로 유실되지 않고 푸터 위나 원래 자리에 자연스럽게 고정되어 보이도록
       * 강제적으로 메뉴 노출 상태를 활성화(isVisible = true) 해둡니다.
       */
      if (currentScrollY <= 10 || currentScrollY + 10 >= maxScroll) {
        setIsVisible(true)
      } else {
        /**
         * 이전 스크롤 측정치보다 현재 스크롤 좌표값이 더 커졌다면 화면을 아래로 내리는 동작(Down)으로 판단하고
         * 모바일 뷰포트의 본문 가독성을 넓히기 위해 하단바를 스르륵 숨겨줍니다(isVisible = false).
         * 반대로 현재 스크롤 좌표값이 작아졌다면 화면을 위로 올리는 동작(Up)으로 판단하고
         * 언제든지 메뉴에 다시 빠르게 접근할 수 있도록 메뉴바를 즉각적으로 재노출시킵니다(isVisible = true).
         */
        if (currentScrollY > lastScrollY) {
          setIsVisible(false)
        } else {
          setIsVisible(true)
        }
      }

      /**
       * 다음 번 스크롤 움직임이 발생했을 때 상하 방향을 올바르게 판별해낼 수 있도록
       * 기준점이 되는 이전 스크롤 값 상태를 현재 최종 확인된 좌표값으로 계속해서 갱신 및 갱신 보존해 나갑니다.
       */
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [lastScrollY])

  const menuItems = [
    { to: '/team', label: 'TEAM', icon: '⚾' },
    { to: '/teamsong', label: '응원가', icon: '🎵' },
    { to: '/stadium-info', label: '구장정보', icon: '🏟️' },
    { to: '/qna', label: '가입인사', icon: '👋' },
    { to: '/free-board', label: '무적LG마당', icon: '💬' },
    { to: '/reviews', label: '승요인증', icon: '🏆' },
    { to: '/stadium-tour', label: '구장투어', icon: '🚩' },
    { to: '/twins-news', label: 'twins뉴스', icon: '📰' },
  ]

  return (
    <nav
      className={`bottomFixedMenu ${isVisible ? '' : 'bottomFixedMenuHidden'}`}
      aria-label="모바일 하단 고정 메뉴"
    >
      <div className="bottomFixedMenuInner">
        <div className="bottomFixedMenuRow">
          {menuItems.slice(0, 4).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `bottomFixedMenuItem ${isActive ? 'bottomFixedMenuItemActive' : ''}`
              }
            >
              <span className="bottomFixedMenuIcon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="bottomFixedMenuLabel">{item.label}</span>
            </NavLink>
          ))}
        </div>
        <div className="bottomFixedMenuRow">
          {menuItems.slice(4, 8).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `bottomFixedMenuItem ${isActive ? 'bottomFixedMenuItemActive' : ''}`
              }
            >
              <span className="bottomFixedMenuIcon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="bottomFixedMenuLabel">{item.label}</span>
            </NavLink>
          ))}
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

  const closeMobileNav = () => setMobileNavOpen(false)

  const handleMyPageClick = () => {
    navigate('/mypage')
    closeMobileNav()
  }

  const handleInquiryClick = () => {
    navigate('/inquiry')
    closeMobileNav()
  }

  const homePath = '/'

  /**
   * 주요 메뉴 순서 — 응원가 옆에 자주 찾는 구장정보를 배치해 경기장 정보 접근 동선을 줄였습니다.
   */
  const navItems = [
    { to: '/team', label: 'Team' },
    { to: '/teamsong', label: '응원가' },
    { to: '/stadium-info', label: '구장정보' },
    { to: '/qna', label: '가입인사' },
    { to: '/free-board', label: '무적LG마당' },
    { to: '/reviews', label: '승요인증' },
    { to: '/stadium-tour', label: '구장투어' },
    { to: '/twins-news', label: 'twins뉴스' },
  ]

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
            {/* 1093px 이하에서는 숨김(appShell.css) — 같은 내용은 모바일 드로어 mobileNavUtilsSection 에만 둡니다 */}
            <div className="headerUtilsDesktopCluster">
              {loading ? (
                <button
                  type="button"
                  className="headerLoginBtn"
                  aria-label="문의하기"
                  onClick={handleInquiryClick}
                >
                  문의하기
                </button>
              ) : user ? (
                <>
                  {/* 닉네임은 로그인 사용자의 현재 계정 식별자라서, 클릭 시 본인 정보 수정 화면으로 이어지게 합니다 */}
                  <button
                    type="button"
                    className="headerWelcomeNickname"
                    onClick={handleMyPageClick}
                    aria-label={`${nickname}님 마이페이지로 이동`}
                  >
                    {nickname}
                  </button>
                  <button
                    type="button"
                    className="headerLoginBtn"
                    aria-label="문의하기"
                    onClick={handleInquiryClick}
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
                    onClick={handleInquiryClick}
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
                    {/* 모바일에서도 같은 계정명 클릭 동선을 제공해 데스크톱과 사용 흐름을 맞춥니다 */}
                    <button
                      type="button"
                      className="mobileDrawerWelcome mobileDrawerWelcomeInTopBar mobileDrawerWelcomeBtn"
                      onClick={handleMyPageClick}
                      aria-label={`${nickname}님 마이페이지로 이동`}
                    >
                      {nickname}
                    </button>
                    <button
                      type="button"
                      className="mobileNavTopBarBtn"
                      aria-label="문의하기"
                      onClick={handleInquiryClick}
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
                    onClick={handleInquiryClick}
                  >
                    문의하기
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="mobileNavTopBarBtn"
                      aria-label="문의하기"
                      onClick={handleInquiryClick}
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

      {/* 
        스크롤을 맨 아래로 내렸을 때 푸터 영역과 고정 메뉴바가 겹쳐서 푸터를 가리는 오작동을 해결하기 위해
        마크업 상에서 BottomFixedMenu 컴포넌트를 mainContent와 siteFooter의 정중앙 사이에 배치합니다.
        이렇게 구조를 조율하고 CSS에서 position: sticky 속성을 활성화하면,
        평상시에는 바닥에 고정(fixed)된 것처럼 보이다가 푸터가 드러나면 푸터 위에 자연스럽게 안착(sticky)하게 됩니다.
      */}
      <BottomFixedMenu />

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
