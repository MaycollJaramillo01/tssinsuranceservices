import { readFile, writeFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { routes } from '../server/app.ts';

const origin = 'http://127.0.0.1:4321';
const paths = ['/', ...routes.map(route => `/${route}/`)];
const report = { pages: [], redirects: [], contrast: [] };
function luminance(hex) {
  const rgb = hex.slice(1).match(/../g).map(v => parseInt(v,16)/255).map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4);
  return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];
}
const colors = { brand:'#4B5D2A',brandHover:'#34421E',background:'#FAFAF7',surface:'#FFFFFF',surfaceMuted:'#F0F2EA',heading:'#20251D',body:'#41483C',muted:'#626B5B',error:'#B42318' };
for (const text of ['brand','brandHover','heading','body','muted','error']) {
  for (const background of ['background','surface','surfaceMuted']) {
    const a = luminance(colors[text]), b = luminance(colors[background]);
    const ratio = (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
    assert.ok(ratio >= 4.5, `${text}/${background}`);
    report.contrast.push({ text, background, ratio: Number(ratio.toFixed(2)) });
  }
}
for (const background of ['brand','brandHover']) {
  const ratio = (1.05)/(luminance(colors[background])+.05);
  assert.ok(ratio >= 4.5);
  report.contrast.push({ text:'white',background,ratio:Number(ratio.toFixed(2)) });
}
const targets = new Set();
for (const path of paths) {
  const response = await fetch(origin+path);
  assert.equal(response.status,200,path);
  const html = await response.text();
  assert.equal((html.match(/<h1\b/g)||[]).length,1,path);
  assert.equal((html.match(/<script type="module">/g)||[]).length,0,'Executable scripts must be external under the CSP.');
  assert.match(html,/noindex, nofollow/);
  for (const match of html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) targets.add(match[1]);
  report.pages.push({path,status:response.status,h1:1,noindex:true});
}
for (const path of targets) {
  const response = await fetch(origin+path,{method:'HEAD'});
  assert.equal(response.status,200,`Broken internal resource: ${path}`);
}
for (const [old, target] of [['insurance-2','insurance'],['income-tax-2','income-tax'],['contact-8','contact'],...routes.map(route => [route,route])]) {
  for (const suffix of old === target ? [''] : ['', '/']) {
    const response = await fetch(`${origin}/${old}${suffix}`, {redirect:'manual'});
    assert.equal(response.status,301);
    assert.equal(response.headers.get('location'),`${origin}/${target}/`);
    assert.equal((await fetch(response.headers.get('location'),{redirect:'manual'})).status,200);
    report.redirects.push({from:`/${old}${suffix}`,to:`/${target}/`,status:301,hops:1});
  }
}
assert.deepEqual(await (await fetch(`${origin}/api/inquiry-config`)).json(),{enabled:false});
await mkdir('qa',{recursive:true});
await writeFile('qa/build-verification.json',JSON.stringify({...report,internalResources:targets.size},null,2));
console.log(`${paths.length} pages, ${targets.size} internal resources, ${report.redirects.length} single-hop 301s, ${report.contrast.length} AA contrast combinations verified. Public form disabled.`);
