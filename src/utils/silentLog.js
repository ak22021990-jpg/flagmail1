// src/utils/silentLog.js
import { LEADERBOARD_URL } from '../config';

export function silentLog(email, logType, details) {
  const payload = {
    action: 'logIntegrity',
    email,
    logType,
    details: {
      timestamp: new Date().toISOString(),
      ...details,
    },
  };
  fetch(LEADERBOARD_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload),
  }).catch(() => {}); // fire-and-forget, silent
}
