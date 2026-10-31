import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { chooseHeroTrack, isHeroTrack } from '../public/lib/hero.js';

const { tracks } = JSON.parse(await readFile(new URL('../public/staze.json', import.meta.url)));

test('hero catalog contains 23 usable and distinct race circuit photos', async () => {
  assert.equal(tracks.length, 23);
  assert.equal(new Set(tracks.map(track => track.image)).size, tracks.length);
  assert.ok(tracks.every(isHeroTrack));
  assert.ok(!tracks.some(track => /madring|madrid/i.test(track.name + ' ' + track.image)));
  for (const track of tracks) {
    const asset = new URL('../public/assets/' + encodeURIComponent(track.image), import.meta.url);
    const meta = await stat(asset);
    assert.ok(meta.size > 1024, `${track.image} mora imati sliku.`);
    assert.match(track.coordinates, /[NS].*[EW]/);
  }
});

test('hero switch always chooses a different track when possible', () => {
  const first = chooseHeroTrack(tracks, '', () => 0);
  assert.equal(first.image, 'Albert park.jpg');
  const second = chooseHeroTrack(tracks, first.image, () => 0);
  assert.notEqual(second.image, first.image);
  assert.equal(second.image, 'Bahrein.jpg');
  const last = chooseHeroTrack(tracks, '', () => .999999);
  assert.equal(last.image, 'zandvoort.jpg');
  assert.equal(chooseHeroTrack([first], first.image, () => 0), first);
});

test('broken or unsafe hero records are ignored', () => {
  assert.equal(chooseHeroTrack([], ''), null);
  assert.equal(chooseHeroTrack(null), null);
  assert.equal(isHeroTrack({ name: 'X', image: '../secret.jpg', coordinates: '0 N' }), false);
  assert.equal(isHeroTrack({ name: 'X', image: 'https://evil.example/shot.jpg', coordinates: '0 N' }), false);
  assert.equal(isHeroTrack({ name: 'X', image: 'suzuka.jpg', coordinates: '' }), false);
  assert.deepEqual(chooseHeroTrack([{ name:'bad', image:'bad.svg', coordinates:'0N' }, tracks[1]], '', ()=>0), tracks[1]);
});

test('hero is loaded separately from the race catalog', async () => {
  const app = await readFile(new URL('../public/app.js', import.meta.url), 'utf8');
  const hero = await readFile(new URL('../public/hero.js', import.meta.url), 'utf8');
  const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
  assert.ok(!app.includes('staze.json'));
  assert.ok(hero.includes("fetch('./staze.json'"));
  assert.ok(html.includes('id="hero-track-name"'));
  assert.ok(html.includes('id="hero-track-coordinates"'));
  assert.ok(html.includes('src="./hero.js"'));
});

test('new circuits retain the correct photo and circuit coordinates', () => {
  const expected = new Map([
    ['abu dabi.jpg', 'YAS MARINA'],
    ['baku.jpg', 'BAKU'],
    ['barselona.jpg', 'BARSELONA-KATALUNJA'],
    ['istanbul.jpg', 'ISTANBUL PARK'],
    ['kanada.jpg', 'ŽIL VILNEV'],
    ['meksiko.jpg', 'HERMANOS RODRIGEZ'],
    ['monako.jpg', 'MONAKO'],
    ['sao paoulo.jpg', 'INTERLAGOS'],
    ['silverston.jpg', 'SILVERSTON'],
    ['singapur.jpg', 'MARINA BEJ'],
    ['teksas.jpg', 'CIRCUIT OF THE AMERICAS'],
    ['zandvoort.jpg', 'ZANDVORT'],
  ]);
  for (const [image, name] of expected) {
    const track = tracks.find(track => track.image === image);
    assert.ok(track, `Missing ${image}`);
    assert.equal(track.name, name);
    assert.match(track.coordinates, /^[0-9]{1,2}°[0-9]{2}′[0-9]{2}″ [NS] · [0-9]{1,3}°[0-9]{2}′[0-9]{2}″ [EW]$/);
  }
});
