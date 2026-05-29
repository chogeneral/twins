import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * Supabase 인증 상태를 구독합니다.
 * - 초기 세션은 getSession()으로 동기적으로 로드합니다.
 * - onAuthStateChange로 로그인/로그아웃 이벤트를 실시간 반영합니다.
 */
export function useAuth() {
  const [user, setUser] = useState(undefined) // undefined = 아직 로드 중, null = 비로그인
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setUser(null)
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = () => supabase.auth.signOut()

  const nickname = user?.user_metadata?.nickname ?? user?.email?.split('@')[0] ?? ''

  return { user, loading, nickname, signOut }
}
