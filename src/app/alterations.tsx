"use client";

import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react";
import Image from "next/image";
import glyphs from "@/data/glyphs.json";
import { Accordion } from "@/lib/components/accordion";
import { Field } from "@/lib/components/field";
import { NumberInput } from "@/lib/components/number-input";
import { ResetButton } from "@/lib/components/reset-button";
import { Select } from "@/lib/components/select";
import type { GlyphName } from "@/lib/components/ritual-site";
import { Button } from "@/lib/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/lib/components/ui/tooltip";
import type { Ritual } from "@/lib/ritual";
import { ADDED_RITUALS, plan } from "@/lib/plan";
import { formatDuration } from "@/lib/ritual-duration";
import { useInventory } from "@/lib/inventory";
import { useSettings } from "@/lib/settings";
import type { RitualName } from "./choose-ritual";
import { FocusSelect } from "./focus-select";
import { ResultSettings, Setting } from "./result-settings";
import { ItemLine, Lines, PlainLine, RitualLine, TotalRow, Totals } from "./result-lines";

/** How many of each alteration glyph are on the site. */
export type AlterationCounts = Partial<Record<GlyphName, number>>;

export const ALTERATIONS = (Object.keys(glyphs) as GlyphName[]).filter((name) => "alteration" in glyphs[name]);

/** The alteration glyphs as options, with their icons, and their levels after their names with the Necromancy icon. */
export function AlterationOptions() {
  return ALTERATIONS.map((name) => (
    <option
      key={name}
      value={name}
      data-level={glyphs[name].level}
      style={{ "--option-icon": `url("${glyphs[name].image}")` } as React.CSSProperties}
    >
      {name}
    </option>
  ));
}

/**
 * How many of each alteration glyph to put on the site, up to the spots the ritual's own glyphs leave `free`,
 * under `header`. While `disabled`, they're only shown. It folds away.
 */
export function Alterations({
  counts,
  free,
  disabled,
  header,
  onChange,
  onReset = () => onChange({}),
}: {
  counts: AlterationCounts;
  free: number;
  disabled?: boolean;
  header?: React.ReactNode;
  onChange: (counts: AlterationCounts) => void;
  onReset?: () => void;
}) {
  const placed = Object.values(counts).reduce((sum, count) => sum + count, 0);
  return (
    <Accordion
      title="Alteration glyphs"
      open
      action={<ResetButton label="Reset alteration glyphs" onClick={onReset} />}
    >
      <div className="flex flex-col gap-4">
        {header}
        <p className="body-sm text-muted-foreground" aria-live="polite">
          {placed} of {free} free spots
        </p>
        <ul className="flex flex-col gap-1.5">
          {ALTERATIONS.map((name) => {
            const count = counts[name] ?? 0;
            return (
              <li key={name} className="flex items-center gap-2">
                <Image src={glyphs[name].image} alt="" aria-hidden width={24} height={24} className="size-6" />
                <span className="body-sm flex-1">{name}</span>
                <NumberInput
                  aria-label={name}
                  min={0}
                  max={count + free - placed}
                  value={count}
                  disabled={disabled}
                  // Only with some to clear.
                  beforeActions={
                    count && !disabled ? (
                      <InputAction
                        label={`Clear ${name}`}
                        tooltip="Clear"
                        onClick={() => onChange({ ...counts, [name]: 0 })}
                      >
                        <XIcon />
                      </InputAction>
                    ) : undefined
                  }
                  // Typing isn't held to `max` as the buttons are.
                  onChange={(event) =>
                    onChange({
                      ...counts,
                      [name]: Math.min(Math.max(event.target.valueAsNumber || 0, 0), count + free - placed),
                    })
                  }
                />
              </li>
            );
          })}
        </ul>
      </div>
    </Accordion>
  );
}

/** Which ritual's alteration glyphs are shown: `ritual`, or (`value`) one Ironman mode adds. */
export function AddedRitualSelect({
  ritual,
  value,
  onChange,
}: {
  ritual: Ritual;
  value?: RitualName;
  onChange: (value?: RitualName) => void;
}) {
  return (
    <Field label="Ritual">
      <Select
        className="w-full"
        value={value ?? ""}
        onChange={(event) => onChange((event.target.value || undefined) as RitualName)}
      >
        <option value="">{ritual.config.choice.ritual}</option>
        <optgroup label="Added rituals">
          {ADDED_RITUALS.map(({ ritual: name }) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </optgroup>
      </Select>
    </Field>
  );
}

/**
 * Whether the added ritual `name` (`shown`) is set up as `main`, and if not, its cape glyph. Turned off, it starts
 * from what it had.
 */
export function AddedSetupControls({ main, shown, name }: { main: Ritual; shown: Ritual; name: RitualName }) {
  const { added, setAdded } = useSettings();
  const setup = added[name] ?? { same: true };
  return (
    <>
      <Setting
        title="Same as main ritual"
        description="Its alteration glyphs, as many as fit, and cape glyph."
        on={setup.same}
        onChange={(same) =>
          setAdded(name, same ? { same } : { same, alterations: shown.alterations, cape: shown.capeGlyph })
        }
      />
      {main.wearsCape && (
        <Field label="Cape glyph">
          <Select
            value={shown.capeGlyph ?? ""}
            disabled={setup.same}
            onChange={(event) =>
              !setup.same && setAdded(name, { ...setup, cape: (event.target.value || undefined) as GlyphName })
            }
          >
            <option value="">None</option>
            <AlterationOptions />
          </Select>
        </Field>
      )}
    </>
  );
}

/**
 * What `rituals` rituals (the golden ratio unless one's typed) take, make and give, and how long they take. It
 * folds away.
 */
export function Results({
  ritual,
  rituals,
  onRitualsChange,
  onChooseFocus,
}: {
  ritual: Ritual;
  rituals: number;
  onRitualsChange: (rituals?: number) => void;
  /** Opens the ritual and focus item chooser. */
  onChooseFocus: () => void;
}) {
  const golden = ritual.goldenRatio;
  // The multiples of the golden ratio either side; none before the first.
  const [previous, next] = [(Math.ceil(rituals / golden) - 1) * golden, (Math.floor(rituals / golden) + 1) * golden];
  return (
    <Accordion
      title="Results"
      open
      // Back to the golden ratio.
      action={<ResetButton label="Reset results" onClick={() => onRitualsChange()} />}
    >
      <div className="flex flex-col gap-4">
        <Field label="Focus">
          <FocusSelect choice={ritual.config.choice} onClick={onChooseFocus} />
        </Field>
        <Field label="Rituals" help={`Golden ratio: ${golden}`}>
          <NumberInput
            min={1}
            value={rituals}
            shimmer={rituals % golden === 0}
            // Emptied, it's the golden ratio again.
            onChange={(event) => onRitualsChange(Math.max(event.target.valueAsNumber, 1) || undefined)}
            beforeActions={
              <InputAction
                label={`Previous golden ratio, ${previous}`}
                tooltip={`Previous golden ratio: ${previous}`}
                disabled={previous < 1}
                onClick={() => onRitualsChange(previous)}
              >
                <ChevronLeftIcon />
              </InputAction>
            }
            afterActions={
              <InputAction
                label={`Next golden ratio, ${next}`}
                tooltip={`Next golden ratio: ${next}`}
                onClick={() => onRitualsChange(next)}
              >
                <ChevronRightIcon />
              </InputAction>
            }
          />
        </Field>
        {/* Settings, kept by the reset. */}
        <ResultSettings />
        <Summary ritual={ritual} rituals={rituals} />
      </div>
    </Accordion>
  );
}

/**
 * The rituals to perform, what `rituals` rituals take and make, how long they take, the XP they give, and the soul
 * attraction.
 */
function Summary({ ritual, rituals }: { ritual: Ritual; rituals: number }) {
  const { fromInventory, ironman, noWaste, added } = useSettings();
  const inventory = useInventory((state) => state.counts);
  const {
    steps,
    inputs,
    outputs: made,
    souls,
    seconds,
    experience,
    disturbanceChances,
    glyphsLeftOff,
  } = plan(ritual, rituals, {
    ironman,
    noWaste,
    inventory: fromInventory ? inventory : {},
    added,
  });
  return (
    <div className="body-sm flex flex-col gap-3">
      {glyphsLeftOff && (
        <p role="status" className="text-gold-300">
          Not self-sustaining: alteration glyphs left off the added rituals.
        </p>
      )}
      <Lines title="Rituals to perform">
        {/* By place: a ritual can be on the list twice (necroplasm made for its own ink). */}
        {steps.map((step, index) => (
          <RitualLine key={index} {...step} />
        ))}
      </Lines>
      <Lines title="Input">
        {inputs.map((input) => (
          <ItemLine key={input.id} {...input} />
        ))}
      </Lines>
      <Lines title="Output">
        {made.map((output) => (
          <ItemLine key={output.id} {...output} />
        ))}
        {/* Souls go to the Well of Souls; they aren't an item, so they take soul attraction's lit face. */}
        {souls > 0 && <PlainLine name="Souls" image="/icons/soul-attraction.png" amount={souls} />}
      </Lines>
      <Totals inputs={inputs} outputs={made}>
        <TotalRow icon="/icons/greater-ritual-candle.png" label="Rituals">
          {steps.reduce((sum, { count }) => sum + count, 0).toLocaleString("en")}
        </TotalRow>
        <TotalRow icon="/icons/soul-attraction-off.png" label="Disturbance chances">
          {disturbanceChances.toLocaleString("en")}
        </TotalRow>
        <TotalRow icon="/icons/timer.png" label="Duration">
          {formatDuration(seconds)}
        </TotalRow>
        <TotalRow icon="/icons/necromancy.png" label="Experience">
          {experience.toLocaleString("en", { maximumFractionDigits: 1 })}
        </TotalRow>
      </Totals>
      <dl className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Soul attraction</dt>
          <dd>
            <SoulAttraction value={ritual.soulAttraction} />
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Multiplier</dt>
          <dd>
            {ritual.multiplier}%{/* Necroplasm's apart, where the Underworld Grimoire makes it more. */}
            {(ritual.necroplasmMultiplier ?? ritual.multiplier) !== ritual.multiplier &&
              ` · ${ritual.necroplasmMultiplier}% necroplasm`}
          </dd>
        </div>
      </dl>
    </div>
  );
}

/** An icon button for a number input's actions, named by `label`, with `tooltip` (the label unless given). */
function InputAction({
  label,
  tooltip = label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  tooltip?: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button type="button" variant="ghost" size="icon-sm" aria-label={label} disabled={disabled} onClick={onClick}>
            {children}
          </Button>
        }
      />
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

/** Soul attraction's levels, as the game rates them: the most each goes up to, in percent. */
const ATTRACTION = [
  ["Low", 100],
  ["Medium", 200],
  ["High", 300],
  ["Extreme", 500],
  ["Dangerous", Infinity],
] as const;

/**
 * Soul attraction (a percentage) as the game shows it: five faces, one lit for each level it's reached, the
 * rest dark.
 */
function SoulAttraction({ value }: { value: number }) {
  const level = ATTRACTION.findIndex(([, most]) => value <= most);
  const label = `${ATTRACTION[level][0]}, ${value}%`;
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="flex" role="img" aria-label={label} />}>
        {ATTRACTION.map(([name], index) => (
          <Image
            key={name}
            src={index <= level ? "/icons/soul-attraction.png" : "/icons/soul-attraction-off.png"}
            alt=""
            width={20}
            height={20}
            className="size-5"
          />
        ))}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
