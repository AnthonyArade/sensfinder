import { useState, useEffect, useRef } from 'react'

interface TimerProps {
  onComplete: () => void
}

function Timer({ onComplete }: TimerProps) {
  const [count, setCount] = useState(3)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (count === 0) {
      intervalRef.current && clearInterval(intervalRef.current)
      onComplete()
      return
    }

    intervalRef.current = setInterval(() => setCount(c => c - 1), 1000)
    return () => { intervalRef.current && clearInterval(intervalRef.current) }
  }, [count])

  if (count === 0) return null

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 30,
        pointerEvents: 'none',
      }}
    >
      <span style={{ fontSize: '12rem', color: '#fff', fontFamily: 'monospace', lineHeight: 1 }}>
        {count}
      </span>
    </div>
  )
}

export default Timer
