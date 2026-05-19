function Dot() {
  return (
    <div
      style={{
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: 'red',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }}
    />
  )
}

export default Dot
