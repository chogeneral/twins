/**
 * 사직야구장(`busanSajik`) 탭 전용 **교통·주차** 참고 문구입니다.
 * - 부산 도시철도 3호선 사직·종합운동장역, 부산역 KTX 환승, 시내버스 노선, 사직종합운동장 주차 요금 및 대체 주차를 정리했으며 노선·요금·운영은 변동될 수 있어 방문 전 구단·부산시 공지를 확인하는 것이 좋습니다.
 * - 아이콘은 시각 보조용(`aria-hidden`)이며, 스크린리더는 제목·본문·목록 텍스트로 경로를 전달합니다.
 */
export function StadiumBusanSajikTransportGuide() {
  return (
    <section
      className="stadiumBusanSajikAccessGuide"
      aria-labelledby="stadiumBusanSajikAccessGuideTitle"
    >
      <h3 id="stadiumBusanSajikAccessGuideTitle" className="stadiumBusanSajikAccessGuideTitle">
        오시는 길 · 주차
      </h3>

      <div className="stadiumBusanSajikAccessGuideBlock">
        <h4 className="stadiumBusanSajikAccessGuideBlockHeading">
         
          지하철 이용 (가장 추천)
        </h4>
        <p className="stadiumBusanSajikAccessGuideLead">
          두 역 모두 도보로 이동 가능하며, <strong>관람석·입장 게이트 위치</strong>에 따라 더 편한 역을 고르면 됩니다.
        </p>
        <ul className="stadiumBusanSajikAccessGuideList">
          <li>
            <strong>사직역 (3호선):</strong> <strong>1번 출구</strong>로 나와 직진, 도보 약 7~10분. <strong>3루 원정석</strong>·<strong>중앙 게이트</strong> 쪽으로 들기에 유리한 동선입니다.
          </li>
          <li>
            <strong>종합운동장역 (3호선):</strong> <strong>9번 출구</strong>로 나와 직진, 도보 약 7~10분. <strong>1루 홈석</strong> 쪽으로 들기에 유리한 동선입니다.
          </li>
        </ul>
      </div>

      <div className="stadiumBusanSajikAccessGuideBlock">
        <h4 className="stadiumBusanSajikAccessGuideBlockHeading">
          
          기차(KTX·SRT) 환승 경로
        </h4>
        <p className="stadiumBusanSajikAccessGuideLead">
          타 지역에서 <strong>부산역</strong>으로 도착한 뒤 도시철도로 환승하는 경우를 기준으로 안내합니다.
        </p>
        <ul className="stadiumBusanSajikAccessGuideList">
          <li>
            <strong>경로:</strong> 부산역(1호선, 노포 방향) 승차 → <strong>연산역</strong>에서 3호선(대저 방향)으로 환승 → <strong>사직역</strong> 또는 <strong>종합운동장역</strong> 하차
          </li>
          <li>
            <strong>소요:</strong> 약 35분 안팎(환승·대기에 따라 달라질 수 있음)
          </li>
        </ul>
      </div>

      <div className="stadiumBusanSajikAccessGuideBlock">
        <h4 className="stadiumBusanSajikAccessGuideBlockHeading">
          
          버스 이용
        </h4>
        <ul className="stadiumBusanSajikAccessGuideList">
          <li>
            <strong>하차 정류장:</strong> &apos;사직야구장&apos; 또는 &apos;사직사거리&apos; — 구장까지 도보 약 3~5분
          </li>
          <li>
            <strong>시내버스(안내 예시):</strong> 10, 44, 50, 57, 80, 111, 111-1, 131, 189-1, 210
          </li>
        </ul>
      </div>

      <div className="stadiumBusanSajikAccessGuideBlock">
        <h4 className="stadiumBusanSajikAccessGuideBlockHeading">
        
          자가용 이용 및 주차 정보
        </h4>
        <ul className="stadiumBusanSajikAccessGuideList">
          <li>
            <strong>네비게이션 검색:</strong> &apos;사직종합운동장 주차장&apos;
          </li>
          <li>
            <strong>주차 요금(안내 사례):</strong> 경기일 승용차 <strong>정액 5,000원 선불</strong>로 운영되는 경우가 많습니다(시즌·행사에 따라 달라질 수 있음).
          </li>
          <li>
            <strong>주의:</strong> 주차 면적이 좁아 빨리 차는 편이며, 주말에는 입장이 매우 어려울 수 있습니다. 만차 시 인근 <strong>홈플러스 아시아드점</strong> 유료 주차장을 이용해야 하는 경우가 많습니다.
          </li>
          <li>
            <strong>권장:</strong> 혼잡을 줄이기 위해 <strong>대중교통 이용을 강력히 권장</strong>합니다.
          </li>
        </ul>
      </div>
    </section>
  )
}
