/**
 * The golden ratio: the fewest rituals that wear every glyph out on the same ritual, from how many rituals each
 * lasts, so no draw is wasted.
 */
export function goldenRatio(durabilities: number[]) {
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  return durabilities.reduce((lcm, durability) => (lcm * durability) / gcd(lcm, durability), 1);
}
