import { validRaceImage } from './catalog.js';

export function isHeroTrack(track) {
  return track && typeof track.name === 'string' &&
    track.name.trim().length > 0 && track.name.length <= 80 &&
    validRaceImage(track.image) &&
    typeof track.coordinates === 'string' &&
    track.coordinates.trim().length > 0 && track.coordinates.length <= 100;
}

// Izbegni istu fotografiju pri dva uzastopna otvaranja kada ih ima vise.
export function chooseHeroTrack(tracks, previousImage = '', random = Math.random) {
  if (!Array.isArray(tracks)) return null;
  const valid = tracks.filter(isHeroTrack);
  if (!valid.length) return null;
  const different = valid.filter(track => track.image !== previousImage);
  const candidates = different.length ? different : valid;
  const sample = Number(random());
  const index = Number.isFinite(sample)
    ? Math.min(candidates.length - 1, Math.max(0, Math.floor(sample * candidates.length)))
    : 0;
  return candidates[index];
}
