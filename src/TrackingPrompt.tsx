interface TrackingPromptProps {
  onPlay: () => void
}

function TrackingPrompt({ onPlay }: TrackingPromptProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.5rem',
        background: 'rgba(0, 0, 0, 0.6)',
        zIndex: 10,
      }}
    >
      <p style={{ color: '#fff', fontFamily: 'monospace', fontSize: '1.25rem', margin: 0 }}>
        Calibration complete — tracking test will start
      </p>
      <button
        onClick={onPlay}
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
        ▶ Play
      </button>
    </div>
  )
}

export default TrackingPrompt
