import type { RoundStats } from './TrackingRound'

/**
 * Adjust the virtual cursor sensitivity multiplier after each tracking round.
 *
 * Circle speed is fixed at 300 px/s. The multiplier scales how much the
 * virtual cursor moves per unit of raw mouse movement:
 *   multiplier > 1 → cursor moves faster (higher effective sensitivity)
 *   multiplier < 1 → cursor moves slower (lower effective sensitivity)
 *
 * Adjustment schedule (binary-search convergence):
 *   Round 2 ends → ±25%
 *   Round 3 ends → ±12.5%
 *   Round 4 ends → ±6.25%
 *   … halving each time
 *
 * More ahead  → cursor too fast for the circle → reduce multiplier
 * More behind → cursor too slow               → increase multiplier
 * Tied        → no change
 */
export function adjustMultiplier(
  current: number,
  stats: RoundStats,
  internalRound: number,   // the internal round number that just finished (≥ 2)
): number {
  let factor = 0.25 / Math.pow(2, internalRound - 2)

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
