import type { Metadata } from "next";
import Link from "next/link";
import { Page } from "@/lib/components/page";
import { RasialSays } from "@/lib/components/rasial-says";
import { buttonVariants } from "@/lib/components/ui/button";

export const metadata: Metadata = { title: "Page not found" };

// Any address without a page: exported as 404.html.
export default function NotFound() {
  return (
    <Page title="Page not found" className="items-center gap-6 py-12">
      <RasialSays
        actions={
          <Link href="/" className={buttonVariants({ variant: "ghost", size: "xs" })}>
            Back to rituals
          </Link>
        }
      >
        Even I, Rasial, the First Necromancer, cannot raise a page that never lived.
      </RasialSays>
    </Page>
  );
}
