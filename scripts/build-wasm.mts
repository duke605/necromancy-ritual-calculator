// Assembles src/lib/bank-scan.wat into src/lib/bank-scan.wasm.ts: the module's bytes, to compile
// synchronously, so bank-scan.ts can stay synchronous (and needs no bundler support for .wasm files). Not
// committed; the dev, build, start and test scripts run it first.
import { readFile, writeFile } from "node:fs/promises";
import wabt from "wabt";

const source = "src/lib/bank-scan.wat";
const { parseWat } = await wabt();
let buffer: Uint8Array;
try {
  const parsed = parseWat(source, await readFile(source, "utf8"), { multi_value: true, simd: true });
  parsed.validate();
  ({ buffer } = parsed.toBinary({}));
} catch (error) {
  // Just wabt's message: uncaught, Node prints the line that threw first, all of wabt's minified source.
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
await writeFile(
  "src/lib/bank-scan.wasm.ts",
  `// Generated from bank-scan.wat by scripts/build-wasm.mts; don't edit.\nconst bytes = new Uint8Array([${buffer}]);\nexport default bytes;\n`,
);
