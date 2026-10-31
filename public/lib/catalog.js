export const SOCIAL_HOSTS = {
  instagram: ['instagram.com', 'www.instagram.com'],
  tiktok: ['tiktok.com', 'www.tiktok.com'],
  youtube: ['youtube.com', 'www.youtube.com', 'youtu.be'],
};

export function safeHttps(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url : null;
  } catch { return null; }
}

export function socialUrl(platform, value) {
  const url = safeHttps(value);
  return url && SOCIAL_HOSTS[platform]?.includes(url.hostname) ? url.href : null;
}

export function videoSource(value) {
  const url = safeHttps(value);
  if (!url) return null;
  let id;
  if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname)) {
    id = url.pathname === '/watch' ? url.searchParams.get('v') : url.pathname.match(/^\/(?:embed|shorts)\/([\w-]+)\/?$/)?.[1];
  } else if (url.hostname === 'youtu.be') id = url.pathname.slice(1);
  if (id && /^[\w-]{11}$/.test(id)) return { type: 'embed', url: `https://www.youtube-nocookie.com/embed/${id}?rel=0` };
  if (['vimeo.com', 'www.vimeo.com'].includes(url.hostname) && /^\/\d+$/.test(url.pathname)) {
    return { type: 'embed', url: `https://player.vimeo.com/video${url.pathname}` };
  }
  if (/\.(mp4|webm)$/i.test(url.pathname)) return { type: 'video', url: url.href };
  const host = url.hostname;
  const embed = (path) => ({ type: 'embed', url: `https://${host}${path}` });
  if (['dailymotion.com', 'www.dailymotion.com'].includes(host)) {
    const match = url.pathname.match(/^\/(?:embed\/)?video\/([a-zA-Z0-9]+)/);
    if (match) return { type: 'embed', url: `https://www.dailymotion.com/embed/video/${match[1]}` };
  }
  if (['streamable.com', 'www.streamable.com'].includes(host)) {
    const match = url.pathname.match(/^\/(?:e\/)?([a-zA-Z0-9]+)\/?$/);
    if (match) return { type: 'embed', url: `https://streamable.com/e/${match[1]}` };
  }
  if (host === 'ok.ru') {
    const match = url.pathname.match(/^\/(?:video|videoembed)\/(\d+)\/?$/);
    if (match) return embed(`/videoembed/${match[1]}`);
  }
  if (['streamtape.com', 'www.streamtape.com'].includes(host)) {
    const match = url.pathname.match(/^\/(?:v|e)\/([a-zA-Z0-9]+)/);
    if (match) return { type: 'embed', url: `https://streamtape.com/e/${match[1]}` };
  }
  if (host === 'rumble.com' && /^\/embed\/v[a-zA-Z0-9]+\/?$/.test(url.pathname)) return embed(url.pathname);
  // Unknown watch pages are external links, never arbitrary iframe HTML.
  return { type: 'external', url: url.href };
}

export function normalizeSearch(value) {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/đ/g, 'dj').trim();
}

export function filterRaces(races, { season = 'all', kind = 'all', query = '', sort = 'newest' } = {}) {
  const search = normalizeSearch(query);
  return races.filter(race =>
    (season === 'all' || race.season === season) &&
    (kind === 'all' || race.kind === kind) &&
    normalizeSearch(`${race.title} ${race.location} ${race.category} ${race.season}`).includes(search)
  ).sort((a, b) => sort === 'title'
    ? a.title.localeCompare(b.title, 'sr-Latn')
    : b.season.localeCompare(a.season) || (b.date || '').localeCompare(a.date || '') || b.round - a.round);
}

// Dozvoljavamo samo naziv datoteke, ne putanje i spoljne URL-ove.
export function validRaceImage(value) {
  return typeof value === 'string' && value.length <= 120 &&
    /^[\p{L}\p{N}][\p{L}\p{N} ._-]*\.(?:png|jpe?g|webp|avif)$/iu.test(value) &&
    !value.includes('..');
}

export function validateCatalog(data) {
  const errors = [];
  if (!data || typeof data !== 'object') return ['Neispravan format arhive.'];
  if (typeof data.name !== 'string' || !data.name.trim() || data.name.length > 40) errors.push('Naziv sajta mora imati 1–40 znakova.');
  if (!Array.isArray(data.seasons) || !data.seasons.length || data.seasons.some(s => !/^\d{4}$/.test(s)) || new Set(data.seasons).size !== data.seasons.length) errors.push('Sezone moraju biti različite četvorocifrene godine.');
  if (!Array.isArray(data.races)) return [...errors, 'Nedostaje lista snimaka.'];
  const ids = new Set();
  for (const race of data.races) {
    if (!race || typeof race !== 'object') { errors.push('Neispravan snimak.'); continue; }
    if (typeof race.id !== 'string' || !/^[a-z0-9-]+$/.test(race.id) || ids.has(race.id)) errors.push('Svaki snimak mora imati jedinstven ID.');
    ids.add(race.id);
    if (typeof race.title !== 'string' || !race.title.trim() || race.title.length > 120) errors.push('Naslov snimka mora imati 1–120 znakova.');
    if (!Array.isArray(data.seasons) || !data.seasons.includes(race.season)) errors.push(`Nepoznata sezona: ${race.season}.`);
    if (!['Trka', 'Kvalifikacije', 'Sprint', 'Trening'].includes(race.kind)) errors.push('Nepoznata vrsta snimka.');
    if (typeof race.category !== 'string' || !race.category.trim() || typeof race.location !== 'string') errors.push('Dodaj takmičenje i lokaciju.');
    if (!Number.isInteger(race.round) || race.round < 1 || race.round > 10000) errors.push('Redni broj snimka mora biti između 1 i 10000.');
    if (race.date && (!/^\d{4}-\d{2}-\d{2}$/.test(race.date) || Number.isNaN(Date.parse(race.date)) || new Date(race.date).toISOString().slice(0, 10) !== race.date)) errors.push('Neispravan datum snimka.');
    if (race.duration && (typeof race.duration !== 'string' || !/^\d{1,2}:\d{2}(?::\d{2})?$/.test(race.duration))) errors.push('Trajanje koristi oblik 1:30:00.');
    if (race.videoUrl && !videoSource(race.videoUrl)) errors.push(`Nepodržan video link: ${race.title}.`);
    if (race.image !== undefined && !validRaceImage(race.image)) errors.push('Naziv slike mora biti ime PNG/JPG/WEBP/AVIF datoteke iz assets foldera.');
  }
  for (const platform of Object.keys(SOCIAL_HOSTS)) {
    if (data.socials?.[platform] && !socialUrl(platform, data.socials[platform])) errors.push(`Neispravan ${platform} link.`);
  }
  return errors;
}
