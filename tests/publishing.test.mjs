import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeContent, decodeContent, loadFromGithub, publishToGithub } from '../public/lib/publishing.js';
test('GitHub encoding preserves Serbian text', () => {
  const text = JSON.stringify({ title: 'Španija, Đorđe i još jedan krug 🏁' });
  assert.equal(decodeContent(encodeContent(text)), text);
});
test('publishing uses branch and optimistic concurrency without writing the token into content', async t => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  const calls = [];
  globalThis.fetch = async (url, options) => {
    assert.ok(url.startsWith('https://api.github.com/repos/formulacija/formulatrke/contents/public/content.json'), 'Urednik mora objavljivati u aktivni GitHub repozitorijum');
    calls.push({ url, options });
    return Response.json(options.method ? { content: { sha: 'next' } } : { sha: 'initial', content: encodeContent('{"name":"Formulacija"}') });
  };
  const loaded = await loadFromGithub('test-token'); assert.equal(loaded.sha, 'initial');
  assert.equal(await publishToGithub('test-token', { name: 'Formulacija' }, loaded.sha), 'next');
  const body = JSON.parse(calls[1].options.body);
  assert.equal(body.sha, 'initial'); assert.equal(body.branch, 'main');
  assert.equal(decodeContent(body.content), '{\n  "name": "Formulacija"\n}\n');
  assert.ok(!decodeContent(body.content).includes('test-token'));
});
test('stale writes produce actionable errors', async t => {
  const original = globalThis.fetch; t.after(() => { globalThis.fetch = original; });
  globalThis.fetch = async () => new Response('', { status: 409 });
  await assert.rejects(() => publishToGithub('test-token', {}, 'old'), /Arhiva je promenjena/);
});
