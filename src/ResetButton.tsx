import { forwardRef } from 'react'
import { useDispatch } from 'react-redux'
import { setStarted } from './store/sessionSlice'

const ResetButton = forwardRef<HTMLButtonElement>((_, ref) => {
  const dispatch = useDispatch()

  const handleReset = () => {
    if (document.pointerLockElement) document.exitPointerLock()
    dispatch(setStarted(false))
  }

  return (
    <button
      ref={ref}
      onClick={handleReset}
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
})

export default ResetButton
