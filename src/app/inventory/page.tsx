import type { Metadata } from "next";
import { Page } from "@/lib/components/page";
import { Panel } from "@/lib/components/panel";
import { openGraph } from "../metadata";
import { BankImport } from "./bank-import";
import { InventoryItems } from "./inventory-items";

const description =
  "Import your RuneScape 3 bank from a screenshot, so your Necromancy ritual costs count only what you still need to buy.";

export const metadata: Metadata = {
  title: "Inventory",
  description,
  openGraph: { ...openGraph, title: "Inventory | Necromancy Ritual Calculator", description, url: "/inventory" },
};

// What you already have, taken off what the rituals cost.
export default function Inventory() {
  return (
    <Page title="Inventory" className="gap-6">
      <p className="body text-muted-foreground">What you have. Rituals use these before counting what to buy.</p>
      <Panel title="Import from bank" className="w-full">
        <div className="p-4">
          <BankImport />
        </div>
      </Panel>
      <InventoryItems />
    </Page>
  );
}
