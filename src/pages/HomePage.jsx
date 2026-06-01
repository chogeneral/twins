import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import mainVisualImage from '../assets/main_visul.jpg'
import { fetchBoardPosts, getBoardPosts } from '../lib/boardPostStorage'
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
   * 게시글 저장 유틸은 최신 글을 배열 앞쪽에 넣습니다.
   * 메인에서는 각 게시판 첫 화면만 빠르게 훑을 수 있게 상위 5개만 잘라 보여줍니다.
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

  useEffect(() => {
    let ignore = false

    async function loadLatestPosts() {
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
