import Image from "next/image";
import { Panel } from "./panel";

/**
 * Rasial talking, as an NPC does in the game: a window with his name in the title bar, his chathead in a round
 * frame on the left, and beside it what he says (`children`), with `actions`, such as extra-small ghost buttons, on
 * the bottom edge.
 */
export function RasialSays({ children, actions }: { children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <Panel title="Rasial, the First Necromancer" className="w-full max-w-2xl">
      {/* Dark on parchment, as the game's dialogue is. */}
      {/* No padding at the bottom: the actions sit on the window's bottom edge, as in the game. */}
      <div className="flex gap-6 parchment px-4 pt-4">
        <div className="chathead mb-4 self-center">
          <Image src="/icons/rasial.webp" alt="" width={92} height={119} />
        </div>
        <div className="flex flex-1 flex-col items-center gap-4 text-center">
          {/* Centred in the room above the actions. */}
          <p className="my-auto text-base text-balance text-ink-900">{children}</p>
          {actions && <div className="flex flex-wrap justify-center gap-2">{actions}</div>}
        </div>
      </div>
    </Panel>
  );
}
