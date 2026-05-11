/**
 * Open-Meteo `weather_code`(WMO) → 한글 짧은 상태 문구.
 * 전체 코드표는 Open-Meteo 문서의 WMO 해석을 따르며, 없는 번호는 '날씨'로 둡니다.
 */
export function wmoCodeToSummaryKo(code) {
  const c = Number(code)
  if (!Number.isFinite(c)) return '정보 없음'

  if (c === 0) return '맑음'
  if (c === 1) return '대체로 맑음'
  if (c === 2) return '약간 흐림'
  if (c === 3) return '흐림'
  if (c === 45 || c === 48) return '안개'
  if (c >= 51 && c <= 55) return '가랑비'
  if (c === 56 || c === 57) return '어는 가랑비'
  if (c >= 61 && c <= 65) return '비'
  if (c === 66 || c === 67) return '어는 비'
  if (c >= 71 && c <= 75) return '눈'
  if (c === 77) return '싸락눈'
  if (c >= 80 && c <= 82) return '소나기'
  if (c === 85 || c === 86) return '눈 소나기'
  if (c >= 95 && c <= 99) return '천둥·번개'

  return '날씨'
}
