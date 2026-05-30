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
        {rows.length === 0 ? (
          <p className="boardThumbnailEmpty">아직 등록된 글이 없습니다</p>
        ) : (
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
                    <span className="boardThumbnailMeta">{row.date}</span>
                  </Link>
                </article>
              )
            })}
          </div>
        )}

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
              <th scope="col" className="boardListColAuthor">글쓴이</th>
              <th scope="col" className="boardListColDate">날짜</th>
              <th scope="col" className="boardListColViews">조회</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={showCategory ? 6 : 5} className="boardListEmptyCell">
                  아직 등록된 글이 없습니다
                </td>
              </tr>
            ) : (
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
                  <td className="boardListAuthorCell">{row.author}</td>
                  <td className="boardListDateCell">{row.date}</td>
                  <td className="boardListViewsCell">{formatViewCount(row.views)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {renderFooter()}
    </div>
  )
}
