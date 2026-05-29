const boardPostStoragePrefix = 'lgtwins.boardPosts.'

function boardStorageKey(boardKey) {
  return `${boardPostStoragePrefix}${boardKey}`
}

function formatToday() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function safeParsePosts(rawValue) {
  if (!rawValue) return []

  try {
    const parsed = JSON.parse(rawValue)
    if (!Array.isArray(parsed)) return []
    return parsed
  }
  catch {
    return []
  }
}

export function getBoardPosts(boardKey) {
  const rows = safeParsePosts(window.localStorage.getItem(boardStorageKey(boardKey)))
  return rows.filter((row) => row && typeof row.id === 'string')
}

export function getBoardPost(boardKey, postId) {
  return getBoardPosts(boardKey).find((row) => row.id === postId) ?? null
}

export function increaseBoardPostViews(boardKey, postId) {
  const previousRows = getBoardPosts(boardKey)
  const nextRows = previousRows.map((row) => (
    row.id === postId
      ? { ...row, views: Number(row.views ?? 0) + 1 }
      : row
  ))

  window.localStorage.setItem(boardStorageKey(boardKey), JSON.stringify(nextRows))
  return nextRows.find((row) => row.id === postId) ?? null
}

export function deleteBoardPost(boardKey, postId) {
  const previousRows = getBoardPosts(boardKey)
  const nextRows = previousRows.filter((row) => row.id !== postId)

  window.localStorage.setItem(boardStorageKey(boardKey), JSON.stringify(nextRows))
  return nextRows.length !== previousRows.length
}

export function updateBoardPost(boardKey, postId, post) {
  const previousRows = getBoardPosts(boardKey)
  let updatedPost = null

  /*
   * 수정은 기존 id·작성일·조회수를 유지하고, 사용자가 다시 입력한 본문 관련 값만 바꿉니다.
   * 목록 정렬이 갑자기 바뀌지 않도록 배열 순서도 그대로 둡니다.
   */
  const nextRows = previousRows.map((row) => {
    if (row.id !== postId) return row

    updatedPost = {
      ...row,
      category: post.category,
      title: post.title,
      content: post.content,
      htmlContent: post.htmlContent,
      fontFamily: post.fontFamily,
      fontSize: post.fontSize,
      tags: post.tags,
    }
    return updatedPost
  })

  window.localStorage.setItem(boardStorageKey(boardKey), JSON.stringify(nextRows))
  return updatedPost
}

export function addBoardPost(boardKey, post) {
  const previousRows = getBoardPosts(boardKey)

  /*
   * 현재는 백엔드 테이블이 없는 게시판이라 브라우저 저장소에 먼저 저장합니다.
   * DB 연결 시에도 목록에서 쓰는 필드 이름을 유지하면 화면 컴포넌트 변경을 줄일 수 있습니다.
   */
  const nextPost = {
    id: `${boardKey}-${Date.now()}`,
    category: post.category,
    title: post.title,
    content: post.content,
    htmlContent: post.htmlContent,
    fontFamily: post.fontFamily,
    fontSize: post.fontSize,
    tags: post.tags,
    author: post.author,
    date: formatToday(),
    views: 0,
  }

  window.localStorage.setItem(
    boardStorageKey(boardKey),
    JSON.stringify([nextPost, ...previousRows]),
  )

  return nextPost
}
