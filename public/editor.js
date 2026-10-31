import { validateCatalog, videoSource } from './lib/catalog.js';
import { loadFromGithub, publishToGithub } from './lib/publishing.js';
const $ = selector => document.querySelector(selector);
const DRAFT_KEY = 'formulacija-link-draft-v1';
let token = '', catalog, sha, dirty = false, busy = false;
function message(text, error = false) { $('#message').hidden = false; $('#message').textContent = text; $('#message').classList.toggle('error', error); }
function syncSocials() { for (const platform of ['instagram', 'tiktok', 'youtube']) catalog.socials[platform] = $(`#social-${platform}`).value.trim(); }
function changed() {
  dirty = true; syncSocials(); $('#dirty-status').textContent = 'Nacrt nije javno objavljen.';
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(catalog)); }
  catch { message('Pregledač ne može da sačuva nacrt. Preuzmi ga da ne izgubiš izmene.', true); }
}
function renderSeasons() {
  const current = $('#race-season').value;
  $('#race-season').replaceChildren(...catalog.seasons.map(season => { const option = document.createElement('option'); option.value = season; option.textContent = season; return option; }));
  if (catalog.seasons.includes(current)) $('#race-season').value = current;
  $('#season-list').textContent = `Sezone u arhivi: ${catalog.seasons.join(', ')}`;
}
function renderRaces() {
  $('#race-list').replaceChildren();
  if (!catalog.races.length) { const empty = document.createElement('p'); empty.textContent = 'Tvoja arhiva čeka prvi link.'; $('#race-list').append(empty); }
  for (const race of [...catalog.races].sort((a, b) => b.season.localeCompare(a.season) || b.round - a.round)) {
    const row = document.createElement('div'); row.className = 'editor-race-row';
    const info = document.createElement('div'), title = document.createElement('strong'), meta = document.createElement('small');
    title.textContent = race.title; meta.textContent = `${race.season} · ${race.kind} · ${race.videoUrl ? 'Video link dodat' : 'Probni unos'}`;
    info.append(title, meta);
    const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'delete-race'; edit.textContent = 'Izmeni';
    edit.addEventListener('click', () => {
      $('#race-form').dataset.editId = race.id;
      for (const [field, value] of Object.entries({ title: race.title, location: race.location, season: race.season, kind: race.kind, date: race.date || '', image: race.image || '' })) $(`#race-${field}`).value = value;
      $('#video-link').value = race.videoUrl || ''; $('#rights').checked = false; $('#add-race').textContent = 'Sačuvaj link u nacrt'; $('#race-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'delete-race'; remove.textContent = 'Ukloni';
    remove.setAttribute('aria-label', `Ukloni ${race.title}, ${race.season}`);
    remove.addEventListener('click', () => { catalog.races = catalog.races.filter(r => r.id !== race.id); changed(); renderRaces(); });
    const actions = document.createElement('div'); actions.className = 'row-actions'; actions.append(edit, remove);
    row.append(info, actions); $('#race-list').append(row);
  }
}
function populate() {
  catalog.socials ||= {};
  for (const platform of ['instagram', 'tiktok', 'youtube']) $(`#social-${platform}`).value = catalog.socials[platform] || '';
  renderSeasons(); renderRaces();
}
function setBusy(value) { busy = value; document.querySelectorAll('button, input, select').forEach(element => element.disabled = value); }
$('#login-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (dirty && !confirm('Učitavanje javne arhive zameniće trenutni nacrt. Preuzmi nacrt ako želiš da ga zadržiš. Nastavi?')) return;
  setBusy(true);
  try {
    const candidate = $('#password').value.trim();
    const result = await loadFromGithub(candidate);
    if (validateCatalog(result.catalog).length) throw new Error('Arhiva u repozitorijumu ima neispravne podatke.');
    token = candidate; catalog = result.catalog; sha = result.sha; dirty = false;
    localStorage.removeItem(DRAFT_KEY); populate(); $('#password').value = ''; $('#logout').hidden = false;
    $('#dirty-status').textContent = 'Povezano sa GitHub-om.'; message('Nalog je povezan. Dodaj linkove pa klikni „Objavi na sajtu“.');
  } catch (error) { message(error.message, true); }
  finally { $('#password').value = ''; setBusy(false); }
});
$('#logout').addEventListener('click', () => { token = ''; sha = null; $('#logout').hidden = true; message('Nalog je odjavljen. Nacrt ostaje u ovom pregledaču.'); });
$('#save').addEventListener('click', async () => {
  if (!token) { message('Za objavljivanje prvo poveži GitHub nalog iznad. Bez povezivanja možeš preuzeti nacrt.', true); $('#password').focus(); return; }
  setBusy(true);
  try {
    syncSocials(); const errors = validateCatalog(catalog); if (errors.length) throw new Error(errors.join(' '));
    sha = await publishToGithub(token, catalog, sha); dirty = false; localStorage.removeItem(DRAFT_KEY);
    $('#dirty-status').textContent = 'Poslato na GitHub; objavljivanje je u toku.';
    message('Izmene su sačuvane na GitHub-u. Javni sajt se ažurira kada hosting završi objavljivanje, obično za nekoliko minuta.');
  } catch (error) { message(error.message, true); }
  finally { setBusy(false); }
});
$('#export').addEventListener('click', () => {
  syncSocials(); const errors = validateCatalog(catalog); if (errors.length) return message(errors.join(' '), true);
  const blob = new Blob([JSON.stringify(catalog, null, 2) + '\n'], { type: 'application/json' });
  const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = 'content.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  message('Nacrt je preuzet kao content.json. To ga ne objavljuje. Može se i zameniti datoteka public/content.json u GitHub repozitorijumu.');
});
$('#import').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file) return;
  try {
    if (file.size > 1024 * 1024) throw new Error('JSON nacrt je prevelik (najviše 1 MB).');
    const imported = JSON.parse(await file.text()), errors = validateCatalog(imported); if (errors.length) throw new Error(errors.join(' '));
    if (dirty && !confirm('Zameni trenutni nacrt podacima iz datoteke?')) return;
    catalog = imported; populate(); changed(); message('Nacrt je učitan. Još nije javno objavljen.');
  } catch (error) { message(error.message, true); }
  finally { event.target.value = ''; }
});
$('#add-season').addEventListener('click', () => {
  const season = $('#new-season').value;
  if (!/^\d{4}$/.test(season) || Number(season) < 1950 || Number(season) > 2199) return message('Unesi godinu između 1950 i 2199.', true);
  if (catalog.seasons.includes(season)) return message('Ta sezona već postoji.', true);
  catalog.seasons.push(season); catalog.seasons.sort().reverse(); renderSeasons(); $('#race-season').value = season; $('#new-season').value = ''; changed(); message(`Sezona ${season} je dodata u nacrt.`);
});
$('#remove-demos').addEventListener('click', () => { catalog.races = catalog.races.filter(r => r.videoUrl); changed(); renderRaces(); message('Probni unosi su uklonjeni iz nacrta.'); });
for (const platform of ['instagram', 'tiktok', 'youtube']) $(`#social-${platform}`).addEventListener('input', changed);
$('#preview-video').addEventListener('click', () => {
  const source = videoSource($('#video-link').value.trim());
  $('#editor-preview').replaceChildren(); $('#editor-preview').hidden = false;
  if (!source) { $('#editor-preview').textContent = 'Unesi ispravan HTTPS link ka snimku.'; return; }
  if (source.type === 'external') { $('#editor-preview').textContent = 'Ovaj link će se otvarati na izvornom servisu u novoj kartici.'; return; }
  const player = document.createElement(source.type === 'video' ? 'video' : 'iframe'); player.src = source.url;
  if (source.type === 'video') { player.controls = true; player.preload = 'metadata'; }
  else { player.title = 'Provera video linka'; player.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation'); player.allowFullscreen = true; }
  $('#editor-preview').append(player);
});
$('#race-form').addEventListener('submit', event => {
  event.preventDefault(); if (busy) return;
  try {
    const videoUrl = $('#video-link').value.trim();
    if (!videoSource(videoUrl)) throw new Error('Dodaj ispravan HTTPS link ka snimku.');
    const season = $('#race-season').value, editId = $('#race-form').dataset.editId;
    const existing = catalog.races.find(r => r.id === editId);
    const race = { id: existing?.id || `snimak-${crypto.randomUUID()}`, title: $('#race-title').value.trim(), location: $('#race-location').value.trim(), season, category: 'Formula 1', kind: $('#race-kind').value, round: existing?.round || Math.max(0, ...catalog.races.filter(r => r.season === season).map(r => r.round)) + 1, date: $('#race-date').value, duration: existing?.duration || '', image: $('#race-image').value.trim(), videoUrl };
    const candidate = { ...catalog, races: [...catalog.races.filter(r => r.id !== editId), race] };
    const errors = validateCatalog(candidate); if (errors.length) throw new Error(errors.join(' '));
    catalog = candidate; changed(); renderRaces(); $('#race-form').reset(); delete $('#race-form').dataset.editId;
    $('#add-race').textContent = 'Dodaj link u nacrt'; $('#editor-preview').replaceChildren(); $('#editor-preview').hidden = true;
    message('Link je sačuvan u nacrtu. Klikni „Objavi na sajtu“ da ga vide posetioci.');
  } catch (error) { message(error.message, true); }
});
window.addEventListener('beforeunload', event => { if (busy) { event.preventDefault(); event.returnValue = ''; } });
async function initialize() {
  try {
    const response = await fetch('./content.json', { cache: 'no-store' }); if (!response.ok) throw new Error('Arhiva nije dostupna.');
    catalog = await response.json(); if (validateCatalog(catalog).length) throw new Error('Arhiva nije ispravna.');
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) { const parsed = JSON.parse(draft); if (!validateCatalog(parsed).length) { catalog = parsed; dirty = true; $('#dirty-status').textContent = 'Vraćen je lokalni nacrt koji nije objavljen.'; } }
    } catch { /* Browsers may disable local storage; the downloadable draft remains available. */ }
    populate();
  } catch (error) { message(error.message, true); $('#workspace').hidden = true; }
}
initialize();
