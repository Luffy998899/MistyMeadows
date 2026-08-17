/**
 * Downloads a freely licensed photograph for each attraction and writes it
 * into `public/media/attractions/`, together with the attribution the
 * licences require.
 *
 *   node scripts/fetch-attraction-photos.mjs            # fetch what is missing
 *   node scripts/fetch-attraction-photos.mjs --force    # re-fetch everything
 *   node scripts/fetch-attraction-photos.mjs kasauli    # just these slugs
 *
 * Why this exists as a script rather than committed files: these are public
 * landmarks, not the resort's property, so no photograph of them ships with
 * the repository. The attractions page picks up whatever lands in that
 * directory (see `src/lib/attraction-photos.ts`), so running this once fills
 * the page in — and a photograph attached to a row in /admin still wins over
 * anything here.
 *
 * Images come from Wikimedia — every file on Commons is freely licensed, but
 * most licences (CC-BY, CC-BY-SA) require crediting the photographer, so the
 * author, licence and source page are written to `credits.json` and rendered
 * under each photograph. Do not delete that file.
 *
 * Requires outbound network access to wikipedia.org / wikimedia.org. It needs
 * no API key and makes one request per attraction plus one download.
 */
import fs from "node:fs";
import path from "node:path";

/*
  Wikipedia article titles, not Commons categories: the REST summary
  endpoint hands back the article's lead image, which is nearly always the
  establishing photograph you would have chosen anyway. Where an attraction
  has no article of its own, the nearest article that does have a usable
  lead image is used and noted.
*/
const SOURCES = [
  ["dagshai", "Dagshai"],
  ["kasauli", "Kasauli"],
  ["sanawar", "The Lawrence School, Sanawar"],
  ["barog-tunnel", "Barog railway station"],
  ["shoolini-mata-temple", "Solan"],
  ["jatoli-shiv-temple", "Jatoli Shiv Temple"],
  ["mohan-shakti-heritage-park", "Mohan Shakti National Heritage Park"],
  ["dolanji-bon-monastery", "Menri Monastery"],
  ["nauni-university", "Dr. Yashwant Singh Parmar University of Horticulture and Forestry"],
  ["karol-tibba", "Karol Tibba"],
  ["chail", "Chail, Himachal Pradesh"],
];

const OUT = path.join(process.cwd(), "public", "media", "attractions");
const CREDITS = path.join(OUT, "credits.json");
const UA = "MistyMeadowsResorts/1.0 (website build script; contact info@mistymeadowsresorts.com)";

const args = process.argv.slice(2);
const force = args.includes("--force");
const only = args.filter((a) => !a.startsWith("--"));

async function getJson(url) {
  const response = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

/** Strips the HTML Wikimedia returns in its `artist` / `licence` fields. */
function plain(html) {
  if (!html) return undefined;
  return String(html)
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim() || undefined;
}

/**
 * Resolves an article title to a downloadable image plus its attribution.
 *
 * Two calls: the REST summary gives the lead image's file name, and the
 * Action API's `imageinfo` gives the author and licence for it. The licence
 * metadata is the point — without it the file cannot legally be published.
 */
async function resolve(title) {
  const summary = await getJson(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
  );

  const source = summary?.originalimage?.source ?? summary?.thumbnail?.source;
  if (!source) return null;

  // ".../commons/a/ab/Some_File.jpg" or a "/thumb/" variant of the same.
  const file = decodeURIComponent(path.basename(source.split("/thumb/").join("/").split("?")[0]));

  let author, licence, descriptionPage;
  try {
    const info = await getJson(
      "https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*" +
        "&prop=imageinfo&iiprop=extmetadata|url&titles=" +
        encodeURIComponent(`File:${file}`),
    );
    const pages = info?.query?.pages ?? {};
    const first = Object.values(pages)[0];
    const meta = first?.imageinfo?.[0];
    author = plain(meta?.extmetadata?.Artist?.value);
    licence = plain(meta?.extmetadata?.LicenseShortName?.value);
    descriptionPage = meta?.descriptionurl;
  } catch {
    // Fall through: the image is still usable, but without confirmed
    // attribution we refuse to write it (see the caller).
  }

  return {
    url: summary.originalimage?.source ?? source,
    author,
    licence,
    source: descriptionPage ?? summary?.content_urls?.desktop?.page,
  };
}

fs.mkdirSync(OUT, { recursive: true });

let credits = {};
try {
  credits = JSON.parse(fs.readFileSync(CREDITS, "utf8"));
} catch {
  // First run.
}

let written = 0;
let skipped = 0;
let failed = 0;

for (const [slug, title] of SOURCES) {
  if (only.length > 0 && !only.includes(slug)) continue;

  const target = path.join(OUT, `${slug}.jpg`);
  if (!force && fs.existsSync(target)) {
    console.log(`  skip   ${slug} (already present — use --force to replace)`);
    skipped++;
    continue;
  }

  try {
    const found = await resolve(title);
    if (!found) {
      console.log(`  none   ${slug} — "${title}" has no lead image`);
      failed++;
      continue;
    }

    /*
      Refuse to write a file whose licence we could not read. Publishing a
      photograph without knowing its terms is the one failure mode this
      script must not have — better a placeholder than an infringement.
    */
    if (!found.licence) {
      console.log(`  skip   ${slug} — licence could not be confirmed`);
      failed++;
      continue;
    }

    const response = await fetch(found.url, { headers: { "User-Agent": UA } });
    if (!response.ok) throw new Error(`${response.status} downloading image`);

    const buffer = Buffer.from(await response.arrayBuffer());

    // Resize if sharp is available (it ships with Next); otherwise write the
    // original, which next/image will resize on demand anyway.
    let out = buffer;
    try {
      const { default: sharp } = await import("sharp");
      out = await sharp(buffer)
        .rotate()
        .resize({ width: 1600, withoutEnlargement: true })
        .jpeg({ quality: 82, mozjpeg: true })
        .toBuffer();
    } catch {
      // sharp unavailable — keep the original bytes.
    }

    fs.writeFileSync(target, out);
    credits[slug] = {
      author: found.author ?? "Wikimedia Commons contributor",
      licence: found.licence,
      source: found.source,
    };
    console.log(
      `  ok     ${slug}  ${Math.round(out.length / 1024)}kB  ${found.licence} — ${credits[slug].author}`,
    );
    written++;
  } catch (error) {
    console.log(`  fail   ${slug} — ${error.message}`);
    failed++;
  }
}

fs.writeFileSync(CREDITS, `${JSON.stringify(credits, null, 2)}\n`);

console.log(`\n${written} written, ${skipped} already present, ${failed} unresolved.`);
console.log(`Credits written to ${path.relative(process.cwd(), CREDITS)} — keep it: the`);
console.log("licences require the attribution rendered under each photograph.");
console.log("\nRebuild (npm run build) for a statically rendered page to pick these up.");

if (written === 0 && failed > 0) process.exit(1);
