import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from './store/store'
import {
  setFullscreen,
  setStarted,
  setTimerDone,
  resetTimer,
  nextRound,
  setShowTrackingPrompt,
  setSensitivityRatio,
  setLastRoundStats,
} from './store/sessionSlice'
import StartPrompt from './StartPrompt'
import ResetButton from './ResetButton'
import Timer from './Timer'
import CalibrationRound from './CalibrationRound'
import TrackingRound from './TrackingRound'
import type { RoundStats } from './TrackingRound'
import TrackingPrompt from './TrackingPrompt'
import SensitivityDisplay from './SensitivityDisplay'

function App() {
  const dispatch = useDispatch()
  const isFullscreen = useSelector((state: RootState) => state.session.isFullscreen)
  const started = useSelector((state: RootState) => state.session.started)
  const timerDone = useSelector((state: RootState) => state.session.timerDone)
  const round = useSelector((state: RootState) => state.session.round)
  const showTrackingPrompt = useSelector((state: RootState) => state.session.showTrackingPrompt)

  const [pos, setPos] = useState({ x: 0, y: 0 })

  const trackingSpeed = 300

  useEffect(() => {
    const onFullscreenChange = () => dispatch(setFullscreen(!!document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [dispatch])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setPos({
      x: parseFloat(((e.clientX / window.innerWidth) * 2 - 1).toFixed(4)),
      y: parseFloat((1 - (e.clientY / window.innerHeight) * 2).toFixed(4)),
    })
  }

  const handleCalibrationComplete = (ratio: number) => {
    dispatch(setSensitivityRatio(ratio))
    dispatch(setShowTrackingPrompt(true))
  }

  const handleTrackingRoundComplete = (stats: RoundStats) => {
    dispatch(setLastRoundStats(stats))
    if (round === 11) {
      dispatch(resetTimer())
    } else {
      dispatch(nextRound())
      dispatch(resetTimer())
    }
  }

  const handleTrackingPlay = () => {
    dispatch(setShowTrackingPrompt(false))
    dispatch(nextRound())
    dispatch(resetTimer())
  }

  if (!isFullscreen) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontFamily: 'monospace',
          gap: '1.5rem',
        }}
      >
        <p style={{ fontSize: '1.25rem', margin: 0 }}>
          Please switch to fullscreen to continue
        </p>
        <button
          onClick={() => document.documentElement.requestFullscreen()}
          style={{
            padding: '0.6rem 1.4rem',
            fontSize: '1rem',
            fontFamily: 'monospace',
            background: '#fff',
            color: '#000',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Go fullscreen
        </button>
      </div>
    )
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontFamily: 'monospace',
        fontSize: '2rem',
        userSelect: 'none',
      }}
    >
      {started && <ResetButton />}
      {round > 1 && <SensitivityDisplay />}
      {!started && <StartPrompt onPlay={() => dispatch(setStarted(true))} />}
      {started && !timerDone && <Timer onComplete={() => dispatch(setTimerDone())} />}
      {showTrackingPrompt && <TrackingPrompt onPlay={handleTrackingPlay} />}
      {timerDone && round > 1
        ? <>x: {pos.x} &nbsp; y: {pos.y}</>
        : <span style={{ fontSize: '4rem', letterSpacing: '0.1em', opacity: 0.15 }}>Sensi Finder</span>
      }
      {timerDone && !showTrackingPrompt && round === 1 && (
        <CalibrationRound onComplete={handleCalibrationComplete} />
      )}
      {timerDone && !showTrackingPrompt && round > 1 && (
        <TrackingRound
          key={round}
          displayRound={round - 1}
          speed={trackingSpeed}
          onComplete={handleTrackingRoundComplete}
        />
      )}
    </div>
  )
}

export default App
