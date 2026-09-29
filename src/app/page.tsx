import { Page } from "@/lib/components/page";
import { Calculator } from "./calculator";
import { CalculatorBoundary } from "./calculator-boundary";

// The home page is the calculator (the sidebar's Rituals link).
export default function Rituals() {
  return (
    <Page title="Rituals" fullWidth>
      <CalculatorBoundary>
        <Calculator />
      </CalculatorBoundary>
    </Page>
  );
}
