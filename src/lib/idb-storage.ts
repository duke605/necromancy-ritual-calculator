import { promisifyRequest } from "idb-keyval";
import { createJSONStorage } from "zustand/middleware";

/**
 * The site's IndexedDB database, "rituals", with an object store for each persisted zustand store, named as
 * its `persist` is ("inventory", "prices", …), holding its state under the key "state". A new persisted store
 * needs its name here and the version raised, so the upgrade makes its object store.
 */
const STORES = ["inventory", "prices", "calculator", "settings"];
const VERSION = 3;

let database: Promise<IDBDatabase> | undefined;
const open = () =>
  (database ??= new Promise((resolve, reject) => {
    const request = indexedDB.open("rituals", VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const name of STORES) if (!db.objectStoreNames.contains(name)) db.createObjectStore(name);
      // Version 1 kept everything in one "keyval" store.
      if (db.objectStoreNames.contains("keyval")) db.deleteObjectStore("keyval");
    };
    request.onsuccess = () => {
      const db = request.result;
      // Another tab, newer, upgrading: get out of its way (an open connection holds an upgrade until it
      // closes, and everything waits on the upgrade). This tab reopens on its next read or write.
      db.onversionchange = () => {
        db.close();
        database = undefined;
      };
      resolve(db);
    };
    request.onerror = () => reject(request.error);
  }));

/** Runs one request on the object store `name`. */
const run = async <T>(name: string, mode: IDBTransactionMode, request: (store: IDBObjectStore) => IDBRequest<T>) =>
  promisifyRequest(request((await open()).transaction(name, mode).objectStore(name)));

/**
 * Storage for zustand's persist: IndexedDB, each store in its own object store. None while pre-rendering, on the
 * server, which has no IndexedDB: the stores then load nothing, so pages pre-render as they start, loading.
 */
export const idbStorage = createJSONStorage(() => {
  if (typeof indexedDB === "undefined") throw new Error("No IndexedDB");
  return {
    getItem: async (name) => {
      // To see what shows while it loads: in development, ?pause-db holds every read until reloaded without it.
      if (process.env.NODE_ENV === "development" && new URLSearchParams(location.search).has("pause-db")) {
        await new Promise(() => {});
      }
      return (await run<string | undefined>(name, "readonly", (store) => store.get("state"))) ?? null;
    },
    setItem: async (name, value) => {
      await run(name, "readwrite", (store) => store.put(value, "state"));
    },
    removeItem: async (name) => {
      await run(name, "readwrite", (store) => store.delete("state"));
    },
  };
});
