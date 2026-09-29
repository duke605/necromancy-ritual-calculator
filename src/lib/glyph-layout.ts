/** Where a spot's partner is, from its offset from the focus, in order of preference: across, up or down, opposite. */
const SYMMETRIES = [
  (dx: number, dy: number) => [-dx, dy],
  (dx: number, dy: number) => [dx, -dy],
  (dx: number, dy: number) => [-dx, -dy],
];

/**
 * Where a ritual's glyphs go on a site: on glyph spots ("G" in `rows`, a row to a line, around the focus
 * "F"), as the site's `glyphs` prop takes them, in reading order. As symmetrical as can be: each kind
 * fills pairs, mirrored left and right of the focus where there are any left, then above and below it,
 * then diagonally opposite; nearest the focus first. An odd one out goes in line with the focus (its
 * column or row), which mirrors itself; where that's taken, as near the focus as there's room, across
 * from another odd one out where it can, so the two at least balance.
 */
export function layoutGlyphs<Name extends string>(rows: string[], glyphs: { name: Name; amount: number }[]) {
  const focusY = rows.findIndex((row) => row.includes("F"));
  const focusX = rows[focusY].indexOf("F");
  const spots = rows.flatMap((row, y) =>
    [...row].flatMap((cell, x) => (cell === "G" ? [{ dx: x - focusX, dy: y - focusY }] : [])),
  );
  const distance = (index: number) => spots[index].dx ** 2 + spots[index].dy ** 2;
  // The spot a symmetry takes this one to: -1 if there's none, or this one if it mirrors itself.
  const partner = (index: number, symmetry: (typeof SYMMETRIES)[number]) => {
    const [dx, dy] = symmetry(spots[index].dx, spots[index].dy);
    return spots.findIndex((spot) => spot.dx === dx && spot.dy === dy);
  };
  // Spots by how near the focus they are; ties in reading order.
  const nearest = spots.map((_, index) => index).sort((a, b) => distance(a) - distance(b) || a - b);

  const placed: (Name | undefined)[] = spots.map(() => undefined);
  const free = (index: number) => index !== -1 && placed[index] === undefined;
  const oddOnes: Name[] = [];
  for (const { name, amount } of glyphs) {
    let left = amount;
    pairs: for (; left >= 2; left -= 2) {
      for (const symmetry of SYMMETRIES) {
        const spot = nearest.find(
          (index) => free(index) && free(partner(index, symmetry)) && partner(index, symmetry) !== index,
        );
        if (spot !== undefined) {
          placed[spot] = placed[partner(spot, symmetry)] = name;
          continue pairs;
        }
      }
      // With no pairs left, the rest are odd ones out.
      break;
    }
    oddOnes.push(...Array<Name>(left).fill(name));
  }
  for (const name of oddOnes) {
    const spot =
      nearest.find((index) => free(index) && (spots[index].dx === 0 || spots[index].dy === 0)) ??
      nearest.find((index) => {
        const across = partner(index, SYMMETRIES[0]);
        return free(index) && across !== -1 && across !== index && !free(across);
      }) ??
      nearest.find(free);
    if (spot === undefined) throw new Error(`More glyphs than glyph spots: no room for ${name}`);
    placed[spot] = name;
  }
  return placed;
}
