/**
 * 고척야구장 탭 전용 **교통** 참고 문구입니다.
 * - 지하철·버스 위주로 정리했으며, 노선·출구 안내는 개편·임시 운행이 있을 수 있어 관람 전 공식 안내를 다시 확인하는 것이 좋습니다.
 * - 아이콘은 시각 보조용이라 `aria-hidden` 으로 읽히지 않게 하고, 제목·목록 텍스트로 정보를 전달합니다.
 */
export function StadiumGocheokTransportGuide() {
  return (
    <section
      className="stadiumGocheokAccessGuide"
      aria-labelledby="stadiumGocheokAccessGuideTitle"
    >
      <h3 id="stadiumGocheokAccessGuideTitle" className="stadiumGocheokAccessGuideTitle">
        오시는 길
      </h3>

      <div className="stadiumGocheokAccessGuideBlock">
        <h4 className="stadiumGocheokAccessGuideBlockHeading">
          
          지하철 이용 (가장 빠름)
        </h4>
        <ul className="stadiumGocheokAccessGuideList">
          <li>
            <strong>지하철역:</strong> 1호선 구일역 (인천 방향) 하차
          </li>
          <li>
            <strong>출구 안내:</strong> 2번 출구로 나오면 야구장 외야 진입 광장과 도보 3분 거리로 바로 연결되어 가장 편리합니다.
          </li>
          <li>
            <strong>대체 경로:</strong> 개봉역 2번 출구(도보 15분) 또는 신도림역 1번 출구에서 버스로 환승하여 이동할 수 있습니다.
          </li>
        </ul>
      </div>

      <div className="stadiumGocheokAccessGuideBlock">
        <h4 className="stadiumGocheokAccessGuideBlockHeading">
          
          버스 이용 (&apos;동양미래대학·구로성심병원&apos; 정류장 하차)
        </h4>
        <p className="stadiumGocheokAccessGuideLead">
          구일역 2번 출구 반대편(내야 및 정문 쪽)으로 바로 접근할 수 있어 버스 노선도 편리합니다.
        </p>
        <ul className="stadiumGocheokAccessGuideList">
          <li>
            <strong>간선(파란 버스):</strong> 160, 600, 660, 662
          </li>
          <li>
            <strong>지선(초록 버스):</strong> 5626, 5712, 6515, 6637, 6640A, 6713
          </li>
          <li>
            <strong>일반(경기 버스):</strong> 10, 83, 88, 510, 530
          </li>
        </ul>
      </div>
      <div className="stadiumGocheokAccessGuideBlock">
        <h4 className="stadiumGocheokAccessGuideBlockHeading">
          
        자가용 이용 시 주의사항 (주차 불가)
        </h4>
        <ul className="stadiumGocheokAccessGuideList">
          <li>
          인근 민영 주차장: 차량을 가져오실 경우 동양미래대학교 주차장, <br />구로중앙유통단지 주차장, 혹은 인근 롯데마트 주차장 등을 개별 유료 이용하셔야 하므로 대중교통이 절대적으로 유리합니다
          </li>
        </ul>
      </div>
    </section>
  )
}
