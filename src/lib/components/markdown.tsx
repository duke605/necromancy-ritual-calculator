import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** A heading's text as an id, for linking to it: "Added rituals" is "added-rituals". */
const slugify = (children: React.ReactNode) =>
  String(children)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/**
 * Markdown, in the site's styles: sections under level-2 headings (as the style guide's), subheadings, lists,
 * tables and links (to other pages without reloading). Tables use GitHub's syntax.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="markdown flex max-w-3xl flex-col gap-4">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => (
            <h2 id={slugify(children)} className="h2 mt-12 border-b border-border pb-2 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 id={slugify(children)} className="subheading mt-4">
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="body">{children}</p>,
          ul: ({ children }) => <ul className="body flex list-disc flex-col gap-1 pl-6">{children}</ul>,
          ol: ({ children }) => <ol className="body flex list-decimal flex-col gap-1 pl-6">{children}</ol>,
          strong: ({ children }) => <strong className="font-bold text-gold-300">{children}</strong>,
          a: ({ href = "", children }) => (
            <Link href={href} className="text-gold-300 underline hover:text-gold-200">
              {children}
            </Link>
          ),
          // The style guide's table, in a game window's frame (without a title bar: a Markdown table has no
          // title). Help text runs long, so its cells wrap, where the table's own don't.
          table: ({ children }) => (
            <div className="panel frame max-w-full overflow-x-auto">
              <table className="table w-full [&_td]:whitespace-normal">{children}</table>
            </div>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
