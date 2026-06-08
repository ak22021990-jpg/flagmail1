import { useState, useCallback } from 'react';
import { LEADERBOARD_URL } from '../config.js';

export function useLeaderboard() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const submitScore = useCallback(async (playerData) => {
    if (!LEADERBOARD_URL || LEADERBOARD_URL === 'YOUR_APPS_SCRIPT_URL') return;
    try {
      await fetch(LEADERBOARD_URL, {
        method: 'POST',
        body: JSON.stringify(playerData),
        mode: 'no-cors',
      });
      setSubmitted(true);
    } catch (err) {
      console.warn('Leaderboard submit failed:', err.message);
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    if (!LEADERBOARD_URL || LEADERBOARD_URL === 'YOUR_APPS_SCRIPT_URL') {
      setEntries([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(LEADERBOARD_URL);
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Could not load leaderboard. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  return { entries, loading, error, submitted, submitScore, fetchLeaderboard };
}
