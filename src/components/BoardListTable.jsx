import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

const defaultPageSize = 9

function formatViewCount(value) {
  return Number(value ?? 0).toLocaleString('ko-KR')
}

function getFirstImageSrc(htmlContent) {
  const match = String(htmlContent ?? '').match(/<img[^>]*\ssrc=["']([^"']+)["']/i)
  return match?.[1] ?? ''
}

function getExcerpt(row) {
  const textContent = String(row.content ?? '').trim()
  if (textContent) return textContent

  return String(row.htmlContent ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function BoardListTable({
  rows,
  caption,
  pageSize = defaultPageSize,
  bottomAction,
  detailBasePath,
  variant = 'table',
  showCategory = true,
  hideEmptyState = false,
}) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  /*
   * 게시글은 9개 단위(pageSize)로 끊어서 보여 줍니다.
   * 1페이지에 담기지 않는 10번째 글부터 다음 페이지가 생기므로, 실제 페이지가 2개 이상일 때만 페이징을 노출합니다.
   */
  const shouldShowPagination = totalPages > 1
  const pageStartIndex = (currentPage - 1) * pageSize
  const pageRows = useMemo(() => {
    return rows.slice(pageStartIndex, pageStartIndex + pageSize)
  }, [pageSize, pageStartIndex, rows])

  const goToPage = (page) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages))
  }

  const renderFooter = () => (
    <div className="boardListFooter">
      <span className="boardListFooterSpacer" aria-hidden="true" />

      {shouldShowPagination && (
        <nav className="boardPagination" aria-label={`${caption} 페이지 이동`}>
          <button
            type="button"
            className="boardPaginationBtn"
            disabled={currentPage === 1}
            onClick={() => goToPage(currentPage - 1)}
          >
            이전
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
            <button
              key={page}
              type="button"
              className={['boardPaginationNumber', page === currentPage ? 'boardPaginationNumberActive' : ''].filter(Boolean).join(' ')}
              aria-current={page === currentPage ? 'page' : undefined}
              onClick={() => goToPage(page)}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            className="boardPaginationBtn"
            disabled={currentPage === totalPages}
            onClick={() => goToPage(currentPage + 1)}
          >
            다음
          </button>
        </nav>
      )}

      {bottomAction && (
        <div className="boardListBottomActions">
          {bottomAction}
        </div>
      )}
    </div>
  )

  if (variant === 'thumbnail') {
    return (
      <div className="boardListWrap">
        {rows.length === 0 && !hideEmptyState ? (
          <p className="boardThumbnailEmpty">아직 등록된 글이 없습니다</p>
        ) : rows.length > 0 ? (
          <div className="boardThumbnailGrid" role="list" aria-label={caption}>
            {pageRows.map((row) => {
              const thumbnailSrc = getFirstImageSrc(row.htmlContent)

              return (
                <article key={row.id} className="boardThumbnailCard" role="listitem">
                  <Link className="boardThumbnailLink" to={`${detailBasePath}/${row.id}`}>
                    <div className="boardThumbnailImageWrap">
                      {thumbnailSrc ? (
                        <img className="boardThumbnailImage" src={thumbnailSrc} alt="" />
                      ) : (
                        <span className="boardThumbnailNoImage">no-image</span>
                      )}
                    </div>
                    <strong className="boardThumbnailTitle">{row.title}</strong>
                    <p className="boardThumbnailExcerpt">{getExcerpt(row)}</p>
                    {/*
                      구글 및 네이버 검색 최적화 이후 카드형 목록에서도 게시글의 상세 활성도를 한눈에 파악할 수 있도록,
                      작성자(author) 및 실시간 댓글 개수(commentCount) 정보를 하단 메타 영역에 추가로 표현합니다.
                      작성자 정보 왼쪽 위치에 댓글 수가 들어가도록 문자열을 구성했습니다.
                    */}
                    <span className="boardThumbnailMeta">
                      {row.commentCount > 0 ? `댓글 ${row.commentCount} · ` : ''}{row.author} · {row.date}
                    </span>
                  </Link>
                </article>
              )
            })}
          </div>
        ) : null}

        {renderFooter()}
      </div>
    )
  }

  return (
    <div className="boardListWrap">
      <div className="boardListTableScroll">
        <table className="boardListTable">
          <caption>{caption}</caption>
          <thead>
            <tr>
              <th scope="col" className="boardListColNumber">번호</th>
              {showCategory && <th scope="col" className="boardListColCategory">구분</th>}
              <th scope="col" className="boardListColTitle">제목</th>
              {/*
                사용자의 요청에 따라 글쓴이 왼쪽에 실시간 댓글 수를 표기할 전용 컬럼 헤더를 배치합니다.
                이를 통해 사용자들이 상세글에 진입하기 전에도 댓글 수량과 화제성을 즉시 판단할 수 있도록 돕습니다.
              */}
              <th scope="col" className="boardListColComments">댓글</th>
              <th scope="col" className="boardListColAuthor">글쓴이</th>
              <th scope="col" className="boardListColDate">날짜</th>
              <th scope="col" className="boardListColViews">조회</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !hideEmptyState ? (
              <tr>
                {/*
                  댓글(Comments) 컬럼이 1개 늘어남에 따라,
                  데이터가 존재하지 않을 때 화면을 채우는 빈 셀의 가로 합(colSpan) 수치를 기존 대비 1씩 증가시켜 테이블 구조 깨짐을 차단합니다.
                */}
                <td colSpan={showCategory ? 7 : 6} className="boardListEmptyCell">
                  아직 등록된 글이 없습니다
                </td>
              </tr>
            ) : rows.length > 0 ? (
              pageRows.map((row, index) => (
                <tr key={row.id}>
                  <td className="boardListNumberCell">{rows.length - (pageStartIndex + index)}</td>
                  {showCategory && <td className="boardListCategoryCell">{row.category}</td>}
                  <td className="boardListTitleCell">
                    {detailBasePath ? (
                      <Link className="boardListTitleText" to={`${detailBasePath}/${row.id}`}>
                        {row.title}
                      </Link>
                    ) : (
                      <span className="boardListTitleText">{row.title}</span>
                    )}
                  </td>
                  {/*
                    스토리지/API로부터 수집된 실시간 댓글 개수(commentCount)를 매핑하여 테이블 셀에 출력합니다.
                    글쓴이(author) 왼쪽 칸에 정밀 정렬되도록 순서를 맞췄습니다.
                  */}
                  <td className="boardListCommentsCell">{row.commentCount ?? 0}</td>
                  <td className="boardListAuthorCell">{row.author}</td>
                  <td className="boardListDateCell">{row.date}</td>
                  <td className="boardListViewsCell">{formatViewCount(row.views)}</td>
                </tr>
              ))
            ) : null}
          </tbody>
        </table>
      </div>

      {renderFooter()}
    </div>
  )
}
