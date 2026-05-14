/**
 * 대전 한화생명 이글스파크(`daejeonHanwha`) 탭 전용 **교통·주차** 참고 문구입니다.
 * - 한밭체육관 일대와 연계된 KTX·버스·도시철도·주차 안내를 정리했으며, 노선 개편·무료 주차 정책은 변동될 수 있어 방문 전 구단·지자체 공지를 확인하는 것이 좋습니다.
 * - 아이콘은 장식용(`aria-hidden`)으로 두고, 본문·목록으로 경로를 전달합니다.
 */
export function StadiumDaejeonHanwhaTransportGuide() {
  return (
    <section
      className="stadiumDaejeonHanwhaAccessGuide"
      aria-labelledby="stadiumDaejeonHanwhaAccessGuideTitle"
    >
      <h3 id="stadiumDaejeonHanwhaAccessGuideTitle" className="stadiumDaejeonHanwhaAccessGuideTitle">
        오시는 길 · 주차
      </h3>

      <div className="stadiumDaejeonHanwhaAccessGuideBlock">
        <h4 className="stadiumDaejeonHanwhaAccessGuideBlockHeading">
          
          열차(KTX·SRT) + 버스 연결 (타지 방문 추천)
        </h4>
        <ul className="stadiumDaejeonHanwhaAccessGuideList">
          <li>
            <strong>대전역 (가장 추천):</strong> 대전역광장 정류장에서 급행 4번 또는 52번 버스 → &apos;한밭체육관&apos; 정류장 하차, 약 12~15분
          </li>
          <li>
            <strong>서대전역:</strong> 서대전역네거리 정류장에서 513번 또는 119번 → &apos;한밭체육관&apos; 또는 &apos;청란여고&apos; 하차, 약 13~15분
          </li>
        </ul>
      </div>

      <div className="stadiumDaejeonHanwhaAccessGuideBlock">
        <h4 className="stadiumDaejeonHanwhaAccessGuideBlockHeading">
          
          고속·시외버스 연결
        </h4>
        <ul className="stadiumDaejeonHanwhaAccessGuideList">
          <li>
            <strong>대전복합터미널:</strong> 터미널 앞 정류장에서 급행 4번 → &apos;한밭체육관&apos; 하차, 약 20분
          </li>
          <li>
            <strong>유성시외버스정류장:</strong> 지하철 구암역(판암 방향) 승차 → 중앙로역 하차 후 급행 4번 또는 604번으로 환승 → &apos;한밭체육관&apos; 하차, 약 35분
          </li>
        </ul>
      </div>

      <div className="stadiumDaejeonHanwhaAccessGuideBlock">
        <h4 className="stadiumDaejeonHanwhaAccessGuideBlockHeading">
         
          대전 도시철도 이용
        </h4>
        <ul className="stadiumDaejeonHanwhaAccessGuideList">
          <li>
            <strong>중앙로역 또는 중구청역:</strong> 하차 후 도보 약 20~25분 거리입니다.
          </li>
          <li>
            <strong>도보 대신:</strong> 중앙로역에서 604번 또는 급행 4번으로 환승해 정문 앞에서 내리는 편이 수월합니다.
          </li>
        </ul>
      </div>

      <div className="stadiumDaejeonHanwhaAccessGuideBlock">
        <h4 className="stadiumDaejeonHanwhaAccessGuideBlockHeading">
          
          자가용 이용 및 주차 정보
        </h4>
        <ul className="stadiumDaejeonHanwhaAccessGuideList">
          <li>
            <strong>네비게이션 검색:</strong> &apos;대전 한화생명 볼파크&apos; 또는 &apos;한밭체육관 주차장&apos;
          </li>
          <li>
            <strong>주차:</strong> 한밭체육관 지상·지하 주차장을 이용할 수 있으며, 약 1,600대 규모로 안내되는 경우가 많습니다(무료 운영 사례 — 시즌·행사에 따라 달라질 수 있음).
          </li>
          <li>
            <strong>주의:</strong> 주말 경기나 매진 일정에는 입구가 매우 혼잡하므로, 경기 시작 최소 1시간 30분 전 도착을 권장합니다.
          </li>
        </ul>
      </div>
    </section>
  )
}
