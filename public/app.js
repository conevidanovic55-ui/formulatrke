import { filterRaces, socialUrl, videoSource, validateCatalog } from './lib/catalog.js';
const $ = selector => document.querySelector(selector);
const state = { season: 'all', kind: 'all', query: '', sort: 'newest' };
let catalog;
const tracks = {
  shanghai: { code: 'SHA', bg: '#6b0909', ink: '#ffaaaa', path: 'M35 110 52 86Q25 43 69 31Q112 17 126 51Q133 77 107 81Q87 82 87 64L106 58 131 73 149 55 177 66 195 33 227 37 241 57 221 76 259 99 252 121 202 113 183 129 157 111 132 126 104 110 77 125Z' },
  monaco: { code: 'MON', bg: '#6b0909', ink: '#ffaaaa', path: 'M40 100 54 82 76 84 93 71 112 74 124 53 143 48 153 23 169 30 163 47 187 54 203 38 225 38 235 53 256 57 266 77 245 82 230 103 217 104 205 120 181 112 167 124 142 115 132 123 108 110 86 116 75 104Z' },
  spa: { code: 'SPA', bg: '#6b0909', ink: '#ffaaaa', path: 'M32 113 77 117 92 102 119 104 136 82 153 86 164 64 189 59 203 30 221 20 246 33 254 55 270 73 253 81 240 68 221 77 214 96 198 99 187 115 160 121 145 112 126 122 95 132 43 130Z' },
  monza: { code: 'MNZ', bg: '#6b0909', ink: '#ffaaaa', path: 'M43 117 67 104 87 110 106 89 143 81 156 64 172 69 216 23Q244 4 263 26Q278 48 260 70L221 112 201 109 185 128 70 134Z' },
  suzuka: { code: 'SUZ', bg: '#6b0909', ink: '#ffaaaa', path: 'M32 92Q20 60 45 53L70 61 91 44 108 48 121 37 143 45 158 29 179 44 176 69 193 86 219 76 242 90Q275 120 245 132L212 129 181 107 157 83 139 91 115 74 95 88 77 76 62 98Z' },
  silverstone: { code: 'SIL', bg: '#6b0909', ink: '#ffaaaa', path: 'M37 111 61 77 85 81 117 30 143 40 133 65 165 77 188 43 213 36 233 58 249 55 272 83 248 105 220 96 206 120 175 129 155 108 133 122 106 106 86 130 62 120Z' },
  australia: { code: 'MEL', bg: '#6b0909', ink: '#ffaaaa', path: 'M51 113 47 87 72 77 88 51 105 53 117 24 143 27 158 49 179 43 199 63 226 60 249 79 263 108 245 125 210 120 188 135 159 118 144 129 113 116 90 129 75 111Z' },
};
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
  const instagram = socialUrl('instagram', catalog.socials?.instagram);
  if (instagram) $('.about-link').href = instagram;
}

function render() {
  const races = filterRaces(catalog.races, state);
  const fragment = document.createDocumentFragment();
  for (const race of races) {
    const card = $('#race-card-template').content.firstElementChild.cloneNode(true);
    const track = tracks[race.art] || tracks.monaco;
    card.style.setProperty('--art-bg', track.bg); card.style.setProperty('--art-ink', track.ink);
    card.querySelector('.card-code').textContent = track.code;
    card.querySelector('.circuit path').setAttribute('d', track.path);
if (race.id === 'kina-2025-sport-klub-hr') {
  const slika = card.querySelector('.card-art');

  slika.style.background =
    "#de2910 url('./assets/Kina.png') center / contain no-repeat";

  card.querySelector('.card-code').hidden = true;
  card.querySelector('.circuit').hidden = true;
}

    card.querySelector('.card-category').textContent = race.category;
    card.querySelector('.card-kind').textContent = race.kind;
    card.querySelector('.card-duration').textContent = race.videoUrl ? race.duration || 'SNIMAK' : 'PRIMER';
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
