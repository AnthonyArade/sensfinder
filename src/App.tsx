import { useState, useEffect, useRef } from 'react'
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
  setSensitivityMultiplier,
  BASE_SPEED,
} from './store/sessionSlice'
import { adjustMultiplier } from './speedAdjust'
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
  const isFullscreen         = useSelector((state: RootState) => state.session.isFullscreen)
  const started              = useSelector((state: RootState) => state.session.started)
  const timerDone            = useSelector((state: RootState) => state.session.timerDone)
  const round                = useSelector((state: RootState) => state.session.round)
  const showTrackingPrompt   = useSelector((state: RootState) => state.session.showTrackingPrompt)
  const sensitivityMultiplier = useSelector((state: RootState) => state.session.sensitivityMultiplier)

  // Virtual cursor — pixel position
  const virtualCursorRef  = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  const multiplierRef     = useRef(sensitivityMultiplier)
  const resetButtonRef    = useRef<HTMLButtonElement>(null)
  const [cursorPx, setCursorPx] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  const [pos,      setPos]      = useState({ x: 0, y: 0 })

  const isTracking = timerDone && round > 1 && !showTrackingPrompt

  // Keep multiplier ref in sync with Redux without re-subscribing to mousemove
  useEffect(() => { multiplierRef.current = sensitivityMultiplier }, [sensitivityMultiplier])

  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement && document.pointerLockElement) {
        document.exitPointerLock()
      }
      dispatch(setFullscreen(!!document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [dispatch])

  // If pointer lock is released mid-tracking (user pressed Escape), reset the session
  const isTrackingRef = useRef(false)
  useEffect(() => { isTrackingRef.current = isTracking }, [isTracking])

  useEffect(() => {
    const onPointerLockChange = () => {
      if (!document.pointerLockElement && isTrackingRef.current) {
        dispatch(setStarted(false))
      }
    }
    document.addEventListener('pointerlockchange', onPointerLockChange)
    return () => document.removeEventListener('pointerlockchange', onPointerLockChange)
  }, [dispatch])

  useEffect(() => {
    const onMouseDown = () => {
      if (!document.pointerLockElement || !resetButtonRef.current) return
      const { x, y } = virtualCursorRef.current
      const rect = resetButtonRef.current.getBoundingClientRect()
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        document.exitPointerLock()
        // setStarted(false) fires via the pointerlockchange handler already, but dispatch directly for reliability
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [dispatch])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (document.pointerLockElement) {
        const vc = virtualCursorRef.current
        vc.x = Math.max(0, Math.min(window.innerWidth,  vc.x + e.movementX * multiplierRef.current))
        vc.y = Math.max(0, Math.min(window.innerHeight, vc.y + e.movementY * multiplierRef.current))
        setCursorPx({ x: vc.x, y: vc.y })
        setPos({
          x: parseFloat(((vc.x / window.innerWidth)  * 2 - 1).toFixed(4)),
          y: parseFloat((1 - (vc.y / window.innerHeight) * 2).toFixed(4)),
        })
      } else {
        virtualCursorRef.current = { x: e.clientX, y: e.clientY }
        setCursorPx({ x: e.clientX, y: e.clientY })
        setPos({
          x: parseFloat(((e.clientX / window.innerWidth)  * 2 - 1).toFixed(4)),
          y: parseFloat((1 - (e.clientY / window.innerHeight) * 2).toFixed(4)),
        })
      }
    }
    document.addEventListener('mousemove', onMove)
    return () => document.removeEventListener('mousemove', onMove)
  }, [])

  const handleCalibrationComplete = (ratio: number) => {
    dispatch(setSensitivityRatio(ratio))
    dispatch(setShowTrackingPrompt(true))
  }

  const handleTrackingRoundComplete = (stats: RoundStats) => {
    dispatch(setLastRoundStats(stats))
    const newMultiplier = adjustMultiplier(sensitivityMultiplier, stats, round)
    dispatch(setSensitivityMultiplier(newMultiplier))
    if (round === 11) {
      dispatch(resetTimer())
    } else {
      dispatch(nextRound())
      dispatch(resetTimer())
    }
  }

  const handleTrackingPlay = () => {
    // Must be called directly from a user gesture for pointer lock to be granted
    document.body.requestPointerLock()
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
        cursor: 'none',
      }}
    >
      {started && <ResetButton ref={resetButtonRef} />}
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
          speed={BASE_SPEED}
          virtualCursorRef={virtualCursorRef}
          onComplete={handleTrackingRoundComplete}
        />
      )}

      {/* Virtual cursor — always visible */}
      <div
        style={{
          position: 'absolute',
          left: cursorPx.x,
          top: cursorPx.y,
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: '#fff',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 50,
        }}
      />
    </div>
  )
}

export default App
