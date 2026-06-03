import { useEffect, useState } from 'react'
import { fetchBoardPosts, getBoardPosts, isSharedBoardKey } from '../lib/boardPostStorage'

const boardRowsMemoryCache = new Map()

export function useBoardPosts(boardKey) {
  const cachedRows = boardRowsMemoryCache.get(boardKey)

  /*
   * 1차로 빠른 세션 메모리 캐시를 조회하고, 없을 경우 2차로 로컬 스토리지에 백업된 캐시를 읽어와 초기 상태를 세팅합니다.
   * 이렇게 함으로써 첫 화면 로딩 시 자바스크립트가 실행되자마자 0초 대기 속도로 글 목록을 즉시 렌더링할 수 있습니다.
   */
  const [rows, setRows] = useState(() => {
    if (isSharedBoardKey(boardKey)) {
      return cachedRows ?? getBoardPosts(boardKey)
    }
    return getBoardPosts(boardKey)
  })

  /*
   * 메모리 캐시 혹은 로컬 스토리지 캐시를 통해 이미 보여줄 수 있는 글이 존재한다면,
   * 화면 전체를 로딩중으로 가려 답답함을 주는 현상을 차단하기 위해 loading 상태의 초기값을 false로 지정합니다.
   * 오직 보여줄 데이터가 아무것도 없는 최초 진입일 때만 loading 상태를 true로 유지합니다.
   */
  const [loading, setLoading] = useState(() => {
    if (isSharedBoardKey(boardKey)) {
      const hasData = rows && rows.length > 0
      return !cachedRows && !hasData
    }
    return false
  })
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadBoardPosts() {
      // 캐시가 이미 존재하여 화면에 렌더링되어 있는 경우, 로딩바(스피너)를 켜지 않고 조용히 백그라운드 조회를 실행합니다.
      const hasLocalData = rows && rows.length > 0
      setLoading(!hasLocalData)
      setError('')

      try {
        const nextRows = await fetchBoardPosts(boardKey)
        if (ignore) return

        if (isSharedBoardKey(boardKey)) {
          boardRowsMemoryCache.set(boardKey, nextRows)
        }

        setRows(nextRows)
      }
      catch (loadError) {
        if (ignore) return

        // 네트워크 에러 등이 났을 때도 사용자가 작성글을 계속 볼 수 있도록 백업 캐시를 재주입하여 복원력을 높입니다.
        setRows(
          isSharedBoardKey(boardKey)
            ? (boardRowsMemoryCache.get(boardKey) ?? getBoardPosts(boardKey))
            : getBoardPosts(boardKey),
        )
        setError(loadError.message ?? '게시글을 불러오지 못했습니다.')
      }
      finally {
        if (!ignore) setLoading(false)
      }
    }

    loadBoardPosts()

    return () => {
      ignore = true
    }
  }, [boardKey])

  return { rows, loading, error }
}
