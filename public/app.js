import { filterRaces, socialUrl, videoSource, validateCatalog } from './lib/catalog.js';
const $ = selector => document.querySelector(selector);
const state = { season: 'all', kind: 'all', query: '', sort: 'newest' };
let catalog;
const socialIcons = {
  instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.5" cy="6.5" r="1"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 2h3c0 2.5 1.4 4 4 4.3v3c-1.6 0-3-.5-4-1.4v8.3A6.5 6.5 0 1 1 12 9.7v3.1a3.4 3.4 0 1 0 3 3.4Z"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 7.3c-.2-1.5-1.2-2.6-2.7-2.8C17.2 4.2 14.9 4 12 4s-5.2.2-7.3.5C3.2 4.7 2.2 5.8 2 7.3a33 33 0 0 0 0 9.4c.2 1.5 1.2 2.6 2.7 2.8 2.1.3 4.4.5 7.3.5s5.2-.2 7.3-.5c1.5-.2 2.5-1.3 2.7-2.8a33 33 0 0 0 0-9.4ZM10 16V8l7 4Z"/></svg>',
};

async function loadCatalog() {
  $('#load-error').hidden = true;
  try {
    const response = await fetch('./content.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Catalog unavailable');
    catalog = await response.json();
    if (validateCatalog(catalog).length) throw new Error('Invalid catalog');
    state.season = catalog.seasons.find(season => catalog.races.some(r => r.season === season && r.videoUrl)) || catalog.seasons[0];
    renderSeasons(); renderSocials(); render();
    $('#archive-note').textContent = catalog.races.some(r => r.videoUrl) ? 'Spremno za gledanje' : 'Probna arhiva';
    $('#demo-note').hidden = catalog.races.some(r => r.videoUrl);
  } catch {
    $('#load-error').hidden = false;
    $('#results-count').textContent = 'Arhiva nije učitana.';
  }
}

function renderSeasons() {
  const fragment = document.createDocumentFragment();
  for (const season of [...catalog.seasons, 'all']) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'season-tab'; button.dataset.season = season;
    button.append(document.createTextNode(season === 'all' ? 'Sve sezone' : `Sezona ${season}`));
    const count = document.createElement('small'); count.textContent = catalog.races.filter(r => season === 'all' || r.season === season).length;
    button.append(count); button.addEventListener('click', () => { state.season = season; render(); }); fragment.append(button);
  }
  $('#season-tabs').replaceChildren(fragment);
}

function renderSocials() {
  $('#social-links').replaceChildren();
  for (const [platform, icon] of Object.entries(socialIcons)) {
    const href = socialUrl(platform, catalog.socials?.[platform]);
    if (!href) continue;
    const link = document.createElement('a');
    link.className = 'social-link'; link.href = href; link.target = '_blank'; link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', `${platform === 'tiktok' ? 'TikTok' : platform === 'youtube' ? 'YouTube' : 'Instagram'} — Formulacija (nova kartica)`);
    link.innerHTML = icon; $('#social-links').append(link);
  }
}

function render() {
  const races = filterRaces(catalog.races, state);
  const fragment = document.createDocumentFragment();
  for (const race of races) {
    const card = $('#race-card-template').content.firstElementChild.cloneNode(true);
    const art = card.querySelector('.card-art');
    if (race.image) {
      const picture = document.createElement('img');
      picture.className = 'card-image';
      picture.src = './assets/' + encodeURIComponent(race.image);
      picture.alt = '';
      picture.loading = 'lazy';
      picture.decoding = 'async';
      picture.addEventListener('error', () => picture.remove());
      art.prepend(picture);
    }
    card.querySelector('.card-kind').textContent = race.kind;
    card.querySelector('.card-meta').textContent = `${race.season} / ${race.kind}`;
    card.querySelector('.card-title').textContent = race.title;
    card.querySelector('.card-location').textContent = race.location;
    card.setAttribute('aria-label', `${race.title}, ${race.kind}, ${race.season}${race.videoUrl ? ' — gledaj snimak' : ' — probni unos bez snimka'}`);
    card.addEventListener('click', () => openPlayer(race)); fragment.append(card);
  }
  $('#race-grid').replaceChildren(fragment);
  $('#empty-state').hidden = races.length > 0;
  $('#results-count').textContent = `${state.season === 'all' ? 'Sve sezone' : `Sezona ${state.season}`} · Prikazano snimaka: ${races.length}`;
  $('#reset').hidden = state.kind === 'all' && !state.query && state.sort === 'newest';
  document.querySelectorAll('.season-tab').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.season === state.season)));
}

function openPlayer(race) {
  $('#player-title').textContent = race.title;
  $('#player-meta').textContent = `${race.category} / Sezona ${race.season} / ${race.kind}`;
  const source = videoSource(race.videoUrl);
  document.querySelector('.player-source-link')?.remove();
  $('#player-body').replaceChildren();
  if (source && source.type !== 'external') {
    const player = document.createElement(source.type === 'video' ? 'video' : 'iframe');
    player.src = source.url;
    if (source.type === 'video') {
      player.controls = true; player.preload = 'metadata'; player.playsInline = true;
      player.addEventListener('error', () => {
        const message = document.createElement('p'); message.className = 'video-unavailable';
        message.textContent = 'Snimak trenutno nije dostupan ili format nije podržan. Pokušaj kasnije.';
        $('#player-body').replaceChildren(message);
      });
    } else { player.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation'); player.title = race.title; player.allowFullscreen = true; player.allow = 'fullscreen; picture-in-picture; encrypted-media'; player.referrerPolicy = 'strict-origin-when-cross-origin'; }
    $('#player-body').append(player);
    const fallback = document.createElement('a'); fallback.className = 'player-source-link'; fallback.href = race.videoUrl; fallback.target = '_blank'; fallback.rel = 'noopener noreferrer'; fallback.textContent = 'Plejer ne radi? Otvori snimak na izvornom servisu ↗';
    $('#player-body').after(fallback);
  } else if (source) {
    const message = document.createElement('div'); message.className = 'video-unavailable';
    const heading = document.createElement('h3'); heading.textContent = 'Gledaj na izvornom servisu.';
    const text = document.createElement('p'); text.textContent = 'Ovaj servis nema podržan ugrađeni plejer. Snimak možeš otvoriti u novoj kartici.';
    const link = document.createElement('a'); link.className = 'button button-red'; link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = 'Otvori snimak';
    message.append(heading, text, link); $('#player-body').append(message);
  } else {
    const message = document.createElement('div'); message.className = 'video-unavailable';
    message.innerHTML = '<span aria-hidden="true">↗</span><h3>Ovde počinje sledeći krug.</h3><p>Ovo je probni unos. Kada urednik doda video, moći ćeš da ga gledaš upravo ovde.</p>';
    $('#player-body').append(message);
  }
  $('#player-dialog').showModal();
}

function reset() { state.season = 'all'; state.kind = 'all'; state.query = ''; state.sort = 'newest'; $('#search').value = ''; $('#kind').value = 'all'; $('#sort').value = 'newest'; render(); }
$('#search').addEventListener('input', event => { state.query = event.target.value; render(); });
$('#kind').addEventListener('change', event => { state.kind = event.target.value; render(); });
$('#sort').addEventListener('change', event => { state.sort = event.target.value; render(); });
$('#reset').addEventListener('click', reset); $('#empty-reset').addEventListener('click', reset);
$('#retry').addEventListener('click', loadCatalog);
$('#year').textContent = new Date().getFullYear();
$('#privacy-link').addEventListener('click', event => { event.preventDefault(); $('#privacy-dialog').showModal(); });
document.querySelectorAll('.close-dialog').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => { if (event.target === dialog && (event.clientX < dialog.getBoundingClientRect().left || event.clientX > dialog.getBoundingClientRect().right || event.clientY < dialog.getBoundingClientRect().top || event.clientY > dialog.getBoundingClientRect().bottom)) dialog.close(); }));
$('#player-dialog').addEventListener('close', () => { $('#player-body').replaceChildren(); document.querySelector('.player-source-link')?.remove(); });
loadCatalog();
