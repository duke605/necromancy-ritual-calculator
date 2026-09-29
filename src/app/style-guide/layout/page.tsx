import type { Metadata } from "next";
import Image from "next/image";
import { Field } from "@/lib/components/field";
import { Input } from "@/lib/components/ui/input";
import { Accordion, AccordionGroup } from "@/lib/components/accordion";
import { Panel } from "@/lib/components/panel";
import { RitualSite } from "@/lib/components/ritual-site";
import items from "@/data/items.json";
import { Section, StyleGuidePage, Subsection } from "../style-guide";

export const metadata: Metadata = { title: "Layout (style guide)" };

/** Sample costs for the table: item IDs, how many, and made-up prices each. */
const costs = [
  { id: 55599, amount: 1200, price: 94 },
  { id: 55595, amount: 45, price: 1805 },
  { id: 7936, amount: 300, price: 38 },
  { id: 55667, amount: 900, price: 12 },
] as const;

export default function Layout() {
  return (
    <StyleGuidePage title="Layout">
      <Section id="tables" title="Tables">
        <div className="max-w-full overflow-x-auto">
          <Panel title="Cost" headingLevel={3}>
            <CostTable />
          </Panel>
        </div>
      </Section>
      <Section id="accordions" title="Accordions">
        <Subsection title="Grouped: opening one closes the other">
          <AccordionGroup>
            <Accordion title="Documentation" headingLevel={4} open>
              <p className="body-sm">
                Choose a ritual, then the glyphs on its site. The cost is worked out for the number of rituals you set,
                with the prices from the Grand Exchange.
              </p>
            </Accordion>
            <Accordion title="Pricing" headingLevel={4}>
              <Field label="Search">
                <Input type="search" placeholder="Search items" />
              </Field>
            </Accordion>
          </AccordionGroup>
        </Subsection>
        <Subsection title="Ungrouped">
          <Accordion title="Inventory" headingLevel={4}>
            <p className="body-sm">It opens and closes by itself.</p>
          </Accordion>
          <Accordion title="Settings" headingLevel={4}>
            <p className="body-sm">So does this one, whether the other is open or not.</p>
          </Accordion>
        </Subsection>
      </Section>
      <Section id="ritual-sites" title="Ritual sites">
        {/* Two to a row where there's room, one under another where there isn't. */}
        <div className="grid gap-6 xl:grid-cols-2">
          <Subsection title="The Underworld">
            <RitualSite site="underworld" />
          </Subsection>
          <Subsection title="Ungael">
            <RitualSite site="ungael" />
          </Subsection>
          <Subsection title="With glyphs">
            <RitualSite site="underworld" glyphs={["Elemental I", undefined, "Multiply II", undefined, "Commune I"]} />
          </Subsection>
        </div>
      </Section>
    </StyleGuidePage>
  );
}

/** The style guide's cost table. */
function CostTable() {
  return (
    <table className="table">
      <thead>
        <tr>
          <th scope="col">Item</th>
          <th scope="col" className="num">
            Amount
          </th>
          <th scope="col" className="num">
            Price
          </th>
          <th scope="col" className="num">
            Total
          </th>
        </tr>
      </thead>
      <tbody>
        {costs.map(({ id, amount, price }) => {
          const { name, image } = items[id];
          return (
            <tr key={id}>
              <th scope="row" className="font-normal">
                <span className="flex items-center gap-2">
                  <Image src={image} alt="" aria-hidden width={24} height={24} className="size-6 object-contain" />
                  {name}
                </span>
              </th>
              <td className="num">{amount.toLocaleString("en")}</td>
              <td className="num">{price.toLocaleString("en")}</td>
              <td className="num">{(amount * price).toLocaleString("en")}</td>
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr>
          <th scope="row" colSpan={3}>
            Total
          </th>
          <td className="num">
            {costs.reduce((sum, { amount, price }) => sum + amount * price, 0).toLocaleString("en")}
          </td>
        </tr>
      </tfoot>
    </table>
  );
}
