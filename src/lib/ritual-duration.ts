/** A ritual tick, in seconds: two game ticks of 0.6s. */
const TICK = 1.2;

/**
 * How long a ritual takes, in seconds, from its length in ritual ticks and its alteration glyphs' speed (a
 * negative percentage, e.g. −15 for Speed III). Speed glyphs add up, to at most −50%, and the result rounds up
 * to a whole ritual tick, as the RuneScape Wiki's ritual calculator has it.
 */
export function ritualSeconds(ticks: number, speed = 0) {
  return Math.ceil((ticks * (100 + Math.max(speed, -50))) / 100) * TICK;
}

/** A time as hours, minutes and seconds, "1h 2m 3s", leaving off hours and minutes while they're 0. */
export function formatDuration(seconds: number) {
  const whole = Math.round(seconds);
  const [h, m, s] = [Math.floor(whole / 3600), Math.floor((whole % 3600) / 60), whole % 60];
  return [h && `${h}h`, (h || m) && `${m}m`, `${s}s`].filter(Boolean).join(" ");
}
