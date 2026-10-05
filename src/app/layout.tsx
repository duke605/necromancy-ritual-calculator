import type { Metadata, Viewport } from "next";
import { Cinzel, Noto_Sans } from "next/font/google";
import "./globals.css";
import { AppSidebar, MenuFab } from "./app-sidebar";
import { openGraph } from "./metadata";
import { PriceSync } from "@/lib/components/price-sync";
import { SidebarInset, SidebarProvider } from "@/lib/components/ui/sidebar";
import { TooltipProvider } from "@/lib/components/ui/tooltip";

// Cinzel stands in for the game's Trajan-style titles; Noto Sans for its body text.
const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
});

const title = "Necromancy Ritual Calculator for RuneScape 3";
const description =
  "Plan your RuneScape 3 Necromancy rituals: the glyphs, inks and ectoplasm each one needs, their Grand Exchange cost, what you get and how long it takes.";

export const metadata: Metadata = {
  // Where the site's deployed, for link previews' absolute URLs: given at build time (the deploy workflow
  // sets it to the Pages site's address).
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  title: {
    default: title,
    template: "%s | Necromancy Ritual Calculator",
  },
  description,
  openGraph: { ...openGraph, title, description, url: "/" },
  twitter: { card: "summary" },
  icons: { icon: "/icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#1d1814",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${notoSans.variable} h-full antialiased`}
    >
      <head>
        <link rel="describedby" type="text/markdown" href="/llms.txt" />
      </head>
      <body className="min-h-full">
        <PriceSync />
        <TooltipProvider>
          {/* The sidebar down the left edge, and the page beside it casting a shadow on the sidebar, so the
              sidebar looks tucked under. On a desktop the page is the screen's height and
              scrolls itself. On a phone the sidebar is a drawer, opened from the page. */}
          {/* Clipped sideways: on a phone, the page pushed over by the drawer would otherwise scroll. */}
          <SidebarProvider className="overflow-x-clip">
            <AppSidebar />
            <SidebarInset
              id="main"
              className="z-10 min-w-0 data-pushed:shadow-[-4px_0_12px_rgb(0_0_0/50%)] md:h-svh md:overflow-y-auto md:shadow-[-4px_0_12px_rgb(0_0_0/50%)]"
            >
              {children}
            </SidebarInset>
            <MenuFab />
          </SidebarProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
