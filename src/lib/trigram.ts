import { collect } from "./collect.ts";

/** A text's trigrams: every run of three characters, lowercased, padded so a word's start counts too. */

function trigrams(text: string): Set<string> {
  const padded = `  ${text.toLowerCase().trim()} `;
  const grams = new Set<string>();
  for (let i = 0; i + 3 <= padded.length; i++) grams.add(padded.slice(i, i + 3));
  return grams;
}

/**
 * The best `limit` of `items` for `query`, by how many trigrams their names share with it, out of all
 * either has. Typos and words out of order still match; an empty query gives the first `limit`.
 */
export function trigramSearch<T>(items: T[], query: string, name: (item: T) => string, limit = 20): T[] {
  if (!query.trim()) return items.slice(0, limit);
  const wanted = trigrams(query);
  return collect(items)
    .map((item) => {
      const grams = trigrams(name(item));
      let shared = 0;
      for (const gram of wanted) if (grams.has(gram)) shared++;
      return { item, score: shared / (wanted.size + grams.size - shared) };
    })
    .filter(({ score }) => score > 0)
    .toArray()
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ item }) => item);
}
