import type { Metadata } from "next";
import Link from "next/link";
import { Page } from "@/lib/components/page";
import { STYLE_GUIDE_PAGES } from "./style-guide";

export const metadata: Metadata = { title: "Style guide" };

export default function StyleGuide() {
  return (
    <Page title="Style guide" className="gap-8">
      <p className="body text-muted-foreground">
        Every component and its variations. Colours come from the RS3 interface.
      </p>
      <ul className="flex flex-col gap-4">
        {STYLE_GUIDE_PAGES.map(({ slug, title, about }) => (
          <li key={slug} className="flex flex-col gap-1">
            <Link href={`/style-guide/${slug}`} className="h3 w-fit text-gold-300 hover:underline">
              {title}
            </Link>
            <p className="body-sm text-muted-foreground">{about}</p>
          </li>
        ))}
      </ul>
    </Page>
  );
}
