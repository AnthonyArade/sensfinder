import { useDispatch } from 'react-redux'
import { setStarted } from './store/sessionSlice'

function ResetButton() {
  const dispatch = useDispatch()

  return (
    <button
      onClick={() => dispatch(setStarted(false))}
      style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        padding: '0.4rem 1rem',
        fontFamily: 'monospace',
        fontSize: '0.9rem',
        background: 'transparent',
        color: '#fff',
        border: '1px solid #fff',
        borderRadius: 4,
        cursor: 'pointer',
        zIndex: 20,
      }}
    >
      Reset
    </button>
  )
}

export default ResetButton
