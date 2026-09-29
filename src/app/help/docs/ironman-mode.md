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

Necroplasm an added ritual makes for the ink is taken off the inputs. If an added ritual makes more than is needed, the rest is listed in **Output**.

### How added rituals are set up

Added rituals are performed in the Underworld, whichever site you choose for your ritual. They use your equipment, so the alteration necklace and Underworld Grimoire count.

## Settings for added rituals

| Setting               | Where             | Effect                                                                                                                              |
| --------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| No waste              | Results           | Rounds each added ritual up to a multiple of its golden ratio. You redraw fewer half-used glyphs, and some necroplasm is left over. |
| On added rituals      | Alteration glyphs | Places your alteration glyphs on the added rituals too, as many as fit.                                                             |
| Cape on added rituals | Alteration glyphs | Sets the glyph on your Necromancy cape for the added rituals. **Same as worn** keeps your own. Needs a Necromancy cape.             |

These settings are unavailable while Ironman mode is off. Hover over one to see what it needs.

### Not self-sustaining

With **On added rituals** on, the added rituals pay for their alteration glyphs in ink, and so in necroplasm. If the glyphs cost more necroplasm than the rituals make, the counts never settle. The calculator then leaves the alteration glyphs off the added rituals and shows a warning in **Results**.
