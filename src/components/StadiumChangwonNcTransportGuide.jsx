/**
 * 창원 NC 파크(`changwonNc`) 탭 전용 **교통·주차** 참고 문구입니다.
 * - 마산역·창원중앙역 KTX 연계, 시외·고속터미널, 시내버스 노선, 경기일 무료 주차 및 만차 시 대안을 정리했으며 노선 개편·요금·무료 주차 정책은 변동될 수 있어 방문 전 구단·창원시·버스 공지를 확인하는 것이 좋습니다.
 * - 아이콘은 시각 보조용(`aria-hidden`)이며, 스크린리더는 제목·목록 텍스트로 경로를 전달합니다.
 */
export function StadiumChangwonNcTransportGuide() {
  return (
    <section
      className="stadiumChangwonNcAccessGuide"
      aria-labelledby="stadiumChangwonNcAccessGuideTitle"
    >
      <h3 id="stadiumChangwonNcAccessGuideTitle" className="stadiumChangwonNcAccessGuideTitle">
        오시는 길 · 주차
      </h3>

      <div className="stadiumChangwonNcAccessGuideBlock">
        <h4 className="stadiumChangwonNcAccessGuideBlockHeading">
         
          열차(KTX·SRT) + 버스·택시 연결 (타지 방문 추천)
        </h4>
        <ul className="stadiumChangwonNcAccessGuideList">
          <li>
            <strong>마산역 (가장 추천):</strong> 역광장 정류장에서 46, 50, 100, 103, 105, 107번 등 → &apos;마산야구장(신세계백화점)&apos; 정류장 하차, 약 10~15분
          </li>
          <li>
            <strong>택시:</strong> 마산역에서 구장까지 기본요금 구간으로 이동하기 수월한 편이며, 안내상 약 <strong>4,000~5,000원</strong>대가 거론되는 경우가 많습니다(요금제·경로에 따라 달라짐).
          </li>
          <li>
            <strong>창원중앙역 출발:</strong> 역 앞 정류장에서 <strong>220번</strong> → &apos;마산야구장&apos; 하차, 약 40분
          </li>
        </ul>
      </div>

      <div className="stadiumChangwonNcAccessGuideBlock">
        <h4 className="stadiumChangwonNcAccessGuideBlockHeading">
          
          고속·시외버스 연결
        </h4>
        <ul className="stadiumChangwonNcAccessGuideList">
          <li>
            <strong>마산시외버스터미널:</strong> 터미널 맞은편 정류장에서 100, 103, 105, 140, 710번 → &apos;마산야구장&apos; 하차, 약 10분
          </li>
          <li>
            <strong>마산고속버스터미널:</strong> 구장과 가까워 도보 약 10~15분 거리로 안내되는 경우가 많습니다.
          </li>
        </ul>
      </div>

      <div className="stadiumChangwonNcAccessGuideBlock">
        <h4 className="stadiumChangwonNcAccessGuideBlockHeading">
          
          창원 시내버스 주요 노선 (&apos;마산야구장&apos; 정류장 하차)
        </h4>
        <ul className="stadiumChangwonNcAccessGuideList">
          <li>
            <strong>간선·지선 등:</strong> 24, 46, 50, 100, 101, 103, 105, 107, 114, 122, 160, 254
          </li>
          <li>
            <strong>좌석버스:</strong> 703, 704, 707, 710, 800
          </li>
        </ul>
      </div>

      <div className="stadiumChangwonNcAccessGuideBlock">
        <h4 className="stadiumChangwonNcAccessGuideBlockHeading">
          
          자가용 이용 및 주차 정보 (무료 안내)
        </h4>
        <ul className="stadiumChangwonNcAccessGuideList">
          <li>
            <strong>네비게이션 검색:</strong> &apos;창원 NC 파크 주차장&apos; 또는 &apos;마산종합운동장 주차타워&apos;
          </li>
          <li>
            <strong>주차 요금(안내 사례):</strong> 경기일 당일 주차장 입장 시 <strong>무료</strong>로 운영되는 경우가 많습니다(시즌·행사·정책에 따라 달라질 수 있음).
          </li>
          <li>
            <strong>주차 팁:</strong> 주차 타워·지상 공간이 갖춰져 있으나, 주말 대형 경기에는 <strong>경기 시작 약 1시간 전</strong>부터 만차에 가까워질 수 있습니다. 만차 시 인근 <strong>홈플러스 마산점</strong>(유료) 등 대형 마트 주차장을 검토하세요.
          </li>
        </ul>
      </div>
    </section>
  )
}
