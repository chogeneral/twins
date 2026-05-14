/**
 * 잠실야구장 탭 전용 **교통·주차** 참고 문구입니다.
 * - 지하철·버스·자가용 순으로 정리했으며, 요금·노선·출구 안내는 현장·공식 공지와 다를 수 있어 관람 전 재확인을 권장합니다.
 * - 시각 구분을 위해 아이콘 영역은 장식(`aria-hidden`)으로 두고, 제목·본문 텍스트로 내용을 읽습니다.
 */
export function StadiumJamsilTransportGuide() {
  return (
    <section
      className="stadiumJamsilAccessGuide"
      aria-labelledby="stadiumJamsilAccessGuideTitle"
    >
      <h3 id="stadiumJamsilAccessGuideTitle" className="stadiumJamsilAccessGuideTitle">
        오시는 길 · 주차
      </h3>

      <div className="stadiumJamsilAccessGuideBlock">
        <h4 className="stadiumJamsilAccessGuideBlockHeading">
         
          지하철 이용 (가장 추천)
        </h4>
        <ul className="stadiumJamsilAccessGuideList">
          <li>
            <strong>지하철역:</strong> 2호선·9호선 종합운동장역 하차
          </li>
          <li>
            <strong>출구 안내:</strong> 5번 출구 또는 6번 출구로 나오면 야구장 중앙매표소와 바로 연결됩니다.
          </li>
        </ul>
      </div>

      <div className="stadiumJamsilAccessGuideBlock">
        <h4 className="stadiumJamsilAccessGuideBlockHeading">
          
          버스 이용
        </h4>
        <p className="stadiumJamsilAccessGuideLead">
          &apos;종합운동장역&apos; 또는 &apos;잠실종합운동장&apos; 정류장에서 하차하시면 도보 3~5분 내에 도착합니다.
        </p>
        <ul className="stadiumJamsilAccessGuideList">
          <li>
            <strong>간선(파란 버스):</strong> 301, 341, 342, 350, 360, 362, N13(심야)
          </li>
          <li>
            <strong>지선(초록 버스):</strong> 2415, 3217, 3411, 3412, 3414, 3417, 3422, 4319
          </li>
          <li>
            <strong>직행/광역(빨간 버스):</strong> 1100, 1700, 2000, 7007, 8001, 9303, M2323, M2353
          </li>
        </ul>
      </div>

      <div className="stadiumJamsilAccessGuideBlock">
        <h4 className="stadiumJamsilAccessGuideBlockHeading">
          
          자가용 이용 및 주차 팁
        </h4>
        <ul className="stadiumJamsilAccessGuideList">
          
          <li>
            <strong>잠실야구장 주차 요금:</strong> 경기 당일 승용차 기준 정액 5,000원 선불 (프로야구 등 대형 행사 시 적용)
          </li>
          <li>
            <strong>탄천주차장 주차 요금:</strong> 소형차: 최초 7시간 2,500원 (초과 시 1시간당 1,200원 추가), 대형차: 최초 7시간 5,000원 (초과 시 1시간당 2,500원 추가)
          </li>
        </ul>
      </div>
    </section>
  )
}
