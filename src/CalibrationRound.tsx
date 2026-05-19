import { useState, useEffect, useRef } from 'react'

const SEPARATION = 300
const TOTAL_STEPS = 5
const RADIUS = 6
const MARGIN = 80
const EXPECTED_DIST = Math.sqrt(SEPARATION ** 2 + SEPARATION ** 2)

interface Pos { x: number; y: number }

function initialPos(): Pos {
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 }
}

function nextPos(current: Pos): Pos {
  const canRight = current.x + SEPARATION < window.innerWidth - MARGIN
  const canLeft  = current.x - SEPARATION > MARGIN
  const goRight  = canRight && (!canLeft || Math.random() > 0.5)

  const canDown = current.y + SEPARATION < window.innerHeight - MARGIN
  const canUp   = current.y - SEPARATION > MARGIN
  const goDown  = canDown && (!canUp || Math.random() > 0.5)

  return {
    x: current.x + (goRight ? SEPARATION : -SEPARATION),
    y: current.y + (goDown  ? SEPARATION : -SEPARATION),
  }
}

interface Props {
  onComplete: (ratio: number) => void
}

function CalibrationRound({ onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [pos, setPos] = useState<Pos>(initialPos)
  const accX = useRef(0)
  const accY = useRef(0)
  const ratios = useRef<number[]>([])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      accX.current += Math.abs(e.movementX)
      accY.current += Math.abs(e.movementY)
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  const handleClick = () => {
    if (step > 0) {
      const dist = Math.sqrt(accX.current ** 2 + accY.current ** 2)
      ratios.current.push(EXPECTED_DIST / dist)
    }
    accX.current = 0
    accY.current = 0

    if (step === TOTAL_STEPS) {
      const avg = ratios.current.reduce((a, b) => a + b, 0) / ratios.current.length
      onComplete(avg)
      return
    }

    setPos(p => nextPos(p))
    setStep(s => s + 1)
  }

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
        <span>{step === 0 ? 'Click to begin' : `${step} / ${TOTAL_STEPS}`}</span>
      </div>

      <div
        onClick={handleClick}
        style={{
          position: 'absolute',
          width: RADIUS * 2,
          height: RADIUS * 2,
          borderRadius: '50%',
          background: 'red',
          left: pos.x - RADIUS,
          top: pos.y - RADIUS,
          cursor: 'pointer',
          zIndex: 20,
        }}
      />
    </>
  )
}

export default CalibrationRound
