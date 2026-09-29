import type { Metadata } from "next";
import { Fragment } from "react";
import { Check } from "lucide-react";
import { Button } from "@/lib/components/ui/button";
import { Field } from "@/lib/components/field";
import { Fieldset } from "@/lib/components/fieldset";
import { Input } from "@/lib/components/ui/input";
import { NumberInput } from "@/lib/components/number-input";
import { Select } from "@/lib/components/select";
import { Switch } from "@/lib/components/switch";
import { DropZone } from "@/lib/components/drop-zone";
import glyphs from "@/data/glyphs.json";
import { Section, StyleGuidePage, Subsection } from "../style-guide";

export const metadata: Metadata = { title: "Controls (style guide)" };

const variants = ["primary", "secondary", "danger", "ghost"] as const;
const sizes = ["xs", "sm", "default", "lg", "icon-sm", "icon"] as const;

const buttonStates = [
  { label: "Default", props: {} },
  { label: "Hover", props: { "data-hover": true } },
  { label: "Disabled", props: { disabled: true } },
];
/** Help and error, for showing each control with them. */
const messages = [
  { label: "Help", props: { help: "Help text sits under the field." } },
  { label: "Error", props: { error: "Something's wrong with this value." } },
];

/** A group of checkboxes or radios with help or an error under it. */
function ChoiceGroup({
  type,
  legend,
  options,
  help,
  error,
}: {
  type: "checkbox" | "radio";
  legend: string;
  options: string[];
  help?: string;
  error?: string;
}) {
  const name = `${type}-${legend.toLowerCase().replaceAll(" ", "-")}`;
  return (
    <Fieldset legend={legend} help={help} error={error} className="flex flex-col gap-3">
      {options.map((option) => (
        <label key={option} className="body flex w-fit cursor-pointer items-center gap-2">
          <input type={type} name={name} className={type} aria-invalid={error ? true : undefined} />
          {option}
        </label>
      ))}
    </Fieldset>
  );
}

export default function Controls() {
  return (
    <StyleGuidePage title="Controls">
      <Section id="buttons" title="Buttons">
        {variants.map((variant) => (
          <Subsection key={variant} title={variant}>
            {/* Pulled out by the table's cell spacing, so its first row sits as close under the heading. */}
            <div className="-mx-3 -my-2 max-w-full overflow-x-auto">
              <table className="w-fit border-separate border-spacing-x-3 border-spacing-y-2">
                <thead>
                  <tr>
                    <td />
                    {sizes.map((size) => (
                      <th key={size} scope="col" className="body-sm text-left font-normal text-muted-foreground">
                        {size}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {buttonStates.map(({ label, props }) => (
                    <tr key={label}>
                      <th scope="row" className="body-sm pr-3 text-left font-normal text-muted-foreground">
                        {label}
                      </th>
                      {sizes.map((size) => (
                        <td key={size}>
                          {size.startsWith("icon") ? (
                            <Button variant={variant} size={size} aria-label="Confirm" {...props}>
                              <Check aria-hidden />
                            </Button>
                          ) : (
                            <Button variant={variant} size={size} {...props}>
                              {size === "lg" ? <Check aria-hidden /> : null}
                              View selected
                            </Button>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Subsection>
        ))}
      </Section>
      <Section id="inputs" title="Inputs">
        <div className="grid max-w-3xl gap-6 sm:grid-cols-2">
          <Field label="Search items">
            <Input type="search" placeholder="Bones, inks, ectoplasm…" />
          </Field>
          <Field label="Ritual count" hint="Golden ratio: 12">
            <NumberInput min={1} defaultValue={12} shimmer />
          </Field>
        </div>
        <Fieldset
          legend="Fields as a group"
          error="An error about the whole group sits under it."
          className="flex flex-wrap gap-6"
        >
          <Field label="Lesser necroplasm">
            <NumberInput min={0} defaultValue={0} />
          </Field>
          <Field label="Greater necroplasm">
            <NumberInput min={0} defaultValue={0} />
          </Field>
        </Fieldset>
        <div className="grid max-w-4xl gap-6 sm:grid-cols-3">
          {messages.map((message) => (
            <Fragment key={message.label}>
              <Field label={`Text, ${message.label.toLowerCase()}`} {...message.props}>
                <Input defaultValue="Greater necroplasm" />
              </Field>
              <Field label={`Number, ${message.label.toLowerCase()}`} {...message.props}>
                <NumberInput min={1} defaultValue={3} />
              </Field>
              <Field label={`No steppers, ${message.label.toLowerCase()}`} {...message.props}>
                <NumberInput min={0} defaultValue={1805} steppers={false} />
              </Field>
            </Fragment>
          ))}
        </div>
        <div className="max-w-full overflow-x-auto">
          <table className="w-fit border-separate border-spacing-x-3 border-spacing-y-2">
            <thead>
              <tr>
                <td />
                {["Text", "Number", "Number, no steppers"].map((kind) => (
                  <th key={kind} scope="col" className="body-sm text-left font-normal text-muted-foreground">
                    {kind}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Default", props: {} },
                { label: "Disabled", props: { disabled: true } },
                { label: "Read-only", props: { readOnly: true } },
              ].map(({ label, props }) => (
                <tr key={label}>
                  <th scope="row" className="body-sm pr-3 text-left font-normal text-muted-foreground">
                    {label}
                  </th>
                  <td>
                    <Input
                      aria-label={`Text, ${label}`}
                      defaultValue="Greater necroplasm"
                      className="w-48"
                      {...props}
                    />
                  </td>
                  <td>
                    <NumberInput aria-label={`Number, ${label}`} min={1} defaultValue={3} {...props} />
                  </td>
                  <td>
                    <NumberInput
                      aria-label={`Price, ${label}`}
                      min={0}
                      defaultValue={1805}
                      steppers={false}
                      className="w-32"
                      {...props}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      <Section id="checkboxes" title="Checkboxes">
        <div className="flex flex-wrap items-start gap-16">
          <Fieldset legend="Additional settings" className="flex flex-col gap-3">
            {[
              { label: "Ironman mode", defaultChecked: true },
              { label: "No waste", indent: true, help: "Help text sits under its label." },
              { label: "Alteration necklace", defaultChecked: true, disabled: true },
              { label: "Ungael ritual site", disabled: true },
            ].map(({ label, indent, help, ...props }) => (
              // Help lines up with the label's text: past the box (1.25rem) and the gap (0.5rem).
              <div key={label} className={`flex flex-col gap-0.5 ${indent ? "ml-7" : ""}`}>
                <label className="body flex w-fit cursor-pointer items-center gap-2 has-disabled:cursor-not-allowed has-disabled:text-muted-foreground">
                  <input
                    type="checkbox"
                    className="checkbox"
                    aria-describedby={help ? `checkbox-${label.toLowerCase().replaceAll(" ", "-")}-help` : undefined}
                    {...props}
                  />
                  {label}
                  {props.disabled && <span className="body-sm text-muted-foreground">(disabled)</span>}
                </label>
                {help && (
                  <p
                    id={`checkbox-${label.toLowerCase().replaceAll(" ", "-")}-help`}
                    className="body-sm ml-7 text-muted-foreground"
                  >
                    {help}
                  </p>
                )}
              </div>
            ))}
          </Fieldset>
          <ChoiceGroup type="checkbox" legend="With an error" options={["Bones", "Ashes"]} error="Pick at least one." />
        </div>
      </Section>
      <Section id="radios" title="Radio buttons">
        <div className="flex flex-wrap items-start gap-16">
          <Fieldset legend="Underworld Grimoire" className="flex flex-col gap-3">
            {[
              { label: "None" },
              { label: "Grimoire 2" },
              { label: "Grimoire 3", defaultChecked: true },
              { label: "Grimoire 4", disabled: true },
            ].map(({ label, ...props }) => (
              <label
                key={label}
                className="body flex w-fit cursor-pointer items-center gap-2 has-disabled:cursor-not-allowed has-disabled:text-muted-foreground"
              >
                <input type="radio" name="grimoire" className="radio" {...props} />
                {label}
                {props.disabled && <span className="body-sm text-muted-foreground">(disabled)</span>}
              </label>
            ))}
          </Fieldset>
          <ChoiceGroup
            type="radio"
            legend="With help"
            options={["Lesser", "Greater"]}
            help="Help for the whole group sits under it."
          />
          <ChoiceGroup type="radio" legend="With an error" options={["Lesser", "Greater"]} error="Pick one." />
        </div>
      </Section>
      <Section id="switches" title="Toggle switches">
        <Fieldset legend="Display" className="flex flex-col gap-3">
          {[
            { label: "Show prices" },
            { label: "Round to the nearest coin", defaultChecked: true },
            { label: "Compact rows", disabled: true },
            { label: "Animated textures", defaultChecked: true, disabled: true },
          ].map(({ label, ...props }) => (
            <label
              key={label}
              className="body flex w-fit cursor-pointer items-center gap-2 has-disabled:cursor-not-allowed has-disabled:text-muted-foreground"
            >
              <Switch {...props} />
              {label}
              {props.disabled && <span className="body-sm text-muted-foreground">(disabled)</span>}
            </label>
          ))}
        </Fieldset>
        <Subsection title="Choosing between two (select)">
          <label className="body flex w-fit cursor-pointer items-center gap-2">
            Sync
            <Switch select aria-label="Add instead of sync" />
            Add
          </label>
        </Subsection>
      </Section>
      <Section id="dropdowns" title="Dropdowns">
        <div className="flex flex-wrap items-start gap-6">
          {[
            { label: "Default", props: {} },
            { label: "Disabled", props: { disabled: true } },
          ].map(({ label, props }) => (
            <Field key={label} label={label}>
              <Select defaultValue="Greater necroplasm" {...props}>
                {["Lesser", "Greater", "Powerful", "Soul"].map((tier) => (
                  <option key={tier}>{tier} necroplasm</option>
                ))}
              </Select>
            </Field>
          ))}
          {messages.map((message) => (
            <Field key={message.label} label={`With ${message.label.toLowerCase()}`} {...message.props}>
              <Select defaultValue="Greater necroplasm">
                {["Lesser", "Greater", "Powerful", "Soul"].map((tier) => (
                  <option key={tier}>{tier} necroplasm</option>
                ))}
              </Select>
            </Field>
          ))}
          <Field label="With images">
            <Select defaultValue="Elemental II">
              {Object.entries(glyphs)
                .slice(0, 6)
                .map(([name, { image }]) => (
                  <option key={name} value={name} style={{ "--option-icon": `url("${image}")` } as React.CSSProperties}>
                    {name}
                  </option>
                ))}
            </Select>
          </Field>
        </div>
      </Section>
      <Section id="drop-zones" title="Drop zones">
        <p className="body-sm text-muted-foreground">
          Drop an image on it, paste one while hovering over it, or click to choose one.
        </p>
        <DropZone label="Paste, drop or choose a bank screenshot" />
      </Section>
    </StyleGuidePage>
  );
}
