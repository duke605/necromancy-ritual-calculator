"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { Component, useState } from "react";
import { useCalculator } from "@/lib/calculator";
import { Accordion } from "@/lib/components/accordion";
import { RasialSays } from "@/lib/components/rasial-says";
import { Button } from "@/lib/components/ui/button";

/** The error as text: its stack where it has one, which starts with its message. */
const details = (error: unknown) => (error instanceof Error ? (error.stack ?? String(error)) : String(error));

/** Copies `text` to the clipboard, saying so for a moment once it has. */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="xs"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

/**
 * Catches the calculator failing to render, most likely from saved choices it can't make sense of, and in its
 * place offers to reset them, which renders it again. Under Rasial's take on it, what happened in plain words,
 * and the error itself, folded away, for a bug report.
 */
export class CalculatorBoundary extends Component<{ children: React.ReactNode }, { error: unknown }> {
  state: { error: unknown } = { error: undefined };

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (error === undefined) return this.props.children;
    return (
      <div className="flex flex-col items-center gap-3 py-12" role="alert">
        <RasialSays
          actions={
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                useCalculator.getState().reset();
                this.setState({ error: undefined });
              }}
            >
              Reset
            </Button>
          }
        >
          Pathetic. Your ritual has crumbled to dust, apprentice. Do you know how long it takes to reform one? Reset it.
          Do not tarry.
        </RasialSays>
        <p className="body-sm max-w-2xl text-center text-muted-foreground">
          Your saved ritual couldn&apos;t be loaded. Reset puts the Rituals page back to its defaults. Your inventory
          and settings are kept.
        </p>
        <div className="w-full max-w-2xl">
          <Accordion title="Details">
            <div className="flex flex-col items-end gap-2">
              {/* Over the field, not in it, where it would cover its scrollbar. */}
              <CopyButton text={details(error)} />
              {/* Read-only, all selected on focus, to copy into a bug report. As tall as the error, up to a point;
                  8 rows where the browser can't size it to its content (Firefox). */}
              <textarea
                readOnly
                aria-label="Error"
                rows={8}
                className="input block h-auto max-h-96 resize-y py-2 font-mono text-xs [field-sizing:content]"
                value={details(error)}
                onFocus={(event) => event.currentTarget.select()}
              />
            </div>
          </Accordion>
        </div>
      </div>
    );
  }
}
