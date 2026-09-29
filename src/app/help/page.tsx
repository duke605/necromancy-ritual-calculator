import type { Metadata } from "next";
import Link from "next/link";
import { Page } from "@/lib/components/page";
import { HELP_PAGES } from "./help";

export const metadata: Metadata = { title: "Help" };

export default function Help() {
  return (
    <Page title="Help" className="gap-8">
      <p className="body text-muted-foreground">How to use the calculator, and what its results mean.</p>
      <ul className="flex flex-col gap-4">
        {HELP_PAGES.map(({ slug, title, about }) => (
          <li key={slug} className="flex flex-col gap-1">
            <Link href={`/help/${slug}`} className="h3 w-fit text-gold-300 hover:underline">
              {title}
            </Link>
            <p className="body-sm text-muted-foreground">{about}</p>
          </li>
        ))}
      </ul>
    </Page>
  );
}
