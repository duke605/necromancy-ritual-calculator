/**
 * How many of an output a ritual makes with its Multiply glyphs (`multiply`, a percentage): a flat increase,
 * rounded down. It applies to everything a ritual makes, souls and ectoplasm included. Whole numbers only, so
 * no floating-point error: 1 × 2 is 2, not 1.9999….
 */
export function ritualOutput(amount: number, multiply = 0) {
  return Math.floor((amount * (100 + multiply)) / 100);
}
