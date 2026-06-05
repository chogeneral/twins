import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import mainVisualImage from '../assets/main_visul.jpg'
import { fetchBoardPosts, getBoardPosts, isSharedBoardKey } from '../lib/boardPostStorage'
import './homePage.css'

const latestBoardSections = [
  {
    boardKey: 'freeBoard',
    title: '무적LG마당',
    path: '/free-board',
  },
  {
    boardKey: 'reviewBoard',
    title: '승요인증',
    path: '/reviews',
  },
  {
    boardKey: 'stadiumTourBoard',
    title: '구장투어',
    path: '/stadium-tour',
  },
  {
    boardKey: 'twinsNewsBoard',
    title: 'twins뉴스',
    path: '/twins-news',
  },
]

function getLatestBoardPosts(boardKey) {
  /*
   * 메인 페이지가 켜지자마자 0초 만에 목록이 바로 뜨도록 하기 위해,
   * 공유 게시판 여부와 관계없이 로컬 스토리지에 캐싱되어 있는 최신 게시글 5개를 즉시 반환합니다.
   */
  return getBoardPosts(boardKey).slice(0, 5)
}

function getInitialLatestPosts() {
  return Object.fromEntries(
    latestBoardSections.map((section) => [
      section.boardKey,
      getLatestBoardPosts(section.boardKey),
    ]),
  )
}

export function HomePage() {
  const [latestPostsByBoard, setLatestPostsByBoard] = useState(getInitialLatestPosts)

  /*
   * 캐시된 데이터가 이미 있는 경우에는 화면이 바로 준비되므로 로딩 상태를 false로 시작합니다.
   * 캐시 데이터조차 전혀 없는 첫 접속 시에만 true로 설정합니다.
   */
  const [loading, setLoading] = useState(() => {
    const initialPosts = getInitialLatestPosts()
    const hasAnyCache = Object.values(initialPosts).some((posts) => posts && posts.length > 0)
    return !hasAnyCache
  })

  useEffect(() => {
    let ignore = false

    async function loadLatestPosts() {
      // 캐시가 전혀 없을 때만 로딩 문구를 노출하며 백그라운드 패치를 진행합니다.
      const initialPosts = getInitialLatestPosts()
      const hasAnyCache = Object.values(initialPosts).some((posts) => posts && posts.length > 0)
      setLoading(!hasAnyCache)

      const entries = await Promise.all(
        latestBoardSections.map(async (section) => {
          try {
            const rows = await fetchBoardPosts(section.boardKey)
            return [section.boardKey, rows.slice(0, 5)]
          }
          catch {
            return [section.boardKey, getLatestBoardPosts(section.boardKey)]
          }
        }),
      )

      if (!ignore) {
        setLatestPostsByBoard(Object.fromEntries(entries))
        setLoading(false)
      }
    }

    loadLatestPosts()

    return () => {
      ignore = true
    }
  }, [])

  return (
    <article className="homePage" aria-labelledby="homeHeroTitle">
      <section className="homeHero">
        <figure className="homeHeroFigure">
          <img
            className="homeHeroImg"
            src={mainVisualImage}
            alt="LG 트윈스 메인 비주얼"
            decoding="async"
            fetchPriority="high"
          />
        </figure>
        <div className="homeHeroContent">
          
          <h1 id="homeHeroTitle" className="homeTitle">
            우리의 심장은 늘 잠실에서 뛴다
          </h1>
          <p className="homeLead">
            승리의 기쁨도, 아쉬운 패배도 우리는 언제나 같은 자리에서 트윈스를 응원합니다.
          </p>
        </div>
      </section>

      <section className="homeLatestBoards" aria-labelledby="homeLatestBoardsTitle">
        <h2 id="homeLatestBoardsTitle" className="srOnly">
          게시판별 최신글
        </h2>

        <div className="homeLatestBoardGrid">
          {latestBoardSections.map((section) => {
            const latestPosts = latestPostsByBoard[section.boardKey] ?? []

            return (
              <section key={section.boardKey} className="homeLatestBoardCard" aria-labelledby={`${section.boardKey}Title`}>
                <div className="homeLatestBoardCardHeader">
                  <h3 id={`${section.boardKey}Title`} className="homeLatestBoardCardTitle">
                    {section.title}
                  </h3>
                  <Link className="homeLatestBoardMoreLink" to={section.path} aria-label={`${section.title} 더보기`}>
                    +
                  </Link>
                </div>

                {latestPosts.length > 0 ? (
                  <ul className="homeLatestPostList">
                    {latestPosts.map((post) => (
                      <li key={post.id} className="homeLatestPostItem">
                        <Link className="homeLatestPostLink" to={`${section.path}/${post.id}`}>
                          <span className="homeLatestPostTitle">{post.title}</span>
                          <span className="homeLatestPostMeta">
                            <span className="homeLatestPostAuthor">{post.author || 'member'}</span>
                            <span className="homeLatestPostDate">{post.date}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : loading ? (
                  /*
                   * 로딩 중에 글이 아직 채워지지 않은 짧은 시간 동안에는
                   * 등록된 글이 없다는 문구 대신 로딩 중이라는 메시지를 노출합니다.
                   */
                  <p className="homeLatestPostEmpty">게시글을 불러오는 중입니다...</p>
                ) : (
                  <p className="homeLatestPostEmpty">아직 등록된 글이 없습니다.</p>
                )}
              </section>
            )
          })}
        </div>
      </section>
    </article>
  )
}
