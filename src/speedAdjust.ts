import type { RoundStats } from './TrackingRound'

/**
 * Adjust the virtual cursor sensitivity multiplier after each tracking round.
 *
 * phaseRound is the 1-based index within the current phase (horizontal or vertical):
 *   phaseRound 2 → ±25%
 *   phaseRound 3 → ±12.5%
 *   phaseRound 4 → ±6.25%
 *   … halving each time
 *
 * If "on it" is the dominant stat, the factor is halved again (already converging well).
 *
 * More ahead  → cursor too fast → reduce multiplier
 * More behind → cursor too slow → increase multiplier
 */
export function adjustMultiplier(
  current: number,
  stats: RoundStats,
  phaseRound: number,   // position within the current phase, starting at 2
): number {
  let factor = 0.25 / Math.pow(2, phaseRound - 2)

  if (stats.on > stats.ahead && stats.on > stats.behind) {
    factor /= 2
  }

  if (stats.ahead > stats.behind) {
    return current * (1 - factor)   // slow virtual cursor down
  }
  if (stats.behind > stats.ahead) {
    return current * (1 + factor)   // speed virtual cursor up
  }
  return current
}
