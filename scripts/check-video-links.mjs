/**
 * Checks the YouTube / Vimeo link parser in `src/lib/video.ts`.
 *
 *   node scripts/check-video-links.mjs
 *
 * This is the one piece of owner-supplied input that ends up inside an
 * `iframe src`, so what matters most here is not that the good links work —
 * it is that anything unrecognised comes back null and gets rendered as a
 * plain link instead. The last few cases are the ones worth keeping.
 *
 * The module is plain TypeScript with no imports and no type annotations
 * beyond the signature, so it can be stripped to JavaScript and evaluated
 * directly rather than pulling in a build step for eleven assertions.
 */
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.join(process.cwd(), "src/lib/video.ts"), "utf8");

const js = source
  .replace("export function embedUrlFor(raw: string): string | null", "function embedUrlFor(raw)")
  .replace("let url: URL;", "let url;");

const embedUrlFor = new Function(`${js}; return embedUrlFor;`)();

/** [input, expected substring — or null meaning "must be rejected"] */
const CASES = [
  ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "youtube-nocookie.com/embed/dQw4w9WgXcQ"],
  ["https://youtu.be/dQw4w9WgXcQ?t=30", "youtube-nocookie.com/embed/dQw4w9WgXcQ"],
  ["https://m.youtube.com/watch?v=abc123XYZ_-", "embed/abc123XYZ_-"],
  ["https://www.youtube.com/embed/abc123", "embed/abc123"],
  ["https://www.youtube.com/shorts/xyz789", "embed/xyz789"],
  ["https://vimeo.com/76979871", "player.vimeo.com/video/76979871"],
  ["https://player.vimeo.com/video/76979871", "player.vimeo.com/video/76979871"],
  ["  https://youtu.be/spaced  ", "embed/spaced"],
  // Rejections — these are the assertions that actually matter.
  ["https://evil.example.com/steal", null],
  ["javascript:alert(1)", null],
  ["not a url at all", null],
  ["https://vimeo.com/channels/staffpicks", null],
  ["https://www.youtube.com/", null],
];

let failed = 0;

for (const [input, expected] of CASES) {
  const got = embedUrlFor(input);
  const ok = expected === null ? got === null : typeof got === "string" && got.includes(expected);
  if (!ok) failed++;
  console.log(
    `  ${ok ? "PASS" : "FAIL"}  ${input.trim().slice(0, 46).padEnd(48)} → ${got}`,
  );
}

console.log(failed === 0 ? "\nAll video link cases pass." : `\n${failed} case(s) failed.`);
process.exit(failed > 0 ? 1 : 0);
