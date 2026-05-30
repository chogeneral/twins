/**
 * 문의하기 게시판: 관리자는 전체 문의를, 일반 사용자는 본인이 작성한 문의만 확인합니다.
 * - 문의 내용은 공통 게시판 저장 구조를 쓰되 목록의 구분 컬럼은 숨깁니다.
 */

import { useEffect, useMemo } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { BoardListTable } from '../components/BoardListTable'
import { useAuth } from '../hooks/useAuth'
import { getBoardPosts } from '../lib/boardPostStorage'
import './boardPage.css'

const inquiryBoardPath = '/inquiry'
const inquiryAdminEmail = 's2ckh1005@gmail.com'

export function InquiryBoardPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading, nickname } = useAuth()
  const loginRedirectHref = `/login?redirect=${encodeURIComponent(inquiryBoardPath)}`
  const isAdmin = user?.email === inquiryAdminEmail
  const authorDisplay = nickname || user?.email?.split('@')[0] || 'member'
  const inquiryRows = useMemo(() => {
    const rows = getBoardPosts('inquiryBoard')

    if (isAdmin) return rows

    /*
     * 문의 전체 목록은 관리자만 보지만, 일반 사용자는 본인이 남긴 문의를 다시 확인해야 합니다.
     * 예전에 저장된 글에는 userId가 없을 수 있어 표시명(author)까지 함께 확인합니다.
     */
    return rows.filter((row) => (
      row.userId === user?.id
      || (!row.userId && row.author === authorDisplay)
    ))
  }, [authorDisplay, isAdmin, user?.id])

  useEffect(() => {
    if (authLoading || !user || isAdmin) return

    /*
     * 일반 사용자가 문의하기 메뉴를 누르면 전체 목록은 관리자만 볼 수 있음을 먼저 안내합니다.
     * 안내 후에는 본인이 작성한 문의만 남겨 두어 문의 상태 확인과 댓글 작성 흐름은 이어지게 합니다.
     */
    window.alert('관리자만 볼 수 있습니다.')
  }, [authLoading, isAdmin, user])

  if (authLoading) {
    return (
      <article className="boardPage" aria-busy="true">
        <header className="boardHeader">
          <p lang="en" className="boardEyebrow">inquiry</p>
          <h1 className="boardTitle">문의하기</h1>
          <p className="boardDescription">로그인 여부를 확인하는 중입니다.</p>
        </header>
      </article>
    )
  }

  if (!user) {
    return <Navigate to={loginRedirectHref} replace />
  }

  return (
    <article className="boardPage">
      <header className="boardHeader">
        
        <h1 className="boardTitle">문의하기</h1>
        <p className="boardDescription">
          {isAdmin
            ? '사이트 이용 문의와 개선 의견을 확인하는 관리자 전용 전체 목록입니다.'
            : '전체 문의 목록은 관리자만 볼 수 있으며, 이 화면에는 내가 작성한 문의만 표시됩니다.'}
        </p>
      </header>

      <section
        className="boardPanel"
        aria-labelledby="inquiryBoardListHeading"
      >
        <h2 id="inquiryBoardListHeading" className="srOnly">
          문의하기 게시글 목록
        </h2>
        <BoardListTable
          rows={inquiryRows}
          caption="문의하기 게시글 목록"
          detailBasePath="/inquiry"
          showCategory={false}
          bottomAction={(
            <button type="button" className="boardWriteLinkBtn" onClick={() => navigate('/inquiry/write')}>
              글쓰기
            </button>
          )}
        />
      </section>
    </article>
  )
}
