import { CheerSongList } from '../components/CheerSongList'
import './boardPage.css'
import './teamSongPage.css'

export function TeamSongPage() {
  return (
    <article className="teamSongPage">
      <header className="boardHeader">
        <p lang="en" className="boardEyebrow">
          cheer song
        </p>
        <h1 className="boardTitle">응원가</h1>
        <p className="boardDescription">
          LG 트윈스 team, 선수별, 레전드 선수 응원가 목록입니다.
        </p>
      </header>

      <CheerSongList />
    </article>
  )
}
