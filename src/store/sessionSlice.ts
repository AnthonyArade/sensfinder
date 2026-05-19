import { createSlice } from '@reduxjs/toolkit'
import type { RoundStats } from '../TrackingRound'

const BASE_SPEED = 300 // px/s — fixed, never changes

interface PhaseMultipliers {
  horizontal: number | null
  vertical:   number | null
  mixed:      number | null
}

interface SessionState {
  isFullscreen: boolean
  started: boolean
  timerDone: boolean
  round: number
  showTrackingPrompt: boolean
  sensitivityRatio: number | null
  lastRoundStats: RoundStats | null
  sensitivityMultiplier: number
  phaseMultipliers: PhaseMultipliers
  sessionComplete: boolean
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
  phaseMultipliers: { horizontal: null, vertical: null, mixed: null },
  sessionComplete: false,
}

const resetFields = {
  started: false,
  timerDone: false,
  round: 1,
  showTrackingPrompt: false,
  lastRoundStats: null,
  sensitivityRatio: null,
  sensitivityMultiplier: 1,
  phaseMultipliers: { horizontal: null, vertical: null, mixed: null },
  sessionComplete: false,
}

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setFullscreen(state, action: { payload: boolean }) {
      state.isFullscreen = action.payload
      if (!action.payload) Object.assign(state, resetFields)
    },
    setStarted(state, action: { payload: boolean }) {
      state.started = action.payload
      if (!action.payload) Object.assign(state, resetFields)
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
    setPhaseMultiplier(state, action: { payload: { phase: keyof PhaseMultipliers; value: number } }) {
      state.phaseMultipliers[action.payload.phase] = action.payload.value
    },
    setSessionComplete(state) {
      state.sessionComplete = true
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
  setPhaseMultiplier,
  setSessionComplete,
} = sessionSlice.actions
export default sessionSlice.reducer
