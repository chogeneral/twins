import logoLgBrand from '../assets/lglogo.png'
import './homePage.css'

export function HomePage() {
  return (
    <article className="homePage" aria-labelledby="homeHeroTitle">
      <section className="homeHero">
        <figure className="homeHeroFigure">
          <img
            className="homeHeroImg"
            src={logoLgBrand}
            width={200}
            alt="LG 브랜드 로고"
            decoding="async"
          />
        </figure>
        <div className="homeHeroContent">
          <p className="homeKicker">
            <span className="homeKickerAccent">WELCOME</span> · 유광 잠바
          </p>
          <h1 id="homeHeroTitle" className="homeTitle">
            우리의 심장은 늘 잠실에서 뛴다
          </h1>
          <p className="homeLead">
            승리의 기쁨도, 아쉬운 패배도 우리는 언제나 같은 자리에서 트윈스를 응원합니다.
          </p>
        </div>
      </section>
    </article>
  )
}
