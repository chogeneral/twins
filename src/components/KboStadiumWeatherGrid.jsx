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
  return `${Math.round(Number(kmh))} km/h`
}

/**
 * KBO 9개 홈 구장의 “현재에 가까운” 날씨를 한 화면에 모읍니다.
 * 데이터 소스는 Open-Meteo(무료)이며, 모델 갱신 주기에 따라 실제 체감과 차이가 날 수 있습니다.
 */
export function KboStadiumWeatherGrid() {
  /**
   * 타이틀 클릭으로 본문만 접었다 펼칩니다. 첫 로딩 시에는 접어 두어 화면이 덜 복잡하게 시작합니다.
   * 닫혀 있어도 훅은 그대로 돌아가서 다시 열었을 때 데이터가 이미 준비돼 있을 수 있습니다.
   */
  const [weatherPanelOpen, setWeatherPanelOpen] = useState(false)

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
                  {row.loadStatus === 'ok' ? (
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
                        <div className="kboWeatherStatRow">
                          <dt>기온</dt>
                          <dd>{formatTemp(row.temperatureC)}</dd>
                        </div>
                        <div className="kboWeatherStatRow">
                          <dt>체감</dt>
                          <dd>{formatTemp(row.apparentTemperatureC)}</dd>
                        </div>
                        <div className="kboWeatherStatRow">
                          <dt>바람</dt>
                          <dd>{formatWind(row.windKmh)}</dd>
                        </div>
                        <div className="kboWeatherStatRow">
                          <dt>습도</dt>
                          <dd>
                            {row.relativeHumidity != null && Number.isFinite(Number(row.relativeHumidity))
                              ? `${Math.round(Number(row.relativeHumidity))}%`
                              : '–'}
                          </dd>
                        </div>
                      </dl>
                      <p className="kboWeatherObserved">관측 시각(검) {formatShortKst(row.observedAt)}</p>
                    </>
                  ) : (
                    <div className="kboWeatherCardError">
                      <h3 className="kboWeatherStadiumName">{row.stadiumKo}</h3>
                      <p className="kboWeatherErrMsg">{row.errorMessage ?? '불러오기 실패'}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  )
}
