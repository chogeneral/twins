import { useState } from 'react'
import { TEAM_SONGS, PLAYER_SONGS, LEGEND_SONGS } from '../data/cheerSongs'
import './cheerSongList.css'

function SongRow({ name, pos, tag, youtubeUrl, isTeam }) {
  return (
    <li className="csRow">
      <a
        className={['csLink', isTeam ? 'csLinkTeam' : ''].filter(Boolean).join(' ')}
        href={youtubeUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${name} 응원가 YouTube에서 보기`}
      >
        <span className="csRowLeft">
          <span className="csName">{name}</span>
          {pos && pos !== 'P' && <span className="csPos">{pos}</span>}
        </span>
        <span className="csRowRight">
          <span className="csTag">{tag}</span>
          <svg className="csYtIcon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z" fill="currentColor" />
          </svg>
        </span>
      </a>
    </li>
  )
}

function Section({ id, label, children }) {
  const [open, setOpen] = useState(false)

  return (
    <section className="csSection" aria-labelledby={id}>
      <button
        type="button"
        className="csSectionHeader"
        aria-expanded={open}
        aria-controls={`${id}-body`}
        onClick={() => setOpen((v) => !v)}
      >
        <h2 className="csSectionLabel" id={id}>{label}</h2>
        <div className="csSectionLine" aria-hidden="true" />
        <span className={['csSectionToggle', open ? 'csSectionToggleOpen' : ''].filter(Boolean).join(' ')} aria-hidden="true">
          ﹀
        </span>
      </button>

      <div
        id={`${id}-body`}
        className={['csSectionBody', open ? 'csSectionBodyOpen' : ''].filter(Boolean).join(' ')}
        aria-hidden={!open}
      >
        <ul className="csList">{children}</ul>
      </div>
    </section>
  )
}

export function CheerSongList() {
  const hitters = PLAYER_SONGS.filter((s) => s.tag === '타자')

  return (
    <div className="cheerSongList">
      <Section id="cs-team" label="TEAM CHEER">
        {TEAM_SONGS.map((s) => (
          <SongRow key={s.title} {...s} name={s.title} isTeam />
        ))}
      </Section>

      <Section id="cs-hitters" label="PLAYER">
        {hitters.map((s) => <SongRow key={s.name} {...s} />)}
      </Section>

      <Section id="cs-legends" label="LEGENDS">
        {LEGEND_SONGS.map((s) => <SongRow key={s.name} {...s} />)}
      </Section>
    </div>
  )
}
