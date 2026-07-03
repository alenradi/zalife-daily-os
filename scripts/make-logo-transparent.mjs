// One-off: convert the solid-black logo background to transparency.
// Pixels are made transparent based on brightness (black -> alpha 0).
import sharp from "sharp";

const SRC = "public/logo.png";
const OUT = "public/logo.png";

const LOW = 12; // fully transparent at/below this brightness
const HIGH = 64; // fully opaque at/above this brightness

const img = sharp(SRC).ensureAlpha();
const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;

for (let i = 0; i < width * height; i++) {
  const o = i * channels;
  const r = data[o], g = data[o + 1], b = data[o + 2];
  const brightness = Math.max(r, g, b);
  let a;
  if (brightness <= LOW) a = 0;
  else if (brightness >= HIGH) a = 255;
  else a = Math.round(((brightness - LOW) / (HIGH - LOW)) * 255);
  data[o + 3] = a;
}

await sharp(data, { raw: { width, height, channels } })
  .png()
  .toFile(OUT + ".tmp");

await sharp(OUT + ".tmp").toFile(OUT);
console.log(`Wrote transparent logo ${width}x${height}`);
