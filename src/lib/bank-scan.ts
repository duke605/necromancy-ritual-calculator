// Reads a screenshot of the RuneScape bank: finds each item's icon and stack count, then names the icons
// by matching them against templates. Runs in the browser (on a canvas's ImageData) and in Node (tests).
//
// Nothing about the bank's layout is assumed, only that icons sit on one flat background colour:
// the background is keyed out, and what's left falls apart into icons and count text.

/** RGBA pixels, as in ImageData. */
export type Pixels = { data: Uint8ClampedArray | Uint8Array; width: number; height: number };

export type Box = { left: number; top: number; right: number; bottom: number };

/**
 * An icon cut out of the screenshot, and the stack count printed over it (1 when there's none). `truncated`
 * when the count's shortened, e.g. "109K", so it's only to the nearest thousand.
 */
export type Icon = { box: Box; count: number; truncated?: boolean };

/**
 * The colours stack counts are printed in: whole, then K, M, B, T and Q (the RuneScape Wiki's "Stackable
 * items" has them).
 */
const TEXT_COLOURS = [0xffff00, 0xffffff, 0x1eff00, 0x6698ff, 0xa335ee, 0xff8000];

const rgb = (pixels: Pixels, i: number) => (pixels.data[i * 4] << 16) | (pixels.data[i * 4 + 1] << 8) | pixels.data[i * 4 + 2];

/**
 * The background colour: the commonest colour among pixels that match all four neighbours, so a flat
 * area wins over textured ones with more pixels in all. Every other pixel in each direction is enough.
 */
export function findBackground(pixels: Pixels): number {
  const { width, height } = pixels;
  const counts = new Map<number, number>();
  for (let y = 1; y < height - 1; y += 2) {
    for (let x = 1; x < width - 1; x += 2) {
      const i = y * width + x;
      const c = rgb(pixels, i);
      if (c === rgb(pixels, i - 1) && c === rgb(pixels, i + 1) && c === rgb(pixels, i - width) && c === rgb(pixels, i + width)) {
        counts.set(c, (counts.get(c) ?? 0) + 1);
      }
    }
  }
  let best = 0;
  let most = -1;
  for (const [c, n] of counts) if (n > most) [best, most] = [c, n];
  return best;
}

/**
 * Which pixels are count text: the text colours, and the black shadow one pixel down and right of them.
 * (The shadow's the same black as icons' outlines, so it can only be told apart by where it is.)
 */
export function findText(pixels: Pixels): Uint8Array {
  const { width, height } = pixels;
  const text = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    if (!TEXT_COLOURS.includes(rgb(pixels, i))) continue;
    text[i] = 1;
    const x = i % width;
    if (x + 1 < width && i + width + 1 < width * height) {
      const shadow = i + width + 1;
      if (!TEXT_COLOURS.includes(rgb(pixels, shadow))) text[shadow] = 2;
    }
  }
  return text;
}

/** Icons are at most 32px square (more or less: a few overhang); anything bigger is the interface. */
const MAX_ICON = 40;

/**
 * Groups of connected pixels (8 neighbours) where `include` is true, as bounding boxes, with groups
 * up to `gap` pixels apart merged into one. Groups bigger than an icon are left out first, or the
 * bank's frame, one shape around everything, would swallow the lot.
 */
function groups(width: number, height: number, include: (i: number) => boolean, gap: number): Box[] {
  const seen = new Uint8Array(width * height);
  const stack = new Int32Array(width * height);
  const boxes: Box[] = [];
  for (let start = 0; start < width * height; start++) {
    if (seen[start] || !include(start)) continue;
    const box = { left: width, top: height, right: -1, bottom: -1 };
    let top = 0;
    stack[top++] = start;
    seen[start] = 1;
    while (top) {
      const i = stack[--top];
      const x = i % width;
      const y = (i - x) / width;
      box.left = Math.min(box.left, x);
      box.right = Math.max(box.right, x);
      box.top = Math.min(box.top, y);
      box.bottom = Math.max(box.bottom, y);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const j = ny * width + nx;
          if (!seen[j] && include(j)) {
            seen[j] = 1;
            stack[top++] = j;
          }
        }
      }
    }
    if (box.right - box.left < MAX_ICON && box.bottom - box.top < MAX_ICON) boxes.push(box);
  }
  return merge(boxes, gap);
}

/**
 * Boxes merged wherever two are up to `gap` pixels apart, until none are. They're kept in order of their
 * tops, so each is only checked against those below it until one starts too far down. A box that grows
 * is checked against the rest again straight away, and whole passes repeat only while one merged
 * something (a grown box can reach one already passed). Checking every pair, and starting over after
 * every merge, made a 4K screenshot, whose icons fall into thousands of pieces, take minutes.
 */
function merge(boxes: Box[], gap: number): Box[] {
  const near = (a: Box, b: Box) =>
    a.left - gap <= b.right && b.left - gap <= a.right && a.top - gap <= b.bottom && b.top - gap <= a.bottom;
  boxes.sort((a, b) => a.top - b.top);
  let merged = true;
  while (merged) {
    merged = false;
    for (let a = 0; a < boxes.length; a++) {
      for (let b = a + 1; b < boxes.length; b++) {
        // Sorted by top, so every box from here on starts lower still.
        if (boxes[b].top - gap > boxes[a].bottom) break;
        if (!near(boxes[a], boxes[b])) continue;
        const [p, q] = [boxes[a], boxes[b]];
        boxes[a] = {
          left: Math.min(p.left, q.left),
          top: Math.min(p.top, q.top),
          right: Math.max(p.right, q.right),
          bottom: Math.max(p.bottom, q.bottom),
        };
        // Removed in place, keeping the order (the grown box's top is still its own, the higher), and
        // the grown box is checked from the start.
        boxes.splice(b, 1);
        b = a;
        merged = true;
      }
    }
  }
  return boxes;
}

/**
 * How far a pixel's colour can be from the background's, on each channel, and still count as
 * background. Enough for the darker square behind a hovered slot, which shades up to about 19 off
 * (its edge). Icons lose a few pixels close to the background to it too, but their black outlines
 * keep them whole, and matching compares the screenshot's own colours.
 */
export const BACKGROUND_TOLERANCE = 20;

const near = (a: number, b: number, tolerance: number) =>
  Math.abs((a >> 16) - (b >> 16)) <= tolerance &&
  Math.abs(((a >> 8) & 255) - ((b >> 8) & 255)) <= tolerance &&
  Math.abs((a & 255) - (b & 255)) <= tolerance;

/**
 * The count text's words (each a box around one number) and the icons (each a box around one item),
 * from the pixels that aren't background.
 */
export function findShapes(pixels: Pixels, background: number, text: Uint8Array, tolerance = BACKGROUND_TOLERANCE) {
  const { width, height } = pixels;
  const words = groups(width, height, (i) => text[i] === 1, 3);
  // Icons touching the screenshot's edge may be cut off, so they're left out.
  const icons = groups(width, height, (i) => !text[i] && !near(rgb(pixels, i), background, tolerance), 2).filter(
    (box) => box.left > 0 && box.top > 0 && box.right < width - 1 && box.bottom < height - 1,
  );
  return { words, icons };
}

/** The stack count font's digits, row by row (8 rows), "#" for a lit pixel. */
const DIGITS_HEIGHT = 8;
const DIGITS = [
  "..#../.#.#./#...#/#...#/#...#/#...#/.#.#./..#..",
  ".#./##./.#./.#./.#./.#./.#./###",
  ".###./#...#/....#/...#./..#../.#.../#..../#####",
  ".##./#..#/...#/.##./...#/...#/#..#/.##.",
  "#.../#.../#.../#.#./#.#./####/..#./..#.",
  "####/#.../#.../###./...#/...#/#..#/.##.",
  "..##./.#..#/#..../#.##./##..#/#...#/#...#/.###.",
  "####/...#/..#./..#./.#../.#../#.../#...",
  ".###./#...#/#...#/.###./#...#/#...#/#...#/.###.",
  ".###./#...#/#...#/.#..#/..###/....#/....#/....#",
];

/**
 * Big stacks end in a letter that multiplies them: "K" for thousands (from 100K, so the last three
 * digits are lost: 109K is 109,000 to 109,999, read as 109,000). ponytail: no "M" yet, as no screenshot
 * so far has one; add its glyph (×1,000,000) when one does.
 */
const MULTIPLIERS: Record<string, number> = { "#..../#..#./#.#../##.../##.../#.#../#..#./#...#": 1000 };

/**
 * The number a word of count text spells (`truncated` if it ends in a multiplier), or undefined if a
 * glyph isn't one it knows. Glyphs are the runs of lit columns between empty ones.
 */
type Count = { value: number; truncated: boolean };
function readNumber(text: Uint8Array, width: number, box: Box): Count | undefined {
  let value = "";
  let start = -1;
  for (let x = box.left; x <= box.right + 1; x++) {
    let lit = false;
    for (let y = box.top; y <= box.bottom && x <= box.right; y++) if (text[y * width + x] === 1) lit = true;
    if (lit && start < 0) start = x;
    if (lit || start < 0) continue;
    const rows: string[] = [];
    for (let y = box.top; y <= box.bottom; y++) {
      let row = "";
      for (let gx = start; gx < x; gx++) row += text[y * width + gx] === 1 ? "#" : ".";
      rows.push(row);
    }
    const glyph = rows.join("/");
    start = -1;
    const multiplier = MULTIPLIERS[glyph];
    if (multiplier) return value && x > box.right ? { value: Number(value) * multiplier, truncated: true } : undefined;
    const digit = DIGITS.indexOf(glyph);
    if (digit < 0) return undefined;
    value += digit;
  }
  return value ? { value: Number(value), truncated: false } : undefined;
}

/**
 * Each icon with its stack count. A count is printed from its slot's top-left corner, so it belongs to
 * the icon level with or just below it whose middle is nearest a slot's width (about 32px) in from where
 * it starts. Icons with no count are single items.
 */
function pairCounts(icons: Box[], words: Box[], text: Uint8Array, width: number): Icon[] {
  const counts = new Map<Box, Count>();
  for (const word of words) {
    if (word.bottom - word.top !== DIGITS_HEIGHT - 1) continue;
    const count = readNumber(text, width, word);
    if (count === undefined) continue;
    let best: Box | undefined;
    let distance = Infinity;
    for (const icon of icons) {
      if (icon.bottom < word.top || icon.top > word.bottom + 16) continue;
      const d = Math.abs((icon.left + icon.right) / 2 - (word.left + 16));
      if (d < distance && d < 20) [best, distance] = [icon, d];
    }
    if (best) counts.set(best, count);
  }
  return icons.map((box) => {
    const count = counts.get(box);
    return count ? { box, count: count.value, truncated: count.truncated || undefined } : { box, count: 1 };
  });
}

/**
 * An item's icon to match against: its pixels, with each one's alpha as how closely a screenshot's
 * pixel must match it (255 exactly, 230 within 25 of each channel, 0 not at all, around the icon).
 */
export type Template = { id: number; pixels: Pixels };

/**
 * How much of a template an icon must match to count as that item. The game's icons score 0.87 to 1.00
 * against the wiki's; the nearest wrong tier 0.78 at most, and other items under 0.6.
 */
const MATCH = 0.8;

/**
 * Scores within this of each other are a tie, broken by closeness in colour: some items' icons differ
 * only by a shade, within the tolerance, so both match in full.
 */
const TIE = 0.02;

/**
 * How well the screenshot matches `template` with the template's top-left at (left, top): the share of
 * its weighted pixels within their tolerance, and how far off in colour those are on average. Stops
 * early once it can't reach `MATCH` (share 0).
 */
function score(pixels: Pixels, template: Pixels, left: number, top: number) {
  let total = 0;
  for (let i = 3; i < template.data.length; i += 4) if (template.data[i]) total++;
  let misses = 0;
  let error = 0;
  const allowed = total * (1 - MATCH);
  for (let y = 0; y < template.height; y++) {
    for (let x = 0; x < template.width; x++) {
      const t = (y * template.width + x) * 4;
      const alpha = template.data[t + 3];
      if (!alpha) continue;
      const sx = left + x;
      const sy = top + y;
      const tolerance = 255 - alpha;
      let miss = sx < 0 || sy < 0 || sx >= pixels.width || sy >= pixels.height;
      let off = 0;
      if (!miss) {
        const s = (sy * pixels.width + sx) * 4;
        for (let c = 0; c < 3 && !miss; c++) {
          const d = Math.abs(pixels.data[s + c] - template.data[t + c]);
          miss = d > tolerance;
          off += d;
        }
      }
      if (miss) {
        if (++misses > allowed) return { share: 0, error: Infinity };
      } else error += off;
    }
  }
  return { share: 1 - misses / total, error: error / (total - misses) };
}

/**
 * The items an icon could be, best first: each template it matches at least `MATCH` of, lined up on the
 * icon's top-left corner give or take a pixel (renders shift a little), at its best placement. A template
 * whose size differs from the icon's by more than a couple of pixels is a different item.
 */
function identify(pixels: Pixels, icon: Box, templates: Template[]): number[] {
  const matches: { id: number; share: number; error: number }[] = [];
  for (const { id, pixels: template } of templates) {
    if (Math.abs(template.width - (icon.right - icon.left + 1)) > 2) continue;
    if (Math.abs(template.height - (icon.bottom - icon.top + 1)) > 2) continue;
    let best = { share: 0, error: Infinity };
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const s = score(pixels, template, icon.left + dx, icon.top + dy);
        if (s.share > best.share + TIE || (s.share > best.share - TIE && s.error < best.error)) best = s;
      }
    }
    if (best.share >= MATCH) matches.push({ id, ...best });
  }
  matches.sort((a, b) => (Math.abs(a.share - b.share) > TIE ? b.share - a.share : a.error - b.error));
  return matches.map(({ id }) => id);
}

/** The background to key out: its colour (found if not given) and tolerance, as the user picks them. */
export type Key = { background?: number; tolerance?: number };

/** Every icon in a bank screenshot, with its count. */
export function findIcons(pixels: Pixels, { background, tolerance }: Key = {}): Icon[] {
  const text = findText(pixels);
  const { words, icons } = findShapes(pixels, background ?? findBackground(pixels), text, tolerance);
  return pairCounts(icons, words, text, pixels.width);
}

/**
 * An icon found in a bank screenshot: where it is, its count, the item it most likely is (`id`, null when
 * it matched no template), and every item it matched, best first (`candidates`, starting with `id`), for
 * the user to correct it from. Some items' icons are identical (Big bones and Baby dragon bones), so the
 * best isn't always right.
 */
export type Match = Icon & { id: number | null; candidates: number[] };

/** An icon's middle. */
const middle = ({ left, top, right, bottom }: Box) => ({ x: (left + right) / 2, y: (top + bottom) / 2 });

/** The middle of a sorted list. */
const median = (values: number[]) => values.sort((a, b) => a - b)[Math.floor(values.length / 2)];

/**
 * The icons that sit in the bank's grid of slots, the named ones and the unnamed between them. Everything
 * else the screenshot shows (tabs, buttons, text, the frame, the inventory beside it) falls apart into
 * shapes too, so an unnamed one only counts as a slot where the grid has it:
 * - Specks too small to be an item are dropped first.
 * - The grid's spacing starts as the commonest distance from an icon to the next along its row (or
 *   column), lined up on the named icons, which are certainly slots; then it's fitted to every icon on it,
 *   so it doesn't drift off over many rows.
 * - An icon's on the grid if its middle's within a quarter of a slot of one. The bank's columns and rows
 *   are the ones running through the named icons, and those next to them that are at least half as full
 *   as the fullest: other grids (the inventory's, the presets') are offset or sparse.
 * Without two named icons there's no grid to go by, so only the named are kept.
 */
export function inGrid(found: Match[]): Match[] {
  const named = found.filter(({ id }) => id !== null);
  if (named.length < 2) return named;
  const shapes = found.filter(({ id, box }) => {
    const width = box.right - box.left + 1;
    const height = box.bottom - box.top + 1;
    return id !== null || (Math.min(width, height) >= 6 && Math.max(width, height) >= 12);
  });
  const centres = shapes.map(({ box }) => middle(box));

  // Per axis: the spacing, then where the grid lines fall, then each icon's line (or none, off the grid).
  const axis = (along: "x" | "y", across: "x" | "y") => {
    const gaps: number[] = [];
    for (const a of centres) {
      let nearest = Infinity;
      for (const b of centres) {
        const d = b[along] - a[along];
        if (d > 8 && d < nearest && Math.abs(b[across] - a[across]) <= 4) nearest = d;
      }
      if (nearest < Infinity) gaps.push(nearest);
    }
    if (!gaps.length) return undefined;
    let step = median(gaps);
    let origin = median(named.map(({ box }) => middle(box)[along] % step));
    const line = (at: number) => {
      const index = (at - origin) / step;
      return Math.abs(index - Math.round(index)) <= 0.25 ? Math.round(index) : undefined;
    };
    // Refitted to the icons on it: the straight line through (line, position), by least squares.
    for (let pass = 0; pass < 2; pass++) {
      const points = centres.flatMap((c) => {
        const index = line(c[along]);
        return index === undefined ? [] : [[index, c[along]]];
      });
      const n = points.length;
      const mx = points.reduce((sum, [x]) => sum + x, 0) / n;
      const my = points.reduce((sum, [, y]) => sum + y, 0) / n;
      const sxx = points.reduce((sum, [x]) => sum + (x - mx) ** 2, 0);
      if (!sxx) break;
      step = points.reduce((sum, [x, y]) => sum + (x - mx) * (y - my), 0) / sxx;
      origin = my - step * mx;
    }
    // The bank's lines: those through named icons, then outwards while they're at least half as full as
    // the fullest.
    const counts = new Map<number, number>();
    for (const c of centres) {
      const index = line(c[along]);
      if (index !== undefined) counts.set(index, (counts.get(index) ?? 0) + 1);
    }
    const full = Math.max(...counts.values()) / 2;
    const own = named.map(({ box }) => line(middle(box)[along])).filter((index) => index !== undefined);
    let [first, last] = [Math.min(...own), Math.max(...own)];
    while ((counts.get(first - 1) ?? 0) >= full) first--;
    while ((counts.get(last + 1) ?? 0) >= full) last++;
    return (at: number) => {
      const index = line(at);
      return index !== undefined && index >= first && index <= last;
    };
  };
  const columns = axis("x", "y");
  const rows = axis("y", "x");
  if (!columns || !rows) return named;
  return shapes.filter(({ id, box }) => {
    const { x, y } = middle(box);
    return id !== null || (columns(x) && rows(y));
  });
}

/**
 * Every slot's icon in a bank screenshot (see `inGrid`), named where it matches a template. `onProgress` hears after each
 * icon's been identified, the slow part: each is checked against every template.
 */
export function scanBank(
  pixels: Pixels,
  templates: Template[],
  key: Key = {},
  onProgress?: (done: number, total: number) => void,
): Match[] {
  const found: Match[] = [];
  const icons = findIcons(pixels, key);
  for (const [index, icon] of icons.entries()) {
    const candidates = identify(pixels, icon.box, templates);
    found.push({ ...icon, id: candidates[0] ?? null, candidates });
    onProgress?.(index + 1, icons.length);
  }
  return inGrid(found);
}
