/**
 * 수원 KT 위즈파크(`suwonKt`) 탭 전용 **교통·주차** 참고 문구입니다.
 * - 제공 자료 기준으로 지하철+버스 환승, 직행·광역버스, 사전예약 주차를 정리했으며 노선·요금·예약 방식은 시즌마다 바뀔 수 있어 관람 전 구단 공지를 확인하는 것이 좋습니다.
 * - 아이콘은 시각 보조용(`aria-hidden`)이며, 스크린리더는 제목과 목록 텍스트로 경로를 읽습니다.
 */
export function StadiumSuwonKtTransportGuide() {
  return (
    <section
      className="stadiumSuwonKtAccessGuide"
      aria-labelledby="stadiumSuwonKtAccessGuideTitle"
    >
      <h3 id="stadiumSuwonKtAccessGuideTitle" className="stadiumSuwonKtAccessGuideTitle">
        오시는 길 · 주차
      </h3>

      <div className="stadiumSuwonKtAccessGuideBlock">
        <h4 className="stadiumSuwonKtAccessGuideBlockHeading">
          
          지하철 + 버스 환승 경로
        </h4>
        <ul className="stadiumSuwonKtAccessGuideList">
          <li>
            <strong>수원역 (1호선·수인분당선):</strong> 4번 출구 앞 정류장에서 777, 900, 310, 5, 60번 등 버스 이용 →
            &apos;수원 KT 위즈파크·행정동 주민센터&apos; 정류장 하차, 약 20분
          </li>
          <li>
            <strong>화서역 (1호선):</strong> 1번 출구 앞 정류장에서 19, 19-1번 버스 → &apos;수원 KT 위즈파크&apos; 정류장 하차, 약 15분
          </li>
          <li>
            <strong>사당역 (2·4호선):</strong> 4번 출구 앞 정류장에서 광역 7770번 → &apos;수원 KT 위즈파크&apos; 정류장 하차. 서울에서 오기 가장 빠른 연결로 약 25~30분
          </li>
        </ul>
      </div>

      <div className="stadiumSuwonKtAccessGuideBlock">
        <h4 className="stadiumSuwonKtAccessGuideBlockHeading">
          
          직행 버스 이용
        </h4>
        <p className="stadiumSuwonKtAccessGuideLead">
          &apos;수원 KT 위즈파크&apos; 정류장에서 바로 하차하는 경우 참고하세요.
        </p>
        <ul className="stadiumSuwonKtAccessGuideList">
          <li>
            <strong>서울 광역·직행:</strong> 2007 (잠실역), 3000 (강남역), 7770 (사당역), 7780 (사당역)
          </li>
          <li>
            <strong>시내버스:</strong> 5, 25, 25-2, 27, 36, 62-1, 99, 300, 310, 777, 900
          </li>
        </ul>
      </div>

      <div className="stadiumSuwonKtAccessGuideBlock">
        <h4 className="stadiumSuwonKtAccessGuideBlockHeading">
          
          자가용 이용 및 주차 정보
        </h4>
        <ul className="stadiumSuwonKtAccessGuideList">
          <li>
            <strong>주차 방식:</strong> 프로야구 경기일 등에는 <strong>사전 예약 차량만</strong> 주차장 입장이 가능합니다. 예약이 없으면 빈자리가 있어도 진입이 제한될 수 있습니다(100% 사전 예약제 운영).
          </li>
          <li>
            <strong>주차 요금:</strong> 경기 당일 승용차 기준 정액 5,000원 (출차 시 납부)
          </li>
          <li>
            <strong>예약 방법:</strong> 경기 전일까지 KT 위즈 공식 홈페이지 또는 &apos;위즈앱&apos; 앱에서 예약합니다.
          </li>
          <li>
            <strong>대안:</strong> 구장 주차가 어려울 때는 &apos;장안구청 주차장(유료)&apos; 등 주변 대체 주차장을 검토해 보세요.
          </li>
        </ul>
      </div>
    </section>
  )
}
