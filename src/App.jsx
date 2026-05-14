/**
 * 라우팅 허브: 모든 화면을 AppShell 레이아웃 아래 Outlet으로 묶었습니다.
 * - 루트 `/` 에는 별도 메인(Home) 페이지를 두고, TEAM·게시판은 기존 경로를 유지합니다.
 */

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell.jsx'
import { HomePage } from './pages/HomePage.jsx'
import { TeamPage } from './pages/TeamPage.jsx'
import { TeamSongPage } from './pages/TeamSongPage.jsx'
import { FreeBoardPage } from './pages/FreeBoardPage.jsx'
import { ReviewBoardPage } from './pages/ReviewBoardPage.jsx'
import { QuestionBoardPage } from './pages/QuestionBoardPage.jsx'
import { StadiumInfoPage } from './pages/StadiumInfoPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="teamsong" element={<TeamSongPage />} />
          <Route path="stadium-info" element={<StadiumInfoPage />} />
          <Route path="free-board" element={<FreeBoardPage />} />
          <Route path="reviews" element={<ReviewBoardPage />} />
          <Route path="qna" element={<QuestionBoardPage />} />
          {/* 정의되지 않은 경로는 메인으로 돌려 첫 진입점을 통일했습니다 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
