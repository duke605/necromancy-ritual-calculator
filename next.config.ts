import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default function config(phase: string): NextConfig {
  // Static, for the deploy; but the dev server, and `npm start` (a production build on a server, SERVER=1),
  // are real servers.
  const dev = phase === PHASE_DEVELOPMENT_SERVER;
  const server = dev || process.env.SERVER === "1";
  // The style guide is listed in the sidebar in dev, and not in production builds; STYLE_GUIDE=0 or 1
  // overrides that either way.
  const styleGuide = process.env.STYLE_GUIDE ? process.env.STYLE_GUIDE === "1" : dev;
  return {
    output: server ? undefined : "export",
    // Read in the browser, inlined at build: whether the style guide's listed.
    env: { SHOW_STYLE_GUIDE: styleGuide ? "1" : "" },
    images: { unoptimized: true },
    reactCompiler: true,
    // The dev server, from any host (its tunnel, the demo address, a phone on the network). Every hostname
    // with a dot: Next refuses a lone "*" or "**", and a "*" is one label, so "**.*" is as wide as it goes.
    allowedDevOrigins: ["**.*"],
  };
}
