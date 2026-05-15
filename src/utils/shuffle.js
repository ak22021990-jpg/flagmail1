import { EMAIL_POOL as EMAILS } from '../data/emails.js';

const ZONE_CLUE_LIMITS = {
  1: 4,
  2: 4,
  3: 4,
};

function fisherYatesShuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function withStaticClues(email) {
  const maxClues = ZONE_CLUE_LIMITS[email.zone] ?? 4;
  return { ...email, clues: [...email.clues].slice(0, maxClues) };
}

export function shuffleEmails() {
  const byZone = { 1: [], 2: [], 3: [] };
  for (const email of EMAILS) {
    if (byZone[email.zone]) byZone[email.zone].push(email);
  }

  return [1, 2, 3].flatMap(zone =>
    fisherYatesShuffle(byZone[zone]).map(withStaticClues)
  );
}
