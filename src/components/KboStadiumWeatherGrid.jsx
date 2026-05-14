import { useState } from 'react'
import { useKboStadiumsLiveWeather } from '../hooks/useKboStadiumsLiveWeather'
import { WeatherWmoIcon } from './WeatherWmoIcon'
import './kboStadiumWeatherGrid.css'

/**
 * Open-Meteo가 넘겨 준 시각 문자열을 한국어 로캘짧은 표기(시:분)로 바꿉니다.
 */
function formatShortKst(isoLike) {
  if (!isoLike) return '–'
  const d = new Date(isoLike)
  if (Number.isNaN(d.getTime())) return '–'
  return d.toLocaleTimeString('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function formatTemp(c) {
  if (c == null || !Number.isFinite(Number(c))) return '–'
  return `${Math.round(Number(c) * 10) / 10}°C`
}

function formatWind(kmh) {
  if (kmh == null || !Number.isFinite(Number(kmh))) return '–'
  return `${Math.round(Number(kmh))} km/h`
}

/**
 * 메인 그리드 한 칸과 동일한 마크업 — `li.kboWeatherCard` 안 또는 탭 안 `div.kboWeatherCard` 안에 둡니다.
 * @param {{ row: { stadiumKey: string, stadiumKo: string, loadStatus: string, errorMessage?: string, weatherCode?: number, summaryKo?: string, temperatureC?: number, apparentTemperatureC?: number, windKmh?: number, relativeHumidity?: number, observedAt?: string } }} props
 */
function KboStadiumWeatherCardBody({ row }) {
  if (row.loadStatus === 'ok') {
    return (
      <>
        <div className="kboWeatherCardTop">
          <span className="kboWeatherIconWrap" aria-hidden="true">
            <WeatherWmoIcon code={row.weatherCode} title={row.summaryKo} />
          </span>
          <div className="kboWeatherCardHead">
            <h3 className="kboWeatherStadiumName">{row.stadiumKo}</h3>
            <p className="kboWeatherSummary">{row.summaryKo}</p>
          </div>
        </div>
        <dl className="kboWeatherStats">
          {/*
            기온·체감·바람·습도를 한 줄에 나열 — 좁은 화면에서는 `flex-wrap` 으로 자연스럽게 줄바꿈됩니다.
            `dl` 직속 `div` 묶음은 HTML5에서 허용되는 dt/dd 그룹 패턴입니다.
          */}
          <div className="kboWeatherStatLine">
            <div className="kboWeatherStatPair">
              <dt>기온</dt>
              <dd>{formatTemp(row.temperatureC)}</dd>
            </div>
            <span className="kboWeatherStatSep" aria-hidden="true">
              ·
            </span>
            <div className="kboWeatherStatPair">
              <dt>체감</dt>
              <dd>{formatTemp(row.apparentTemperatureC)}</dd>
            </div>
            <span className="kboWeatherStatSep" aria-hidden="true">
              ·
            </span>
            <div className="kboWeatherStatPair">
              <dt>바람</dt>
              <dd>{formatWind(row.windKmh)}</dd>
            </div>
            <span className="kboWeatherStatSep" aria-hidden="true">
              ·
            </span>
            <div className="kboWeatherStatPair">
              <dt>습도</dt>
              <dd>
                {row.relativeHumidity != null && Number.isFinite(Number(row.relativeHumidity))
                  ? `${Math.round(Number(row.relativeHumidity))}%`
                  : '–'}
              </dd>
            </div>
          </div>
        </dl>
        <p className="kboWeatherObserved">관측 시각(검) {formatShortKst(row.observedAt)}</p>
      </>
    )
  }

  return (
    <div className="kboWeatherCardError">
      <h3 className="kboWeatherStadiumName">{row.stadiumKo}</h3>
      <p className="kboWeatherErrMsg">{row.errorMessage ?? '불러오기 실패'}</p>
    </div>
  )
}

/**
 * 구장정보 탭 한 칸 — 지도 아래에 메인과 같은 Open-Meteo 카드를 붙일 때 씁니다.
 * 페이지에서 `useKboStadiumsLiveWeather` 한 번만 돌리고 `rows`·`status` 를 넘깁니다.
 *
 * @param {{ stadiumKey: string, stadiumKo: string, status: string, rows: object[] }} props
 */
export function KboStadiumWeatherTabCard({ stadiumKey, stadiumKo, status, rows }) {
  const listBusy = status === 'loading' && rows.length === 0
  const dataRow = rows.find((r) => r.stadiumKey === stadiumKey)

  return (
    <section className="stadiumInfoTabKboWeather" aria-label={`${stadiumKo} 실시간 날씨`}>
      {/*
        지도와 카드 사이에 고정 라벨을 두어, 어떤 상태(로딩·오류·성공)에서도 구역 제목이 동일하게 보이게 합니다.
      */}
      <h3 className="stadiumJamsilAccessGuideTitle">실시간 날씨</h3>
      {listBusy ? (
        <p className="kboWeatherState" role="status">
          {stadiumKo} 날씨를 불러오는 중입니다.
        </p>
      ) : null}

      {!listBusy && !dataRow ? (
        <p className="kboWeatherState" role="status">
          날씨 데이터가 없습니다.
        </p>
      ) : null}

      {!listBusy && dataRow ? (
        <div className="kboWeatherCard stadiumInfoTabKboWeatherCard">
          <KboStadiumWeatherCardBody row={dataRow} />
        </div>
      ) : null}
    </section>
  )
}

/**
 * KBO 9개 홈 구장의 “현재에 가까운” 날씨를 한 화면에 모읍니다.
 * 데이터 소스는 Open-Meteo(무료)이며, 모델 갱신 주기에 따라 실제 체감과 차이가 날 수 있습니다.
 *
 * @param {{ defaultPanelOpen?: boolean }} [props]
 * @param {boolean} [props.defaultPanelOpen] — `true`이면 처음부터 패널을 펼칩니다(구장정보 페이지 등). 메인은 기본 `false` 로 접힌 상태로 시작합니다.
 */
export function KboStadiumWeatherGrid({ defaultPanelOpen = false } = {}) {
  /**
   * 타이틀 클릭으로 본문만 접었다 펼칩니다. `defaultPanelOpen` 으로 초기 펼침 여부를 넘길 수 있습니다.
   * 닫혀 있어도 훅은 그대로 돌아가서 다시 열었을 때 데이터가 이미 준비돼 있을 수 있습니다.
   */
  const [weatherPanelOpen, setWeatherPanelOpen] = useState(defaultPanelOpen)

  const { status, rows } = useKboStadiumsLiveWeather({
    refreshIntervalMs: 300_000,
  })

  const listBusy = status === 'loading' && rows.length === 0

  return (
    <section className="kboWeatherSection" aria-labelledby="kboWeatherTitle">
      <div className="kboWeatherHeader">
        <h2 id="kboWeatherTitle" className="kboWeatherTitleHeading">
          <button
            type="button"
            className="kboWeatherTitleToggle"
            aria-expanded={weatherPanelOpen}
            aria-controls="kboWeatherPanel"
            onClick={() => setWeatherPanelOpen((open) => !open)}
          >
            <span className="kboWeatherTitleText">KBO 전 구장 날씨</span>
            <span className="kboWeatherTitleChevron" aria-hidden />
          </button>
        </h2>
      </div>

      {/* 바깥은 grid 0fr→1fr 전환으로 높이를 부드럽게, 안쪽은 inert로 접힌 동안 탭 포커스가 들어가지 않게 했습니다. */}
      <div
        id="kboWeatherPanel"
        className={`kboWeatherPanel${weatherPanelOpen ? ' kboWeatherPanelOpen' : ''}`}
        aria-hidden={!weatherPanelOpen}
      >
        <div className="kboWeatherPanelInner" inert={weatherPanelOpen ? undefined : true}>
          {listBusy ? (
            <p className="kboWeatherState" role="status">
              구장별 날씨를 불러오는 중입니다.
            </p>
          ) : null}

          {!listBusy && status === 'error' && rows.length > 0 && rows.every((r) => r.loadStatus !== 'ok') ? (
            <p className="kboWeatherState kboWeatherStateError" role="alert">
              날씨 정보를 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.
            </p>
          ) : null}

          {rows.length > 0 ? (
            <ul className="kboWeatherGrid">
              {rows.map((row) => (
                <li key={row.stadiumKey} className="kboWeatherCard">
                  <KboStadiumWeatherCardBody row={row} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  )
}
