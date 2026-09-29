import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/** Bank screenshots given to the bank import, kept as test images. Only where there's a server: in dev and
 * `npm start` (see next.config.ts). */
const DIR = path.join(process.cwd(), "tmp", "bank-screenshots");
const MAX_BYTES = 20 * 1024 * 1024;

export async function POST(request: Request) {
  const type = request.headers.get("content-type") ?? "";
  const extension = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" }[type];
  if (!extension) return new Response("Not a PNG, JPEG or WebP image", { status: 415 });
  const image = Buffer.from(await request.arrayBuffer());
  if (image.length > MAX_BYTES) return new Response("Over 20MB", { status: 413 });

  // Named for when it came, not what it was called: the name's the uploader's, so it isn't trusted.
  const file = path.join(DIR, `${new Date().toISOString().replaceAll(":", "-")}.${extension}`);
  await mkdir(DIR, { recursive: true });
  await writeFile(file, image);
  return new Response(null, { status: 201 });
}
