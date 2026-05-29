import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

const defaultPageSize = 10

function formatViewCount(value) {
  return Number(value ?? 0).toLocaleString('ko-KR')
}

export function BoardListTable({ rows, caption, pageSize = defaultPageSize, bottomAction, detailBasePath }) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const shouldShowPagination = rows.length > pageSize
  const pageStartIndex = (currentPage - 1) * pageSize
  const pageRows = useMemo(() => {
    return rows.slice(pageStartIndex, pageStartIndex + pageSize)
  }, [pageSize, pageStartIndex, rows])

  const goToPage = (page) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages))
  }

  return (
    <div className="boardListWrap">
      <div className="boardListTableScroll">
        <table className="boardListTable">
          <caption>{caption}</caption>
          <thead>
            <tr>
              <th scope="col" className="boardListColNumber">번호</th>
              <th scope="col" className="boardListColCategory">구분</th>
              <th scope="col" className="boardListColTitle">제목</th>
              <th scope="col" className="boardListColAuthor">글쓴이</th>
              <th scope="col" className="boardListColDate">날짜</th>
              <th scope="col" className="boardListColViews">조회</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="boardListEmptyCell">
                  아직 등록된 글이 없습니다
                </td>
              </tr>
            ) : (
              pageRows.map((row, index) => (
                <tr key={row.id}>
                  <td className="boardListNumberCell">{rows.length - (pageStartIndex + index)}</td>
                  <td className="boardListCategoryCell">{row.category}</td>
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
    </div>
  )
}
