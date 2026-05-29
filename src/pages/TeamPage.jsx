import { Fragment, useEffect, useState } from 'react'
import dongsooImg from '../assets/dongsoo.jpg'
import sanghoonImg from '../assets/sanghoon.jpg'
/* 골든글러브 이상훈(투수) 전용 — 김상훈과 파일명이 비슷해 sanghoon.jpg 와 구분하기 위해 sanghoon.png 를 따로 둡니다 */
import leeSanghoonGgImg from '../assets/sanghoon.png'
/* 골든글러브 송구홍 모달 사진 */
import goohongImg from '../assets/goohong.jpg'
import youngbinImg from '../assets/youngbin.jpg'
import jonghoImg from '../assets/jongho.jpg'
import daehwaImg from '../assets/daehwa.jpg'
import jaehyunImg from '../assets/jaehyun.jpg'
/* 골든글러브 이병규 모달 사진 */
import byunggyuGgImg from '../assets/byunggyu.png'
/* 골든글러브 류지현 모달 사진 */
import jihyunGgImg from '../assets/jihyun.png'
/* 골든글러브 신윤호 모달 사진 */
import yoonhoGgImg from '../assets/yoonho.png'
/* 골든글러브 양준혁 모달 사진 */
import junhyuckGgImg from '../assets/junhyuck.jpg'
/* 골든글러브 이대형 모달 사진 — 에셋 파일명이 대문자 D 로 시작합니다(Daehyeong.jpg) */
import daehyeongGgImg from '../assets/Daehyeong.jpg'
/* 골든글러브 박용택 모달 사진 */
import yonhteakGgImg from '../assets/yonhteak.jpg'
/* 골든글러브 조인성 모달 사진 */
import ingsungGgImg from '../assets/ingsung.jpg'
/* 골든글러브 오지환 모달 사진 */
import jihwanGgImg from '../assets/jihwan.jpg'
/* 골든글러브 김현수 모달 사진 */
import hyunsooGgImg from '../assets/hyunsoo.jpg'
/* 골든글러브 오스틴 딘 모달 사진 */
import austinGgImg from '../assets/austin.jpg'
/* 골든글러브 홍창기 모달 사진 */
import changkiGgImg from '../assets/changki.jpg'
/* 골든글러브 신민재 모달 사진 */
import minjaeGgImg from '../assets/minjae.jpg'
/* MBC 청룡 골든글러브 김용운 모달 사진 — LG 구역과 동일한 사진 모달을 씁니다 */
import yongyunGgImg from '../assets/yongyun.jpg'
/* MBC 청룡 골든글러브 김용달 모달 사진 */
import youngdalGgImg from '../assets/youngdal.jpg'
/* MBC 청룡 골든글러브 이해창 모달 사진 */
import haechangGgImg from '../assets/haechang.jpg'
/* MBC 청룡 골든글러브 김재박 모달 사진 */
import jaebackGgImg from '../assets/jaeback.jpg'
/* MBC 청룡 골든글러브 이광은 모달 사진 */
import kwangeunGgImg from '../assets/kwangeun.jpg'
import './teamPage.css'
import './boardPage.css'

const HISTORY = [
  {
    year: '1982',
    title: 'MBC 청룡 창단',
    desc: 'KBO 리그 원년 6개 구단 중 하나로 MBC 청룡이 서울을 연고로 창단되었습니다. LG 트윈스의 전신으로, 한국 프로야구 출범과 함께 역사를 시작했습니다.',
  },
  {
    year: '1982–1989',
    title: 'MBC 청룡 시대',
    desc: '8시즌 동안 서울 팬들의 사랑을 받으며 활약했습니다. 1989년 LG그룹에 구단이 매각되며 새로운 시대의 막을 올렸습니다.',
  },
  {
    year: '1990',
    title: 'LG 트윈스 창단',
    desc: 'LG그룹이 MBC 청룡을 인수하며 LG 트윈스를 창단. 서울 잠실야구장을 홈구장으로 KBO 리그에 새 이름으로 첫발을 내디뎠습니다.',
  },
  {
    year: '1994',
    title: '첫 번째 한국시리즈 우승',
    desc: '창단 5년 만에 태평양 돌핀스를 꺾고 구단 첫 한국시리즈 우승. 잠실 팬들에게 첫 번째 감동을 선물했습니다.',
  },
  {
    year: '2002',
    title: '두 번째 한국시리즈 우승',
    desc: 'SK 와이번스를 상대로 한국시리즈를 제패하며 두 번째 챔피언 자리에 올랐습니다.',
  },
  {
    year: '2003–2022',
    title: '재건의 시간',
    desc: '긴 암흑기 속에서도 팬들의 응원은 끊이지 않았습니다. 박용택·오지환·김현수 등 프랜차이즈 스타들이 팀을 지켰습니다.',
  },
  {
    year: '2023',
    title: '세 번째 한국시리즈 우승',
    desc: '21년의 기다림을 끝내고 KT 위즈를 꺾으며 우승. 잠실을 가득 메운 팬들과 함께 역사적인 순간을 만들었습니다.',
  },
  {
    year: '2024',
    title: '디펜딩 챔피언의 도전',
    desc: '우승 직후 시즌, 디펜딩 챔피언으로 리그에 임했습니다. 포스트시즌에 진출하며 강팀의 면모를 이어갔고, 다음 시즌을 향한 전력 정비에 집중했습니다.',
  },
  {
    year: '2025',
    title: '네 번째 한국시리즈 우승',
    desc: '2025년, LG 트윈스는 잠실의 주인이자 대한민국 야구의 정점임을 다시 한번 증명하며 통산 4번째 별을 가슴에 새겼다.',
  },
]

const GOLDEN_GLOVE_MBC = [
  {
    name: '김용운',
    pos: '포수',
    years: '1982',
    photo: yongyunGgImg,
    /* 수상 포지션은 포수이나 사용자 제공 표는 타격 기록입니다 — 첨부 이미지 수치 그대로 반영 */
    stats: [{ year: 1982, games: 72, hr: 3, sb: 2, hits: 53, rbi: 29, avg: '0.244' }],
  },
  {
    name: '김용달',
    pos: '1루수',
    years: '1982',
    photo: youngdalGgImg,
    /* 골든글러브 수상 연도(1982) 타격 성적 — 사용자 제공 표(연도·경기·홈런·도루·안타·타점·타율) 그대로 반영 */
    stats: [{ year: 1982, games: 68, hr: 5, sb: 2, hits: 53, rbi: 23, avg: '0.315' }],
  },
  /* 사용자 제공 통합 명단에만 있어 기존 목록에 빠져 있던 MBC 청룡 시대 수상자입니다 */
  {
    name: '이해창',
    pos: '외야수',
    years: '1983',
    photo: haechangGgImg,
    /* 골든글러브 수상 연도는 1983입니다. 사용자 제공 표에 1984 시즌도 있어 모달에는 두 행 모두 넣었습니다 */
    stats: [
      { year: 1983, games: 100, hr: 8, sb: 26, hits: 114, rbi: 46, avg: '0.294' },
      { year: 1984, games: 100, hr: 7, sb: 36, hits: 94, rbi: 38, avg: '0.264' },
    ],
  },
  /* 명단상 1986년 수상 포함 → 1983–85 가 아닌 1983–86 으로 표기했습니다 */
  {
    name: '김재박',
    pos: '유격수',
    years: '1983–86 · 1989',
    photo: jaebackGgImg,
    /* 수상 연도별 시즌 타격 성적 — 사용자 제공 표 그대로. 출처 표의 합계 행은 연도 열 구조와 맞지 않아 모달에는 넣지 않았습니다 */
    stats: [
      { year: 1983, games: 97, hr: 5, sb: 34, hits: 108, rbi: 46, avg: '0.290' },
      { year: 1984, games: 91, hr: 7, sb: 26, hits: 103, rbi: 37, avg: '0.300' },
      { year: 1985, games: 100, hr: 3, sb: 50, hits: 118, rbi: 36, avg: '0.313' },
      { year: 1986, games: 102, hr: 4, sb: 38, hits: 102, rbi: 43, avg: '0.264' },
      { year: 1989, games: 101, hr: 3, sb: 39, hits: 102, rbi: 27, avg: '0.286' },
    ],
  },
  /* 1984년은 3루, 1985–87년은 외야로 명단에 구분되어 있습니다 */
  {
    name: '이광은',
    pos: '3루수 · 외야수',
    years: '1984 · 1985–87',
    photo: kwangeunGgImg,
    /* 수상 연도 구간별 시즌 타격 성적 — 사용자 제공 표 그대로. 합계 행은 연도 열 구조상 모달에서 생략했습니다 */
    stats: [
      { year: 1984, games: 100, hr: 18, sb: 22, hits: 114, rbi: 68, avg: '0.311' },
      { year: 1985, games: 110, hr: 11, sb: 24, hits: 119, rbi: 49, avg: '0.285' },
      { year: 1986, games: 108, hr: 10, sb: 29, hits: 114, rbi: 38, avg: '0.284' },
      { year: 1987, games: 101, hr: 4, sb: 16, hits: 98, rbi: 34, avg: '0.270' },
    ],
  },
]

/* LG 트윈스 골든글러브 — 사용자 제공 통합 명단 기준으로 연도·포지션을 맞추었습니다. photo 가 있는 항목만 행 클릭 시 성적 모달이 열립니다 */

const GOLDEN_GLOVE = [
  {
    name: '김동수', pos: '포수', years: '1990 · 1993–95 · 1997', photo: dongsooImg,
    stats: [
      { year: 1990, games: 110, hr: 13, rbi: 62, avg: '0.291',  },
      { year: 1993, games: 116, hr: 10, rbi: 55, avg: '0.258' },
      { year: 1994, games: 121, hr: 15, rbi: 63, avg: '0.280',  },
      { year: 1995, games: 119, hr: 10, rbi: 56, avg: '0.264' },
      { year: 1997, games: 115, hr: 12, rbi: 54, avg: '0.279' },
    ],
  },
  {
    name: '김상훈',
    pos: '1루수',
    years: '1990',
    photo: sanghoonImg,
    /* 골든글러브 수상 연도(1990) 타격 성적 — 사용자 제공 수치 */
    stats: [{ year: 1990, games: 100, hr: 6, rbi: 58, avg: '0.322' }],
  },
  {
    name: '한대화',
    pos: '3루수',
    years: '1990 · 1994',
    photo: daehwaImg,
    /* 수상 연도는 1990·1994 이지만 모달 표는 기존 사용자 제공 시즌(1994)만 유지했습니다 */
    stats: [{ year: 1994, games: 106, hr: 10, rbi: 67, avg: '0.297' }],
  },
  /* 사용자 요청으로 통합 명단 정리 시 빠졌던 1993년 수상 기록을 다시 넣었습니다 */
  {
    name: '송구홍',
    pos: '3루수',
    years: '1993',
    photo: goohongImg,
    /* 골든글러브 수상 연도(1993) 타격 성적 — 사용자 제공 수치 */
    stats: [{ year: 1993, games: 121, hr: 20, rbi: 59, avg: '0.304' }],
  },
  {
    name: '서용빈',
    pos: '1루수',
    years: '1994',
    photo: youngbinImg,
    /* 통합 명단은 1994년 수상 — 표 시즌 연도만 1994 로 맞추었습니다 */
    stats: [{ year: 1994, games: 126, hr: 12, rbi: 72, avg: '0.318' }],
  },
  {
    name: '박종호',
    pos: '2루수',
    years: '1994',
    photo: jonghoImg,
    /* 골든글러브 수상 연도(1994) 타격 성적 — 사용자 제공 수치(도루 포함) */
    stats: [{ year: 1994, games: 123, hr: 6, sb: 21, rbi: 56, avg: '0.260' }],
  },
  {
    name: '김재현',
    pos: '외야수',
    years: '1993 · 1994',
    photo: jaehyunImg,
    /* 명단은 1993·1994 수상 — 모달에는 사용자 제공 1994 시즌만 두었습니다 */
    stats: [{ year: 1994, games: 126, hr: 21, sb: 21, hits: 115, rbi: 80, avg: '0.289' }],
  },
  {
    name: '이상훈',
    pos: '투수',
    years: '1995',
    photo: leeSanghoonGgImg,
    /* 골든글러브 수상 연도(1995) 투수 성적 — 사용자 제공 수치. 「228과 3/1」은 통산 이닝 표기 관례에 맞춰 228⅓이닝으로 보았습니다 */
    pitcherStats: [
      {
        year: 1995,
        games: 30,
        wins: 20,
        losses: 5,
        era: '2.01',
        inningsDisplay: '228⅓',
        strikeouts: 142,
        completeGames: 12,
        shutouts: 3,
      },
    ],
  },
  {
    name: '이병규',
    pos: '외야수 · 지명타자',
    years: '1997 · 1999–2001 · 2004–05 (외야수) · 2013 (지명타자)',
    photo: byunggyuGgImg,
    /* 골든글러브 수상 연도별 타격 성적 — 사용자 제공 표(연도·경기·홈런·도루·안타·타점·타율) 그대로 반영 */
    stats: [
      { year: 1997, games: 126, hr: 7, sb: 23, hits: 151, rbi: 69, avg: '0.305' },
      { year: 1999, games: 132, hr: 30, sb: 31, hits: 192, rbi: 99, avg: '0.349' },
      { year: 2000, games: 132, hr: 18, sb: 14, hits: 170, rbi: 99, avg: '0.323' },
      { year: 2001, games: 133, hr: 12, sb: 9, hits: 167, rbi: 83, avg: '0.305' },
      { year: 2004, games: 129, hr: 9, sb: 7, hits: 135, rbi: 54, avg: '0.343' },
      { year: 2005, games: 119, hr: 9, sb: 10, hits: 157, rbi: 75, avg: '0.337' },
      { year: 2013, games: 98, hr: 5, sb: 2, hits: 130, rbi: 74, avg: '0.348' },
    ],
  },
  {
    name: '류지현',
    pos: '유격수',
    years: '1998 · 1999',
    photo: jihyunGgImg,
    /* 골든글러브 수상 연도별 타격 성적 — 사용자 제공 표(연도·경기·홈런·도루·안타·타점·타율) 그대로 반영 */
    stats: [
      { year: 1998, games: 126, hr: 12, sb: 40, hits: 132, rbi: 61, avg: '0.277' },
      { year: 1999, games: 93, hr: 11, sb: 14, hits: 108, rbi: 45, avg: '0.303' },
    ],
  },
  {
    name: '신윤호',
    pos: '투수',
    years: '2001',
    photo: yoonhoGgImg,
    /* 골든글러브 수상 연도(2001) 투수 성적 — 사용자 제공 표. 이닝 144.1 은 KBO 관례상 144⅓이닝과 동일하게 표기했습니다 */
    pitcherStats: [
      {
        year: 2001,
        games: 70,
        wins: 15,
        losses: 6,
        saves: 18,
        era: '3.12',
        inningsDisplay: '144⅓',
        strikeouts: 99,
      },
    ],
  },
  {
    name: '양준혁',
    pos: '지명타자',
    years: '2001',
    photo: junhyuckGgImg,
    /* 골든글러브 수상 연도(2001) 타격 성적 — 사용자 제공 표(연도·경기·홈런·도루·안타·타점·타율) 그대로 반영 */
    stats: [{ year: 2001, games: 131, hr: 14, sb: 3, hits: 155, rbi: 92, avg: '0.355' }],
  },
  {
    name: '이대형',
    pos: '외야수',
    years: '2007',
    photo: daehyeongGgImg,
    /* 골든글러브 수상 연도(2007) 타격 성적 — 사용자 제공 표(연도·경기·홈런·도루·안타·타점·타율) 그대로 반영 */
    stats: [{ year: 2007, games: 126, hr: 1, sb: 53, hits: 139, rbi: 31, avg: '0.308' }],
  },
  {
    name: '박용택',
    pos: '외야수 · 지명타자',
    years: '2009 · 2012–13 (외야수) · 2017 (지명타자)',
    photo: yonhteakGgImg,
    /* 골든글러브 수상 연도별 타격 성적 — 사용자 제공 표(연도·경기·홈런·도루·안타·타점·타율) 그대로 반영 */
    stats: [
      { year: 2009, games: 111, hr: 18, sb: 22, hits: 143, rbi: 74, avg: '0.372' },
      { year: 2012, games: 127, hr: 11, sb: 30, hits: 152, rbi: 76, avg: '0.304' },
      { year: 2013, games: 126, hr: 7, sb: 13, hits: 156, rbi: 67, avg: '0.328' },
      { year: 2017, games: 138, hr: 14, sb: 4, hits: 175, rbi: 90, avg: '0.344' },
    ],
  },
  {
    name: '조인성',
    pos: '포수',
    years: '2010',
    photo: ingsungGgImg,
    /* 골든글러브 수상 연도(2010) 타격 성적 — 사용자 제공 표(연도·경기·홈런·도루·안타·타점·타율) 그대로 반영 */
    stats: [{ year: 2010, games: 133, hr: 28, sb: 2, hits: 145, rbi: 107, avg: '0.317' }],
  },
  {
    name: '김현수',
    pos: '외야수',
    years: '2020',
    photo: hyunsooGgImg,
    /* 골든글러브 수상 연도(2020) 타격 성적 — 사용자 제공 표(연도·경기·홈런·도루·안타·타점·타율) 그대로 반영 */
    stats: [{ year: 2020, games: 142, hr: 22, sb: 0, hits: 181, rbi: 119, avg: '0.331' }],
  },
  {
    name: '오스틴 딘',
    pos: '1루수 (외인)',
    years: '2023 · 2024',
    photo: austinGgImg,
    /* 골든글러브 수상 연도별 타격 성적 — 사용자 제공 표(연도·경기·홈런·도루·안타·타점·타율) 그대로 반영 */
    stats: [
      { year: 2023, games: 139, hr: 23, sb: 7, hits: 163, rbi: 95, avg: '0.313' },
      { year: 2024, games: 140, hr: 32, sb: 12, hits: 168, rbi: 132, avg: '0.319' },
    ],
  },
  {
    name: '오지환',
    pos: '유격수',
    years: '2022 · 2023',
    photo: jihwanGgImg,
    /* 사용자 제공 표(2022·2023) — 목록 수상 연도와 동일 */
    stats: [
      { year: 2022, games: 142, hr: 25, sb: 20, hits: 133, rbi: 87, avg: '0.269' },
      { year: 2023, games: 126, hr: 8, sb: 16, hits: 113, rbi: 62, avg: '0.268' },
    ],
  },
  {
    name: '홍창기',
    pos: '외야수',
    years: '2021 · 2023',
    photo: changkiGgImg,
    /* 골든글러브 수상 연도별 타격 성적 — 사용자 제공 표(연도·경기·홈런·도루·안타·타점·타율) 그대로 반영 */
    stats: [
      { year: 2021, games: 144, hr: 4, sb: 23, hits: 172, rbi: 52, avg: '0.328' },
      { year: 2023, games: 141, hr: 1, sb: 23, hits: 174, rbi: 65, avg: '0.332' },
    ],
  },
  {
    name: '신민재',
    pos: '2루수',
    years: '2025',
    photo: minjaeGgImg,
    /* 골든글러브 수상 연도(2025) 타격 성적 — 사용자 제공 표(연도·경기·홈런·도루·안타·타점·타율) 그대로 반영 */
    stats: [{ year: 2025, games: 135, hr: 1, sb: 15, hits: 145, rbi: 61, avg: '0.313' }],
  },
]

/**
 * LG 트윈스 시즌 성적 (1990~) — 제공 이미지 표의 수치·문구를 그대로 옮겼습니다.
 * - finalTone: 우승 여부(행 배경·★). champion이면 팀 컬러 틴트 행이 됩니다.
 * - championYoutubeId: 값이 있으면 **해당 표 행 전체** 클릭 시 팝업으로 YouTube 임베드 재생(watch?v= 뒤 ID). 우승 연도가 아니어도 동일하게 동작합니다.
 */
const LG_TWINS_SEASON_RECORDS = [
  {
    year: 2025,
    regularSeason: '1위',
    finalRank: '우승',
    games: 144,
    wins: 85,
    draws: 3,
    losses: 56,
    winRate: 0.603,
    finalTone: 'champion',
    /* 2025 우승 영상 — https://www.youtube.com/watch?v=IdjEMLOv99M */
    championYoutubeId: 'IdjEMLOv99M',
  },
  {
    year: 2024,
    regularSeason: '3위',
    finalRank: '3위',
    games: 144,
    wins: 76,
    draws: 2,
    losses: 66,
    winRate: 0.535,
    finalTone: 'rank34',
  },
  {
    year: 2023,
    regularSeason: '1위',
    finalRank: '우승',
    games: 144,
    wins: 86,
    draws: 2,
    losses: 56,
    winRate: 0.606,
    finalTone: 'champion',
    /* 2023 우승 영상 — https://www.youtube.com/watch?v=P_tZWc6ZGis */
    championYoutubeId: 'P_tZWc6ZGis',
  },
  {
    year: 2022,
    regularSeason: '2위',
    finalRank: '3위',
    games: 144,
    wins: 87,
    draws: 2,
    losses: 55,
    winRate: 0.613,
    finalTone: 'rank34',
  },
  {
    year: 2021,
    regularSeason: '3위',
    finalRank: '4위',
    games: 144,
    wins: 72,
    draws: 14,
    losses: 58,
    winRate: 0.554,
    finalTone: 'rank34',
  },
  {
    year: 2020,
    regularSeason: '4위',
    finalRank: '4위',
    games: 144,
    wins: 79,
    draws: 4,
    losses: 61,
    winRate: 0.564,
    finalTone: 'rank34',
  },
  {
    year: 2019,
    regularSeason: '4위',
    finalRank: '4위',
    games: 144,
    wins: 79,
    draws: 1,
    losses: 64,
    winRate: 0.552,
    finalTone: 'rank34',
  },
  {
    year: 2018,
    regularSeason: '8위',
    finalRank: '8위',
    games: 144,
    wins: 68,
    draws: 1,
    losses: 75,
    winRate: 0.476,
    finalTone: 'default',
  },
  {
    year: 2017,
    regularSeason: '6위',
    finalRank: '6위',
    games: 144,
    wins: 69,
    draws: 3,
    losses: 72,
    winRate: 0.489,
    finalTone: 'default',
  },
  {
    year: 2016,
    regularSeason: '4위',
    finalRank: '4위',
    games: 144,
    wins: 71,
    draws: 2,
    losses: 71,
    winRate: 0.5,
    finalTone: 'rank34',
  },
  {
    year: 2015,
    regularSeason: '9위',
    finalRank: '9위',
    games: 144,
    wins: 64,
    draws: 2,
    losses: 78,
    winRate: 0.451,
    finalTone: 'default',
  },
  {
    year: 2014,
    regularSeason: '4위',
    finalRank: '4위',
    games: 128,
    wins: 62,
    draws: 2,
    losses: 64,
    winRate: 0.492,
    finalTone: 'rank34',
  },
  {
    year: 2013,
    regularSeason: '2위',
    finalRank: '3위',
    games: 128,
    wins: 74,
    draws: 0,
    losses: 54,
    winRate: 0.578,
    finalTone: 'rank34',
  },
  {
    year: 2012,
    regularSeason: '7위',
    finalRank: '7위',
    games: 133,
    wins: 57,
    draws: 4,
    losses: 72,
    winRate: 0.442,
    finalTone: 'default',
  },
  {
    year: 2011,
    regularSeason: '6위',
    finalRank: '6위',
    games: 133,
    wins: 59,
    draws: 2,
    losses: 72,
    winRate: 0.45,
    finalTone: 'default',
  },
  {
    year: 2010,
    regularSeason: '6위',
    finalRank: '6위',
    games: 133,
    wins: 57,
    draws: 5,
    losses: 71,
    winRate: 0.429,
    finalTone: 'default',
  },
  {
    year: 2009,
    regularSeason: '7위',
    finalRank: '7위',
    games: 133,
    wins: 54,
    draws: 4,
    losses: 75,
    winRate: 0.406,
    finalTone: 'default',
  },
  {
    year: 2008,
    regularSeason: '8위',
    finalRank: '8위',
    games: 126,
    wins: 46,
    draws: 0,
    losses: 80,
    winRate: 0.365,
    finalTone: 'default',
  },
  {
    year: 2007,
    regularSeason: '5위',
    finalRank: '5위',
    games: 126,
    wins: 58,
    draws: 6,
    losses: 62,
    winRate: 0.483,
    finalTone: 'default',
  },
  {
    year: 2006,
    regularSeason: '8위',
    finalRank: '8위',
    games: 126,
    wins: 47,
    draws: 4,
    losses: 75,
    winRate: 0.385,
    finalTone: 'default',
  },
  {
    year: 2005,
    regularSeason: '6위',
    finalRank: '6위',
    games: 126,
    wins: 54,
    draws: 1,
    losses: 71,
    winRate: 0.432,
    finalTone: 'default',
  },
  {
    year: 2004,
    regularSeason: '6위',
    finalRank: '6위',
    games: 133,
    wins: 59,
    draws: 4,
    losses: 70,
    winRate: 0.457,
    finalTone: 'default',
  },
  {
    year: 2003,
    regularSeason: '6위',
    finalRank: '6위',
    games: 133,
    wins: 60,
    draws: 2,
    losses: 71,
    winRate: 0.458,
    finalTone: 'default',
  },
  {
    year: 2002,
    regularSeason: '4위',
    finalRank: '준우승',
    games: 133,
    wins: 66,
    draws: 6,
    losses: 61,
    winRate: 0.52,
    finalTone: 'runnerUp',
  },
  {
    year: 2001,
    regularSeason: '6위',
    finalRank: '6위',
    games: 133,
    wins: 58,
    draws: 8,
    losses: 67,
    winRate: 0.464,
    finalTone: 'default',
  },
  {
    year: 2000,
    regularSeason: '매직 1위',
    finalRank: '매직 1위',
    games: 133,
    wins: 67,
    draws: 3,
    losses: 63,
    winRate: 0.515,
    finalTone: 'default',
  },
  {
    year: 1999,
    regularSeason: '매직 3위',
    finalRank: '매직 3위',
    games: 132,
    wins: 61,
    draws: 1,
    losses: 70,
    winRate: 0.466,
    finalTone: 'rank34',
  },
  {
    year: 1998,
    regularSeason: '3위',
    finalRank: '준우승',
    games: 126,
    wins: 63,
    draws: 1,
    losses: 62,
    winRate: 0.504,
    finalTone: 'runnerUp',
  },
  {
    year: 1997,
    regularSeason: '2위',
    finalRank: '준우승',
    games: 126,
    wins: 73,
    draws: 2,
    losses: 51,
    winRate: 0.587,
    finalTone: 'runnerUp',
  },
  {
    year: 1996,
    regularSeason: '7위',
    finalRank: '7위',
    games: 126,
    wins: 50,
    draws: 5,
    losses: 71,
    winRate: 0.417,
    finalTone: 'default',
  },
  {
    year: 1995,
    regularSeason: '2위',
    finalRank: '3위',
    games: 126,
    wins: 74,
    draws: 4,
    losses: 48,
    winRate: 0.603,
    finalTone: 'rank34',
  },
  {
    year: 1994,
    regularSeason: '1위',
    finalRank: '우승',
    games: 126,
    wins: 81,
    draws: 0,
    losses: 45,
    winRate: 0.643,
    finalTone: 'champion',
    /* 1994 우승 영상 — https://www.youtube.com/watch?v=_S_UQyAZtHE */
    championYoutubeId: '_S_UQyAZtHE',
  },
  {
    year: 1993,
    regularSeason: '4위',
    finalRank: '4위',
    games: 126,
    wins: 66,
    draws: 3,
    losses: 57,
    winRate: 0.536,
    finalTone: 'rank34',
  },
  {
    year: 1992,
    regularSeason: '7위',
    finalRank: '7위',
    games: 126,
    wins: 53,
    draws: 3,
    losses: 70,
    winRate: 0.433,
    finalTone: 'default',
  },
  {
    year: 1991,
    regularSeason: '6위',
    finalRank: '6위',
    games: 126,
    wins: 53,
    draws: 1,
    losses: 72,
    winRate: 0.425,
    finalTone: 'default',
  },
  {
    year: 1990,
    regularSeason: '1위',
    finalRank: '우승',
    games: 120,
    wins: 71,
    draws: 0,
    losses: 49,
    winRate: 0.592,
    finalTone: 'champion',
    /* 1990 우승 영상 — 팝업 임베드용 ID(https://www.youtube.com/watch?v=PWU9HkyekOA) */
    championYoutubeId: 'PWU9HkyekOA',
  },
]

/* MBC 청룡 시대 — 이미지에는 없으므로 기존 페이지 승·무·패·승률만 유지하고, 경기 수는 공식 집계 생략(표에서는 —) */
const MBC_SEASON_RECORDS = [
  { year: 1989, regularSeason: '6위', finalRank: '6위', games: null, wins: 49, draws: 4, losses: 67, winRate: 0.423, finalTone: 'default', mbc: true },
  { year: 1988, regularSeason: '6위', finalRank: '6위', games: null, wins: 40, draws: 4, losses: 64, winRate: 0.385, finalTone: 'default', mbc: true },
  { year: 1987, regularSeason: '5위', finalRank: '5위', games: null, wins: 50, draws: 7, losses: 51, winRate: 0.495, finalTone: 'default', mbc: true },
  { year: 1986, regularSeason: '3위', finalRank: '3위', games: null, wins: 59, draws: 8, losses: 41, winRate: 0.59, finalTone: 'rank34', mbc: true },
  { year: 1985, regularSeason: '5위', finalRank: '5위', games: null, wins: 44, draws: 1, losses: 65, winRate: 0.404, finalTone: 'default', mbc: true },
  { year: 1984, regularSeason: '4위', finalRank: '4위', games: null, wins: 51, draws: 1, losses: 48, winRate: 0.515, finalTone: 'rank34', mbc: true },
  { year: 1983, regularSeason: '1위', finalRank: '준우승', games: null, wins: 55, draws: 2, losses: 43, winRate: 0.561, finalTone: 'runnerUp', mbc: true },
  { year: 1982, regularSeason: '3위', finalRank: '3위', games: null, wins: 46, draws: 0, losses: 34, winRate: 0.575, finalTone: 'rank34', mbc: true },
]

const YEARLY_TABLE_ROWS = [...LG_TWINS_SEASON_RECORDS, ...MBC_SEASON_RECORDS]

function formatWinRate(rate) {
  return rate.toFixed(3)
}

/**
 * championYoutubeId 가 있는 행 전용 — 모달 제목·iframe 제목을 우승 행(우승 영상)과 그 외(영상)으로 나눕니다
 */
function championVideoModalPayload(r) {
  return {
    year: r.year,
    videoId: r.championYoutubeId,
    titleSuffix: r.finalTone === 'champion' ? '우승 영상' : '영상',
  }
}

/* 영구결번 카드: 패널 상단 안내로 등번호 클릭 시 영상 안내 — 통산 모달은 제거된 상태이며, 영상은 추후 등번호·카드에 연결 가능 */
const RETIRED_NUMBERS = [
  {
    number: '33',
    name: '박용택',
    pos: '외야수',
    period: '2002–2020',
    note: '박용택은 KBO 리그 역사상 최다인 통산 2,504안타를 기록한 꾸준함의 대명사입니다. 2002년부터 2020년까지 LG 트윈스에서만 뛴 원클럽맨입니다.',
    /* 사용자 제공 KBO 통산기록(타자) 이미지 수치 — note 아래 동일 스타일 요약 표로 노출 */
    kboCareerBattingSummary: {
      sectionTitle: 'KBO 통산기록',
      gamesPlayed: 2237,
      plateAppearances: 9138,
      battingAverage: '0.308',
      hits: 2504,
      homeRuns: 213,
    },
  },
  {
    number: '9',
    name: '이병규',
    pos: '외야수 · 지명타자',
    period: '1997–2016',
    note: "'적토마'이자, 압도적인 타격 능력으로 등번호 9번이 영구결번된 전설적인 프랜차이즈 스타입니다.",
    /* 사용자 제공 KBO 통산기록(타자) 이미지 수치 — 김용수 카드와 동일한 블록·표 스타일로 노출 */
    kboCareerBattingSummary: {
      sectionTitle: 'KBO 통산기록',
      gamesPlayed: 1741,
      plateAppearances: 7247,
      battingAverage: '0.311',
      hits: 2043,
      homeRuns: 161,
    },
  },
  {
    number: '41',
    name: '김용수',
    pos: '투수',
    period: '1988–2003',
    /* 작은따옴표로만 문자열을 감싸면 안의「'노송'」이 문자열을 중간에 끊어 문법 오류가 나므로, 바깥은 큰따옴표로 처리했습니다 */
    note: "'노송' 김용수는 한국프로야구(KBO) 리그 통산 126승 및 227세이브를 기록한 전설적인 투수입니다. KBO 리그 최초로 100승-200세이브 클럽을 달성하였습니다.",
    /* 사용자 제공 KBO 통산기록 표 이미지와 동일한 수치 — 카드 하단에 7열 요약 표로만 노출합니다 */
    kboCareerPitchingSummary: {
      sectionTitle: 'KBO 통산기록',
      gamesPlayed: 613,
      inningsPitchedDisplay: '1831⅓',
      wins: 126,
      losses: 89,
      saves: 227,
      era: '2.98',
      strikeouts: 1146,
    },
  },
]

const TABS = [
  { id: 'history',   label: 'History' },
  { id: 'records',   label: '연도별 성적' },
  { id: 'goldglove', label: '골든글러브' },
  { id: 'retired',   label: '영구결번' },
]

export function TeamPage() {
  const [activeTab, setActiveTab] = useState('history')
  /* championYoutubeId 가 있는 행만 열림 — ESC·배경 클릭으로 닫음. 행 전체 클릭(우승·비우승 모두 동일) */
  const [championVideoModal, setChampionVideoModal] = useState(null)
  const [photoModal, setPhotoModal] = useState(null)

  useEffect(() => {
    if (!championVideoModal && !photoModal) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setChampionVideoModal(null)
        setPhotoModal(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [championVideoModal, photoModal])

  return (
    <article className="teamPage">
      <header className="boardHeader">
        <p lang="en" className="boardEyebrow">team</p>
        <h1 className="boardTitle">Team</h1>
        <p className="boardDescription">
          LG 트윈스 팀 정보를 확인할 수 있는 공간입니다.
        </p>
      </header>

      <div className="teamTabs">
        <div className="teamTabList" role="tablist" aria-label="팀 정보">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              className={['teamTabBtn', activeTab === tab.id ? 'teamTabBtnActive' : ''].filter(Boolean).join(' ')}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* HISTORY */}
        <div
          id="panel-history"
          role="tabpanel"
          aria-labelledby="tab-history"
          hidden={activeTab !== 'history'}
          className="teamTabPanel"
        >
          <ol className="teamTimeline">
            {HISTORY.map((item) => (
              <li key={item.year} className="teamTimelineItem">
                <span className="teamTimelineYear">{item.year}</span>
                <div className="teamTimelineBody">
                  <strong className="teamTimelineTitle">{item.title}</strong>
                  <p className="teamTimelineDesc">{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* 연도별 성적 — 사용자 제공 표(1990~2025) 열 구성: 정규순위 / 최종 / 경기 / 승·무·패 / 승률 */}
        <div
          id="panel-records"
          role="tabpanel"
          aria-labelledby="tab-records"
          hidden={activeTab !== 'records'}
          className="teamTabPanel"
        ><p className="teamTabNote">
        우승 연도 클릭시 우승 당시 영상을 볼 수 있습니다.
       </p>
          <div className="teamRecordTableWrap">
            <table className="teamRecordTable">
              <thead>
                <tr>
                  <th className="teamRecordTh teamRecordThYear" scope="col">
                    연도
                  </th>
                  <th className="teamRecordTh" scope="col">
                    정규시즌
                  </th>
                  <th className="teamRecordTh" scope="col">
                    최종순위
                  </th>
                  <th className="teamRecordTh teamRecordThNum" scope="col">
                    경기
                  </th>
                  <th className="teamRecordTh teamRecordThNum" scope="col">
                    승
                  </th>
                  <th className="teamRecordTh teamRecordThNum" scope="col">
                    무
                  </th>
                  <th className="teamRecordTh teamRecordThNum" scope="col">
                    패
                  </th>
                  <th className="teamRecordTh teamRecordThNum" scope="col">
                    승률
                  </th>
                </tr>
              </thead>
              <tbody>
                {YEARLY_TABLE_ROWS.map((r, i) => {
                  const prev = YEARLY_TABLE_ROWS[i - 1]
                  const prevMbc = prev ? prev.mbc : false
                  const showDivider = Boolean(r.mbc) && !prevMbc
                  return (
                    <Fragment key={r.year}>
                      {showDivider ? (
                        <tr className="teamRecordDividerRow">
                          <td colSpan={8} className="teamRecordDividerCell">
                            MBC 청룡 (1982–1989)
                          </td>
                        </tr>
                      ) : null}
                      <tr
                        className={[
                          'teamRecordRow',
                          r.finalTone === 'champion' ? 'teamRecordRowWinner' : '',
                          r.championYoutubeId ? 'teamRecordRowClickable' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        {...(r.championYoutubeId
                          ? {
                              tabIndex: 0,
                              'aria-label': `${r.year}년 ${r.finalTone === 'champion' ? '우승 영상' : '영상'} 열기`,
                              onClick: () => setChampionVideoModal(championVideoModalPayload(r)),
                              onKeyDown: (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  setChampionVideoModal(championVideoModalPayload(r))
                                }
                              },
                            }
                          : {})}
                      >
                        <td
                          className={['teamRecordTd', 'teamRecordYear', r.mbc ? 'teamRecordYearMbc' : '']
                            .filter(Boolean)
                            .join(' ')}
                        >
                          {r.year}
                        </td>
                        <td className="teamRecordTd teamRecordRegular">{r.regularSeason}</td>
                        <td className="teamRecordTd teamRecordFinalCell">
                          {r.finalTone === 'champion' ? (
                            <span className="teamRecordStar" aria-hidden="true">
                              ★
                            </span>
                          ) : null}
                          {r.finalRank}
                        </td>
                        <td className="teamRecordTd teamRecordNum">
                          {r.games != null ? r.games : '—'}
                        </td>
                        <td className="teamRecordTd teamRecordNum">{r.wins}</td>
                        <td className="teamRecordTd teamRecordNum">{r.draws}</td>
                        <td className="teamRecordTd teamRecordNum">{r.losses}</td>
                        <td className="teamRecordTd teamRecordNum">{formatWinRate(r.winRate)}</td>
                      </tr>
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
          
        </div>

        {/* 골든글러브 */}
        <div
          id="panel-goldglove"
          role="tabpanel"
          aria-labelledby="tab-goldglove"
          hidden={activeTab !== 'goldglove'}
          className="teamTabPanel"
        >
          <div className="teamGGEraLabel">LG 트윈스 (1990–)</div>
          <ol className="teamGGList">
            {GOLDEN_GLOVE.map((p) => (
              <li
                key={p.name}
                className={['teamGGItem', p.photo ? 'teamGGItemClickable' : ''].filter(Boolean).join(' ')}
                {...(p.photo
                  ? {
                      role: 'button',
                      tabIndex: 0,
                      'aria-label': `${p.name} 사진 보기`,
                      /* 타자(stats)·투수(pitcherStats) 중 하나만 넘기면 모달에서 표 종류를 나눕니다 */
                      onClick: () =>
                        setPhotoModal({
                          name: p.name,
                          src: p.photo,
                          stats: p.stats,
                          pitcherStats: p.pitcherStats,
                        }),
                      onKeyDown: (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setPhotoModal({
                            name: p.name,
                            src: p.photo,
                            stats: p.stats,
                            pitcherStats: p.pitcherStats,
                          })
                        }
                      },
                    }
                  : {})}
              >
                <span className="teamGGName">{p.name}</span>
                <span className="teamGGPos">{p.pos}</span>
                <span className="teamGGYearsWrap">
                  <span className="teamGGYears">{p.years}</span>
                  {p.note && <span className="teamGGNote">{p.note}</span>}
                </span>
              </li>
            ))}
          </ol>
          <div className="teamGGEraLabel teamGGEraLabelMbc">MBC 청룡 (1982–1989)</div>
          <ol className="teamGGList">
            {GOLDEN_GLOVE_MBC.map((p) => (
              <li
                key={p.name}
                className={['teamGGItem', 'teamGGItemMbc', p.photo ? 'teamGGItemClickable' : ''].filter(Boolean).join(' ')}
                {...(p.photo
                  ? {
                      role: 'button',
                      tabIndex: 0,
                      'aria-label': `${p.name} 사진 보기`,
                      /* LG 목록과 같은 photoModal 상태를 공유합니다 — 타자(stats)·투수(pitcherStats) 분기 동일 */
                      onClick: () =>
                        setPhotoModal({
                          name: p.name,
                          src: p.photo,
                          stats: p.stats,
                          pitcherStats: p.pitcherStats,
                        }),
                      onKeyDown: (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setPhotoModal({
                            name: p.name,
                            src: p.photo,
                            stats: p.stats,
                            pitcherStats: p.pitcherStats,
                          })
                        }
                      },
                    }
                  : {})}
              >
                <span className="teamGGName">{p.name}</span>
                <span className="teamGGPos">{p.pos}</span>
                <span className="teamGGYearsWrap">
                  <span className="teamGGYears">{p.years}</span>
                  {p.note && <span className="teamGGNote">{p.note}</span>}
                </span>
              </li>
            ))}
          </ol>
          
        </div>

        {/* 영구결번 — 카드별 등번호 클릭으로 선수 영상을 열 계획일 때 사용자 안내 */}
        <div
          id="panel-retired"
          role="tabpanel"
          aria-labelledby="tab-retired"
          hidden={activeTab !== 'retired'}
          className="teamTabPanel"
        >
          <p className="teamTabNote">등번호 클릭 시 선수 영상을 볼 수 있습니다.</p>
          <ul className="teamRetiredGrid">
            {RETIRED_NUMBERS.map((p) => (
              <li
                key={p.number}
                className="teamRetiredCard"
              >
                <span className="teamRetiredNumber" aria-label={`${p.number}번`}>
                  {p.number}
                </span>
                <div className="teamRetiredInfo">
                  <strong className="teamRetiredName">{p.name}</strong>
                  <span className="teamRetiredPos">{p.pos}</span>
                  <span className="teamRetiredPeriod">{p.period}</span>
                  {p.note && <span className="teamRetiredNote">{p.note}</span>}
                </div>
                {p.kboCareerPitchingSummary ? (
                  <div className="teamRetiredKboSummary">
                    {/* 이미지 레이아웃: 제목은 표 위 왼쪽, 셀은 가운데 정렬·테두리로 구분 */}
                    <h3 className="teamRetiredKboSummaryTitle">
                      {p.kboCareerPitchingSummary.sectionTitle}
                    </h3>
                    <table className="teamRetiredKboSummaryTable">
                      <thead>
                        <tr>
                          <th scope="col">경기</th>
                          <th scope="col">이닝</th>
                          <th scope="col">승</th>
                          <th scope="col">패</th>
                          <th scope="col">세이브</th>
                          <th scope="col">ERA</th>
                          <th scope="col">삼진</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="teamRetiredKboSummaryStrong">{p.kboCareerPitchingSummary.gamesPlayed}</td>
                          <td>{p.kboCareerPitchingSummary.inningsPitchedDisplay}</td>
                          <td>{p.kboCareerPitchingSummary.wins}</td>
                          <td>{p.kboCareerPitchingSummary.losses}</td>
                          <td>{p.kboCareerPitchingSummary.saves}</td>
                          <td>{p.kboCareerPitchingSummary.era}</td>
                          <td>{p.kboCareerPitchingSummary.strikeouts}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : null}
                {p.kboCareerBattingSummary ? (
                  <div className="teamRetiredKboSummary">
                    <h3 className="teamRetiredKboSummaryTitle">
                      {p.kboCareerBattingSummary.sectionTitle}
                    </h3>
                    <table className="teamRetiredKboSummaryTable">
                      <thead>
                        <tr>
                          <th scope="col">경기</th>
                          <th scope="col">타석</th>
                          <th scope="col">타율</th>
                          <th scope="col">안타</th>
                          <th scope="col">홈런</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {/* 레퍼런스 이미지: 수치 행 전체를 굵게 표시 */}
                          <td className="teamRetiredKboSummaryStrong">{p.kboCareerBattingSummary.gamesPlayed}</td>
                          <td className="teamRetiredKboSummaryStrong">{p.kboCareerBattingSummary.plateAppearances}</td>
                          <td className="teamRetiredKboSummaryStrong">{p.kboCareerBattingSummary.battingAverage}</td>
                          <td className="teamRetiredKboSummaryStrong">{p.kboCareerBattingSummary.hits}</td>
                          <td className="teamRetiredKboSummaryStrong">{p.kboCareerBattingSummary.homeRuns}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        
        </div>
      </div>

      {/* championYoutubeId 가 있는 행에서만 열림 — YouTube iframe 임베드(외부 도메인) */}
      {championVideoModal ? (
        <div
          className="teamChampionModalBackdrop"
          role="presentation"
          onClick={() => setChampionVideoModal(null)}
        >
          <div
            className="teamChampionModalDialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="teamChampionModalTitle"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="teamChampionModalHeader">
              <h2 id="teamChampionModalTitle" className="teamChampionModalTitle">
                {championVideoModal.year}년 {championVideoModal.titleSuffix}
              </h2>
              <button
                type="button"
                className="teamChampionModalClose"
                aria-label="영상 닫기"
                onClick={() => setChampionVideoModal(null)}
              >
                닫기
              </button>
            </div>
            <div className="teamChampionModalEmbedWrap">
              {/* YouTube iframe 쿼리: autoplay=1 만 사용해 소리 포함 자동재생을 시도합니다.
                  연도 행 클릭이 곧바로 이 iframe 로드로 이어지므로(사용자 제스처 직후) 크롬 등에서도 소리 있는 자동재생이 허용되는 경우가 많습니다.
                  다만 브라우저·OS·YouTube 정책에 따라 차단되면 재생이 멈추거나 음소거로 시작할 수 있으며, 그때는 플레이어에서 재생/음소거를 한 번 조작하면 됩니다.
                  playsinline=1 은 모바일(iOS 등)에서 전체화면 강제 전환 없이 인라인 재생을 돕기 위한 옵션입니다. */}
              <iframe
                className="teamChampionModalIframe"
                title={`${championVideoModal.year}년 ${championVideoModal.titleSuffix}`}
                src={`https://www.youtube.com/embed/${championVideoModal.videoId}?autoplay=1&playsinline=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      ) : null}

      {photoModal ? (
        <div
          className="teamPhotoModalBackdrop"
          role="presentation"
          onClick={() => setPhotoModal(null)}
        >
          <div
            className="teamPhotoModalDialog"
            role="dialog"
            aria-modal="true"
            aria-label={
              photoModal.src
                ? `${photoModal.name} 사진`
                : `${photoModal.name} 기록`
            }
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="teamPhotoModalClose"
              aria-label={photoModal.src ? '사진 닫기' : '닫기'}
              onClick={() => setPhotoModal(null)}
            >
              닫기
            </button>
            {photoModal.src
              ? (
                  <img
                    className="teamPhotoModalImg"
                    src={photoModal.src}
                    alt={photoModal.name}
                  />
                )
              : null}
            {photoModal.pitcherStats
              ? (() => {
                  /* 선수·연도마다 기록 항목이 다릅니다(선발형 완투·완봉 vs 마무리 세이브). 값이 있는 행이 하나라도 있으면 해당 열만 표시합니다 */
                  const pitcherRows = photoModal.pitcherStats
                  const pitcherShowSaves = pitcherRows.some((row) => row.saves != null)
                  const pitcherShowCompleteGames = pitcherRows.some((row) => row.completeGames != null)
                  const pitcherShowShutouts = pitcherRows.some((row) => row.shutouts != null)
                  return (
                    <div className="teamPhotoModalStatsScroll">
                      <table className="teamPhotoModalStats teamPhotoModalStatsPitcher">
                        <thead>
                          <tr>
                            <th>연도</th>
                            <th>경기</th>
                            <th>승</th>
                            <th>패</th>
                            {pitcherShowSaves ? <th>세이브</th> : null}
                            <th>평균자책점</th>
                            <th>이닝</th>
                            <th>탈삼진</th>
                            {pitcherShowCompleteGames ? <th>완투</th> : null}
                            {pitcherShowShutouts ? <th>완봉</th> : null}
                          </tr>
                        </thead>
                        <tbody>
                          {pitcherRows.map((row) => (
                            <tr key={row.year}>
                              <td>{row.year}</td>
                              <td>{row.games}</td>
                              <td>{`${row.wins}승`}</td>
                              <td>{`${row.losses}패`}</td>
                              {pitcherShowSaves ? <td>{row.saves != null ? row.saves : '—'}</td> : null}
                              <td>{row.era}</td>
                              <td>{row.inningsDisplay}</td>
                              <td>{row.strikeouts}</td>
                              {pitcherShowCompleteGames ? (
                                <td>{row.completeGames != null ? `${row.completeGames}완투` : '—'}</td>
                              ) : null}
                              {pitcherShowShutouts ? (
                                <td>{row.shutouts != null ? `${row.shutouts}완봉` : '—'}</td>
                              ) : null}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                })()
              : null}
            {!photoModal.pitcherStats && photoModal.stats
              ? (() => {
                  /* 도루(sb)·안타(hits) 열은 해당 값이 한 행이라도 있을 때만 표시 — 선수별로 열 개수가 달라집니다 */
                  const statsShowSb = photoModal.stats.some((s) => s.sb != null)
                  const statsShowHits = photoModal.stats.some((s) => s.hits != null)
                  return (
                    <table className="teamPhotoModalStats">
                      <thead>
                        <tr>
                          <th>연도</th>
                          <th>경기</th>
                          <th>홈런</th>
                          {statsShowSb ? <th>도루</th> : null}
                          {statsShowHits ? <th>안타</th> : null}
                          <th>타점</th>
                          <th>타율</th>
                        </tr>
                      </thead>
                      <tbody>
                        {photoModal.stats.map((s) => (
                          <tr key={s.year}>
                            <td>{s.year}</td>
                            <td>{s.games}</td>
                            <td>{s.hr}</td>
                            {statsShowSb ? <td>{s.sb != null ? s.sb : '—'}</td> : null}
                            {statsShowHits ? <td>{s.hits != null ? s.hits : '—'}</td> : null}
                            <td>{s.rbi}</td>
                            <td>{s.avg}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )
                })()
              : null}
          </div>
        </div>
      ) : null}
    </article>
  )
}
