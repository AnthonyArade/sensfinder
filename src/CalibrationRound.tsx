import { useState, useEffect, useRef } from 'react'

const TOTAL_STEPS  = 5
const RADIUS       = 6
const MARGIN       = 80
const MIN_DIST     = 220
const MAX_ATTEMPTS = 50

interface Pos { x: number; y: number }

function dist(a: Pos, b: Pos) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

function randomPos(): Pos {
  return {
    x: MARGIN + Math.random() * (window.innerWidth  - MARGIN * 2),
    y: MARGIN + Math.random() * (window.innerHeight - MARGIN * 2),
  }
}

function nextTarget(from: Pos): Pos {
  let pos: Pos
  let attempts = 0
  do {
    pos = randomPos()
    attempts++
  } while (dist(pos, from) < MIN_DIST && attempts < MAX_ATTEMPTS)
  return pos
}

function center(): Pos {
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 }
}

export interface Props {
  onComplete: (ratio: number) => void
}

function CalibrationRound({ onComplete }: Props) {
  // step 0 = anchor click (no measurement), steps 1-5 = measured clicks
  const [step,      setStep]      = useState(0)
  const [target,    setTarget]    = useState<Pos>(center)
  const [overshoot, setOvershoot] = useState(0)

  const prevPos    = useRef<Pos | null>(null)
  const accX       = useRef(0)
  const accY       = useRef(0)
  const ratios     = useRef<number[]>([])
  const overshoots = useRef(0)
  const prevCursorX = useRef<number | null>(null)
  const prevCursorY = useRef<number | null>(null)

  // track accumulated movement + overshoot detection
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      accX.current += Math.abs(e.movementX)
      accY.current += Math.abs(e.movementY)

      // overshoot: cursor crossed past the target and came back
      if (prevPos.current && step > 0) {
        const prev = prevCursorX.current
        if (prev !== null) {
          const tX = target.x
          const crossedPast =
            (prev < tX && e.clientX > tX) ||
            (prev > tX && e.clientX < tX)
          if (crossedPast) overshoots.current++
        }
      }
      prevCursorX.current = e.clientX
      prevCursorY.current = e.clientY
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [step, target])

  const handleClick = () => {
    if (step > 0 && prevPos.current) {
      const straight = dist(target, prevPos.current)
      const accumulated = Math.sqrt(accX.current ** 2 + accY.current ** 2)
      // efficiency: how directly did the user move (1 = perfect straight line)
      const efficiency = accumulated > 0 ? Math.min(1, straight / accumulated) : 1
      ratios.current.push(efficiency)
    }

    // reset per-step counters
    accX.current       = 0
    accY.current       = 0
    overshoots.current = 0
    setOvershoot(0)

    if (step === TOTAL_STEPS) {
      const avg = ratios.current.reduce((a, b) => a + b, 0) / ratios.current.length
      onComplete(avg)
      return
    }

    prevPos.current = target
    const next = nextTarget(target)
    setTarget(next)
    setStep(s => s + 1)
  }

  return (
    <>
      {/* Step counter */}
      <div
        style={{
          position: 'absolute',
          top: '1.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#fff',
          fontFamily: 'monospace',
          fontSize: '1.5rem',
          zIndex: 20,
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.25rem',
        }}
      >
        <span style={{ fontSize: '0.85rem', opacity: 0.5 }}>Calibration</span>
        <span>{step === 0 ? 'Click the dot to begin' : `${step} / ${TOTAL_STEPS}`}</span>
      </div>

      {/* Target circle */}
      <div
        onClick={handleClick}
        style={{
          position: 'absolute',
          width: RADIUS * 2,
          height: RADIUS * 2,
          borderRadius: '50%',
          background: 'red',
          left: target.x - RADIUS,
          top:  target.y - RADIUS,
          cursor: 'pointer',
          zIndex: 20,
        }}
      />
    </>
  )
}

export default CalibrationRound
