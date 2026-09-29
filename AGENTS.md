<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project structure

- `src/app/`: routes and pages. `globals.css` holds the design tokens and component classes.
- `src/lib/components/`: reusable components. shadcn adds its components to `src/lib/components/ui/`.
- `src/lib/hooks/`: reusable React hooks.
- `src/lib/`: logic and reusable utility functions.
- `src/data/`: ritual, glyph and ink JSON generated from the RuneScape Wiki API. Don't edit it by hand; run `npm run data` (`scripts/fetch-data.mts`).
