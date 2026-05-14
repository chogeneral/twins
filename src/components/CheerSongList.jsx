import { useState, useEffect, useRef } from 'react'
import { TEAM_SONGS, PLAYER_SONGS, LEGEND_SONGS } from '../data/cheerSongs'
import './cheerSongList.css'

function getVideoId(url) {
  const m = url.match(/[?&]v=([^&]+)/)
  return m ? m[1] : null
}

function fmt(sec) {
  const s = Math.max(0, Math.floor(sec))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function loadYtApi() {
  if (document.querySelector('script[src*="youtube.com/iframe_api"]')) return
  const tag = document.createElement('script')
  tag.src = 'https://www.youtube.com/iframe_api'
  document.head.appendChild(tag)
}

function AudioBar({ song, onClose }) {
  const videoId = getVideoId(song.youtubeUrl)
  const containerRef = useRef(null)
  const playerRef = useRef(null)
  const intervalRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  useEffect(() => {
    if (!videoId) return
    let alive = true

    const startPolling = (player) => {
      clearInterval(intervalRef.current)
      intervalRef.current = setInterval(() => {
        if (!alive) return
        const ct = player.getCurrentTime?.() ?? 0
        const dur = player.getDuration?.() ?? 0
        setCurrent(ct)
        setDuration(dur)
      }, 500)
    }

    const createPlayer = () => {
      if (!containerRef.current || !alive) return
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: { autoplay: 1, controls: 0, rel: 0, modestbranding: 1 },
        events: {
          onReady: (e) => { if (alive) startPolling(e.target) },
          onStateChange: (e) => {
            if (alive && e.data === window.YT.PlayerState.ENDED) onCloseRef.current()
          },
        },
      })
    }

    if (window.YT?.Player) {
      createPlayer()
    } else {
      loadYtApi()
      const prev = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => { prev?.(); createPlayer() }
    }

    return () => {
      alive = false
      clearInterval(intervalRef.current)
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [videoId])

  const progress = duration > 0 ? (current / duration) * 100 : 0

  return (
    <div className="csAudioBar" role="region" aria-label="응원가 재생 중">
      <div ref={containerRef} className="csAudioIframe" />
      <div className="csAudioLeft">
        <svg className="csAudioPlayIcon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M8 5v14l11-7z" fill="currentColor" />
        </svg>
        <span className="csAudioTitle">{song.name}</span>
      </div>
      <div className="csAudioCenter">
        <div
          className="csAudioProgressWrap"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="재생 진행"
        >
          <div className="csAudioProgressBar" style={{ width: `${progress}%` }} />
        </div>
        <span className="csAudioTime">{fmt(current)} / {fmt(duration)}</span>
      </div>
      <button type="button" className="csAudioClose" onClick={onClose} aria-label="재생 정지">
        정지
      </button>
    </div>
  )
}

function SongRow({ name, pos, tag, youtubeUrl, isTeam, isPlaying, onPlay, onStop }) {
  return (
    <li className="csRow">
      <button
        type="button"
        className={['csLink', isTeam ? 'csLinkTeam' : '', isPlaying ? 'csLinkPlaying' : ''].filter(Boolean).join(' ')}
        onClick={() => isPlaying ? onStop() : onPlay({ name, youtubeUrl })}
        aria-label={isPlaying ? `${name} 응원가 정지` : `${name} 응원가 재생`}
        aria-pressed={isPlaying}
      >
        <span className="csRowLeft">
          <span className="csName">{name}</span>
          {pos && pos !== 'P' && <span className="csPos">{pos}</span>}
        </span>
        <span className="csRowRight">
          <span className="csTag">{tag}</span>
          <svg className="csYtIcon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            {isPlaying
              ? <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor" />
              : <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z" fill="currentColor" />
            }
          </svg>
        </span>
      </button>
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
  const [playing, setPlaying] = useState(null)
  const hitters = PLAYER_SONGS.filter((s) => s.tag === '타자')

  return (
    <>
      <div className="cheerSongList">
        <Section id="cs-team" label="TEAM CHEER">
          {TEAM_SONGS.map((s) => (
            <SongRow key={s.title} {...s} name={s.title} isTeam
              isPlaying={playing?.youtubeUrl === s.youtubeUrl}
              onPlay={setPlaying} onStop={() => setPlaying(null)} />
          ))}
        </Section>

        <Section id="cs-hitters" label="PLAYER">
          {hitters.map((s) => (
            <SongRow key={s.name} {...s}
              isPlaying={playing?.youtubeUrl === s.youtubeUrl}
              onPlay={setPlaying} onStop={() => setPlaying(null)} />
          ))}
        </Section>

        <Section id="cs-legends" label="LEGENDS">
          {LEGEND_SONGS.map((s) => (
            <SongRow key={s.name} {...s}
              isPlaying={playing?.youtubeUrl === s.youtubeUrl}
              onPlay={setPlaying} onStop={() => setPlaying(null)} />
          ))}
        </Section>
      </div>

      {playing && <AudioBar song={playing} onClose={() => setPlaying(null)} />}
    </>
  )
}
