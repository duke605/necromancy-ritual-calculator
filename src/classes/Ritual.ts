import ritualData from '$data/rituals.json';
import glyphData from '$data/glyphs.json';
import inkData from '$data/inks.json';

export interface Focus {
  input: {
    name: string;
    amount: number;
  };
  outputs: {
    name: string;
    amount: number;
  }[];
}

export type GlyphName = keyof typeof glyphData;

export interface Glyph {
  name: keyof typeof glyphData;
  inks: {
    basic?: number;
    regular?: number;
    greater?: number;
    powerful?: number;
  };
  amount: number;
  durability: number;
  image: string;
  ectoplasm?: number;
  soulAttraction?: number;
  multiply?: number;
  alteration?: boolean;
  duration?: number;
}

export interface RitualModifier {
  id: string;
  multiplier?: number;
  necroplasmMultiplier?: number;
  duration?: number
  soulAttraction?: number;
  extra?: Record<string, any>;
}

export type RitualSite = 'um' | 'ungael';

export class Ritual {
  private _name: string;
  private _focuses: readonly Focus[];
  private _experience: number;
  private _disturbanceChances: number;
  private _alterationBuff: boolean = false;
  private _ritualSite: RitualSite;
  private glyphs: readonly Glyph[];
  private durationTicks: number;
  
  private modifiers: Map<string, RitualModifier> = new Map();
  private focusName: string;

  constructor(
    name: string,
    glyphs: readonly Glyph[],
    durationTicks: number,
    disturbanceChances: number,
    focuses: readonly Focus[],
    experience: number,
    site: RitualSite,
  ) {
    this._name = name;
    this._focuses = focuses;
    this._disturbanceChances = disturbanceChances;
    this._experience = experience;
    this._ritualSite = site;
    this.glyphs = glyphs;
    this.durationTicks = durationTicks;

    this.focusName = this._focuses[0].input.name;
  }

  copy = () => {
    const r = new Ritual(
      this._name,
      this.glyphs,
      this.durationTicks,
      this._disturbanceChances,
      this._focuses,
      this._experience,
      this._ritualSite,
    );

    r.focusName = this.focusName;
    r.modifiers = this.modifiers;
    r._alterationBuff = this._alterationBuff;

    return r;
  }

  get name() {
    return this._name;
  }

  get focusCount() {
    return this.focuses.length;
  }

  get focuses() {
    return this._focuses;
  }

  get ritualSite() {
    return this._ritualSite;
  }

  get experience() {
    return this._experience * (this.ritualSite === 'ungael' ? 0.80 : 1);
  }

  get disturbanceChances() {
    return this._disturbanceChances;
  }

  get alterationBuff() {
    return this._alterationBuff;
  }

  /**
   * Sets the site of the ritual
   * 
   * @param site The site of the ritual
   * @returns 
   */
  setRitualSite = (site: RitualSite) => {
    const newRitual = this.copy();
    newRitual._ritualSite = site;

    return newRitual;
  }

  /**
   * Sets the state of the alteration buff on the ritual
   * 
   * @param f The state of the alteration buff
   * @returns 
   */
  setAlterationBuff = (f: boolean) => {
    if (this.alterationBuff === f) return this;
    const newRitual = this.copy();
    newRitual._alterationBuff = f;

    return newRitual;
  }

  /**
   * Set the focus of the ritual. Must be the name of one of the inputs
   * 
   * @param name the name of the focus input
   * @returns 
   */
  setFocus = (name: string) => {
    const focus = this.focuses.find(f => f.input.name === name);
    if (!focus) {
      throw new Error(`No focus found with name ${name}`);
    }

    const newRitual = this.copy();
    newRitual.focusName = name;

    return newRitual;
  }

  /**
   * @returns the current focus of the ritual
   */
  getFocus = () => {
    return this.focuses.find(f => f.input.name === this.focusName)!;
  }

  /**
   * @returns the cost to preform n rituals
   */
  getInputs = (n: number) => {
    const inputs = {
      items: {
        [this.getFocus().input.name]: this.getFocus().input.amount * n,
      },
      inks: {
        basic: 0,
        regular: 0,
        greater: 0,
        powerful: 0,
      },
    };

    for (const glyph of this.glyphs) {
      const glyphDraws = Math.ceil(n / glyph.durability);
      
      // Adding ectoplasm if the glyph uses it
      if (glyph.ectoplasm) {
        inputs.items.Ectoplasm ??= 0;
        inputs.items.Ectoplasm += glyphDraws * glyph.ectoplasm * glyph.amount;
      }

      for (const [inkType, amount] of Object.entries(glyph.inks)) {
        inputs.inks[inkType as keyof typeof inkData] += glyphDraws * amount * glyph.amount;
      }
    }

    return inputs;
  }

  /**
   * Adds a modifier to the ritual
   * 
   * @param modifier the modifier to add to the ritual
   * @returns a new Ritual with the modifier added
   */
  putModifiers = (...modifiers: RitualModifier[]) => {
    const newRitual = this.copy();

    newRitual.modifiers = new Map(newRitual.modifiers);
    for (const modifier of modifiers) {
      newRitual.modifiers.set(modifier.id, modifier);
    }

    return newRitual;
  }

  /**
   * Gets a modifier from the ritual if it exists
   * 
   * @param id the id of the modifier
   * @returns the found modifier. Undefined otherwise
   */
  getModifier = (id: string) => {
    return this.modifiers.get(id);
  }

  /**
   * Gets gets the modifiers on the ritual
   * 
   * @returns the modifiers on the ritual if any
   */
  getModifiers = () => {
    return this.modifiers;
  }

  /**
   * Removes a modifier from the ritual
   * 
   * @param modifierId the id of the modifier to remove from the ritual
   * @returns a new ritual with the modifier removed if found. If the modifier was
   *          not found the current ritual is returned
   */
  removeModifier = (modifierId: string) => {
    if (!this.modifiers.has(modifierId)) {
      return this;
    }
    
    const newRitual = this.copy();
    newRitual.modifiers = new Map(newRitual.modifiers);
    newRitual.modifiers.delete(modifierId);

    return newRitual;
  }

  /**
   * Adds an alteration glyph to the ritual
   * 
   * @param glyphName the name of the glyph to add to the ritual (must be a key of glyphData)
   * @param amount the amount of glyphs to add to the ritual
   * @returns a new ritual with the alteration glyph added
   * 
   * @throws if the glyph is not an alteration glyph
   * @throws if glyphName is not a key of glyphData
   */
  addAlterationGlyph = (glyphName: keyof typeof glyphData, amount: number) => {
    const glyph = glyphData[glyphName] as Omit<Glyph, 'name' | 'amount'>;

    if (!glyph) {
      throw new Error(`No glyph found with name ${glyphName}`);
    }

    if (!glyph.alteration) {
      throw new Error(`Glyph ${glyphName} must be an alteration glyph`);
    }

    const newRitual = this.copy();
    newRitual.glyphs = [...this.glyphs, {
      name: glyphName,
      amount,
      ...glyph,
    }];

    return newRitual;
  }

  /**
   * Removes an alteration glyph from the ritual. If multiple alteration glyphs with the name given,
   * only one of them will be removed.
   * 
   * @param glyphName the name of the glyph to remove from the ritual (must be a key of glyphData)
   * @returns a new ritual with the alteration glyph removed if found. If the alteration glyph
   *          was not found the current ritual will be returned
   * 
   * @throws if the glyph is not an alteration glyph
   * @throws if glyphName is not a key of glyphData
   */
  removeAlterationGlyph = (glyphName: keyof typeof glyphData) => {
    const glyph = glyphData[glyphName] as Omit<Glyph, 'name' | 'amount'>;

    if (!glyph) {
      throw new Error(`No glyph found with name ${glyphName}`);
    }

    if (!glyph.alteration) {
      throw new Error(`Glyph ${glyphName} must be an alteration glyph`);
    }

    let notFound = true;
    const glyphs = this.glyphs.filter(g =>
      notFound ? notFound = g.name !== glyphName : true  
    );

    if (notFound) return this;

    const newRitual = this.copy();
    newRitual.glyphs = glyphs;
    return newRitual;
  }

  /**
   * @returns the altercation glyphs in the ritual, if any
   */
  getAlterationGlyphs = () => {
    return this.glyphs.filter(g => g.alteration);
  }

  /**
   * @returns the count of all the glyphs in the ritual
   */
  getGlyphCount = () => {
    return this.glyphs.reduce((a, b) => a + b.amount, 0);
  }

  /**
   * @returns the amount of glyph spots used by the ritual (not including alteration glyphs)
   */
  getBaseGlyphCount = () => {
    return this.glyphs
      .filter(g => !g.alteration)
      .reduce((a, b) => a + b.amount, 0);
  }

  /**
   * @returns the multiplier of the ritual with the modifier and alteration glyphs taken into account 
   */
  getMultiplier = (forNecroplasm: boolean = false) => {
    const { multiplier, necroplasmMultiplier } = this.sumAttributes();

    return forNecroplasm ? necroplasmMultiplier : multiplier;
  }

  /**
   * Gets the outputs of performing the ritual n times with the multiplier being taken into account
   * 
   * @param n the number of rituals to get outputs for
   * @returns the outputs of the ritual with the multiplier taken into account
   */
  getOutputs = (n: number) => {
    return this.getFocus().outputs.map(o => ({
      ...o,
      amount: Math.floor(o.amount * this.getMultiplier(o.name.includes('necroplasm'))) * n,
    }));
  }

  /**
   * @returns the number of rituals that need to be preformed to use up all the glyphs at the same time
   */
  getGoldenRatio = () => {
    const lcm = (...arr: number[]) => {
      const gcd = (x: number, y: number): number => !y ? x : gcd(y, x % y);
      const _lcm = (x: number, y: number) => (x * y) / gcd(x, y);
      return arr.reduce((a, b) => _lcm(a, b));
    };

    const multiplier = this.ritualSite === 'ungael' ? 1.20 : 1;
    return lcm(...this.glyphs.map(g => Math.floor(g.durability * multiplier)));
  }

  /**
   * @returns the amount of time in ticks a ritual takes with the modifiers and alteration glyphs taken into account
   */
  getDurationTicks = () => {
    const { duration } = this.sumAttributes();

    return Math.ceil(this.durationTicks * duration);
  }

  /**
   * @returns the amount of soul attraction the ritual has with the modifiers and alteration glyphs taken into account
   */
  getSoulAttraction = () => {
    return this.sumAttributes().soulAttraction;
  }

  /**
   * @returns the amount of time in seconds a ritual takes with the modifiers and alteration glyphs taken into account
   */
  getDuration = () => {
    return (this.getDurationTicks() * 1200) / 1000;
  }

  private sumAttributes = () => {
    const attributes = {
      soulAttraction: 100,
      multiplier: 100,
      duration: 100,
      necroplasmMultiplier: 0,
    };

    const alterationBuff = this._alterationBuff ? 1.2 : 1;
    for (const glyph of this.glyphs) {
      attributes.soulAttraction += (glyph.soulAttraction ?? 0) * alterationBuff;
      attributes.multiplier += (glyph.multiply ?? 0) * alterationBuff;
      attributes.duration += (glyph.duration ?? 0) * alterationBuff;
    }

    for (const [ name, modifier ] of this.modifiers) {
      const altBuf = name === 'cape' ? alterationBuff : 1;

      attributes.soulAttraction += (modifier.soulAttraction ?? 0) * altBuf;
      attributes.multiplier += (modifier.multiplier ?? 0) * altBuf;
      attributes.duration += (modifier.duration ?? 0) * altBuf;
      attributes.necroplasmMultiplier += modifier.necroplasmMultiplier ?? 0;
    }
  
    attributes.soulAttraction /= 100.0;
    attributes.necroplasmMultiplier = (attributes.multiplier + attributes.necroplasmMultiplier) / 100.0;
    attributes.multiplier /= 100.0;
    attributes.duration = Math.abs(Math.max(attributes.duration, -50)) / 100;

    return attributes;
  }
}

export const rituals = Object.entries(ritualData).map(([name, data]) => {
  const resolvedGlyphs = data.glyphs.map(g => {
    if (!(g.name in glyphData)) {
      throw new Error(`Glyph ${g.name} not found`);
    }

    const glyphName = g.name as Glyph['name'];
    const glyph = glyphData[glyphName] as Omit<Glyph, 'name' | 'amount'>;
    return <Glyph>{
      ...glyph,
      name: glyphName,
      amount: g.amount,
    };
  });

  return new Ritual(
    name,
    resolvedGlyphs,
    data.durationTicks,
    data.disturbanceChances,
    data.focuses,
    data.experience,
    'um',
  );
});