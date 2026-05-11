/**
 * KBO 9개 홈 구장 좌표(대략적인 구장 중심).
 * 날씨 API는 격자 데이터이므로 '구장 입구'와 100% 일치하지 않을 수 있으나 관람 일기용으로 충분한 수준입니다.
 * 표기명은 요청하신 이름과 맞추되, 띄어쓰기만 읽기 쉽게 정리했습니다.
 */
export const kboStadiumLocations = [
  { stadiumKey: 'jamsil', stadiumKo: '잠실야구장', lat: 37.5122, lon: 127.0719 },
  { stadiumKey: 'gocheok', stadiumKo: '고척야구장', lat: 37.4988, lon: 126.8551 },
  { stadiumKey: 'incheonMunhak', stadiumKo: '인천 SSG 랜더스필드', lat: 37.435, lon: 126.5465 },
  { stadiumKey: 'suwonKt', stadiumKo: '수원 KT 위즈파크', lat: 37.2989, lon: 127.0478 },
  { stadiumKey: 'daejeonHanwha', stadiumKo: '대전 한화생명 이글스파크', lat: 36.318, lon: 127.4286 },
  { stadiumKey: 'daeguSamsung', stadiumKo: '대구 삼성 라이온즈파크', lat: 35.8405, lon: 128.5655 },
  { stadiumKey: 'busanSajik', stadiumKo: '사직야구장', lat: 35.1942, lon: 129.0604 },
  { stadiumKey: 'changwonNc', stadiumKo: '창원 NC 파크', lat: 35.2252, lon: 128.5821 },
  { stadiumKey: 'gwangjuChampions', stadiumKo: '광주 기아 챔피언스 필드', lat: 35.1683, lon: 126.8891 },
]
