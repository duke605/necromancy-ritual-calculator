import type { Metadata } from "next";

/** What every page's link preview shares. A page that sets its own openGraph replaces the layout's whole,
    so it spreads this in first. */
export const openGraph = {
  type: "website",
  siteName: "Necromancy Ritual Calculator",
  locale: "en_CA",
} satisfies Metadata["openGraph"];
