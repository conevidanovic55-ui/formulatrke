import { chooseHeroTrack } from './lib/hero.js';

const hero = document.querySelector('.hero');
const trackName = document.querySelector('#hero-track-name');
const trackCoordinates = document.querySelector('#hero-track-coordinates');
const trackCaption = document.querySelector('.hero-caption');
const STORAGE_KEY = 'formulacija-poslednja-hero-staza';

async function showRandomHero() {
  if (!hero || !trackName || !trackCoordinates || !trackCaption) return;

  try {
    const response = await fetch('./staze.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Lista staza nije dostupna.');
    const { tracks } = await response.json();
    if (!Array.isArray(tracks)) return;

    let previous = '';
    try { previous = sessionStorage.getItem(STORAGE_KEY) || ''; }
    catch { /* Pamcenje nije neophodno za prikaz. */ }

    // Ako je pojedinacna slika ostecena, probaj neku drugu.
    let remaining = [...tracks];
    while (remaining.length) {
      const selected = chooseHeroTrack(remaining, previous);
      if (!selected) return;

      const imageUrl = './assets/' + encodeURIComponent(selected.image);
      try {
        const preview = new Image();
        preview.src = imageUrl;
        await preview.decode();

        // Slika i koordinate menjaju se zajedno tek kad je slika ucitana.
        trackName.textContent = selected.name;
        trackCoordinates.textContent = selected.coordinates;
        hero.style.setProperty('--hero-image', `url("${imageUrl}")`);
        hero.dataset.trackImage = selected.image;
        trackCaption.hidden = false;
        try { sessionStorage.setItem(STORAGE_KEY, selected.image); }
        catch { /* Privatni rezim moze blokirati sessionStorage. */ }
        return;
      } catch {
        remaining = remaining.filter(track => track.image !== selected.image);
      }
    }
  } catch (error) {
    console.warn('Nasumicna pocetna slika nije ucitana:', error);
  }
}

showRandomHero();
