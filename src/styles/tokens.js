// src/styles/tokens.js

/** Canonical glass surface style — use in every screen card */
export const glass = {
  background: 'rgba(255,255,255,0.74)',
  backdropFilter: 'blur(28px) saturate(165%)',
  WebkitBackdropFilter: 'blur(28px) saturate(165%)',
  border: '1px solid rgba(255,255,255,0.86)',
  boxShadow: '0 24px 80px rgba(32,52,89,0.11), 0 8px 24px rgba(32,52,89,0.06)',
};

/** Points per email × 5 emails per zone × 3 zones */
export const POINTS_PER_EMAIL = 4;
export const EMAILS_PER_ZONE = 5;
export const ZONE_COUNT = 3;
export const ZONE_MAX_SCORE = POINTS_PER_EMAIL * EMAILS_PER_ZONE;  // 20
export const MAX_SCORE = ZONE_MAX_SCORE * ZONE_COUNT;               // 60

export const ZONE_META_LIST = [
  { zone: 1, title: 'The Inbox',      difficulty: 'Foundation',   accent: '#0A84FF', endColor: '#0055CC' },
  { zone: 2, title: 'The Queue',      difficulty: 'Intermediate', accent: '#30B0C7', endColor: '#1A8FA8' },
  { zone: 3, title: 'The Escalation', difficulty: 'Advanced',     accent: '#FF7A1A', endColor: '#E56A00' },
];
