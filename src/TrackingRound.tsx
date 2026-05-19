import { useState, useEffect, useRef } from 'react'

const RADIUS       = 12
const DURATION_MS  = 1_000
const ON_THRESHOLD = 30
const MARGIN       = 60

export interface RoundStats {
  behind: number
  on: number
  ahead: number
  displayRound: number
}

interface Props {
  displayRound: number
  speed: number
  direction: 'horizontal' | 'vertical' | 'mixed'
  initialSign: 1 | -1        // +1 = right/down, -1 = left/up (ignored for mixed)
  mixedAngle?: number         // pre-generated angle in radians for mixed rounds
  virtualCursorRef: React.MutableRefObject<{ x: number; y: number }>
  onComplete: (stats: RoundStats) => void
}

function TrackingRound({ displayRound, speed, direction, initialSign, mixedAngle = 0, virtualCursorRef, onComplete }: Props) {
  const centerX = window.innerWidth  / 2
  const centerY = window.innerHeight / 2

  const initVX = direction === 'vertical'   ? 0 : direction === 'mixed' ? speed * Math.cos(mixedAngle) : speed * initialSign
  const initVY = direction === 'horizontal' ? 0 : direction === 'mixed' ? speed * Math.sin(mixedAngle) : speed * initialSign

  const [circleX,   setCircleX]   = useState(centerX)
  const [circleY,   setCircleY]   = useState(centerY)
  const [remaining, setRemaining] = useState(10)
  const [isOnIt,    setIsOnIt]    = useState(false)

  const xRef     = useRef(centerX)
  const yRef     = useRef(centerY)
  const velXRef  = useRef(initVX)
  const velYRef  = useRef(initVY)
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

      let x = xRef.current + velXRef.current * dt
      if (x >= window.innerWidth - MARGIN) {
        x = window.innerWidth - MARGIN
        velXRef.current = -Math.abs(velXRef.current)
      } else if (x <= MARGIN) {
        x = MARGIN
        velXRef.current = Math.abs(velXRef.current)
      }

      let y = yRef.current + velYRef.current * dt
      if (y >= window.innerHeight - MARGIN) {
        y = window.innerHeight - MARGIN
        velYRef.current = -Math.abs(velYRef.current)
      } else if (y <= MARGIN) {
        y = MARGIN
        velYRef.current = Math.abs(velYRef.current)
      }

      xRef.current = x
      yRef.current = y
      setCircleX(x)
      setCircleY(y)
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

      const dx   = virtualCursorRef.current.x - x
      const dy   = virtualCursorRef.current.y - y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const onIt = dist <= ON_THRESHOLD
      setIsOnIt(onIt)
      counts.current.total++
      if (onIt) {
        counts.current.on++
      } else {
        const dot = dx * velXRef.current + dy * velYRef.current
        if (dot >= 0) counts.current.ahead++
        else          counts.current.behind++
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current) }
  }, [speed, direction, displayRound, onComplete, virtualCursorRef])

  const label = direction === 'horizontal' ? 'horizontal'
              : direction === 'vertical'   ? 'vertical'
              : 'mixed'

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
        <span style={{ fontSize: '0.85rem', opacity: 0.5 }}>Round {displayRound} — {label}</span>
        <span style={{ fontSize: '1.5rem' }}>{remaining}s</span>
      </div>

      <div
        style={{
          position: 'absolute',
          width: RADIUS * 2,
          height: RADIUS * 2,
          borderRadius: '50%',
          background: isOnIt ? '#4f4' : 'red',
          left: circleX - RADIUS,
          top:  circleY - RADIUS,
          pointerEvents: 'none',
          zIndex: 20,
        }}
      />
    </>
  )
}

export default TrackingRound
