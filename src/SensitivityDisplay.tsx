import { useSelector } from 'react-redux'
import type { RootState } from './store/store'

function computeCm360(ratio: number): number {
  return (window.screen.width * 2.54) / (96 * ratio)
}

function SensitivityDisplay() {
  const sensitivityRatio      = useSelector((state: RootState) => state.session.sensitivityRatio)
  const lastRoundStats        = useSelector((state: RootState) => state.session.lastRoundStats)
  const sensitivityMultiplier = useSelector((state: RootState) => state.session.sensitivityMultiplier)
  const round                 = useSelector((state: RootState) => state.session.round)

  if (sensitivityRatio === null) return null

  const cm360 = computeCm360(sensitivityRatio).toFixed(1)

  // Recompute the factor that was applied after the last completed round (round - 1)
  let lastDeltaLabel: string | null = null
  if (lastRoundStats && round >= 3) {
    const completedRound = round - 1
    let factor = 0.25 / Math.pow(2, completedRound - 2)
    if (lastRoundStats.on > lastRoundStats.ahead && lastRoundStats.on > lastRoundStats.behind) {
      factor /= 2
    }
    const pct = (factor * 100).toFixed(2)
    if (lastRoundStats.ahead > lastRoundStats.behind) {
      lastDeltaLabel = `−${pct}%`
    } else if (lastRoundStats.behind > lastRoundStats.ahead) {
      lastDeltaLabel = `+${pct}%`
    } else {
      lastDeltaLabel = `±0%`
    }
  }

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
        <span style={{ opacity: 0.7 }}>multiplier &nbsp;<strong>{sensitivityMultiplier.toFixed(4)}×</strong></span>
        {lastDeltaLabel && (
          <span style={{ opacity: 0.7 }}>
            last adj &nbsp;&nbsp;
            <strong style={{ color: lastDeltaLabel.startsWith('+') ? '#4f4' : lastDeltaLabel.startsWith('−') ? '#f66' : '#fff' }}>
              {lastDeltaLabel}
            </strong>
          </span>
        )}
      </div>

      {/* Sensitivity gauge — range 0.5× … 1.5×, centre = 1.0× */}
      {(() => {
        const MIN = 0.5, MAX = 1.5
        const clampedM = Math.max(MIN, Math.min(MAX, sensitivityMultiplier))
        const centerPct  = ((1 - MIN) / (MAX - MIN)) * 100          // px% where 1.0 sits
        const valuePct   = ((clampedM - MIN) / (MAX - MIN)) * 100
        const fillLeft   = Math.min(centerPct, valuePct)
        const fillWidth  = Math.abs(valuePct - centerPct)
        const fillColor  = sensitivityMultiplier >= 1 ? '#4f4' : '#f66'
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={{ opacity: 0.5 }}>speed gauge</span>
            <div style={{ position: 'relative', width: 160, height: 8, background: '#333', borderRadius: 4 }}>
              {/* filled segment */}
              <div style={{
                position: 'absolute',
                top: 0, bottom: 0,
                left: `${fillLeft}%`,
                width: `${fillWidth}%`,
                background: fillColor,
                borderRadius: 4,
              }} />
              {/* centre tick */}
              <div style={{
                position: 'absolute',
                top: -2, bottom: -2,
                left: `${centerPct}%`,
                width: 2,
                background: '#fff',
                transform: 'translateX(-50%)',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.4, fontSize: '0.7rem' }}>
              <span>0.5×</span>
              <span>1.0×</span>
              <span>1.5×</span>
            </div>
            <span style={{ opacity: 0.7 }}>
              virtual &nbsp;<strong>{(computeCm360(sensitivityRatio) / sensitivityMultiplier).toFixed(1)} cm/360°</strong>
            </span>
          </div>
        )
      })()}

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
