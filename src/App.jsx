/**
 * 라우팅 허브: 모든 화면을 AppShell 레이아웃 아래 Outlet으로 묶었습니다.
 * - 루트 `/` 에는 별도 메인(Home) 페이지를 두고, TEAM·게시판은 기존 경로를 유지합니다.
 */

import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from './components/AppShell.jsx'
import { useAuth } from './hooks/useAuth.js'
import { HomePage } from './pages/HomePage.jsx'
import { TeamPage } from './pages/TeamPage.jsx'
import { TeamSongPage } from './pages/TeamSongPage.jsx'
import { FreeBoardPage } from './pages/FreeBoardPage.jsx'
import { ReviewBoardPage } from './pages/ReviewBoardPage.jsx'
import { StadiumTourBoardPage } from './pages/StadiumTourBoardPage.jsx'
import { TwinsNewsBoardPage } from './pages/TwinsNewsBoardPage.jsx'
import { InquiryBoardPage } from './pages/InquiryBoardPage.jsx'
import { BoardWritePage } from './pages/BoardWritePage.jsx'
import { BoardDetailPage } from './pages/BoardDetailPage.jsx'
import { QuestionBoardPage } from './pages/QuestionBoardPage.jsx'
import { StadiumInfoPage } from './pages/StadiumInfoPage.jsx'
import { LoginPage } from './pages/LoginPage.jsx'
import { SignupPage } from './pages/SignupPage.jsx'
import { MyPage } from './pages/MyPage.jsx'
import { FindIdPage } from './pages/FindIdPage.jsx'
import { FindPasswordPage } from './pages/FindPasswordPage.jsx'

const defaultSeo = {
  title: '유광 잠바 | LG 트윈스 팬 커뮤니티',
  description: '유광 잠바는 LG 트윈스 팬을 위한 커뮤니티입니다. 팀 정보, 응원가, 가입인사, 무적LG마당, 승요인증, 구장투어, 트윈스뉴스를 함께 나눕니다.',
  keywords: '유광 잠바, LG 트윈스, 엘지 트윈스, LG Twins, LG트윈스 팬 커뮤니티, 무적LG마당, 승요인증, 구장투어, 트윈스뉴스, 응원가',
  robots: 'index, follow',
}

const routeSeoEntries = [
  {
    path: '/',
    exact: true,
    title: defaultSeo.title,
    description: defaultSeo.description,
    keywords: defaultSeo.keywords,
  },
  {
    path: '/team',
    title: 'TEAM | 유광 잠바',
    description: 'LG 트윈스 팀 역사, 주요 기록, 영구결번, 선수 이야기를 확인할 수 있는 유광 잠바 TEAM 페이지입니다.',
    keywords: 'LG 트윈스 TEAM, LG 트윈스 역사, LG 트윈스 기록, 유광 잠바',
  },
  {
    path: '/teamsong',
    title: '응원가 | 유광 잠바',
    description: 'LG 트윈스 팀 응원가와 선수별 응원가를 모아 볼 수 있는 유광 잠바 응원가 페이지입니다.',
    keywords: 'LG 트윈스 응원가, 엘지 트윈스 응원가, 선수 응원가, 유광 잠바',
  },
  {
    path: '/qna',
    title: '가입인사 | 유광 잠바',
    description: 'LG 트윈스 팬들이 처음 인사를 나누고 서로를 환영하는 유광 잠바 가입인사 게시판입니다.',
    keywords: 'LG 트윈스 가입인사, 유광 잠바 가입인사, LG트윈스 팬 커뮤니티',
  },
  {
    path: '/free-board',
    title: '무적LG마당 | 유광 잠바',
    description: 'LG 트윈스 팬들이 경기, 응원, 티켓, 일상 이야기를 자유롭게 나누는 무적LG마당 게시판입니다.',
    keywords: '무적LG마당, LG 트윈스 자유게시판, 엘지 트윈스 팬 게시판, 유광 잠바',
  },
  {
    path: '/reviews',
    title: '승요인증 | 유광 잠바',
    description: 'LG 트윈스 승리 순간과 직관 후기를 팬들과 함께 공유하는 승요인증 게시판입니다.',
    keywords: '승요인증, LG 트윈스 직관 후기, LG 트윈스 승리 인증, 유광 잠바',
  },
  {
    path: '/stadium-tour',
    title: '구장투어 | 유광 잠바',
    description: '야구장 방문 후기, 좌석 시야, 먹거리, 동선 정보를 나누는 유광 잠바 구장투어 게시판입니다.',
    keywords: '구장투어, 야구장 후기, 잠실야구장 후기, LG 트윈스 직관, 유광 잠바',
  },
  {
    path: '/twins-news',
    title: 'twins뉴스 | 유광 잠바',
    description: 'LG 트윈스 경기 소식, 기사, 인터뷰, 팬들이 주목한 뉴스를 공유하는 twins뉴스 게시판입니다.',
    keywords: 'twins뉴스, LG 트윈스 뉴스, 엘지 트윈스 소식, 유광 잠바',
  },
  {
    path: '/stadium-info',
    title: '구장정보 | 유광 잠바',
    description: 'KBO 주요 구장 위치, 지도, 날씨, 교통 정보를 확인할 수 있는 유광 잠바 구장정보 페이지입니다.',
    keywords: '구장정보, 잠실야구장, KBO 구장, 야구장 교통, 유광 잠바',
  },
]

const noIndexPathPrefixes = ['/login', '/signup', '/mypage', '/find-id', '/find-password', '/inquiry']
const noIndexPathSegments = ['/write', '/edit']

function upsertMeta(selector, createMeta, valueAttribute, value) {
  let element = document.head.querySelector(selector)

  if (!element) {
    element = createMeta()
    document.head.appendChild(element)
  }

  element.setAttribute(valueAttribute, value)
}

function getRouteSeo(pathname) {
  const normalizedPath = pathname === '' ? '/' : pathname
  const matchedEntry = routeSeoEntries.find((entry) => (
    entry.exact
      ? entry.path === normalizedPath
      : normalizedPath === entry.path || normalizedPath.startsWith(`${entry.path}/`)
  ))

  const shouldNoIndex = noIndexPathPrefixes.some((path) => normalizedPath.startsWith(path))
    || noIndexPathSegments.some((segment) => normalizedPath.includes(segment))

  return {
    ...defaultSeo,
    ...(matchedEntry ?? {}),
    robots: shouldNoIndex ? 'noindex, nofollow' : defaultSeo.robots,
  }
}

function RouteSeo() {
  const location = useLocation()

  useEffect(() => {
    const seo = getRouteSeo(location.pathname)
    const canonicalUrl = `${window.location.origin}${location.pathname}`

    document.title = seo.title

    /*
     * Vite SPA는 모든 경로가 index.html에서 시작하므로, 라우트가 바뀔 때 head 메타를 직접 갱신합니다.
     * Google은 렌더링 후 메타를 읽을 수 있고, 네이버도 최소한 게시판별 제목·설명을 분리해 인식할 가능성이 높아집니다.
     */
    upsertMeta('meta[name="description"]', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      return meta
    }, 'content', seo.description)

    upsertMeta('meta[name="keywords"]', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('name', 'keywords')
      return meta
    }, 'content', seo.keywords)

    upsertMeta('meta[name="robots"]', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('name', 'robots')
      return meta
    }, 'content', seo.robots)

    upsertMeta('link[rel="canonical"]', () => {
      const link = document.createElement('link')
      link.setAttribute('rel', 'canonical')
      return link
    }, 'href', canonicalUrl)

    upsertMeta('meta[property="og:title"]', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('property', 'og:title')
      return meta
    }, 'content', seo.title)

    upsertMeta('meta[property="og:description"]', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('property', 'og:description')
      return meta
    }, 'content', seo.description)

    upsertMeta('meta[property="og:url"]', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('property', 'og:url')
      return meta
    }, 'content', canonicalUrl)

    upsertMeta('meta[name="twitter:title"]', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('name', 'twitter:title')
      return meta
    }, 'content', seo.title)

    upsertMeta('meta[name="twitter:description"]', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('name', 'twitter:description')
      return meta
    }, 'content', seo.description)
  }, [location.pathname])

  return null
}

function ProtectedRoute({ children }) {
  const location = useLocation()
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <article className="boardPage" aria-busy="true">
        <header className="boardHeader">
          <h1 className="boardTitle">로그인 확인 중</h1>
          <p className="boardDescription">
            로그인 여부를 확인하는 중입니다.
          </p>
        </header>
      </article>
    )
  }

  if (!user) {
    const redirectPath = `${location.pathname}${location.search}${location.hash}`

    /**
     * 보호 페이지에서 로그인으로 보낼 때 원래 주소를 남겨 둡니다.
     * LoginPage가 redirect 값을 읽어 로그인 성공 후 사용자가 누른 메뉴로 자연스럽게 돌아오게 하기 위함입니다.
     */
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirectPath)}`} replace />
  }

  return children
}

export default function App() {
  const requireAuth = (element) => (
    <ProtectedRoute>
      {element}
    </ProtectedRoute>
  )

  return (
    <BrowserRouter>
      <RouteSeo />
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="teamsong" element={<TeamSongPage />} />
          <Route path="stadium-info" element={<StadiumInfoPage />} />
          <Route path="free-board" element={<FreeBoardPage />} />
          <Route path="free-board/write" element={requireAuth(<BoardWritePage boardType="free" />)} />
          <Route path="free-board/:postId/edit" element={requireAuth(<BoardWritePage boardType="free" />)} />
          <Route path="free-board/:postId" element={<BoardDetailPage boardType="free" />} />
          <Route path="reviews" element={<ReviewBoardPage />} />
          <Route path="reviews/write" element={requireAuth(<BoardWritePage boardType="review" />)} />
          <Route path="reviews/:postId/edit" element={requireAuth(<BoardWritePage boardType="review" />)} />
          <Route path="reviews/:postId" element={<BoardDetailPage boardType="review" />} />
          <Route path="stadium-tour" element={<StadiumTourBoardPage />} />
          <Route path="stadium-tour/write" element={requireAuth(<BoardWritePage boardType="stadiumTour" />)} />
          <Route path="stadium-tour/:postId/edit" element={requireAuth(<BoardWritePage boardType="stadiumTour" />)} />
          <Route path="stadium-tour/:postId" element={<BoardDetailPage boardType="stadiumTour" />} />
          <Route path="twins-news" element={<TwinsNewsBoardPage />} />
          <Route path="twins-news/write" element={requireAuth(<BoardWritePage boardType="twinsNews" />)} />
          <Route path="twins-news/:postId/edit" element={requireAuth(<BoardWritePage boardType="twinsNews" />)} />
          <Route path="twins-news/:postId" element={<BoardDetailPage boardType="twinsNews" />} />
          <Route path="inquiry" element={requireAuth(<InquiryBoardPage />)} />
          <Route path="inquiry/write" element={requireAuth(<BoardWritePage boardType="inquiry" />)} />
          <Route path="inquiry/:postId/edit" element={requireAuth(<BoardWritePage boardType="inquiry" />)} />
          <Route path="inquiry/:postId" element={requireAuth(<BoardDetailPage boardType="inquiry" />)} />
          <Route path="qna" element={<QuestionBoardPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="signup" element={<SignupPage />} />
          <Route path="mypage" element={<MyPage />} />
          <Route path="find-id" element={<FindIdPage />} />
          <Route path="find-password" element={<FindPasswordPage />} />
          {/* 정의되지 않은 경로는 메인으로 돌려 첫 진입점을 통일했습니다 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
