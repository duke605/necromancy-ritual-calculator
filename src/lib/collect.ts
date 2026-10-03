/**
 * A lazy chain over `items`, written left to right: the browser's iterator helpers, which run every step for one
 * item before the next, in a single pass, once it's collected with `toArray` or `toObject` (or `reduce`). Anything
 * iterable (an array, a Map, a Set) is gone through as it is; any other object, by its [key, value] pairs.
 */
export function collect<T>(items: Iterable<T>): Collection<T>;
export function collect<O extends object>(object: O): Collection<[`${Exclude<keyof O, symbol>}`, O[keyof O]]>;
export function collect(items: object) {
  return new Collection(
    Iterator.from(Symbol.iterator in Object(items) ? (items as Iterable<unknown>) : Object.entries(items)),
  );
}

class Collection<T> implements Iterable<T> {
  readonly #items: IteratorObject<T, undefined, unknown>;

  constructor(items: IteratorObject<T, undefined, unknown>) {
    this.#items = items;
  }

  map<U>(fn: (item: T, index: number) => U) {
    return new Collection(this.#items.map(fn));
  }

  filter<S extends T>(fn: (item: T, index: number) => item is S): Collection<S>;
  filter(fn: (item: T, index: number) => unknown): Collection<T>;
  filter(fn: (item: T, index: number) => unknown) {
    return new Collection(this.#items.filter(fn));
  }

  /** Another collection works as `fn`'s result too. */
  flatMap<U>(fn: (item: T, index: number) => Iterable<U>) {
    return new Collection(this.#items.flatMap(fn));
  }

  reduce<U>(fn: (total: U, item: T, index: number) => U, initial: U) {
    return this.#items.reduce(fn, initial);
  }

  /** Iterable itself, for `for…of`, a spread, `new Map` or `new Set`; once, as any iterator. */
  [Symbol.iterator]() {
    return this.#items;
  }

  toArray() {
    return this.#items.toArray();
  }

  /** Key-value pairs as an object. */
  toObject<K extends PropertyKey, V>(this: Collection<readonly [K, V]>) {
    return Object.fromEntries(this.#items) as Record<K, V>;
  }
}
