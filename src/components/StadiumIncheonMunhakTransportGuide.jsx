/**
 * 인천 SSG 랜더스필드(`incheonMunhak`) 탭 전용 **교통·주차** 참고 문구입니다.
 * - 제공 이미지 기준으로 지하철·버스·자가용 순으로 정리했으며, 요금·노선은 시즌·행사에 따라 달라질 수 있어 방문 전 공식 공지 확인을 권장합니다.
 * - 이모지 아이콘은 장식용(`aria-hidden`)으로 두어 스크린리더는 제목·본문만 읽습니다.
 */
export function StadiumIncheonMunhakTransportGuide() {
  return (
    <section
      className="stadiumIncheonMunhakAccessGuide"
      aria-labelledby="stadiumIncheonMunhakAccessGuideTitle"
    >
      <h3 id="stadiumIncheonMunhakAccessGuideTitle" className="stadiumIncheonMunhakAccessGuideTitle">
        오시는 길 · 주차
      </h3>

      <div className="stadiumIncheonMunhakAccessGuideBlock">
        <h4 className="stadiumIncheonMunhakAccessGuideBlockHeading">
          
          지하철 이용 (가장 추천)
        </h4>
        <ul className="stadiumIncheonMunhakAccessGuideList">
          <li>
            <strong>지하철역:</strong> 인천 1호선 문학경기장역 하차
          </li>
          <li>
            <strong>출구 안내:</strong> 2번 출구로 나오면 야구장 3루 매표소 및 광장과 도보 5분 내로 바로 연결됩니다.
          </li>
        </ul>
      </div>

      <div className="stadiumIncheonMunhakAccessGuideBlock">
        <h4 className="stadiumIncheonMunhakAccessGuideBlockHeading">
          
          버스 이용
        </h4>
        <p className="stadiumIncheonMunhakAccessGuideLead">
          &apos;문학경기장(박태환수영장)&apos; 또는 &apos;선학사거리&apos; 정류장에서 하차하시면 편리합니다.
        </p>
        <ul className="stadiumIncheonMunhakAccessGuideList">
          <li>
            <strong>지선(초록 버스):</strong> 515, 522, 523
          </li>
          <li>
            <strong>간선(파란 버스):</strong> 4, 6, 11, 13, 22, 27, 46, 63, 82, 111-2
          </li>
          <li>
            <strong>광역/급행 버스:</strong> 9201 (강남역 직행), 급행91
          </li>
        </ul>
      </div>

      <div className="stadiumIncheonMunhakAccessGuideBlock">
        <h4 className="stadiumIncheonMunhakAccessGuideBlockHeading">
          
          자가용 이용 및 주차 정보
        </h4>
        <ul className="stadiumIncheonMunhakAccessGuideList">
          <li>
            <strong>네비게이션 검색:</strong> &apos;인천SSG랜더스필드 주차장&apos; 또는 &apos;문학경기장 주차장&apos;
          </li>
          <li>
            <strong>주차 요금:</strong> 경기 당일 승용차 기준 정액 2,000원 선불 (프로야구 경기 시 적용)
          </li>
          <li>
            <strong>주차 팁:</strong> 주차 공간이 약 4,000대로 비교적 넉넉한 편이지만, 주말 만석 경기 시에는 경기 시작 1시간 전부터 매우 혼잡하므로 지하철 이용이 가장 편합니다.
          </li>
        </ul>
      </div>
    </section>
  )
}
