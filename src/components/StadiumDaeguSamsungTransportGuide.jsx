/**
 * 대구 삼성 라이온즈파크(`daeguSamsung`) 탭 전용 **교통·주차** 참고 문구입니다.
 * - 대공원역 연계 지하철·KTX 환승·버스 노선·구장 주차 요금 및 대체 주차지를 정리했으며, 노선 개편·주차 요금·행사별 운영은 변동될 수 있어 방문 전 구단·대구시 공지를 확인하는 것이 좋습니다.
 * - 아이콘은 시각 보조용(`aria-hidden`)이며, 스크린리더는 제목·본문·목록 텍스트만으로 경로를 전달합니다.
 */
export function StadiumDaeguSamsungTransportGuide() {
  return (
    <section
      className="stadiumDaeguSamsungAccessGuide"
      aria-labelledby="stadiumDaeguSamsungAccessGuideTitle"
    >
      <h3 id="stadiumDaeguSamsungAccessGuideTitle" className="stadiumDaeguSamsungAccessGuideTitle">
        오시는 길 · 주차
      </h3>

      <div className="stadiumDaeguSamsungAccessGuideBlock">
        <h4 className="stadiumDaeguSamsungAccessGuideBlockHeading">
          
          지하철 이용 (가장 추천)
        </h4>
        <ul className="stadiumDaeguSamsungAccessGuideList">
          <li>
            <strong>역:</strong> 대구 도시철도 2호선 <strong>대공원역</strong> 하차
          </li>
          <li>
            <strong>출구:</strong> <strong>4번·5번 출구</strong>로 나오면 3루(홈) 광장·매표소와 바로 연결되며, 도보 약 1분 이내입니다.
          </li>
        </ul>
      </div>

      <div className="stadiumDaeguSamsungAccessGuideBlock">
        <h4 className="stadiumDaeguSamsungAccessGuideBlockHeading">
         
          KTX · 기차 환승 경로 (타 지역 방문객)
        </h4>
        <ul className="stadiumDaeguSamsungAccessGuideList">
          <li>
            <strong>동대구역:</strong> 1호선(설화명곡 방향) 승차 → <strong>반월당역</strong>에서 2호선(영남대 방향)으로 환승 → <strong>대공원역</strong> 하차, 약 30분
          </li>
          <li>
            <strong>대구역:</strong> 1호선 승차 → <strong>반월당역</strong>에서 2호선으로 환승 → <strong>대공원역</strong> 하차, 약 25분
          </li>
        </ul>
      </div>

      <div className="stadiumDaeguSamsungAccessGuideBlock">
        <h4 className="stadiumDaeguSamsungAccessGuideBlockHeading">
         
          버스 이용
        </h4>
        <p className="stadiumDaeguSamsungAccessGuideLead">
          &apos;대공원역&apos; 또는 &apos;대공원역(지하철2호선)&apos; 정류장에서 내리면 이동이 수월합니다.
        </p>
        <ul className="stadiumDaeguSamsungAccessGuideList">
          <li>
            <strong>간선:</strong> 349, 399, 449, 509, 609, 724, 849, 937
          </li>
          <li>
            <strong>순환:</strong> 수성3, 수성3-1
          </li>
        </ul>
      </div>

      <div className="stadiumDaeguSamsungAccessGuideBlock">
        <h4 className="stadiumDaeguSamsungAccessGuideBlockHeading">
          
          자가용 이용 및 주차 정보
        </h4>
        <ul className="stadiumDaeguSamsungAccessGuideList">
          <li>
            <strong>네비게이션 검색:</strong> &apos;대구 삼성 라이온즈파크 주차장&apos;
          </li>
          <li>
            <strong>주차 요금(안내 사례):</strong> 프로야구 경기일 등에 승용차 <strong>정액 2,000원</strong> 선불로 운영되는 경우가 많습니다(시즌·행사에 따라 달라질 수 있음).
          </li>
          <li>
            <strong>주차 팁:</strong> 구장 주차장(약 1,000대 규모로 안내되는 경우가 많음)은 주말·매진 경기에 빨리 차는 편입니다. 만차 시 인근 <strong>대구미술관</strong> 또는 <strong>대구스타디움</strong> 주차장 이용을 검토하세요.
          </li>
        </ul>
      </div>
    </section>
  )
}
