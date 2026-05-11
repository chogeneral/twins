/**
 * Open-Meteo weather_code(WMO) 구간별로 아주 단순한 실루엣 아이콘을 골라 접근성·의미를 보조합니다.
 * 정밀한 일기도 기호가 아니라 카드 UI에서 상태를 한눈에 구분하기 위한 용도입니다.
 */
function categoryFromWmo(code) {
  const c = Number(code)
  if (!Number.isFinite(c)) return 'unknown'
  if (c === 0) return 'clear'
  if (c === 1) return 'mostlyClear'
  if (c === 2 || c === 3) return 'cloud'
  if (c === 45 || c === 48) return 'fog'
  if ((c >= 51 && c <= 67) || (c >= 80 && c <= 82)) return 'rain'
  if ((c >= 71 && c <= 77) || c === 85 || c === 86) return 'snow'
  if (c >= 95) return 'storm'
  return 'cloud'
}

export function WeatherWmoIcon({ code, title, className = '' }) {
  const cat = categoryFromWmo(code)
  const label =
    title ?? (cat === 'unknown' ? '날씨 정보 없음' : '날씨 상태 아이콘')

  return (
    <svg
      className={`weatherWmoIcon ${className}`.trim()}
      viewBox="0 0 24 24"
      width="24"
      height="24"
      role="img"
      aria-label={label}
    >
      {cat === 'clear' && (
        <circle cx="12" cy="12" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      )}
      {cat === 'mostlyClear' && (
        <>
          <circle cx="12" cy="11" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path
            d="M7 17c-1.2 0-2 .9-2 2h12c0-1.1-.9-2-2-2H7z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </>
      )}
      {(cat === 'cloud' || cat === 'fog') && (
        <path
          d="M7.5 17h9a3 3 0 000-6 3.6 3.6 0 00-6.7-1.2A3.3 3.3 0 007.5 17z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinejoin="round"
        />
      )}
      {cat === 'rain' && (
        <>
          <path
            d="M7 14h9.5a2.8 2.8 0 000-5.5A3.2 3.2 0 005 14z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path d="M9 17.5v2M12 17v2.3M15 17.5v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
      {cat === 'snow' && (
        <>
          <path
            d="M7 13.5h9a2.8 2.8 0 000-5.5A3.2 3.2 0 005 13.5z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path
            d="M12 16l1.2 1.2m0-2.4L12 16l-1.2 1.2m0-2.4L12 16"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
        </>
      )}
      {cat === 'storm' && (
        <>
          <path
            d="M6.5 13h9a2.6 2.6 0 000-5.2 3 3 0 00-5.6-1A2.8 2.8 0 006.5 13z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path d="M12 13.5L10 18h3l-1.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
        </>
      )}
      {cat === 'unknown' && (
        <path d="M12 6v2M12 16v2M6 12h2M16 12h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      )}
    </svg>
  )
}
