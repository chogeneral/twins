/**
 * 구장정보 페이지 — 퀵메뉴에서 진입합니다.
 * - KBO 9개 홈구장 탭마다 카카오맵 거칠지도 퍼가기(`KakaoRoughMapEmbed`)를 둡니다.
 * - 9개 홈구장 탭 모두 실시간 날씨 카드(`KboStadiumWeatherTabCard`) 아래에 교통 안내(`StadiumJamsilTransportGuide`, `StadiumGocheokTransportGuide`, `StadiumIncheonMunhakTransportGuide`, `StadiumSuwonKtTransportGuide`, `StadiumDaejeonHanwhaTransportGuide`, `StadiumDaeguSamsungTransportGuide`, `StadiumBusanSajikTransportGuide`, `StadiumChangwonNcTransportGuide`, `StadiumGwangjuKiaTransportGuide`)를 둡니다.
 * - 날씨 UI는 메인 그리드와 동일합니다. **지도 → 실시간 날씨 → 오시는 길·주차** 순으로 배치합니다.
 *   `useKboStadiumsLiveWeather` 는 페이지에서 한 번만 호출해 9개 탭이 같은 `rows` 를 참조합니다.
 */

import { useState } from 'react'
import { KakaoRoughMapEmbed } from '../components/KakaoRoughMapEmbed.jsx'
import { StadiumBusanSajikTransportGuide } from '../components/StadiumBusanSajikTransportGuide.jsx'
import { StadiumChangwonNcTransportGuide } from '../components/StadiumChangwonNcTransportGuide.jsx'
import { StadiumDaeguSamsungTransportGuide } from '../components/StadiumDaeguSamsungTransportGuide.jsx'
import { StadiumDaejeonHanwhaTransportGuide } from '../components/StadiumDaejeonHanwhaTransportGuide.jsx'
import { StadiumGocheokTransportGuide } from '../components/StadiumGocheokTransportGuide.jsx'
import { StadiumGwangjuKiaTransportGuide } from '../components/StadiumGwangjuKiaTransportGuide.jsx'
import { StadiumIncheonMunhakTransportGuide } from '../components/StadiumIncheonMunhakTransportGuide.jsx'
import { StadiumJamsilTransportGuide } from '../components/StadiumJamsilTransportGuide.jsx'
import { StadiumSuwonKtTransportGuide } from '../components/StadiumSuwonKtTransportGuide.jsx'
import { KboStadiumWeatherTabCard } from '../components/KboStadiumWeatherGrid.jsx'
import { useKboStadiumsLiveWeather } from '../hooks/useKboStadiumsLiveWeather.js'
import { kboStadiumLocations } from '../data/kboStadiumLocations.js'
import './boardPage.css'
import './teamPage.css'
import './stadiumInfoPage.css'

/** 거칠지도 퍼가기를 붙인 구장 키(9개 전부) — 패널 최소 높이(`stadiumInfoTabPanelFeatured`)와 동기 */
const stadiumKeysWithRoughMap = ['jamsil', 'gocheok', 'incheonMunhak', 'suwonKt', 'daejeonHanwha', 'daeguSamsung', 'busanSajik', 'changwonNc', 'gwangjuChampions']

const initialStadiumKey = kboStadiumLocations[0]?.stadiumKey ?? 'jamsil'

export function StadiumInfoPage() {
  const [activeStadiumKey, setActiveStadiumKey] = useState(initialStadiumKey)
  /** 구장정보 탭 날씨 카드용 — Open-Meteo 기반 `useKboStadiumsLiveWeather` 를 한 번만 호출하고 각 탭에 `rows` 를 넘깁니다 */
  const { status: weatherStatus, rows: weatherRows } = useKboStadiumsLiveWeather({
    refreshIntervalMs: 300_000,
  })

  return (
    <article className="boardPage">
      <header className="boardHeader">
        <p lang="en" className="boardEyebrow">
          ballpark
        </p>
        <h1 className="boardTitle">구장정보</h1>
        <p className="boardDescription">
          각 구장의 정보를 알 수 있습니다.
        </p>
      </header>

      <section className="boardPanel" aria-label="구장 탭">
        <div className="stadiumInfoTabs teamTabs">
          <div className="teamTabList" role="tablist" aria-label="KBO 구장">
            {kboStadiumLocations.map((row) => {
              const isActive = activeStadiumKey === row.stadiumKey
              return (
                <button
                  key={row.stadiumKey}
                  type="button"
                  role="tab"
                  id={`stadium-tab-${row.stadiumKey}`}
                  aria-selected={isActive}
                  aria-controls={`stadium-panel-${row.stadiumKey}`}
                  className={['teamTabBtn', isActive ? 'teamTabBtnActive' : ''].filter(Boolean).join(' ')}
                  onClick={() => setActiveStadiumKey(row.stadiumKey)}
                >
                  {row.stadiumKo}
                </button>
              )
            })}
          </div>

          {kboStadiumLocations.map((row) => (
            <div
              key={row.stadiumKey}
              id={`stadium-panel-${row.stadiumKey}`}
              role="tabpanel"
              aria-labelledby={`stadium-tab-${row.stadiumKey}`}
              hidden={activeStadiumKey !== row.stadiumKey}
              className={[
                'teamTabPanel',
                'stadiumInfoTabPanel',
                stadiumKeysWithRoughMap.includes(row.stadiumKey) ? 'stadiumInfoTabPanelFeatured' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <h2 className="srOnly">{row.stadiumKo}</h2>
              {/* 잠실야구장 — 카카오 퍼가기 */}
              {row.stadiumKey === 'jamsil' ? (
                <KakaoRoughMapEmbed
                  roughMapTimestamp="1778761208583"
                  roughMapLanderKey="ne3sqoimn7b"
                  mapWidth="100%"
                  mapHeight="360"
                  panelIsVisible={activeStadiumKey === 'jamsil'}
                />
              ) : null}
              {/* 고척야구장 — 카카오 퍼가기 */}
              {row.stadiumKey === 'gocheok' ? (
                <KakaoRoughMapEmbed
                  roughMapTimestamp="1778763149763"
                  roughMapLanderKey="ne57ase3h5v"
                  mapWidth="640"
                  mapHeight="360"
                  panelIsVisible={activeStadiumKey === 'gocheok'}
                />
              ) : null}
              {/* 인천 SSG 랜더스필드 — 카카오 퍼가기(timestamp·key·640×360) */}
              {row.stadiumKey === 'incheonMunhak' ? (
                <KakaoRoughMapEmbed
                  roughMapTimestamp="1778763270109"
                  roughMapLanderKey="nro2evcwbh7"
                  mapWidth="640"
                  mapHeight="360"
                  panelIsVisible={activeStadiumKey === 'incheonMunhak'}
                />
              ) : null}
              {/* 수원 KT 위즈파크 — 카카오 퍼가기 */}
              {row.stadiumKey === 'suwonKt' ? (
                <KakaoRoughMapEmbed
                  roughMapTimestamp="1778763304153"
                  roughMapLanderKey="nro389cf3ea"
                  mapWidth="640"
                  mapHeight="360"
                  panelIsVisible={activeStadiumKey === 'suwonKt'}
                />
              ) : null}
              {/* 대전 한화생명 이글스파크 — 카카오 퍼가기 */}
              {row.stadiumKey === 'daejeonHanwha' ? (
                <KakaoRoughMapEmbed
                  roughMapTimestamp="1778763455896"
                  roughMapLanderKey="nro6rqrujcd"
                  mapWidth="640"
                  mapHeight="360"
                  panelIsVisible={activeStadiumKey === 'daejeonHanwha'}
                />
              ) : null}
              {/* 대구 삼성 라이온즈 파크 — 카카오 퍼가기 */}
              {row.stadiumKey === 'daeguSamsung' ? (
                <KakaoRoughMapEmbed
                  roughMapTimestamp="1778763494825"
                  roughMapLanderKey="nro7ovhdssy"
                  mapWidth="640"
                  mapHeight="360"
                  panelIsVisible={activeStadiumKey === 'daeguSamsung'}
                />
              ) : null}
              {/* 사직야구장 — 카카오 퍼가기 */}
              {row.stadiumKey === 'busanSajik' ? (
                <KakaoRoughMapEmbed
                  roughMapTimestamp="1778763540751"
                  roughMapLanderKey="nrr3ybicpek"
                  mapWidth="640"
                  mapHeight="360"
                  panelIsVisible={activeStadiumKey === 'busanSajik'}
                />
              ) : null}
              {/* 창원 NC 파크 — 카카오 퍼가기 */}
              {row.stadiumKey === 'changwonNc' ? (
                <KakaoRoughMapEmbed
                  roughMapTimestamp="1778763594899"
                  roughMapLanderKey="nroa2dnrixt"
                  mapWidth="640"
                  mapHeight="360"
                  panelIsVisible={activeStadiumKey === 'changwonNc'}
                />
              ) : null}
              {/* 광주 기아 챔피언스 필드 — 카카오 퍼가기 */}
              {row.stadiumKey === 'gwangjuChampions' ? (
                <KakaoRoughMapEmbed
                  roughMapTimestamp="1778763633234"
                  roughMapLanderKey="nroax38dkfx"
                  mapWidth="640"
                  mapHeight="360"
                  panelIsVisible={activeStadiumKey === 'gwangjuChampions'}
                />
              ) : null}
              <KboStadiumWeatherTabCard
                stadiumKey={row.stadiumKey}
                stadiumKo={row.stadiumKo}
                status={weatherStatus}
                rows={weatherRows}
              />
              {/* 실시간 날씨 카드 아래 — 오시는 길·주차(구장별 하나만 렌더). 지도는 위 거칠지도 블록에만 붙습니다. */}
              {row.stadiumKey === 'jamsil' ? <StadiumJamsilTransportGuide /> : null}
              {row.stadiumKey === 'gocheok' ? <StadiumGocheokTransportGuide /> : null}
              {row.stadiumKey === 'incheonMunhak' ? <StadiumIncheonMunhakTransportGuide /> : null}
              {row.stadiumKey === 'suwonKt' ? <StadiumSuwonKtTransportGuide /> : null}
              {row.stadiumKey === 'daejeonHanwha' ? <StadiumDaejeonHanwhaTransportGuide /> : null}
              {row.stadiumKey === 'daeguSamsung' ? <StadiumDaeguSamsungTransportGuide /> : null}
              {row.stadiumKey === 'busanSajik' ? <StadiumBusanSajikTransportGuide /> : null}
              {row.stadiumKey === 'changwonNc' ? <StadiumChangwonNcTransportGuide /> : null}
              {row.stadiumKey === 'gwangjuChampions' ? <StadiumGwangjuKiaTransportGuide /> : null}
            </div>
          ))}
        </div>
      </section>
    </article>
  )
}
