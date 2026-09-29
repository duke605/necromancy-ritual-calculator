"use client";

import { useState } from "react";
import { Field } from "@/lib/components/field";
import { Spinner } from "@/lib/components/spinner";

/**
 * The spinner, and with `tune`, a slider for how long its tail is (--spinner-tail), to try lengths out. Hidden
 * otherwise: pass `tune` to bring it back.
 */
export function SpinnerExample({ tune }: { tune?: boolean }) {
  const [tail, setTail] = useState(67);
  return (
    <div className="flex items-center gap-6" style={{ "--spinner-tail": tail } as React.CSSProperties}>
      <Spinner />
      <Spinner size="lg" />
      <Spinner size="xl" />
      {tune && (
        <div className="w-60">
          <Field label="Tail" hint={`${tail}%`}>
            <input
              type="range"
              min={10}
              max={95}
              value={tail}
              className="w-full accent-gold-500"
              onChange={(event) => setTail(event.target.valueAsNumber)}
            />
          </Field>
        </div>
      )}
    </div>
  );
}
