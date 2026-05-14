/**
 * 카카오맵 **거칠지도 지도 퍼가기** 공통 블록입니다.
 *
 * - 퍼가기 HTML 과 동일하게 `id="daumRoughmapContainer{timestamp}"` + `new daum.roughmap.Lander({ timestamp, key, mapWidth, mapHeight }).render()` 를 씁니다.
 * - `timestamp`·`key`·컨테이너 접미사는 카카오에서 새로 받을 때 **항상 한 세트**로 맞춰야 합니다.
 * - 화면에는 지도 노드만 두고, 하단 주소·전화 줄은 `stadiumInfoPage.css` 의 `.section_address` 숨김으로 처리합니다.
 * - 로더 스크립트는 `index.html` 에 한 번만 두는 카카오 권장 방식입니다(`document.write` 대응).
 * - 탭이 `hidden` 일 때는 `panelIsVisible` 이 false 가 되어 `render()` 를 호출하지 않습니다.
 */
import { useEffect } from 'react'

const rootRoughMapClassNames = ['root_daum_roughmap', 'root_daum_roughmap_landing'].join(' ')

async function waitForRoughMapLander(timeoutMs = 8000, stepMs = 64) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const LandingCtor = typeof window !== 'undefined' ? window.daum?.roughmap?.Lander : undefined
    if (typeof LandingCtor === 'function') return LandingCtor
    await new Promise((resolve) => {
      window.setTimeout(resolve, stepMs)
    })
  }
  throw new Error('카카오 거칠지도 로더가 준비되지 않았습니다.')
}

/**
 * @param {object} props
 * @param {string} props.roughMapTimestamp 퍼가기 실행 스크립트의 timestamp (컨테이너 id 접미사와 동일)
 * @param {string} props.roughMapLanderKey 퍼가기 key 문자열
 * @param {string} props.mapWidth 카카오 Lander mapWidth (예: '100%', '640')
 * @param {string} props.mapHeight 카카오 Lander mapHeight (예: '360')
 * @param {boolean} props.panelIsVisible 현재 탭이 보일 때만 true
 */
export function KakaoRoughMapEmbed({
  roughMapTimestamp,
  roughMapLanderKey,
  mapWidth,
  mapHeight,
  panelIsVisible = true,
}) {
  const mountDomId = `daumRoughmapContainer${roughMapTimestamp}`

  useEffect(() => {
    if (!panelIsVisible) return undefined

    let aborted = false
    const container = typeof document !== 'undefined' ? document.getElementById(mountDomId) : null
    if (!container) return undefined

    ;(async () => {
      try {
        container.innerHTML = ''
        const LanderCtor = await waitForRoughMapLander()
        if (aborted) return

        const embedInstance = new LanderCtor({
          timestamp: roughMapTimestamp,
          key: roughMapLanderKey,
          mapWidth,
          mapHeight,
        })
        embedInstance.render()

        window.requestAnimationFrame(() => window.dispatchEvent(new Event('resize')))
      } catch {
        if (import.meta.env.DEV) {
          console.warn('[KakaoRoughMapEmbed] 지도 렌더 실패', { mountDomId })
        }
      }
    })()

    return () => {
      aborted = true
      container.innerHTML = ''
    }
  }, [panelIsVisible, roughMapTimestamp, roughMapLanderKey, mapWidth, mapHeight])

  return (
    <div className="stadiumRoughMapOnly">
      <div id={mountDomId} className={rootRoughMapClassNames} />
    </div>
  )
}
