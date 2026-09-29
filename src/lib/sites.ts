/**
 * Ritual sites' layouts, 9 by 9 tiles with the focus in the middle, a row to a line: G a glyph, L a light
 * source, F the focus, "." nothing.
 */
export const SITES = {
  underworld: [
    "....L....",
    ".G..L..G.",
    "..G.G.G..",
    "...L.L...",
    "L.G.F.G.L",
    "...L.L...",
    "...G.G...",
    ".G..L..G.",
    "....L....",
  ],
  ungael: [
    ".........",
    "....L....",
    ".G.G.G.G.",
    ".G.LLL.G.",
    "L.L.F.L.L",
    ".G.L.L.G.",
    "..G...G..",
    "....G....",
    ".........",
  ],
};

export type RitualSiteName = keyof typeof SITES;

/** Ritual sites' names, as the game gives them. */
export const SITE_NAMES: Record<RitualSiteName, string> = { underworld: "The Underworld", ungael: "Ungael" };
