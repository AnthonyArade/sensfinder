import { useSelector } from 'react-redux'
import type { RootState } from './store/store'

function computeCm360(ratio: number): number {
  return (window.screen.width * 2.54) / (96 * ratio)
}

function SensitivityDisplay() {
  const sensitivityRatio = useSelector((state: RootState) => state.session.sensitivityRatio)
  const lastRoundStats   = useSelector((state: RootState) => state.session.lastRoundStats)

  if (sensitivityRatio === null) return null

  const cm360 = computeCm360(sensitivityRatio).toFixed(1)

  return (
    <div
      style={{
        position: 'absolute',
        top: '1.5rem',
        left: '1.5rem',
        color: '#fff',
        fontFamily: 'monospace',
        fontSize: '0.85rem',
        zIndex: 20,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        <span style={{ opacity: 0.5 }}>sensitivity</span>
        <span style={{ fontSize: '1.25rem' }}>{cm360} cm/360°</span>
      </div>

      {lastRoundStats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span style={{ opacity: 0.5 }}>round {lastRoundStats.displayRound} tracking</span>
          <span>behind &nbsp;<strong>{lastRoundStats.behind}%</strong></span>
          <span>on it &nbsp;&nbsp;<strong>{lastRoundStats.on}%</strong></span>
          <span>ahead &nbsp;&nbsp;<strong>{lastRoundStats.ahead}%</strong></span>
        </div>
      )}
    </div>
  )
}

export default SensitivityDisplay
