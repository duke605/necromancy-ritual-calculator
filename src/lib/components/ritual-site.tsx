import Image from "next/image";
import { useId } from "react";
import glyphData from "@/data/glyphs.json";
import inks from "@/data/inks.json";
import items from "@/data/items.json";
import { ItemImage } from "./item-image";
import { ItemTooltip } from "./item-tooltip";
import { layoutGlyphs } from "@/lib/glyph-layout";
import { SITES, type RitualSiteName } from "@/lib/sites";

/** What goes on a spot: a glyph, a light source, or the focus. */
type Spot = "glyph" | "light" | "focus";

const SPOTS: Record<string, Spot> = { G: "glyph", L: "light", F: "focus" };
const LABELS: Record<Spot, string> = { glyph: "Glyph", light: "Light source", focus: "Focus" };
/** What's shown on lit light spots: any tier works, and npm run data saves the greater candle's picture. */
const LIGHT = { name: "Greater ritual candle", image: "/images/lights/greater-ritual-candle.webp" };

/**
 * The ground around a site's tiles, behind them: a 0 to 100 box over the tiles, reaching past it (as far as
 * .ritual-site's --reach allows). The Underworld's is round, from its floor design: green
 * marble with a worn gold edge, a dark blue ring, a stone ring, then blue slate with dark sockets for the
 * braziers. Ungael's is a rim of its tiles' colour, a dark edge and a lighter one, with blocks jutting out
 * either side of the middle of each side.
 */
const GROUNDS: Partial<Record<RitualSiteName, React.ReactNode>> = {
  underworld: (
    <>
      <circle className="ritual-ground-slate" cx="50" cy="50" r="91.4" />
      {/* Three either side; none top or bottom. */}
      {[60, 90, 120, 240, 270, 300].map((angle) => (
        <rect
          key={angle}
          className="ritual-ground-socket"
          x="47.5"
          y="-39.9"
          width="5"
          height="5"
          rx="0.8"
          transform={`rotate(${angle} 50 50)`}
        />
      ))}
      <circle className="ritual-ground-stone" cx="50" cy="50" r="81.4" />
      {/* About 35px on the style guide's site. */}
      <circle className="ritual-ground-deep" cx="50" cy="50" r="78.4" />
      <circle className="ritual-ground-marble" cx="50" cy="50" r="64" />
    </>
  ),
  ungael: (
    <>
      {/* Three bands, each about 7.5px on the style guide's site: lighter outside, dark, then the tiles' own. */}
      <rect className="ritual-ground-edge-outer" x="-6.9" y="-6.9" width="113.8" height="113.8" rx="1" />
      <rect className="ritual-ground-edge" x="-4.8" y="-4.8" width="109.6" height="109.6" />
      <rect className="ritual-ground-rim" x="-2.7" y="-2.7" width="105.4" height="105.4" />
      {/* Blocks either side of the middle of each side, jutting out past the edge. */}
      {[0, 90, 180, 270].map((angle) => (
        <g key={angle} transform={`rotate(${angle} 50 50)`}>
          <rect className="ritual-ground-block" x="32" y="-12.9" width="6" height="8.1" />
          <rect className="ritual-ground-block" x="62" y="-12.9" width="6" height="8.1" />
        </g>
      ))}
    </>
  ),
};

export type GlyphName = keyof typeof glyphData;

/** An item on the focus: what the ritual's done to, and how many. */
export type FocusItem = {
  name: string;
  image: string;
  examine?: string;
  amount: number;
  /** More lines for its tooltip, after the amount, e.g. its prices. */
  stats?: { label: string; value: React.ReactNode }[];
};

/**
 * A ritual site from above: each spot a slate, shaped by what goes there, laid out as on the ground.
 * `glyphs` are what's on the glyph spots, in reading order (left to right, then down); a gap leaves one empty.
 * `lights` light that many light spots, laid out as symmetrically as glyphs.
 * `focus` is the item on the focus; clicking it calls `onFocusClick`, if there is one.
 */
export function RitualSite({
  site,
  glyphs = [],
  lights = 0,
  focus,
  onFocusClick,
}: {
  site: RitualSiteName;
  glyphs?: (GlyphName | undefined)[];
  lights?: number;
  focus?: FocusItem;
  onFocusClick?: () => void;
}) {
  const rows = SITES[site];
  let glyphSpot = 0;
  const lit = layoutGlyphs(rows, [{ name: LIGHT.name, amount: lights }], "L");
  let lightSpot = 0;
  return (
    // The frame measures the room there is, so the grid in it can shrink to fit.
    <div className="ritual-site-frame">
      <div
        className="ritual-site"
        data-site={site}
        style={{ "--columns": rows[0].length, "--rows": rows.length } as React.CSSProperties}
      >
        {GROUNDS[site] && (
          <svg className="ritual-site-ground" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            {GROUNDS[site]}
          </svg>
        )}
        <div className="ritual-site-tiles" aria-hidden />
        {rows.flatMap((row, y) =>
          [...row].map((cell, x) => {
            const spot = SPOTS[cell];
            if (!spot) return null;
            const glyph = spot === "glyph" ? glyphs[glyphSpot++] : undefined;
            const item = spot === "focus" ? focus : undefined;
            const light = spot === "light" ? lit[lightSpot++] : undefined;
            return (
              <div
                key={`${x},${y}`}
                // A glyph's or item's trigger names it; an image can't hold something focusable.
                role={glyph || item ? undefined : "img"}
                aria-label={glyph || item ? undefined : light ? `${LABELS.light}: ${light}` : LABELS[spot]}
                data-spot={spot}
                data-filled={glyph || light ? "" : undefined}
                // The player's choice, not the ritual's, so it's told apart.
                data-alteration={glyph && "alteration" in glyphData[glyph] ? "" : undefined}
                style={{ gridColumn: x + 1, gridRow: y + 1 }}
              >
                <Slate spot={spot} />
                {glyph && <PlacedGlyph name={glyph} />}
                {light && (
                  <>
                    <Image src={LIGHT.image} alt="" width={28} height={28} />
                    <Flame flicker={FLICKERS[lightSpot % FLICKERS.length]} />
                  </>
                )}
                {item && <PlacedFocus item={item} onClick={onFocusClick} />}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}

/** A glyph on its spot, with its tooltip: durability, the ink to draw it, and its examine. */
function PlacedGlyph({ name }: { name: GlyphName }) {
  const { image, durability, inks: cost, examine } = glyphData[name];
  return (
    <ItemTooltip name={name} image={image} stats={[{ label: "Durability", value: durability }]} flavour={examine}>
      <ItemTooltip.Trigger aria-label={`${LABELS.glyph}: ${name}`}>
        <Image src={image} alt="" width={28} height={28} />
      </ItemTooltip.Trigger>
      <ItemTooltip.RowHeading>Cost</ItemTooltip.RowHeading>
      <ItemTooltip.Stats
        // One line per ink, named: the icon backs the name up, since nothing in a tooltip can be hovered.
        stats={Object.entries(cost).map(([ink, amount]) => {
          const { name, image } = items[`${inks[ink as keyof typeof inks].id}` as keyof typeof items];
          return {
            label: name,
            value: (
              <>
                <Image src={image} alt="" aria-hidden width={20} height={20} />
                {amount}
              </>
            ),
          };
        })}
      />
    </ItemTooltip>
  );
}

/**
 * The item on the focus, with its count and its tooltip: its amount, then its other stats. With `onClick`,
 * it's a button.
 */
function PlacedFocus({
  item: { name, image, examine, amount, stats = [] },
  onClick,
}: {
  item: FocusItem;
  onClick?: () => void;
}) {
  return (
    <ItemTooltip
      name={name}
      image={image}
      stats={[{ label: "Amount", value: amount.toLocaleString("en") }, ...stats]}
      flavour={examine}
    >
      <ItemTooltip.Trigger
        aria-label={`${LABELS.focus}: ${name}, ${amount.toLocaleString("en")}`}
        {...(onClick && {
          role: "button",
          "aria-haspopup": "dialog",
          className: "cursor-pointer",
          onClick,
          onKeyDown: (event: React.KeyboardEvent) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            onClick();
          },
        })}
      >
        <ItemImage src={image} alt="" count={amount} />
      </ItemTooltip.Trigger>
    </ItemTooltip>
  );
}

/** How long lit candles' flames take to flicker, in seconds, taken in turn so they don't flicker together. */
const FLICKERS = [1.3, 1.1, 1.45, 1.2, 1.35];

/** A candle's flame and its glow, over the candle's picture (128 by 128), on its wick's tip. */
function Flame({ flicker }: { flicker: number }) {
  const id = useId();
  return (
    <svg
      className="candle-flame"
      viewBox="0 0 128 128"
      aria-hidden
      style={{ "--flicker": `${flicker}s` } as React.CSSProperties}
    >
      <defs>
        <radialGradient id={`${id}-flame`} cx=".5" cy=".75" r=".7">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".35" stopColor="#bff6ff" />
          <stop offset=".75" stopColor="#3fd8ff" />
          <stop offset="1" stopColor="#2a6cff" stopOpacity=".6" />
        </radialGradient>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" stopColor="#3fd8ff" stopOpacity=".6" />
          <stop offset="1" stopColor="#3fd8ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g transform="translate(66.5 1) scale(3)">
        <circle className="candle-flame-glow" r="7" cy="-4" fill={`url(#${id}-glow)`} />
        <path
          className="candle-flame-fire"
          d="M0 0c-2.4 0-3.4-1.8-3.4-3.6 0-2.6 2.2-4.6 3.4-8.4 1.2 3.8 3.4 5.8 3.4 8.4 0 1.8-1 3.6-3.4 3.6z"
          fill={`url(#${id}-flame)`}
        />
      </g>
    </svg>
  );
}

/** Glyphs' slates are square, light sources' five-sided with an eye, the focus's round; corners rounded. */
function Slate({ spot }: { spot: Spot }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden>
      {spot === "glyph" && (
        <>
          <rect className="slate-edge" x="2" y="2" width="36" height="36" rx="4" />
          <rect className="slate-face" x="5.5" y="5.5" width="29" height="29" rx="2.5" />
        </>
      )}
      {spot === "light" && (
        <>
          <path
            className="slate-edge"
            d="M16.77 4.36Q20 2 23.23 4.36L35.27 13.14Q38.5 15.5 37.29 19.31L32.71 33.69Q31.5 37.5 27.5 37.5L12.5 37.5Q8.5 37.5 7.29 33.69L2.71 19.31Q1.5 15.5 4.73 13.14Z"
          />
          <path
            className="slate-face"
            d="M17.98 7.97Q20 6.5 22.02 7.97L32.48 15.53Q34.5 17 33.71 19.37L29.79 31.13Q29 33.5 26.5 33.5L13.5 33.5Q11 33.5 10.21 31.13L6.29 19.37Q5.5 17 7.52 15.53Z"
          />
          <path className="slate-mark" d="M12 21q8-8 16 0-8 8-16 0Z" />
          <circle className="slate-mark" cx="20" cy="21" r="2.5" />
        </>
      )}
      {spot === "focus" && (
        <>
          <circle className="slate-edge" cx="20" cy="20" r="18.5" />
          <circle className="slate-face" cx="20" cy="20" r="15" />
        </>
      )}
    </svg>
  );
}
