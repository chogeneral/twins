const boardPostStoragePrefix = 'lgtwins.boardPosts.'
const boardCommentStoragePrefix = 'lgtwins.boardComments.'

function boardStorageKey(boardKey) {
  return `${boardPostStoragePrefix}${boardKey}`
}

function boardCommentStorageKey(boardKey, postId) {
  return `${boardCommentStoragePrefix}${boardKey}.${postId}`
}

function formatToday() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatNow() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
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
      userId: row.userId ?? post.userId,
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
    userId: post.userId,
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

export function getBoardComments(boardKey, postId) {
  const rows = safeParsePosts(window.localStorage.getItem(boardCommentStorageKey(boardKey, postId)))
  return rows.filter((row) => row && typeof row.id === 'string')
}

export function addBoardComment(boardKey, postId, comment) {
  const previousRows = getBoardComments(boardKey, postId)

  /*
   * 댓글은 서버 테이블 연결 전까지 게시글 id 단위로 분리 저장합니다.
   * parentId가 있으면 대댓글이고, null이면 원 댓글입니다.
   */
  const nextComment = {
    id: `${boardKey}-${postId}-comment-${Date.now()}`,
    postId,
    parentId: comment.parentId ?? null,
    userId: comment.userId,
    authorDisplay: comment.authorDisplay,
    content: comment.content,
    createdAt: formatNow(),
    updatedAt: '',
  }

  window.localStorage.setItem(
    boardCommentStorageKey(boardKey, postId),
    JSON.stringify([...previousRows, nextComment]),
  )

  return nextComment
}

export function updateBoardComment(boardKey, postId, commentId, content) {
  const previousRows = getBoardComments(boardKey, postId)
  let updatedComment = null

  const nextRows = previousRows.map((row) => {
    if (row.id !== commentId) return row

    updatedComment = {
      ...row,
      content,
      updatedAt: formatNow(),
    }
    return updatedComment
  })

  window.localStorage.setItem(boardCommentStorageKey(boardKey, postId), JSON.stringify(nextRows))
  return updatedComment
}

export function deleteBoardComment(boardKey, postId, commentId) {
  const previousRows = getBoardComments(boardKey, postId)
  const deleteIds = new Set([commentId])

  /*
   * 부모 댓글을 삭제하면 그 아래 대댓글도 함께 삭제합니다.
   * 여러 단계 대댓글까지 안전하게 지우기 위해 삭제 대상이 더 이상 늘지 않을 때까지 순회합니다.
   */
  let changed = true
  while (changed) {
    changed = false
    previousRows.forEach((row) => {
      if (row.parentId && deleteIds.has(row.parentId) && !deleteIds.has(row.id)) {
        deleteIds.add(row.id)
        changed = true
      }
    })
  }

  const nextRows = previousRows.filter((row) => !deleteIds.has(row.id))
  window.localStorage.setItem(boardCommentStorageKey(boardKey, postId), JSON.stringify(nextRows))
  return nextRows.length !== previousRows.length
}
