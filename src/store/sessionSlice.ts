import { createSlice } from '@reduxjs/toolkit'
import type { RoundStats } from '../TrackingRound'

const BASE_SPEED = 300 // px/s — fixed, never changes

interface SessionState {
  isFullscreen: boolean
  started: boolean
  timerDone: boolean
  round: number
  showTrackingPrompt: boolean
  sensitivityRatio: number | null
  lastRoundStats: RoundStats | null
  sensitivityMultiplier: number   // virtual cursor scale: 1 = 1:1, 0.75 = 25% slower
}

const initialState: SessionState = {
  isFullscreen: !!document.fullscreenElement,
  started: false,
  timerDone: false,
  round: 1,
  showTrackingPrompt: false,
  sensitivityRatio: null,
  lastRoundStats: null,
  sensitivityMultiplier: 1,
}

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setFullscreen(state, action: { payload: boolean }) {
      state.isFullscreen = action.payload
      if (!action.payload) {
        state.started = false
        state.timerDone = false
        state.round = 1
        state.showTrackingPrompt = false
        state.lastRoundStats = null
        state.sensitivityMultiplier = 1
      }
    },
    setStarted(state, action: { payload: boolean }) {
      state.started = action.payload
      if (!action.payload) {
        state.timerDone = false
        state.round = 1
        state.showTrackingPrompt = false
        state.lastRoundStats = null
        state.sensitivityMultiplier = 1
      }
    },
    setTimerDone(state) {
      state.timerDone = true
    },
    resetTimer(state) {
      state.timerDone = false
    },
    nextRound(state) {
      state.round += 1
    },
    setShowTrackingPrompt(state, action: { payload: boolean }) {
      state.showTrackingPrompt = action.payload
    },
    setSensitivityRatio(state, action: { payload: number }) {
      state.sensitivityRatio = action.payload
    },
    setLastRoundStats(state, action: { payload: RoundStats }) {
      state.lastRoundStats = action.payload
    },
    setSensitivityMultiplier(state, action: { payload: number }) {
      state.sensitivityMultiplier = action.payload
    },
  },
})

export { BASE_SPEED }
export const {
  setFullscreen,
  setStarted,
  setTimerDone,
  resetTimer,
  nextRound,
  setShowTrackingPrompt,
  setSensitivityRatio,
  setLastRoundStats,
  setSensitivityMultiplier,
} = sessionSlice.actions
export default sessionSlice.reducer
