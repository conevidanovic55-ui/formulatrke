import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html, css, app] = await Promise.all([
  readFile(new URL('../public/index.html', import.meta.url), 'utf8'),
  readFile(new URL('../public/styles.css', import.meta.url), 'utf8'),
  readFile(new URL('../public/app.js', import.meta.url), 'utf8'),
]);

test('hero no longer contains the slogan or its arrow', () => {
  assert.ok(!html.includes('STRAST NE POZNAJE CILJNU LINIJU'));
  assert.ok(!html.includes('arrow-down'));
  assert.ok(!css.includes('arrow-down'));
  assert.match(html, /class="hero-bottom"><span><span class="small-square"><\/span> FORMULA 1 · VIDEO ARHIVA<\/span><\/div>/);
});

test('red ticker has a single centred sequence without old left offset', () => {
  const ticker = html.match(/<div class="ticker"[^>]*>(.*?)<\/div><\/div>/s)?.[1];
  assert.ok(ticker);
  assert.deepEqual([...ticker.matchAll(/class="ticker-word">([^<]+)<\/span>/g)].map(m => m[1]), [
    'SVAKA SEZONA', 'SVAKA KRIVINA', 'ISTA STRAST', 'FORMULACIJA'
  ]);
  assert.equal([...ticker.matchAll(/class="ticker-star"/g)].length, 3);
  assert.ok(css.includes('justify-content:center;padding:0 16px'));
  assert.ok(css.includes('justify-content:center;gap:clamp('));
  assert.ok(!css.includes('translateX(-20px)'));
});

test('race cards show the race kind but not redundant Formula 1 or SNIMAK badges', () => {
  const template = html.split('<template id="race-card-template">')[1]?.split('</template>')[0];
  assert.ok(template);
  assert.ok(template.includes('class="card-kind"'));
  assert.ok(!template.includes('class="card-category"'));
  assert.ok(!template.includes('class="card-duration"'));
  assert.ok(!app.includes("querySelector('.card-category')"));
  assert.ok(!app.includes("querySelector('.card-duration')"));
  assert.ok(!css.includes('.card-category'));
  assert.ok(!css.includes('.card-duration'));
});
