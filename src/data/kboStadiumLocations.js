/**
 * KBO 9개 홈 구장 좌표(대략적인 구장 중심).
 * 날씨 API는 격자 데이터이므로 '구장 입구'와 100% 일치하지 않을 수 있으나 관람 일기용으로 충분한 수준입니다.
 * homeTeam·addressSummary 는 구장정보 화면용 참고 문구(날씨 훅·향후 UI)에 쓸 수 있으며, 세부 주소·개편은 구단·지자체 공지를 따릅니다.
 */
export const kboStadiumLocations = [
  {
    stadiumKey: 'jamsil',
    stadiumKo: '잠실야구장',
    lat: 37.5122,
    lon: 127.0719,
    homeTeam: 'LG 트윈스 · 두산 베어스',
    addressSummary: '서울특별시 송파구 잠실동 · 서울 종합운동장 일대',
  },
  {
    stadiumKey: 'gocheok',
    stadiumKo: '고척야구장',
    lat: 37.4988,
    lon: 126.8551,
    homeTeam: '키움 히어로즈',
    addressSummary: '서울특별시 구로구 경인로 일대(고척스카이돔)',
  },
  {
    stadiumKey: 'incheonMunhak',
    stadiumKo: '인천 SSG 랜더스필드',
    lat: 37.435,
    lon: 126.5465,
    homeTeam: 'SSG 랜더스',
    addressSummary: '인천광역시 미추홀구 문학동 · 문학경기장 일대',
  },
  {
    stadiumKey: 'suwonKt',
    stadiumKo: '수원 KT 위즈파크',
    lat: 37.2989,
    lon: 127.0478,
    homeTeam: 'KT 위즈',
    addressSummary: '경기도 수원시 장안구 경수대로 일대',
  },
  {
    stadiumKey: 'daejeonHanwha',
    stadiumKo: '대전 한화생명 이글스파크',
    lat: 36.318,
    lon: 127.4286,
    homeTeam: '한화 이글스',
    addressSummary: '대전광역시 중구 대종로 일대',
  },
  {
    stadiumKey: 'daeguSamsung',
    stadiumKo: '대구 삼성 라이온즈파크',
    lat: 35.8405,
    lon: 128.5655,
    homeTeam: '삼성 라이온즈',
    addressSummary: '대구광역시 수성구 야구전설로 일대',
  },
  {
    stadiumKey: 'busanSajik',
    stadiumKo: '사직야구장',
    lat: 35.1942,
    lon: 129.0604,
    homeTeam: '롯데 자이언츠',
    addressSummary: '부산광역시 동래구 사직로 일대',
  },
  {
    stadiumKey: 'changwonNc',
    stadiumKo: '창원 NC 파크',
    lat: 35.2252,
    lon: 128.5821,
    homeTeam: 'NC 다이노스',
    addressSummary: '경상남도 창원시 마산회원구 양덕로 일대',
  },
  {
    stadiumKey: 'gwangjuChampions',
    stadiumKo: '광주 기아 챔피언스 필드',
    lat: 35.1683,
    lon: 126.8891,
    homeTeam: 'KIA 타이거즈',
    addressSummary: '광주광역시 북구 임방울대로 일대',
  },
]
