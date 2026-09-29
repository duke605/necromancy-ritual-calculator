"use client";

import { useState } from "react";
import items from "@/data/items.json";
import { Accordion } from "@/lib/components/accordion";
import { Equipment, type EquipmentSlot } from "@/lib/components/equipment";
import { Field } from "@/lib/components/field";
import { RitualSite } from "@/lib/components/ritual-site";
import { Select } from "@/lib/components/select";
import { Spinner } from "@/lib/components/spinner";
import { ResetButton } from "@/lib/components/reset-button";
import { Button } from "@/lib/components/ui/button";
import { layoutGlyphs } from "@/lib/glyph-layout";
import { useCalculator } from "@/lib/calculator";
import { useInventory } from "@/lib/inventory";
import { SITE_NAMES, SITES, type RitualSiteName } from "@/lib/sites";
import { usePriceStats } from "@/lib/hooks/use-price-stats";
import { useSettings } from "@/lib/settings";
import { Alterations, Results } from "./alterations";
import { ChooseGear, GEAR_SLOTS, gearEffects } from "./choose-gear";
import { ChooseRitual } from "./choose-ritual";

/**
 * The site, chosen over it, with the ritual on it: its glyphs laid out, and its focus item on the focus.
 * Clicking the focus item, or the button under the site, chooses the ritual and its focus item. Beside
 * the site (under it on smaller screens), the alteration glyphs on it, kept for each ritual, on its left, and
 * the results on its right, both against it, and under the results the worn equipment, chosen from the gear
 * that changes rituals. All of it is kept between visits, so a spinner shows until it's loaded, rather than
 * the defaults for a moment.
 */
export function Calculator() {
  const ritualLoaded = useCalculator((state) => state.loaded);
  const settingsLoaded = useSettings((state) => state.loaded);
  const inventoryLoaded = useInventory((state) => state.loaded);
  return ritualLoaded && settingsLoaded && inventoryLoaded ? <LoadedCalculator /> : <Loading />;
}

/** The spinner, until the saved ritual's in. */
function Loading() {
  return (
    <div className="flex flex-col items-center gap-4 py-24">
      <Spinner size="xl" label="Loading your ritual" />
      <p className="body-sm text-muted-foreground" aria-hidden>
        Summoning your ritual…
      </p>
    </div>
  );
}

function LoadedCalculator() {
  const { ritual, rituals: times } = useCalculator();
  const { setRitual, setRituals, reset } = useCalculator.getState();
  const [choosing, setChoosing] = useState(false);
  const [choosingGear, setChoosingGear] = useState<EquipmentSlot | null>(null);
  const { site, choice, worn } = ritual.config;
  const { input } = ritual.focus;
  const item = items[`${input.id}` as keyof typeof items];
  const { name, image, examine } = item;
  // Not every item can be alched or traded.
  const prices = usePriceStats(input.id, "highAlch" in item ? item.highAlch : undefined);
  return (
    <div className="grid gap-6">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(--spacing(72),1fr)_minmax(0,750px)_minmax(--spacing(72),1fr)]">
        {/* The site and the alteration glyphs, centred against each other in a grid of their own, so the results
            growing beside them don't move them (and the glyph under the pointer). On small screens, not a box at all. */}
        <div className="contents lg:col-span-2 lg:row-start-1 lg:grid lg:grid-cols-subgrid lg:items-center">
          <div className="grid gap-6 lg:col-start-2 lg:row-start-1">
            <div className="w-full max-w-sm justify-self-center">
              <Field label="Site">
                <div className="flex items-center gap-2">
                  <Select
                    className="min-w-0 flex-1"
                    value={site}
                    onChange={(event) => setRitual(ritual.with({ site: event.target.value as RitualSiteName }))}
                  >
                    {Object.entries(SITE_NAMES).map(([id, name]) => (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    ))}
                  </Select>
                  {/* The same as clicking the focus item, for anyone who doesn't know it can be. */}
                  <Button variant="secondary" size="sm" className="shrink-0" onClick={() => setChoosing(true)}>
                    Select focus
                  </Button>
                  <ResetButton label="Reset all" className="shrink-0" onClick={reset} />
                </div>
              </Field>
            </div>
            <RitualSite
              site={site}
              glyphs={layoutGlyphs(SITES[site], ritual.glyphs)}
              focus={{ name, image, examine, amount: input.amount, stats: prices }}
              onFocusClick={() => setChoosing(true)}
            />
          </div>
          {/* Beside the middle of the site art, against its left; on small screens, under the results. */}
          <div className="max-lg:order-2 lg:col-start-1 lg:row-start-1 lg:w-72 lg:justify-self-end">
            <Alterations
              counts={ritual.alterations}
              free={ritual.free}
              capeWorn={ritual.wearsCape}
              onChange={(counts) => setRitual(ritual.withAlterations(counts))}
            />
          </div>
        </div>
        {/* Beside the site art, against its right, from its top, so it only grows down: with the equipment under it. */}
        <div className="flex flex-col gap-4 max-lg:order-1 lg:col-start-3 lg:row-start-1 lg:w-72">
          <Results ritual={ritual} rituals={times ?? ritual.goldenRatio} onRitualsChange={setRituals} />
          <Accordion title="Equipment" open>
            <div className="relative">
              {/* What's worn only. */}
              <ResetButton
                label="Reset equipment"
                className="absolute top-1 right-1 z-10"
                onClick={() => setRitual(ritual.with({ worn: {} }))}
              />
              <Equipment
                items={Object.fromEntries(
                  ritual.gear.map((piece) => [
                    piece.slot,
                    { ...piece, effects: gearEffects(piece, worn[piece.slot as EquipmentSlot]?.glyph) },
                  ]),
                )}
                choosable={GEAR_SLOTS}
                onChoose={setChoosingGear}
              />
            </div>
          </Accordion>
        </div>
      </div>
      <ChooseGear
        slot={choosingGear}
        worn={worn}
        onChoose={(next) => setRitual(ritual.with({ worn: next }))}
        onClose={() => setChoosingGear(null)}
      />
      <ChooseRitual
        open={choosing}
        choice={choice}
        onChoose={(next) => setRitual(ritual.with({ choice: next }))}
        onClose={() => setChoosing(false)}
      />
    </div>
  );
}
