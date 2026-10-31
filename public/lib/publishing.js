// A fine-grained GitHub token stays in memory in the editor; never save it in content.
export const REPOSITORY = 'formulacija/formulatrke';
export const BRANCH = 'main';
export const CONTENT_PATH = 'public/content.json';
const endpoint = `https://api.github.com/repos/${REPOSITORY}/contents/${CONTENT_PATH}`;
export function encodeContent(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
export function decodeContent(value) {
  const binary = atob(value.replace(/\s/g, ''));
  return new TextDecoder().decode(Uint8Array.from(binary, character => character.charCodeAt(0)));
}
async function github(token, options = {}) {
  const response = await fetch(endpoint + (options.method ? '' : `?ref=${BRANCH}`), {
    ...options,
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28', ...options.headers },
  });
  if (!response.ok) {
    if ([409, 422].includes(response.status)) throw new Error('Arhiva je promenjena ili GitHub odbija izmenu. Preuzmi nacrt i ponovo poveži nalog pre ponovnog pokušaja.');
    if ([401, 403, 404].includes(response.status)) throw new Error('Pristup repozitorijumu nije dozvoljen. Proveri da token važi za formulatrke i ima Contents: Read and write.');
    throw new Error(`GitHub trenutno nije dostupan (${response.status}). Nacrt nije izgubljen.`);
  }
  return response.json();
}
export async function loadFromGithub(token) {
  const result = await github(token);
  return { catalog: JSON.parse(decodeContent(result.content)), sha: result.sha };
}
export async function publishToGithub(token, catalog, sha) {
  if (!sha) throw new Error('Prvo poveži GitHub nalog.');
  const result = await github(token, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Ažuriraj arhivu trka', branch: BRANCH, sha, content: encodeContent(JSON.stringify(catalog, null, 2) + '\n') }) });
  return result.content.sha;
}
