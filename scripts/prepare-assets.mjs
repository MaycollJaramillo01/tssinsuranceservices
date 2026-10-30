import sharp from 'sharp';
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const originals = resolve('assets/originals');
await mkdir('public/images', { recursive: true });
await mkdir('public/fonts', { recursive: true });
await mkdir('public/licenses', { recursive: true });
await mkdir('src/generated', { recursive: true });

const images = [
  { name: 'christian-tolossa', source: 'christian.jpg', widths: [320, 480, 768], ratio: 4 / 5 },
  { name: 'cruz-garcia', source: 'cruz.jpg', widths: [320, 480, 768], ratio: 4 / 5 },
  { name: 'german-abril', source: 'german.jpg', widths: [320, 480, 768], ratio: 4 / 5 },
  { name: 'tax-preparation', source: 'taxes.jpeg', widths: [480, 768, 1200], ratio: 3 / 2 },
  { name: 'home-purchase', source: 'housing.jpg', widths: [480, 768, 1200], ratio: 3 / 2 },
];
for (const item of images) {
  for (const width of item.widths) {
    const pipeline = sharp(resolve(originals, item.source)).rotate().resize({
      width, height: Math.round(width / item.ratio), fit: 'cover',
      position: 'centre', withoutEnlargement: true,
    });
    await Promise.all([
      pipeline.clone().webp({ quality: 82 }).toFile(`public/images/${item.name}-${width}.webp`),
      pipeline.clone().avif({ quality: 55, effort: 4 }).toFile(`public/images/${item.name}-${width}.avif`),
    ]);
  }
}
// Trim only the white outer margin; preserve every original brand color.
await sharp(resolve(originals, 'logo.png')).trim({ background: '#ffffff', threshold: 15 })
  .resize({ width: 384, withoutEnlargement: true }).webp({ lossless: true }).toFile('public/images/tss-logo.webp');
const logo = await sharp('public/images/tss-logo.webp').metadata();
await writeFile('src/generated/logo.json', JSON.stringify({ width: logo.width, height: logo.height }));

for (const [family, file] of [['manrope', 'manrope-latin-wght-normal.woff2'], ['source-sans-3', 'source-sans-3-latin-wght-normal.woff2']]) {
  const base = `node_modules/@fontsource-variable/${family}`;
  await copyFile(`${base}/files/${file}`, `public/fonts/${family}-latin.woff2`);
  await copyFile(`${base}/LICENSE`, `public/licenses/${family}-OFL.txt`);
}
const names = ['shield-check', 'receipt-tax', 'car', 'home', 'building', 'arrow-up-right', 'arrow-right', 'chevron-down', 'plus', 'minus', 'phone', 'mail', 'clock', 'menu-2', 'x', 'brand-facebook', 'check'];
const icons = {};
for (const name of names) {
  const svg = await readFile(`node_modules/@tabler/icons/icons/outline/${name}.svg`, 'utf8');
  icons[name] = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>[\s\S]*$/, '');
}
await writeFile('src/generated/icons.json', JSON.stringify(icons));
await copyFile('node_modules/@tabler/icons/LICENSE', 'public/licenses/tabler-icons-MIT.txt');
console.log('Responsive AVIF/WebP, original logo colors, licensed local fonts and Tabler icons prepared.');
