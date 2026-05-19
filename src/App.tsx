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
  setPhaseMultiplier,
  setSessionComplete,
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
  const showTrackingPrompt    = useSelector((state: RootState) => state.session.showTrackingPrompt)
  const sensitivityMultiplier = useSelector((state: RootState) => state.session.sensitivityMultiplier)
  const phaseMultipliers      = useSelector((state: RootState) => state.session.phaseMultipliers)
  const sessionComplete       = useSelector((state: RootState) => state.session.sessionComplete)
  const sensitivityRatio      = useSelector((state: RootState) => state.session.sensitivityRatio)

  // Virtual cursor — pixel position
  const virtualCursorRef  = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  const multiplierRef     = useRef(sensitivityMultiplier)
  const resetButtonRef    = useRef<HTMLButtonElement>(null)
  const restartButtonRef  = useRef<HTMLButtonElement>(null)
  const mixedAngleRef     = useRef(0)
  const [cursorPx,   setCursorPx]   = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  const [pos,        setPos]        = useState({ x: 0, y: 0 })
  const [copiedKey,  setCopiedKey]  = useState<string | null>(null)
  const [toast,      setToast]      = useState<string | null>(null)

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

  // If pointer lock is released while session is active (Escape, or virtual reset click), reset
  // but NOT when we intentionally release it at session complete
  const startedRef         = useRef(false)
  const sessionCompleteRef = useRef(false)
  useEffect(() => { startedRef.current = started }, [started])
  useEffect(() => { sessionCompleteRef.current = sessionComplete }, [sessionComplete])

  useEffect(() => {
    const onPointerLockChange = () => {
      if (!document.pointerLockElement && startedRef.current && !sessionCompleteRef.current) {
        dispatch(setStarted(false))
      }
    }
    document.addEventListener('pointerlockchange', onPointerLockChange)
    return () => document.removeEventListener('pointerlockchange', onPointerLockChange)
  }, [dispatch])

  useEffect(() => {
    const onMouseDown = () => {
      if (!document.pointerLockElement) return
      const { x, y } = virtualCursorRef.current
      const hits = (ref: React.RefObject<HTMLButtonElement | null>) => {
        if (!ref.current) return false
        const r = ref.current.getBoundingClientRect()
        return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
      }
      if (hits(resetButtonRef) || hits(restartButtonRef)) {
        document.exitPointerLock()
        dispatch(setStarted(false))
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
    const phaseRound = round <= 4 ? round : round <= 7 ? round - 3 : round - 6
    const newMultiplier = adjustMultiplier(sensitivityMultiplier, stats, phaseRound)
    dispatch(setSensitivityMultiplier(newMultiplier))

    // Save phase-end multiplier at the last round of each phase
    if (round === 4)  dispatch(setPhaseMultiplier({ phase: 'horizontal', value: newMultiplier }))
    if (round === 7)  dispatch(setPhaseMultiplier({ phase: 'vertical',   value: newMultiplier }))
    if (round === 11) dispatch(setPhaseMultiplier({ phase: 'mixed',      value: newMultiplier }))

    if (round === 11) {
      sessionCompleteRef.current = true   // set before exitPointerLock to suppress the reset handler
      document.exitPointerLock()
      dispatch(setSessionComplete())
    } else {
      dispatch(nextRound())
      // Pre-generate the angle for the upcoming mixed round so the preview arrow can show it
      if (round >= 7) mixedAngleRef.current = Math.random() * 2 * Math.PI
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
      {started && !sessionComplete && <ResetButton ref={resetButtonRef} />}
      {round > 1 && !sessionComplete && <SensitivityDisplay />}
      {!started && <StartPrompt onPlay={() => dispatch(setStarted(true))} />}
      {started && !timerDone && <Timer onComplete={() => dispatch(setTimerDone())} aboveCenter={round > 1} />}
      {started && !timerDone && round > 1 && (() => {
        const isMixed       = round > 7
        // Alternate sign within each phase: even phase-position = +1, odd = -1
        const phasePos      = round <= 4 ? round - 2 : round <= 7 ? round - 5 : 0
        const sign          = phasePos % 2 === 0 ? 1 : -1
        // Degrees: 0°=right, 90°=down, 180°=left, 270°=up; mixed uses pre-generated angle
        const arrowDeg      = isMixed
          ? mixedAngleRef.current * (180 / Math.PI)
          : round <= 4
            ? (sign > 0 ? 0 : 180)
            : (sign > 0 ? 90 : 270)
        const upcomingLabel = round <= 4 ? 'Horizontal' : round <= 7 ? 'Vertical' : 'Random'
        return (
          <>
            {/* Starting position dot */}
            <div
              style={{
                position: 'absolute',
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: 'red',
                left: window.innerWidth / 2 - 12,
                top: window.innerHeight / 2 - 12,
                pointerEvents: 'none',
                zIndex: 20,
              }}
            />

            {/* Direction arrow */}
            {(
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                  zIndex: 20,
                }}
              >
                <svg
                  width="120" height="120" viewBox="-60 -60 120 120"
                  style={{ display: 'block', transform: `rotate(${arrowDeg}deg)` }}
                >
                  {/* shaft starting after the 6px dot radius */}
                  <line x1="8" y1="0" x2="52" y2="0" stroke="red" strokeWidth="2.5" strokeLinecap="round" />
                  <polyline points="42,-9 54,0 42,9" fill="none" stroke="red" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}

            {/* Label */}
            <div
              style={{
                position: 'absolute',
                bottom: '3rem',
                left: '50%',
                transform: 'translateX(-50%)',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                color: '#fff',
                opacity: 0.5,
                pointerEvents: 'none',
                zIndex: 20,
                whiteSpace: 'nowrap',
              }}
            >
              Next — Round {round - 1} &nbsp;·&nbsp; {upcomingLabel}
            </div>
          </>
        )
      })()}
      {showTrackingPrompt && <TrackingPrompt onPlay={handleTrackingPlay} />}

      {!sessionComplete && (timerDone && round > 1
        ? <>x: {pos.x} &nbsp; y: {pos.y}</>
        : <span style={{ fontSize: '4rem', letterSpacing: '0.1em', opacity: 0.15 }}>Sensi Finder</span>
      )}

      {timerDone && !showTrackingPrompt && round === 1 && (
        <CalibrationRound onComplete={handleCalibrationComplete} />
      )}

      {timerDone && !showTrackingPrompt && round > 1 && !sessionComplete && (() => {
        const phasePos    = round <= 4 ? round - 2 : round <= 7 ? round - 5 : 0
        const initialSign = (phasePos % 2 === 0 ? 1 : -1) as 1 | -1
        return (
          <TrackingRound
            key={round}
            displayRound={round - 1}
            speed={BASE_SPEED}
            direction={round <= 4 ? 'horizontal' : round <= 7 ? 'vertical' : 'mixed'}
            initialSign={initialSign}
            mixedAngle={mixedAngleRef.current}
            virtualCursorRef={virtualCursorRef}
            onComplete={handleTrackingRoundComplete}
          />
        )
      })()}

      {sessionComplete && sensitivityRatio !== null && (() => {
        const baseCm360 = (window.screen.width * 2.54) / (96 * sensitivityRatio)
        const cm360     = (m: number) => (baseCm360 / m).toFixed(1)
        const deltaPct  = (m: number) => {
          const d = (m - 1) * 100
          return (d >= 0 ? '+' : '') + d.toFixed(1) + '%'
        }
        const deltaColor = (m: number) => m >= 1 ? '#4f4' : '#f66'

        const { horizontal, vertical, mixed } = phaseMultipliers
        const vals = [horizontal, vertical, mixed].filter((v): v is number => v !== null)
        const avgCm = vals.length
          ? (vals.reduce((s, m) => s + parseFloat(cm360(m)), 0) / vals.length).toFixed(1)
          : '—'
        const avgMultiplier = vals.length ? vals.reduce((s, m) => s + m, 0) / vals.length : null
        const finalCm = mixed !== null ? cm360(mixed) : '—'

        const copy = (key: string, text: string) => {
          navigator.clipboard.writeText(text)
          setCopiedKey(key)
          setToast(`Copied: ${text}`)
          setTimeout(() => {
            setCopiedKey(k => k === key ? null : k)
            setToast(null)
          }, 1500)
        }

        const CopyableValue = ({ copyKey, text, style }: { copyKey: string; text: string; style?: React.CSSProperties }) => (
          <span
            onClick={() => copy(copyKey, text)}
            title="Click to copy"
            style={{
              cursor: 'pointer',
              pointerEvents: 'all',
              borderBottom: '1px dashed rgba(255,255,255,0.25)',
              transition: 'color 0.15s',
              color: copiedKey === copyKey ? '#4f4' : undefined,
              ...style,
            }}
          >
            {copiedKey === copyKey ? 'Copied!' : text}
          </span>
        )

        return (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              fontFamily: 'monospace',
              color: '#fff',
              zIndex: 30,
              pointerEvents: 'none',
            }}
          >
            <span style={{ fontSize: '0.8rem', opacity: 0.4, letterSpacing: '0.15em', marginBottom: '0.5rem' }}>
              SESSION COMPLETE
            </span>

            {[
              { label: 'Horizontal', value: horizontal },
              { label: 'Vertical',   value: vertical },
              { label: 'Mixed',      value: mixed },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', gap: '1.5rem', alignItems: 'baseline' }}>
                <span style={{ opacity: 0.5, width: '6rem', textAlign: 'right', fontSize: '0.85rem' }}>{label}</span>
                <span style={{ fontSize: '1.1rem', width: '9rem' }}>
                  {value !== null
                    ? <CopyableValue copyKey={label} text={`${cm360(value)} cm/360°`} />
                    : '—'}
                </span>
                {value !== null && (
                  <span style={{ fontSize: '0.85rem', color: deltaColor(value), width: '4rem' }}>
                    {deltaPct(value)}
                  </span>
                )}
              </div>
            ))}

            <div style={{ width: '22rem', height: 1, background: '#444', margin: '0.5rem 0' }} />

            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'baseline' }}>
              <span style={{ opacity: 0.5, width: '6rem', textAlign: 'right', fontSize: '0.85rem' }}>Average</span>
              <span style={{ fontSize: '1.1rem', width: '9rem' }}>
                <CopyableValue copyKey="Average" text={`${avgCm} cm/360°`} />
              </span>
              {avgMultiplier !== null && (
                <span style={{ fontSize: '0.85rem', color: deltaColor(avgMultiplier), width: '4rem' }}>
                  {deltaPct(avgMultiplier)}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'baseline' }}>
              <span style={{ opacity: 0.5, width: '6rem', textAlign: 'right', fontSize: '0.85rem' }}>Final</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 'bold', width: '9rem' }}>
                <CopyableValue copyKey="Final" text={`${finalCm} cm/360°`} />
              </span>
              {mixed !== null && (
                <span style={{ fontSize: '0.85rem', color: deltaColor(mixed), width: '4rem' }}>
                  {deltaPct(mixed)}
                </span>
              )}
            </div>

            <button
              ref={restartButtonRef}
              onClick={() => {
                if (document.pointerLockElement) document.exitPointerLock()
                dispatch(setStarted(false))
              }}
              style={{
                marginTop: '1.5rem',
                padding: '0.5rem 1.5rem',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                background: 'transparent',
                color: '#fff',
                border: '1px solid #fff',
                borderRadius: 4,
                cursor: 'pointer',
                pointerEvents: 'all',
              }}
            >
              Restart
            </button>
          </div>
        )
      })()}

      {/* Copy toast */}
      {toast && (
        <div
          style={{
            position: 'absolute',
            bottom: '2.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1a1a1a',
            border: '1px solid #4f4',
            color: '#4f4',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            padding: '0.4rem 1rem',
            borderRadius: 4,
            whiteSpace: 'nowrap',
            zIndex: 50,
            pointerEvents: 'none',
          }}
        >
          {toast}
        </div>
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
