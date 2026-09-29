// Downloads ritual, glyph and ink data from the RuneScape Wiki API into src/data/.
// Run `npm run data` to pick up new or changed rituals.
import { mkdir, writeFile } from "node:fs/promises";

const API = "https://runescape.wiki/api.php";
const USER_AGENT = "necromancy-ritual-calculator (https://rituals.duke605.ca)";
const OUT_DIR = new URL("../src/data/", import.meta.url);

type Stack = { name: string; quantity: string; image?: string };
type Production = {
  facility?: string;
  process?: string;
  ticks: string;
  glyphType?: string;
  materials: Stack[];
  outputs: Stack[];
  skills?: { experience: string; level: string }[];
};

// POST so long bucket queries don't hit URL length limits.
async function api(params: Record<string, string>) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "User-Agent": USER_AGENT },
    body: new URLSearchParams({ format: "json", formatversion: "2", ...params }),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${JSON.stringify(params)}`);
  const json = await res.json();
  if (json.error) throw new Error(`${json.error.info ?? JSON.stringify(json.error)}: ${JSON.stringify(params)}`);
  return json;
}

async function bucket<T>(query: string): Promise<T[]> {
  return (await api({ action: "bucket", query })).bucket;
}

// Durability and type of every glyph and light source.
const components = new Map(
  (
    await bucket<{ page_name: string; json: string }>(
      "bucket('ritual_component').select('page_name','json').limit(5000).run()",
    )
  ).map((c) => [c.page_name, JSON.parse(c.json) as { durability: number; type: string }]),
);
const isGlyph = (name: string) => components.get(name)?.type.endsWith("glyph") ?? false;

const recipes = (
  await bucket<{ production_json: string }>(
    "bucket('recipe').select('production_json').where('uses_skill','Necromancy').limit(5000).run()",
  )
).map((r) => JSON.parse(r.production_json) as Production);

// Alteration effects aren't in any bucket; the wiki's own ritual calculator keeps them in this module.
const dataModule = (
  await api({
    action: "query",
    prop: "revisions",
    rvprop: "content",
    rvslots: "main",
    titles: "Module:Necromancy/rituals/data",
  })
).query.pages[0].revisions[0].slots.main.content as string;
const effectKeys: Record<string, string> = { output: "multiply", attraction: "soulAttraction", speed: "duration" };
const effects = new Map<string, Record<string, number>>();
for (const [, name, body] of dataModule.matchAll(/\["([^"]+)"\] = \{[^{}]*\["alteration"\] = \{([^}]*)\}/g)) {
  const glyphEffects: Record<string, number> = {};
  for (const [, key, value] of body.matchAll(/\["([^"]+)"\] = (-?[\d.]+)/g)) {
    if (effectKeys[key]) glyphEffects[effectKeys[key]] = Number(value);
  }
  effects.set(name, glyphEffects);
}

// "Regular ghostly ink" -> "regular"
const inkKey = (name: string) => name.split(" ")[0].toLowerCase();

const glyphRecipes = recipes.filter((r) => r.facility === "Glyph spot" && isGlyph(r.outputs[0]?.name));
const images = await imageUrls(glyphRecipes.map((r) => r.outputs[0].image!));

// Glyphs' examines, for their tooltips' flavour text. They're scenery: each has a depleted variant too, which
// the item infobox doesn't (it has "N/A" for most).
const glyphExamines = new Map(
  (
    await bucket<{ page_name: string; examine?: string }>(
      `bucket('infobox_scenery').select('page_name','examine').where(bucket.Or(${glyphRecipes
        .map((r) => `{'page_name',${JSON.stringify(r.outputs[0].name)}}`)
        .join(",")})).limit(5000).run()`,
    )
  )
    .filter(({ examine }) => examine && !examine.includes("(depleted)"))
    // Some have a doubled space.
    .map(({ page_name, examine }) => [page_name, examine!.replace(/\s+/g, " ")]),
);

const glyphs: Record<string, object> = {};
for (const r of glyphRecipes) {
  const name = r.outputs[0].name;
  const alteration = r.glyphType === "Alteration";
  if (alteration && !effects.has(name)) throw new Error(`No alteration effects for ${name} in the data module`);

  glyphs[name] = {
    level: Number(r.skills?.[0]?.level),
    inks: Object.fromEntries(
      r.materials.filter((m) => m.name.endsWith("ghostly ink")).map((m) => [inkKey(m.name), Number(m.quantity)]),
    ),
    ...(alteration && {
      ectoplasm: Number(r.materials.find((m) => m.name === "Ectoplasm")?.quantity ?? 0),
      ...effects.get(name),
    }),
    durability: components.get(name)!.durability,
    ...(alteration && { alteration }),
    image: images.get(r.outputs[0].image!),
    examine: glyphExamines.get(name),
  };
}

// Rituals refer to items by their game item ID. Souls go straight into the Well of Souls
// and aren't an item, so they get their own field on the focus.
const SOUL = "Soul (Well of Souls)";
const itemImages = new Map<string, string>();
const itemRef = (stack: Stack) => {
  itemImages.set(stack.name, stack.image!);
  return { name: stack.name, amount: Number(stack.quantity) };
};

type ItemRef = { name: string; amount: number };
type Ritual = {
  level: number;
  glyphs: { name: string; amount: number }[];
  focuses: { input: ItemRef; outputs: ItemRef[]; souls?: number }[];
  durationTicks: number;
  disturbanceChances: number;
  experience: number;
};
const rituals: Record<string, Ritual> = {};
for (const r of recipes) {
  if (!r.facility?.startsWith("Ritual site") || !r.process) continue;

  const name = r.process.replace(/ \(ritual\)$/, "");
  const inputs = r.materials.filter((m) => !isGlyph(m.name) && !/ritual candle/i.test(m.name));
  if (inputs.length !== 1) {
    console.warn(`Skipping a ${name} recipe: expected 1 focus, got ${inputs.map((m) => m.name).join(", ")}`);
    continue;
  }

  // Progress ticks are 2 game ticks each. Disturbances can spawn 13 progress ticks
  // before the end and every 12 before that (https://runescape.wiki/w/Rituals).
  const durationTicks = Math.ceil(Number(r.ticks) / 2);
  const ritual = (rituals[name] ??= {
    level: Number(r.skills?.[0]?.level),
    glyphs: r.materials.filter((m) => isGlyph(m.name)).map((m) => ({ name: m.name, amount: Number(m.quantity) })),
    focuses: [],
    durationTicks,
    disturbanceChances: Math.floor((durationTicks - 1) / 12),
    experience: Number(r.skills?.[0]?.experience),
  });

  if (ritual.focuses.some((f) => f.input.name === inputs[0].name)) continue;
  const souls = r.outputs.find((o) => o.name === SOUL);
  ritual.focuses.push({
    input: itemRef(inputs[0]),
    outputs: r.outputs.filter((o) => o !== souls).map(itemRef),
    ...(souls && { souls: Number(souls.quantity) }),
  });
}

// Ink keys come from the glyph recipes; what each ink is made from (for ironmen, who make their own) and how many
// a batch makes come from the ink recipes.
const inks: Record<string, { name: string; makes?: number; materials?: ItemRef[] }> = {};
for (const r of glyphRecipes) {
  for (const m of r.materials) {
    if (m.name.endsWith("ghostly ink")) inks[inkKey(itemRef(m).name)] ??= { name: m.name };
    if (m.name === "Ectoplasm") itemRef(m);
  }
}
for (const r of recipes) {
  const ink = r.outputs.find((o) => o.name.endsWith("ghostly ink"));
  if (ink && inks[inkKey(ink.name)] && !inks[inkKey(ink.name)].materials) {
    Object.assign(inks[inkKey(ink.name)], { makes: Number(ink.quantity), materials: r.materials.map(itemRef) });
  }
}

const itemIds = new Map<string, number>();
const tradeableIds = new Set<number>();
const examines = new Map<string, string>();
const highAlchs = new Map<string, number>();
const itemNames = [...itemImages.keys()];
const infoboxes = await bucket<{
  page_name: string;
  item_id?: number[];
  tradeable?: boolean;
  examine?: string;
  high_alchemy_value?: number | string;
}>(
  `bucket('infobox_item').select('page_name','item_id','tradeable','examine','high_alchemy_value').where(bucket.Or(${itemNames
    .map((n) => `{'page_name',${JSON.stringify(n)}}`)
    .join(",")})).limit(5000).run()`,
);
for (const { page_name, item_id = [], tradeable, examine, high_alchemy_value } of infoboxes) {
  // Only a number: items that can't be alched have none, or the wiki's "false".
  if (typeof high_alchemy_value === "number") highAlchs.set(page_name, high_alchemy_value);
  // Some carry the wiki's editorial notes as HTML, e.g. a "[sic]" after a typo kept from the game.
  if (examine)
    examines.set(
      page_name,
      examine
        .replace(/<sup[^>]*>.*?<\/sup>/g, "")
        .replace(/<[^>]+>/g, "")
        .trim(),
    );
  for (const id of item_id) {
    if (itemIds.has(page_name) && itemIds.get(page_name) !== id)
      throw new Error(`${page_name} has more than one item ID`);
    itemIds.set(page_name, id);
    if (tradeable) tradeableIds.add(id);
  }
}
// Armour and weapon stats, for the items that have them, under shorter names. Fields that don't apply
// (zeros, "no") are left out, and so is `stats` itself for items with none.
const STATS: Record<string, string> = {
  combat_class: "class",
  equipment_slot: "slot",
  equipment_type: "type",
  equipment_tier: "tier",
  equipment_armour: "armour",
  equipment_life_points: "lifePoints",
  pvm_damage_reduction: "pvmReduction",
  pvp_damage_reduction: "pvpReduction",
  weapon_damage: "damage",
  weapon_accuracy: "accuracy",
  attack_style: "style",
  attack_range: "range",
  weapon_attack_speed: "speed",
  prayer_bonus: "prayer",
  strength_bonus: "strength",
  ranged_bonus: "ranged",
  magic_bonus: "magic",
  necromancy_bonus: "necromancy",
};
const bonuses = await bucket<Record<string, string | number>>(
  `bucket('infobox_bonuses').select('page_name',${Object.keys(STATS)
    .map((f) => `'${f}'`)
    .join(
      ",",
    )}).where(bucket.Or(${itemNames.map((n) => `{'page_name',${JSON.stringify(n)}}`).join(",")})).limit(5000).run()`,
);
const stats = new Map<string, Record<string, string | number>>();
for (const { page_name, ...fields } of bonuses) {
  // An item with versions (an upgraded one, say) has a row each; the first is the plain item.
  if (stats.has(page_name as string)) continue;
  const kept: Record<string, string | number> = {};
  for (const [field, value] of Object.entries(fields)) {
    // Numbers come as text from some fields ("195.5", "0").
    const parsed = typeof value === "string" && value.trim() !== "" && !isNaN(Number(value)) ? Number(value) : value;
    if (parsed === 0 || parsed === "no" || parsed === "" || parsed == null) continue;
    kept[STATS[field]] = parsed;
  }
  if (Object.keys(kept).length) stats.set(page_name as string, kept);
}

const idOf = (name: string) => {
  const id = itemIds.get(name);
  if (id === undefined) throw new Error(`No item ID for ${name}`);
  return id;
};
// _displayName is only there to make the JSON readable; code should look names up in items.json.
const toId = ({ name, amount }: ItemRef) => ({ id: idOf(name), _displayName: name, amount });

const itemUrls = await imageUrls([...itemImages.values()]);
const items = Object.fromEntries(
  itemNames.map((name) => [
    idOf(name),
    {
      id: idOf(name),
      name,
      image: itemUrls.get(itemImages.get(name)!),
      tradeable: tradeableIds.has(idOf(name)),
      examine: examines.get(name),
      ...(highAlchs.has(name) && { highAlch: highAlchs.get(name) }),
      ...(stats.has(name) && { stats: stats.get(name) }),
    },
  ]),
);

async function imageUrls(files: string[]) {
  const urls = new Map<string, string>();
  for (let i = 0; i < files.length; i += 50) {
    const batch = files.slice(i, i + 50);
    const { query } = await api({
      action: "query",
      prop: "imageinfo",
      iiprop: "url",
      titles: batch.map((f) => `File:${f}`).join("|"),
    });
    for (const page of query.pages) {
      const file = batch.find((f) => `File:${f}` === page.title);
      if (file && page.imageinfo) urls.set(file, page.imageinfo[0].url);
    }
  }
  return urls;
}

// Lowest level first, then by name, so reruns produce stable diffs.
const sortedRituals = Object.fromEntries(
  Object.entries(rituals)
    .sort(([a, x], [b, y]) => x.level - y.level || a.localeCompare(b))
    .map(([name, ritual]) => [
      name,
      {
        ...ritual,
        focuses: ritual.focuses.map((f) => ({ ...f, input: toId(f.input), outputs: f.outputs.map(toId) })),
      },
    ]),
);
const inksById = Object.fromEntries(
  // Basic ink has no recipe: it's only sold, at Lupe's shop in Um, to ironmen too.
  Object.entries(inks).map(([key, { name, makes, materials }]) => [
    key,
    { id: idOf(name), ...(makes && materials && { makes, materials: materials.map(toId) }) },
  ]),
);

// Gear that changes rituals, by the slot it's worn in, and what it does: percentages, from the items' wiki pages
// (their effects aren't data there). Kept apart from the items, so the bank scan and inventory never see it.
// xp: Necromancy XP. focusSave: chance the focus isn't used up. alterationBoost: alteration glyphs' effects.
// necroplasm: necroplasm made. disturbanceXp: XP from disturbances. soulAttraction: added to it. doubleRewards:
// chance disturbance item rewards double. lights: which light sources don't wear out (not for ironmen). glyph:
// an alteration glyph chosen for it works as if drawn, free and without a spot (the Necromancy cape's perk).
const EQUIPMENT: Record<string, { slot: string; effects: Record<string, number | string> }> = {
  "Ritualist's mask": { slot: "head", effects: { xp: 1 } },
  "Modified ritualist's mask": { slot: "head", effects: { xp: 1, focusSave: 5 } },
  "Pumpkin mask": { slot: "head", effects: { lights: "tier 1 and 2" } },
  "Ensouled pumpkin mask": { slot: "head", effects: { lights: "all" } },
  "Ritualist's robe top": { slot: "torso", effects: { xp: 1 } },
  "Ritualist's robe bottoms": { slot: "legs", effects: { xp: 1 } },
  "Ritualist's gloves": { slot: "hands", effects: { xp: 1 } },
  "Ritualist's boots": { slot: "feet", effects: { xp: 1 } },
  "Alteration necklace": { slot: "neck", effects: { alterationBoost: 20 } },
  "Underworld Grimoire 1": { slot: "pocket", effects: { disturbanceXp: 3 } },
  "Underworld Grimoire 2": { slot: "pocket", effects: { disturbanceXp: 6, necroplasm: 5 } },
  "Underworld Grimoire 3": { slot: "pocket", effects: { disturbanceXp: 9, necroplasm: 10 } },
  "Underworld Grimoire 4": { slot: "pocket", effects: { disturbanceXp: 12, necroplasm: 15 } },
  "Ring of Kayazu": { slot: "ring", effects: { soulAttraction: 80, doubleRewards: 20 } },
  "Necromancy cape": { slot: "back", effects: { glyph: "alteration" } },
  "Necromancy master cape": { slot: "back", effects: { glyph: "alteration" } },
};
const equipmentInfo = await bucket<{ page_name: string; item_id: number[]; image: string[]; examine?: string }>(
  `bucket('infobox_item').select('page_name','item_id','image','examine').where(bucket.Or(${Object.keys(EQUIPMENT)
    .map((name) => `{'page_name',${JSON.stringify(name)}}`)
    .join(",")})).limit(500).run()`,
);
const equipmentUrls = await imageUrls(equipmentInfo.map(({ image }) => image[0].replace(/^File:/, "")));
const equipment = Object.fromEntries(
  Object.entries(EQUIPMENT).map(([name, gear]) => {
    const info = equipmentInfo.find((row) => row.page_name === name);
    if (!info) throw new Error(`${name} isn't on the wiki as an item`);
    const id = info.item_id[0];
    return [
      id,
      { id, name, ...gear, image: equipmentUrls.get(info.image[0].replace(/^File:/, "")), examine: info.examine },
    ];
  }),
);

await mkdir(OUT_DIR, { recursive: true });
for (const [file, data] of Object.entries({ rituals: sortedRituals, glyphs, inks: inksById, items, equipment })) {
  await writeFile(new URL(`${file}.json`, OUT_DIR), `${JSON.stringify(data, null, 2)}\n`);
}
console.log(
  `Wrote ${Object.keys(sortedRituals).length} rituals, ${Object.keys(glyphs).length} glyphs, ${Object.keys(inks).length} inks, ${Object.keys(items).length} items, ${Object.keys(equipment).length} pieces of equipment to src/data/`,
);
