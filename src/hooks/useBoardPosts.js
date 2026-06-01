import { useEffect, useState } from 'react'
import { fetchBoardPosts, getBoardPosts, isSharedBoardKey } from '../lib/boardPostStorage'

export function useBoardPosts(boardKey) {
  const [rows, setRows] = useState(() => getBoardPosts(boardKey))
  const [loading, setLoading] = useState(() => isSharedBoardKey(boardKey))
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadBoardPosts() {
      setLoading(isSharedBoardKey(boardKey))
      setError('')

      try {
        const nextRows = await fetchBoardPosts(boardKey)
        if (ignore) return

        setRows(nextRows)
      }
      catch (loadError) {
        if (ignore) return

        setRows(getBoardPosts(boardKey))
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
