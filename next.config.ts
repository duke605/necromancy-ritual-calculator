import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default function config(phase: string): NextConfig {
  // Static, for the deploy; but the dev server, and `npm start` (a production build on a server, SERVER=1),
  // are real servers. There, *.server.ts files are routes too (e.g. where bank screenshots are uploaded to);
  // the static build leaves them out, as a static export can't take a POST.
  const dev = phase === PHASE_DEVELOPMENT_SERVER;
  const server = dev || process.env.SERVER === "1";
  // The style guide is listed in the sidebar in dev, and not in production builds; STYLE_GUIDE=0 or 1
  // overrides that either way.
  const styleGuide = process.env.STYLE_GUIDE ? process.env.STYLE_GUIDE === "1" : dev;
  return {
    output: server ? undefined : "export",
    pageExtensions: server ? ["tsx", "ts", "jsx", "js", "server.ts"] : ["tsx", "ts", "jsx", "js"],
    // Read in the browser, inlined at build: whether there's a server to upload bank screenshots to, and
    // whether the style guide's listed.
    env: { BANK_SCREENSHOT_UPLOADS: server ? "1" : "", SHOW_STYLE_GUIDE: styleGuide ? "1" : "" },
    images: { unoptimized: true },
    reactCompiler: true,
    // For sharing the dev server through its tunnel, at the demo address.
    allowedDevOrigins: ["rituals-demo.duke605.ca"],
  };
}
