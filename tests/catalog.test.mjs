import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { filterRaces, socialUrl, videoSource, validateCatalog, validRaceImage } from '../public/lib/catalog.js';
const catalog = JSON.parse(await readFile(new URL('./fixtures/demo-catalog.json', import.meta.url)));
test('catalog is valid and demo records have no fabricated videos', () => {
  assert.deepEqual(validateCatalog(catalog), []);
  assert.equal(catalog.races.filter(r => r.videoUrl).length, 0);
});
test('season, type and accent insensitive search combine', () => {
  assert.equal(filterRaces(catalog.races, { season: '2025', kind: 'Kvalifikacije', query: 'belgije' }).length, 1);
  assert.equal(filterRaces(catalog.races, { query: 'NEPOSTOJECE' }).length, 0);
  assert.equal(filterRaces(catalog.races, { query: 'Monca' }).length, 2);
});
test('only supported safe video sources are accepted', () => {
  assert.equal(videoSource('/media/123e4567-e89b-12d3-a456-426614174000.mp4'), null);
  assert.equal(videoSource('https://youtu.be/abcdefghijk').type, 'embed');
  assert.equal(videoSource('https://vimeo.com/123456').type, 'embed');
  for (const value of ['javascript:alert(1)', '//evil.test/x.mp4', '/media/../secret', 'http://example.com/video.mp4', 'https://u:p@example.com/x.mp4']) assert.equal(videoSource(value), null);
});
test('social links reject wrong domains and validation handles malformed catalogs', () => {
  assert.equal(socialUrl('instagram', 'https://www.instagram.com/formulacija/'), 'https://www.instagram.com/formulacija/');
  assert.equal(socialUrl('instagram', 'https://evil.test/'), null);
  for (const data of [null, {}, { name: 'a', seasons: {}, races: [{}] }, { name: 'a', seasons: [], races: [null] }]) assert.ok(validateCatalog(data).length);
  const duplicate = structuredClone(catalog); duplicate.races.push(duplicate.races[0]); assert.ok(validateCatalog(duplicate).some(e => e.includes('jedinstven')));
});

test('OK.ru watch links become embed links, other services normalize safely', () => {
  assert.deepEqual(videoSource('https://ok.ru/video/11719629212384'), { type: 'embed', url: 'https://ok.ru/videoembed/11719629212384' });
  assert.equal(videoSource('https://ok.ru/videoembed/11719629212384').type, 'embed');
  assert.equal(videoSource('https://www.dailymotion.com/video/x123456').url, 'https://www.dailymotion.com/embed/video/x123456');
  assert.equal(videoSource('https://streamable.com/abc123').url, 'https://streamable.com/e/abc123');
  assert.equal(videoSource('https://streamtape.com/v/abc123/title').url, 'https://streamtape.com/e/abc123');
  assert.equal(videoSource('https://example.com/watch/123').type, 'external');
  assert.equal(videoSource('https://ok.ru.evil.test/video/123').type, 'external');
});

test('published catalog contains the user-provided China 2025 link', async () => {
  const live = JSON.parse(await readFile(new URL('../public/content.json', import.meta.url)));
  assert.deepEqual(validateCatalog(live), []);
  assert.equal(live.races[0].season, '2025');
  assert.equal(live.races[0].videoUrl, 'https://ok.ru/video/11719629212384');
});

test('flag images are local asset filenames, not arbitrary paths or urls', () => {
  assert.equal(validRaceImage('Kina.png'), true);
  assert.equal(validRaceImage('Monako.jpg'), true);
  assert.equal(validRaceImage('Španija.png'), true);
  assert.equal(validRaceImage('Saudi Arabia.png'), true);
  for (const bad of ['../secret.jpg', 'https://evil.test/flag.png', '/Kina.png', 'Kina.svg', 'foo\\bar.png', '']) {
    assert.equal(validRaceImage(bad), false);
  }
  const missing = structuredClone(catalog);
  missing.races[0].image = '../secret.png';
  assert.ok(validateCatalog(missing).some(e => e.includes('Naziv slike')));
});

test('published race image names are valid', async () => {
  const live = JSON.parse(await readFile(new URL('../public/content.json', import.meta.url)));
  assert.equal(live.races.length, 2);
  assert.ok(live.races.every(r => validRaceImage(r.image)));
  assert.deepEqual(validateCatalog(live), []);
});

test('social links render even if the removed About section is missing', async () => {
  const source = await readFile(new URL('../public/app.js', import.meta.url), 'utf8');
  const match = source.match(/function renderSocials\(\) \{[\s\S]*?\n\}/);
  assert.ok(match, 'renderSocials is available');
  const links = {
    children: [],
    replaceChildren() { this.children = []; },
    append(element) { this.children.push(element); },
  };
  const catalog = { socials: { instagram: 'https://www.instagram.com/formulacija/' } };
  const fakeDocument = { createElement() { return {}; } };
  const renderSocials = runInNewContext('(' + match[0] + ')', {
    $: selector => selector === '#social-links' ? links : null,
    document: fakeDocument,
    socialIcons: { instagram: '<svg></svg>' },
    socialUrl: (platform, value) => value,
    catalog,
  });
  assert.doesNotThrow(() => renderSocials());
  assert.equal(links.children.length, 1);
  assert.equal(links.children[0].href, catalog.socials.instagram);
});
