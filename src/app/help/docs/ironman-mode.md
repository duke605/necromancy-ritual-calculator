## What Ironman mode changes

Ironman accounts cannot buy ghostly ink from the Grand Exchange. They make it from necroplasm, ashes and vials of water. With **Ironman mode** on, the calculator does the same:

- Regular, greater and powerful ink are replaced in the inputs by what they are made from: 20 necroplasm of the same tier, 1 ash and 1 vial of water for each ink.
- Basic ink stays an input. It cannot be made, so everyone buys it from Lupe's shop in the City of Um.
- Weak necroplasm stays an input. No ritual makes it.

## Added rituals

Lesser, greater and powerful necroplasm each come from a ritual. Ironman mode adds those rituals to **Rituals to perform**. They are called added rituals.

The calculator sets how many of each added ritual to perform. The count is the smallest number that makes enough necroplasm for:

- the ink your ritual needs
- the ink the added rituals need for their own glyphs
- the necroplasm an added ritual uses as its focus item (greater necroplasm rituals use lesser necroplasm, for example)

Because the added rituals also need ink, more of one can mean more of another. The calculator recalculates every count until none of them change.

The rituals are worked out in order, lowest level first and your ritual last, as you would perform them. Each one uses what you have: your inventory (with **Take from inventory** on) and what the rituals before it made. Ink it still needs is made from that necroplasm, plus ashes and vials of water. Ectoplasm the rituals make is used for later rituals' glyphs too.

**Input** lists only what is still needed after that. **Output** lists what the rituals make that is left at the end.

### How added rituals are set up

Added rituals are performed in the Underworld, whichever site you choose for your ritual. They use your equipment, so the alteration necklace and Underworld Grimoire count.

## Settings for added rituals

**No waste**, in **Results**, rounds each added ritual up to a multiple of its golden ratio. You redraw fewer half-used glyphs, and some necroplasm is left over. It is unavailable while Ironman mode is off.

### Glyphs for each added ritual

In Ironman mode, the **Alteration glyphs** panel has a **Ritual** list. Choose an added ritual in it to see that ritual on the site and set up its glyphs.

| Setting             | Effect                                                                                                               |
| ------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Same as main ritual | Uses your Necromancy cape's glyph, and no alteration glyphs. On until you turn it off.                               |
| Cape glyph          | The glyph on your Necromancy cape for this ritual. Set it after turning off **Same as main ritual**. Needs the cape. |

Your ritual's alteration glyphs are not copied to the added rituals. Their ink can need necroplasm that is not made yet: a lesser necroplasm ritual cannot use powerful ink, because powerful ink is made from necroplasm the later rituals make.

With **Same as main ritual** off, set the ritual's alteration glyphs as you would your own. They start with none. The reset button turns **Same as main ritual** back on. Each added ritual keeps its own setup.

### Glyphs that need necroplasm not made yet

For an added ritual, the **Alteration glyphs** panel lists some glyphs under **Needs necroplasm not made yet**. Their ink is made from necroplasm that this ritual or a later one makes, so you need some of it before the ritual starts. You can still choose them, for example if you have that ink already or buy it from the Grand Exchange. **Input** then lists the necroplasm to start with.

For a lesser necroplasm ritual, every alteration glyph is in that list: they all need regular ink or higher, and regular ink is made from lesser necroplasm.

### Not self-sustaining

The added rituals pay for their alteration glyphs in ink, and so in necroplasm. If the glyphs cost more necroplasm than the rituals make, the counts never settle. The calculator then leaves the alteration glyphs off the added rituals and shows a warning in **Results**.
