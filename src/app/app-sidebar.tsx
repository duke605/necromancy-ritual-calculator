"use client";

import { PanelLeftIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LinkProgress } from "@/lib/components/link-progress";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
  useSidebar,
} from "@/lib/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { HELP_PAGES } from "./help/help";
import { STYLE_GUIDE_PAGES } from "./style-guide/style-guide";

/** The wordmark's rarer tie-dye palettes (--tie-dye-* in globals.css). */
const RARE_TIE_DYES = ["trans", "bi", "gay"];

/** A palette for this hover: nearly always the skull's eyes, but 1 time in 200 one of the rare ones. */
function pickTieDye() {
  const name = Math.random() < 1 / 200 ? RARE_TIE_DYES[Math.floor(Math.random() * RARE_TIE_DYES.length)] : "eyes";
  document.documentElement.style.setProperty("--tie-dye-image", `var(--tie-dye-${name})`);
  document.documentElement.style.setProperty("--tie-dye-spin", `var(--tie-dye-${name}-spin)`);
}

/** The logo/expand swap's motion: 150 ms, eased, none for reduced motion. */
const SWAP =
  "transition-[width,height,padding,opacity,scale] duration-150 ease-[cubic-bezier(.25,.1,.25,1)] motion-reduce:transition-none";

/**
 * The whole left edge: a drawer on phones, collapsible to icons
 * on desktop (⌘B). The page sits beside it (see layout.tsx).
 */
export function AppSidebar() {
  const { state, isMobile, openMobile } = useSidebar();
  // Collapsed, the logo is only a picture over the expand button (which is what tabbing reaches).
  const collapsed = state === "collapsed";
  // The logo's and links' entry plays as the site loads, and again each time the phone drawer opens.
  // After the links' (the longer) ends, the classes go, so it doesn't replay otherwise (say, when the
  // sidebar remounts switching between phone and desktop).
  const [entering, setEntering] = useState(true);
  // Replaying on the drawer opening: set during render when it changes, as React has it for state that
  // follows a prop, not in an effect (which would render twice).
  const [drawerWasOpen, setDrawerWasOpen] = useState(openMobile);
  if (openMobile !== drawerWasOpen) {
    setDrawerWasOpen(openMobile);
    if (isMobile && openMobile) setEntering(true);
  }
  // Collapsing by click leaves the pointer over the header, so for a frame the collapsed logo counts as
  // hovered and starts its swap to the expand button: a flicker. `pointer-events: none` doesn't stop it,
  // since the browser keeps the old hover until its next hit test. So while it collapses, the header drops
  // its `group/logo` class (see below), and the swap's group-hover classes have nothing to match, whatever
  // the browser thinks is hovered. It's back when the sidebar's width transition ends, or after a second
  // in case that event never fires. Only the container's own width counts: other transitions inside it
  // bubble up too. Each collapse restarts the fallback, so an earlier one's can't end a later collapse early.
  const [settling, setSettling] = useState(false);
  const fallback = useRef<ReturnType<typeof setTimeout>>(undefined);
  const settle = () => {
    setSettling(true);
    clearTimeout(fallback.current);
    fallback.current = setTimeout(() => setSettling(false), 1000);
  };
  return (
    // No border on its edge: the page's shadow marks it.
    <Sidebar
      collapsible="icon"
      className="overflow-hidden border-r-0!"
      onTransitionEnd={(event) =>
        event.target === event.currentTarget && event.propertyName === "width" && setSettling(false)
      }
    >
      {/* The logo, and the button that collapses it to icons. Collapsed, the two share the logo's square,
          and hovering it (or tabbing to it) swaps the logo for the expand button: the logo fades out
          shrinking to 80% while the button fades in, its icon growing from 80%, over 150 ms. */}
      <SidebarHeader
        // Odd on purpose: the group is dropped while collapsing, not styled away. See `settling` above.
        className={cn("relative flex-row items-center", !settling && "group/logo")}
      >
        <SidebarMenu className="min-w-0 flex-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Necromancy Ritual Calculator"
              onPointerEnter={pickTieDye}
              onFocus={pickTieDye}
              render={<Link href="/" tabIndex={collapsed ? -1 : undefined} aria-hidden={collapsed || undefined} />}
              className={cn(
                entering && "logo-in",
                "h-8 p-1 font-heading text-base font-bold text-gold-300 [&_img]:size-6 group-data-[collapsible=icon]:p-1!",
                // A logo, not a menu item: no fill on hover or press.
                "hover:bg-transparent hover:text-gold-300 active:bg-transparent active:text-gold-300",
                `${SWAP} group-data-[collapsible=icon]:pointer-events-none`,
                "group-data-[collapsible=icon]:group-hover/logo:scale-80 group-data-[collapsible=icon]:group-hover/logo:opacity-0",
                "group-data-[collapsible=icon]:group-has-focus-visible/logo:scale-80 group-data-[collapsible=icon]:group-has-focus-visible/logo:opacity-0",
              )}
            >
              <Image src="/icon.png" alt="" aria-hidden width={32} height={32} loading="eager" />
              {/* The name's too long for one line: stacked, it fits the button's 32px height. */}
              <span className="wordmark flex flex-col leading-none">
                {/* The space keeps the accessible name "Necromancy Ritual Calculator", not "NecromancyRitual". */}
                <span>Necromancy </span>
                <span className="font-sans text-xs/none font-medium tracking-wide text-gold-400">
                  Ritual Calculator
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {/* Two buttons, not one that moves: each is gone the moment the state changes. Expanded, it sits
            at the right. */}
        <SidebarTrigger
          title="Collapse sidebar (⌘B)"
          className="shrink-0 group-data-[collapsible=icon]:hidden"
          onClick={settle}
        />
        {/* Collapsed, it waits unseen over the logo for the hover. */}
        <SidebarTrigger
          title="Expand sidebar (⌘B)"
          className={cn(
            `absolute top-2 left-2 hidden size-8 opacity-0 group-data-[collapsible=icon]:flex ${SWAP}`,
            "[&_svg]:scale-80 [&_svg]:transition-[scale] [&_svg]:duration-150 [&_svg]:ease-[cubic-bezier(.25,.1,.25,1)] motion-reduce:[&_svg]:transition-none",
            "group-hover/logo:opacity-100 group-hover/logo:[&_svg]:scale-100 group-has-focus-visible/logo:opacity-100 group-has-focus-visible/logo:[&_svg]:scale-100",
          )}
        />
      </SidebarHeader>
      {/* The last link finishes last (they're staggered), so its end is when all are in. */}
      <SidebarContent
        onAnimationEnd={(event) =>
          event.animationName === "nav-in" && (event.target as Element).matches(":last-child") && setEntering(false)
        }
      >
        <SidebarGroup>
          <MainNav entering={entering} />
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

/** The site's pages, each with a game icon. The style guide is for building the site, so it's only
    listed when SHOW_STYLE_GUIDE is set: in dev, by default (see next.config.ts). The page itself is still
    there, unlisted and not indexed. */
const NAV = [
  { href: "/", label: "Rituals", icon: "/icons/greater-ritual-candle.png" },
  // Brown on the brown active fill, so it gets the black outline the others have in their art.
  { href: "/inventory", label: "Inventory", icon: "/icons/inventory.png", outlined: true },
  {
    href: "/help",
    label: "Help",
    icon: "/icons/help.png",
    sub: HELP_PAGES.map(({ slug, title }) => ({ href: `/help/${slug}`, label: title })),
  },
  ...(process.env.SHOW_STYLE_GUIDE
    ? [
        {
          href: "/style-guide",
          label: "Style guide",
          icon: "/icons/red-paint.png",
          sub: STYLE_GUIDE_PAGES.map(({ slug, title }) => ({ href: `/style-guide/${slug}`, label: title })),
        },
      ]
    : []),
];

/** The pages. Its own component, so a route change re-renders only this. */
function MainNav({ entering }: { entering: boolean }) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  return (
    <nav aria-label="Main">
      <SidebarMenu className="gap-1">
        {NAV.map(({ href, label, icon, outlined, sub }, index) => (
          // Slides and fades in as the site loads, one after another (.nav-in in globals.css).
          <SidebarMenuItem
            key={href}
            className={cn(entering && "nav-in")}
            style={{ "--i": index } as React.CSSProperties}
          >
            <SidebarMenuButton
              isActive={pathname === href}
              tooltip={label}
              className="relative"
              // On a phone, going somewhere closes the drawer.
              onPointerEnter={pickTieDye}
              onFocus={pickTieDye}
              render={<Link href={href} onClick={() => isMobile && setOpenMobile(false)} />}
            >
              {/* First: the button truncates its last span, the label. */}
              <LinkProgress current={pathname === href} />
              {/* Every icon in the same 20px square, whatever its shape, so the labels line up. */}
              <Image
                src={icon}
                alt=""
                aria-hidden
                width={14}
                height={28}
                className={cn("size-5 object-contain", outlined && "icon-outline")}
              />
              {/* Tie-dyes while hovered, like the logo's name. */}
              <span className="wordmark">{label}</span>
            </SidebarMenuButton>
            {/* Only while on it, or one of them. */}
            {sub && (pathname === href || pathname.startsWith(`${href}/`)) && (
              // Full width, no indent line: the text is padded in by the parent's icon and gap (36px), so
              // it lines up under the parent's label.
              <SidebarMenuSub className="mx-0 mt-1 translate-x-0 border-0 px-0 py-0">
                {sub.map((link) => (
                  <SidebarMenuSubItem key={link.href}>
                    <SidebarMenuSubButton
                      isActive={pathname === link.href}
                      className="relative h-8 translate-x-0 pl-9"
                      onPointerEnter={pickTieDye}
                      onFocus={pickTieDye}
                      render={<Link href={link.href} onClick={() => isMobile && setOpenMobile(false)} />}
                    >
                      <LinkProgress current={pathname === link.href} />
                      <span className="wordmark">{link.label}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </nav>
  );
}

/**
 * The phone's way to the sidebar: a floating button in the bottom-left corner. A manual
 * popover, so it floats in the top layer over everything without z-indexes, and nothing dismisses it.
 */
export function MenuFab() {
  const { openMobile, setOpenMobile } = useSidebar();
  const fab = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!fab.current?.matches(":popover-open")) fab.current?.showPopover();
  }, []);
  // Focus comes back here when the drawer closes, if it was in the drawer (now inert, so on the body).
  const wasOpen = useRef(false);
  useEffect(() => {
    const active = document.activeElement;
    if (wasOpen.current && !openMobile && (active === document.body || active?.closest("[data-mobile]"))) {
      fab.current?.focus();
    }
    wasOpen.current = openMobile;
  }, [openMobile]);
  return (
    <button
      ref={fab}
      popover="manual"
      type="button"
      className="menu-fab"
      aria-label="Open menu"
      aria-controls="mobile-sidebar"
      aria-expanded={openMobile}
      data-open={openMobile || undefined}
      onClick={() => setOpenMobile(true)}
    >
      <PanelLeftIcon aria-hidden />
    </button>
  );
}
