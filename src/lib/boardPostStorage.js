import { supabase } from './supabaseClient'

const boardPostStoragePrefix = 'lgtwins.boardPosts.'
const boardCommentStoragePrefix = 'lgtwins.boardComments.'
const sharedBoardKeys = new Set(['freeBoard', 'reviewBoard', 'stadiumTourBoard', 'twinsNewsBoard'])
const boardPostBaseSelectColumns = [
  'id',
  'board_key',
  'user_id',
  'category',
  'title',
  'content',
  'html_content',
  'font_family',
  'font_size',
  'author_display',
  'views',
  'created_at',
].join(', ')
const boardPostSelectColumns = `post_no, ${boardPostBaseSelectColumns}`
const boardCommentBaseSelectColumns = [
  'id',
  'post_id',
  'parent_id',
  'user_id',
  'author_display',
  'content',
  'created_at',
  'updated_at',
].join(', ')
const boardCommentSelectColumns = `comment_no, ${boardCommentBaseSelectColumns}`

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

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

function formatDateFromTimestamp(value) {
  if (!value) return formatToday()

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return formatToday()

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateTimeFromTimestamp(value) {
  if (!value) return formatNow()

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return formatNow()

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

function mapBoardPostRow(row) {
  /*
   * Supabase에서 조인해 온 board_comments의 count 값을 우선시하고,
   * 만약 로컬 스토리지나 다른 경로를 통해 commentCount가 이미 정의되어 있다면 그 값을 안전하게 매핑합니다.
   * 이를 통해 모든 게시판 데이터가 동일한 commentCount 속성을 사용할 수 있도록 일관성을 부여합니다.
   */
  const commentCount = row.commentCount ?? row.board_comments?.[0]?.count ?? 0

  return {
    id: row.id,
    postNo: row.post_no,
    category: row.category,
    title: row.title,
    content: row.content,
    htmlContent: row.html_content,
    fontFamily: row.font_family,
    fontSize: row.font_size,
    userId: row.user_id,
    author: row.author_display || 'member',
    date: formatDateFromTimestamp(row.created_at),
    views: row.views ?? 0,
    commentCount,
  }
}

function boardPostInsertPayload(boardKey, post) {
  return {
    board_key: boardKey,
    user_id: post.userId,
    category: post.category,
    title: post.title,
    content: post.content,
    html_content: post.htmlContent,
    font_family: post.fontFamily,
    font_size: post.fontSize,
  }
}

function boardPostUpdatePayload(post) {
  return {
    category: post.category,
    title: post.title,
    content: post.content,
    html_content: post.htmlContent,
    font_family: post.fontFamily,
    font_size: post.fontSize,
  }
}

function mapBoardCommentRow(row) {
  return {
    id: row.id,
    commentNo: row.comment_no,
    postId: row.post_id,
    parentId: row.parent_id,
    userId: row.user_id,
    authorDisplay: row.author_display || 'member',
    content: row.content,
    createdAt: formatDateTimeFromTimestamp(row.created_at),
    updatedAt: row.updated_at && row.updated_at !== row.created_at
      ? formatDateTimeFromTimestamp(row.updated_at)
      : '',
  }
}

function boardCommentInsertPayload(postId, comment) {
  return {
    post_id: postId,
    parent_id: comment.parentId ?? null,
    user_id: comment.userId,
    content: comment.content,
  }
}

function isMissingDisplayNumberColumn(error) {
  const message = `${error?.message ?? ''} ${error?.details ?? ''} ${error?.hint ?? ''}`
  return /post_no|comment_no/i.test(message)
}

export function isSharedBoardKey(boardKey) {
  return sharedBoardKeys.has(boardKey)
}

export async function fetchBoardPosts(boardKey) {
  if (!supabase || !isSharedBoardKey(boardKey)) return getBoardPosts(boardKey)

  /*
   * Supabase 게시글 목록을 읽어올 때 각 게시글별 댓글 개수를 효율적으로 계산하기 위하여
   * board_comments(count) 관계 조인 쿼리를 select 절에 포함시킵니다.
   * 이렇게 함으로써 별도의 네트워크 요청 없이 목록을 가져올 때 한 번에 모든 댓글 수가 실시간 수집됩니다.
   */
  let { data, error } = await supabase
    .from('board_posts')
    .select(`
      post_no,
      id,
      board_key,
      user_id,
      category,
      title,
      content,
      html_content,
      font_family,
      font_size,
      author_display,
      views,
      created_at,
      board_comments(count)
    `)
    .eq('board_key', boardKey)
    .order('created_at', { ascending: false })

  /*
   * post_no 컬럼이 없는 기존 구 버전 데이터베이스 스키마와 호환을 유지하기 위해
   * 오류 발생 시 post_no를 제외하고 board_comments(count)는 유지한 채 안전한 2차 조회를 재시도합니다.
   */
  if (error && isMissingDisplayNumberColumn(error)) {
    const retryResult = await supabase
      .from('board_posts')
      .select(`
        id,
        board_key,
        user_id,
        category,
        title,
        content,
        html_content,
        font_family,
        font_size,
        author_display,
        views,
        created_at,
        board_comments(count)
      `)
      .eq('board_key', boardKey)
      .order('created_at', { ascending: false })

    data = retryResult.data
    error = retryResult.error
  }

  if (error) throw error

  const mapped = (data ?? []).map(mapBoardPostRow)

  /*
   * Supabase 서버로부터 신선한(fresh) 최신 데이터를 수집하는 데 성공하면
   * 이를 로컬 스토리지 캐시에도 백업하여 보관합니다.
   * 이렇게 함으로써 다음 번에 사용자가 페이지에 진입할 때 대기 딜레이(로딩바) 없이 
   * 로컬 스토리지에 임시 저장된 목록을 0초 만에 보여줄 수 있는 강력한 Stale-While-Revalidate 효과를 낼 수 있습니다.
   */
  window.localStorage.setItem(boardStorageKey(boardKey), JSON.stringify(mapped))

  return mapped
}

export async function fetchBoardPost(boardKey, postId) {
  if (!supabase || !isSharedBoardKey(boardKey)) {
    return getBoardPost(boardKey, postId)
  }

  if (!uuidPattern.test(postId)) return null

  let { data, error } = await supabase
    .from('board_posts')
    .select(boardPostSelectColumns)
    .eq('board_key', boardKey)
    .eq('id', postId)
    .maybeSingle()

  if (error && isMissingDisplayNumberColumn(error)) {
    const retryResult = await supabase
      .from('board_posts')
      .select(boardPostBaseSelectColumns)
      .eq('board_key', boardKey)
      .eq('id', postId)
      .maybeSingle()

    data = retryResult.data
    error = retryResult.error
  }

  if (error) throw error

  return data ? mapBoardPostRow(data) : null
}

export async function createBoardPost(boardKey, post) {
  if (!supabase || !isSharedBoardKey(boardKey)) return addBoardPost(boardKey, post)

  let { data, error } = await supabase
    .from('board_posts')
    .insert(boardPostInsertPayload(boardKey, post))
    .select(boardPostSelectColumns)
    .single()

  if (error && isMissingDisplayNumberColumn(error)) {
    const retryResult = await supabase
      .from('board_posts')
      .insert(boardPostInsertPayload(boardKey, post))
      .select(boardPostBaseSelectColumns)
      .single()

    data = retryResult.data
    error = retryResult.error
  }

  if (error) throw error

  return mapBoardPostRow(data)
}

export async function saveBoardPost(boardKey, postId, post) {
  if (!supabase || !isSharedBoardKey(boardKey) || !uuidPattern.test(postId)) {
    return updateBoardPost(boardKey, postId, post)
  }

  let { data, error } = await supabase
    .from('board_posts')
    .update(boardPostUpdatePayload(post))
    .eq('board_key', boardKey)
    .eq('id', postId)
    .select(boardPostSelectColumns)
    .maybeSingle()

  if (error && isMissingDisplayNumberColumn(error)) {
    const retryResult = await supabase
      .from('board_posts')
      .update(boardPostUpdatePayload(post))
      .eq('board_key', boardKey)
      .eq('id', postId)
      .select(boardPostBaseSelectColumns)
      .maybeSingle()

    data = retryResult.data
    error = retryResult.error
  }

  if (error) throw error

  return data ? mapBoardPostRow(data) : null
}

export async function removeBoardPost(boardKey, postId) {
  if (!supabase || !isSharedBoardKey(boardKey) || !uuidPattern.test(postId)) {
    return deleteBoardPost(boardKey, postId)
  }

  const { error } = await supabase
    .from('board_posts')
    .delete()
    .eq('board_key', boardKey)
    .eq('id', postId)

  if (error) throw error

  return true
}

export async function incrementBoardPostViews(boardKey, postId) {
  if (!supabase || !isSharedBoardKey(boardKey) || !uuidPattern.test(postId)) {
    return increaseBoardPostViews(boardKey, postId)
  }

  const { data, error } = await supabase.rpc('increment_board_post_views', {
    p_post_id: postId,
  })

  if (error) return fetchBoardPost(boardKey, postId)

  return data ? mapBoardPostRow(data) : null
}

export async function fetchBoardComments(boardKey, postId) {
  if (!supabase || !isSharedBoardKey(boardKey)) {
    return getBoardComments(boardKey, postId)
  }

  if (!uuidPattern.test(postId)) return []

  let { data, error } = await supabase
    .from('board_comments')
    .select(boardCommentSelectColumns)
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error && isMissingDisplayNumberColumn(error)) {
    const retryResult = await supabase
      .from('board_comments')
      .select(boardCommentBaseSelectColumns)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    data = retryResult.data
    error = retryResult.error
  }

  if (error) throw error

  return (data ?? []).map(mapBoardCommentRow)
}

export async function createBoardComment(boardKey, postId, comment) {
  if (!supabase || !isSharedBoardKey(boardKey) || !uuidPattern.test(postId)) {
    return addBoardComment(boardKey, postId, comment)
  }

  let { data, error } = await supabase
    .from('board_comments')
    .insert(boardCommentInsertPayload(postId, comment))
    .select(boardCommentSelectColumns)
    .single()

  if (error && isMissingDisplayNumberColumn(error)) {
    const retryResult = await supabase
      .from('board_comments')
      .insert(boardCommentInsertPayload(postId, comment))
      .select(boardCommentBaseSelectColumns)
      .single()

    data = retryResult.data
    error = retryResult.error
  }

  if (error) throw error

  return mapBoardCommentRow(data)
}

export async function saveBoardComment(boardKey, postId, commentId, content) {
  if (!supabase || !isSharedBoardKey(boardKey) || !uuidPattern.test(postId) || !uuidPattern.test(commentId)) {
    return updateBoardComment(boardKey, postId, commentId, content)
  }

  let { data, error } = await supabase
    .from('board_comments')
    .update({ content })
    .eq('post_id', postId)
    .eq('id', commentId)
    .select(boardCommentSelectColumns)
    .maybeSingle()

  if (error && isMissingDisplayNumberColumn(error)) {
    const retryResult = await supabase
      .from('board_comments')
      .update({ content })
      .eq('post_id', postId)
      .eq('id', commentId)
      .select(boardCommentBaseSelectColumns)
      .maybeSingle()

    data = retryResult.data
    error = retryResult.error
  }

  if (error) throw error

  return data ? mapBoardCommentRow(data) : null
}

export async function removeBoardComment(boardKey, postId, commentId) {
  if (!supabase || !isSharedBoardKey(boardKey) || !uuidPattern.test(postId) || !uuidPattern.test(commentId)) {
    return deleteBoardComment(boardKey, postId, commentId)
  }

  const { error } = await supabase
    .from('board_comments')
    .delete()
    .eq('post_id', postId)
    .eq('id', commentId)

  if (error) throw error

  return true
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
  const validRows = rows.filter((row) => row && typeof row.id === 'string')

  /*
   * Supabase를 사용하지 않는 로컬 저장소 기반의 테스트나 1:1 문의사항 게시판의 경우,
   * 각 게시글별 댓글(getBoardComments) 데이터 갯수를 실시간으로 계산하여 commentCount로 주입합니다.
   * 로컬 스토리지 환경에서도 목록에서 정상적으로 댓글 수가 카운팅되게 만들기 위함입니다.
   */
  return validRows.map((row) => {
    const comments = getBoardComments(boardKey, row.id)
    return {
      ...row,
      commentCount: comments.length,
    }
  })
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
