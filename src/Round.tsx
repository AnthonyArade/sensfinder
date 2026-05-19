import { useState, useEffect, useRef } from 'react'

interface RoundProps {
  round: number
  onComplete: () => void
}

function Round({ round, onComplete }: RoundProps) {
  const [count, setCount] = useState(10)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setCount(10)
  }, [round])

  useEffect(() => {
    if (count === 0) {
      intervalRef.current && clearInterval(intervalRef.current)
      onComplete()
      return
    }

    intervalRef.current = setInterval(() => setCount(c => c - 1), 1000)
    return () => { intervalRef.current && clearInterval(intervalRef.current) }
  }, [count])

  return (
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
      <span style={{ fontSize: '0.85rem', opacity: 0.5 }}>
        {round === 1 ? 'Calibration' : `Round ${round - 1}`}
      </span>
      <span>{count}s</span>
    </div>
  )
}

export default Round
