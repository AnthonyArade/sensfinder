import { useState, useEffect, useRef } from 'react'

const RADIUS      = 6
const DURATION_MS = 10_000
const ON_THRESHOLD = 30
const MARGIN      = 60

export interface RoundStats {
  behind: number
  on: number
  ahead: number
  displayRound: number
}

interface Props {
  displayRound: number
  speed: number
  /** Ref to the virtual cursor position managed by App */
  virtualCursorRef: React.MutableRefObject<{ x: number; y: number }>
  onComplete: (stats: RoundStats) => void
}

function TrackingRound({ displayRound, speed, virtualCursorRef, onComplete }: Props) {
  const circleY = window.innerHeight / 2

  const [circleX,   setCircleX]   = useState(MARGIN)
  const [remaining, setRemaining] = useState(10)

  const xRef    = useRef(MARGIN)
  const velRef  = useRef(speed)
  const startRef = useRef<number | null>(null)
  const lastRef  = useRef<number | null>(null)
  const rafRef   = useRef<number | null>(null)
  const doneRef  = useRef(false)
  const counts   = useRef({ total: 0, behind: 0, on: 0, ahead: 0 })

  useEffect(() => {
    const animate = (now: number) => {
      if (doneRef.current) return
      if (startRef.current === null) startRef.current = now
      const elapsed = now - startRef.current
      const dt = lastRef.current !== null ? (now - lastRef.current) / 1000 : 0
      lastRef.current = now

      // move circle
      let x = xRef.current + velRef.current * dt
      if (x >= window.innerWidth - MARGIN) {
        x = window.innerWidth - MARGIN
        velRef.current = -Math.abs(velRef.current)
      } else if (x <= MARGIN) {
        x = MARGIN
        velRef.current = Math.abs(velRef.current)
      }
      xRef.current = x
      setCircleX(x)
      setRemaining(Math.max(0, Math.ceil((DURATION_MS - elapsed) / 1000)))

      if (elapsed >= DURATION_MS) {
        doneRef.current = true
        const { total, behind, on, ahead } = counts.current
        onComplete({
          behind:       Math.round(behind / total * 100),
          on:           Math.round(on     / total * 100),
          ahead:        Math.round(ahead  / total * 100),
          displayRound,
        })
        return
      }

      // classify virtual cursor state — only within the 10 s window
      const cx  = virtualCursorRef.current.x
      const dir = Math.sign(velRef.current)
      const rel = (cx - x) * dir
      counts.current.total++
      if (Math.abs(cx - x) <= ON_THRESHOLD) counts.current.on++
      else if (rel < 0)                      counts.current.behind++
      else                                   counts.current.ahead++

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current) }
  }, [speed, displayRound, onComplete, virtualCursorRef])

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: '1.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#fff',
          fontFamily: 'monospace',
          zIndex: 20,
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.25rem',
        }}
      >
        <span style={{ fontSize: '0.85rem', opacity: 0.5 }}>Round {displayRound}</span>
        <span style={{ fontSize: '1.5rem' }}>{remaining}s</span>
      </div>

      {/* Circle position — red, below cursor coords */}
      <div
        style={{
          position: 'absolute',
          top: 'calc(50% + 2.5rem)',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'red',
          fontFamily: 'monospace',
          fontSize: '2rem',
          zIndex: 20,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        x: {((circleX / window.innerWidth) * 2 - 1).toFixed(4)}
        &nbsp;
        y: {(1 - (circleY / window.innerHeight) * 2).toFixed(4)}
      </div>

      {/* Moving red circle */}
      <div
        style={{
          position: 'absolute',
          width: RADIUS * 2,
          height: RADIUS * 2,
          borderRadius: '50%',
          background: 'red',
          left: circleX - RADIUS,
          top: circleY - RADIUS,
          pointerEvents: 'none',
          zIndex: 20,
        }}
      />
    </>
  )
}

export default TrackingRound
