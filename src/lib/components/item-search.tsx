"use client";

import Image from "next/image";
import { useId, useState } from "react";
import items from "@/data/items.json";
import { trigramSearch } from "@/lib/trigram";
import { useField } from "./field";

type Item = (typeof items)[keyof typeof items];
const all: Item[] = Object.values(items);
const byId = (id: number) => items[String(id) as keyof typeof items];

/**
 * A search field over the known items, with the best 20 matches listed under it (trigram search, so
 * typos still find them). Arrow keys move through the list and Enter picks; so does a click. `first`
 * are listed ahead of the results while the query is still `defaultQuery`, e.g. a guess's other matches.
 */
export function ItemSearch({
  defaultQuery,
  first = [],
  picked,
  onPick,
}: {
  defaultQuery: string;
  first?: number[];
  picked: number;
  onPick: (id: number) => void;
}) {
  // What's typed, and what was searched for: picking an item writes its name in the field but leaves the
  // results as they were, so the list doesn't jump under the pointer.
  const [text, setText] = useState(defaultQuery);
  const [query, setQuery] = useState(defaultQuery);
  const [active, setActive] = useState(0);
  const list = useId();
  const field = useField();

  const found = trigramSearch(all, query, (item) => item.name);
  const results =
    query === defaultQuery
      ? [...first.map(byId), ...found.filter(({ id }) => !first.includes(id))].slice(0, 20)
      : found;
  const pick = (item: Item) => {
    onPick(item.id);
    setText(item.name);
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        {...field}
        type="search"
        className="input"
        role="combobox"
        aria-expanded
        aria-controls={list}
        aria-activedescendant={results[active] && `${list}-${results[active].id}`}
        autoComplete="off"
        value={text}
        // Selected, so typing replaces the name.
        onFocus={(event) => event.currentTarget.select()}
        onChange={(event) => {
          setText(event.target.value);
          setQuery(event.target.value);
          setActive(0);
        }}
        onKeyDown={(event) => {
          const move = { ArrowDown: 1, ArrowUp: -1 }[event.key];
          if (move) {
            event.preventDefault();
            setActive((index) => Math.min(Math.max(index + move, 0), results.length - 1));
          } else if (event.key === "Enter" && results[active]) {
            event.preventDefault();
            pick(results[active]);
          }
        }}
      />
      <ul id={list} role="listbox" aria-label="Items" className="item-search-results scrollbar">
        {results.map((item, index) => (
          <li
            key={item.id}
            id={`${list}-${item.id}`}
            role="option"
            aria-selected={item.id === picked}
            data-active={index === active || undefined}
            onPointerEnter={() => setActive(index)}
            // Not onClick: pressing would blur the field first.
            onPointerDown={(event) => {
              event.preventDefault();
              pick(item);
            }}
          >
            <Image src={item.image} alt="" aria-hidden width={24} height={24} className="size-6 object-contain" />
            {item.name}
          </li>
        ))}
        {results.length === 0 && <li className="text-muted-foreground">No items match.</li>}
      </ul>
    </div>
  );
}
