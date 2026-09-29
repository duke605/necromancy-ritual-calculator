// A damped spring's path from one position to another, sampled for a Web Animations keyframe list.
// Its overshoot is a fixed fraction of the distance travelled, so a longer drop bounces further.

/** How much it overshoots: none at 1, more the lower it goes; about 13% of the distance at 0.55. */
const DAMPING_RATIO = 0.55;
/** How quick it is: the first overshoot peaks about 300 ms in. */
const ANGULAR_FREQUENCY = 12;
export const FRAME_MS = 1000 / 60;

/**
 * Positions from `from` to `to`, one per frame, until it's within half a pixel and still. `velocity`
 * (px/ms) is how fast it's already moving, so a flick carries into the spring. `floor` is a hard edge it
 * bounces off instead of passing (a closing drawer can't go past closed).
 */
export function springPath(from: number, to: number, { velocity = 0, floor }: { velocity?: number; floor?: number } = {}) {
  const damped = ANGULAR_FREQUENCY * Math.sqrt(1 - DAMPING_RATIO ** 2);
  const decay = DAMPING_RATIO * ANGULAR_FREQUENCY;
  // The underdamped spring from `from` moving at `velocity` (px/s here): to + e^(-decay t) (a cos + b sin).
  const a = from - to;
  const b = (velocity * 1000 + decay * a) / damped;
  const reach = Math.hypot(a, b);
  const path: number[] = [];
  for (let t = 0; ; t += FRAME_MS / 1000) {
    const envelope = Math.exp(-decay * t);
    let position = to + envelope * (a * Math.cos(damped * t) + b * Math.sin(damped * t));
    // Past the edge, it bounces back off it by as much as it would have gone past.
    if (floor !== undefined && (position - floor) * (from - floor) < 0) position = floor - (position - floor);
    path.push(position);
    if (envelope * reach < 0.5) break;
  }
  path[path.length - 1] = to;
  return path;
}
