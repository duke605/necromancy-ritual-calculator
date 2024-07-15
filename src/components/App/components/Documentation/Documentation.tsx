import { Accordion, AccordionSummary } from '$src/lib/components';
import { AccordionDetails, Typography, Stack } from '@mui/material';
import React from 'react';

const Section = ({title, children}: {title: string, children: React.ReactNode}) => {
  return <section>
    <Typography variant="body1" fontWeight="bold">{title}</Typography>
    <Typography variant="body2">{children}</Typography>
  </section>;
}

const Documentation = () => {
  return <>
    <Accordion>
      <AccordionSummary>
        <Typography variant="h6">Help</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={3}>
          <Section title="Ritual">
            Selects the ritual you want to perform.
          </Section>
          <Section title="Ritual Focus">
            Selects the focus you want to use for the ritual. Some rituals only have one focus in which this setting will become disabled and the focus will{' '}
            be selected automatically.
          </Section>
          <Section title="Ritual Count">
            The number of times you wish to perform the selected ritual. The title of the setting features a number refered to as the "Golden Ratio." This{' '}
            number is the amount of rituals you need to perform to completely degrade all the glyphs at the same time. When the number entered in this setting is{' '}
            a multiple of the Golden Ratio, the the number will turn gold.
          </Section>
          <Section title="Alteration Glyphs">
            Adds an alteration glyph to the selected ritual. Once added, the alteration glyphs will appear under this setting and removed by clicking the "x." When{' '}
            the maximum amount of glyphs is reached (11), the add button will become disabled.
          </Section>
          <Section title="Cape Alteration Glyph">
            Selects the 99 Necromancy alteration glyphs you wish to use.
          </Section>
          <Section title="Additional Settings - Underworld Grimoire">
            When 2, 3, or 4 is checked, the calculator will increase the necroplasm output of rituals by 5%, 10%, or 12% respectively. This 5%/10%/12{' '}
            increase will not appear in the multiplier as it only affects necroplasm, not all outputs.
          </Section>
          <Section title="Additional Settings - Alteration Necklace">
            When checked, the calculator will increases the power of alteration glyphs by 20% multiplicatively during (e.g. Attraction III's 150% soul attraction increase becomes{' '}
            180% instead). The alteration glyph attuned to the player's Necromancy cape or any variant of it is also affected by this setting.
          </Section>
          <Section title="Additional Settings - ungael Ritual Site">
            When checked, the calculator will add 20% extra durability to the glyphs (rounded down) and reduce experience gained by completing rituals by 20%.
          </Section>
          <Section title="Additional Settings - Ironman Mode">
            When checked, all materials needed to perform the selected ritual the number of times specified in the "Ritual Count" setting, including the necroplasm needed{' '}
            to make the inks, will be added to the inputs. The calculator will then, starting from the highest tier necroplasm, calculate how many "prerequisite" rituals are{' '}
            needing to be performed to create the number of necroplasm required. The materials needed to perform the "prerequisite" rituals will then be added to the inputs list,{' '}
            and the calculator move down on tier of necroplasm and do the same calculation for that tier until reaching the lowest tier necroplasm.
            <br /><br />
            <strong>Note:</strong> When calculating the number of prerequisite rituals needing to be performed, the selected alteration glyphs are ignored due them creating a feedback loop.{' '}
            the Underworld Grimoire and glyph set for the "Prerequisite Cape Glyph" will be taken into account however.
          </Section>
          <Section title="Additional Settings - Ironman Mode - No Waste">
            When checked, the prerequisite rituals will use the their Golden Ratio to make sure all glyphs are completely used up before moving onto the next prerequisite or selected ritual.{' '}
            at the current time, the excess necroplasm made from the prerequisite rituals will not appear in the outputs.
          </Section>
          <Section title="Prerequisite Cape Glyph">
            Selects the 99 Necromancy alteration glyphs you wish to use for prerequisite rituals (The rituals used to make the necroplasm that makes the ink for the selected ritual).
          </Section>
        </Stack>
      </AccordionDetails>
    </Accordion>
  </>;
}

export default Documentation;