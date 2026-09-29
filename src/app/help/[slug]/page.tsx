import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Metadata } from "next";
import { Markdown } from "@/lib/components/markdown";
import { Page } from "@/lib/components/page";
import { HELP_PAGES } from "../help";

type Props = { params: Promise<{ slug: string }> };

/** Every help page, built ahead of time; there are no others. */
export const generateStaticParams = () => HELP_PAGES.map(({ slug }) => ({ slug }));
export const dynamicParams = false;

const pageOf = (slug: string) => HELP_PAGES.find((page) => page.slug === slug)!;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `${pageOf((await params).slug).title} (help)` };
}

/** A help page: its Markdown, from ./docs, read when the site's built. */
export default async function HelpPage({ params }: Props) {
  const { slug } = await params;
  const markdown = await readFile(join(process.cwd(), "src/app/help/docs", `${slug}.md`), "utf8");
  return (
    <Page title={pageOf(slug).title} eyebrow="Help">
      <Markdown>{markdown}</Markdown>
    </Page>
  );
}
