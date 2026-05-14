/**
 * 광주 기아 챔피언스 필드(`gwangjuChampions`) 탭 전용 **교통·주차** 참고 문구입니다.
 * - 광주송정역 KTX·유스퀘어(종합버스터미널) 연계, 시내버스 노선, 경기일 무료 주차 및 만차 시 대체 주차지를 정리했으며 노선 개편·요금·무료 주차 정책은 변동될 수 있어 방문 전 구단·광주시·버스 공지를 확인하는 것이 좋습니다.
 * - 아이콘은 시각 보조용(`aria-hidden`)이며, 스크린리더는 제목·목록 텍스트로 경로를 전달합니다.
 */
export function StadiumGwangjuKiaTransportGuide() {
  return (
    <section
      className="stadiumGwangjuKiaAccessGuide"
      aria-labelledby="stadiumGwangjuKiaAccessGuideTitle"
    >
      <h3 id="stadiumGwangjuKiaAccessGuideTitle" className="stadiumGwangjuKiaAccessGuideTitle">
        오시는 길 · 주차
      </h3>

      <div className="stadiumGwangjuKiaAccessGuideBlock">
        <h4 className="stadiumGwangjuKiaAccessGuideBlockHeading">
         
          기차(KTX·SRT) 연계 경로 (타 지역 방문객)
        </h4>
        <ul className="stadiumGwangjuKiaAccessGuideList">
          <li>
            <strong>광주송정역(KTX·SRT):</strong> 역전 정류장에서 <strong>송정19번</strong> → &apos;광주기아챔피언스필드&apos; 정류장 하차, 약 40~45분
          </li>
          <li>
            <strong>택시:</strong> 이동 시간 약 25~30분, 요금은 안내상 <strong>15,000원</strong> 안팎이 거론되는 경우가 많습니다(요금제·경로에 따라 달라짐).
          </li>
        </ul>
      </div>

      <div className="stadiumGwangjuKiaAccessGuideBlock">
        <h4 className="stadiumGwangjuKiaAccessGuideBlockHeading">
         
          고속·시외버스 연계 경로 (추천)
        </h4>
        <ul className="stadiumGwangjuKiaAccessGuideList">
          <li>
            <strong>유스퀘어(광주종합버스터미널):</strong> 야구장과 매우 가깝습니다. 터미널 앞 정류장에서 <strong>임곡89, 문흥39, 유덕65, 대원70번</strong> → &apos;광주기아챔피언스필드&apos; 하차, 약 10~15분
          </li>
          <li>
            <strong>도보:</strong> 터미널에서 야구장까지 약 <strong>20~25분</strong> 정도 직진 동선으로 안내되는 경우가 많아, 날씨가 좋을 때 도보 선택도 가능합니다.
          </li>
        </ul>
      </div>

      <div className="stadiumGwangjuKiaAccessGuideBlock">
        <h4 className="stadiumGwangjuKiaAccessGuideBlockHeading">
          
          광주 시내버스 주요 노선 (&apos;광주기아챔피언스필드&apos; 정류장 하차)
        </h4>
        <ul className="stadiumGwangjuKiaAccessGuideList">
          <li>
            <strong>간선·지선 등:</strong> 임곡89, 문흥39, 송정19, 유덕65, 대원70, 양동43, 매월16, 풍암16
          </li>
        </ul>
      </div>

      <div className="stadiumGwangjuKiaAccessGuideBlock">
        <h4 className="stadiumGwangjuKiaAccessGuideBlockHeading">
          
          자가용 이용 및 주차 정보 (무료 안내)
        </h4>
        <ul className="stadiumGwangjuKiaAccessGuideList">
          <li>
            <strong>네비게이션 검색:</strong> &apos;광주기아챔피언스필드 주차장&apos;
          </li>
          <li>
            <strong>주차 요금(안내 사례):</strong> 경기 당일 주차장 이용 시 <strong>무료</strong>로 운영되는 경우가 많습니다(시즌·행사에 따라 달라질 수 있음).
          </li>
          <li>
            <strong>주차 팁:</strong> 지하·지상 주차장(약 <strong>1,100대</strong> 규모로 안내되는 경우가 많음)은 관람 인원 대비 협소한 편입니다. 주말 경기는 <strong>경기 시작 2시간 전</strong>에도 만차에 가까워질 수 있어, 만차 시 구장 뒤편 <strong>임동 공영주차장</strong> 또는 <strong>천변 우수로 하상주차장</strong> 이용이 필요할 수 있습니다.
          </li>
        </ul>
      </div>
    </section>
  )
}
