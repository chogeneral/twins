import { useState, useEffect, useCallback, useRef } from 'react'
import { kboStadiumLocations } from '../data/kboStadiumLocations'
import { wmoCodeToSummaryKo } from '../utils/wmoWeatherKo'

const openMeteoForecastUrl = 'https://api.open-meteo.com/v1/forecast'

/**
 * 단일 좌표의 Open-Meteo 현재(`current`) 스냅샷을 가져옵니다.
 * 공식 문서의 무료 엔드포인트를 사용하며, API 키가 필요 없습니다.
 */
async function fetchOpenMeteoCurrent(lat, lon, signal) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: [
      'temperature_2m',
      'apparent_temperature',
      'weather_code',
      'wind_speed_10m',
      'relative_humidity_2m',
    ].join(','),
    timezone: 'Asia/Seoul',
    wind_speed_unit: 'kmh',
  })
  const res = await fetch(`${openMeteoForecastUrl}?${params}`, {
    signal,
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) {
    throw new Error(`openMeteo ${res.status}`)
  }
  const data = await res.json()
  const cur = data?.current
  if (!cur) throw new Error('openMeteo:noCurrent')
  return {
    observedAt: cur.time,
    temperatureC: cur.temperature_2m,
    apparentTemperatureC: cur.apparent_temperature,
    weatherCode: cur.weather_code,
    windKmh: cur.wind_speed_10m,
    relativeHumidity: cur.relative_humidity_2m,
  }
}

/**
 * 9개 구장을 병렬로 조회합니다. 한 구장만 실패해도 나머지는 표시할 수 있게 `Promise.allSettled` 를 씁니다.
 */
async function fetchAllStadiums(signal) {
  const settled = await Promise.allSettled(
    kboStadiumLocations.map(async (row) => {
      const snap = await fetchOpenMeteoCurrent(row.lat, row.lon, signal)
      return {
        stadiumKey: row.stadiumKey,
        stadiumKo: row.stadiumKo,
        lat: row.lat,
        lon: row.lon,
        loadStatus: 'ok',
        summaryKo: wmoCodeToSummaryKo(snap.weatherCode),
        ...snap,
      }
    }),
  )

  return settled.map((r, i) => {
    const base = kboStadiumLocations[i]
    if (r.status === 'fulfilled') {
      return r.value
    }
    const err = r.reason
    const aborted = err && typeof err === 'object' && err.name === 'AbortError'
    return {
      stadiumKey: base.stadiumKey,
      stadiumKo: base.stadiumKo,
      loadStatus: aborted ? 'aborted' : 'error',
      errorMessage: aborted ? '취소됨' : err?.message ? String(err.message) : '요청 실패',
    }
  })
}

/**
 * KBO 전 구장(고정 9곳) 실시간에 가까운 날씨를 주기적으로 가져옵니다.
 * 기상청 관측소 실시간이 아니라 Open-Meteo 모델 보간값이므로, “라이브 스코어” 수준의 초단위 갱신은 기대하지 않습니다.
 */
export function useKboStadiumsLiveWeather({ refreshIntervalMs = 300_000 } = {}) {
  const [state, setState] = useState({
    status: 'loading',
    rows: [],
    fetchedAt: null,
    isRefreshing: false,
  })
  const timerRef = useRef(null)
  const abortRef = useRef(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const run = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setState((prev) => ({
      ...prev,
      isRefreshing: prev.rows.length > 0,
      status: prev.rows.length > 0 ? prev.status : 'loading',
    }))

    const rows = await fetchAllStadiums(controller.signal)
    if (!mountedRef.current) return

    const anyOk = rows.some((r) => r.loadStatus === 'ok')

    setState({
      status: anyOk ? 'success' : 'error',
      rows,
      fetchedAt: new Date().toISOString(),
      isRefreshing: false,
    })
  }, [])

  useEffect(() => {
    run()
    if (refreshIntervalMs > 0) {
      timerRef.current = window.setInterval(run, refreshIntervalMs)
    }
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
      abortRef.current?.abort()
    }
  }, [run, refreshIntervalMs])

  return { ...state, refetch: run }
}
