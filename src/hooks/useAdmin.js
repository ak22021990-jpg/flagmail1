import { useState, useCallback, useRef } from 'react';
import { LEADERBOARD_URL } from '../config.js';

export function useAdmin() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const passcodeRef = useRef(null);

  const fetchAdminData = useCallback(async (passcode) => {
    if (!LEADERBOARD_URL) {
      setError('Leaderboard URL not configured');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(LEADERBOARD_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'getAdminData', passcode }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || 'Invalid passcode');
        setAuthenticated(false);
      } else {
        setData({ candidates: json.candidates || [], rawData: json.rawData || [], socData: json.socData || [], integrityLogs: json.integrityLogs || [] });
        setAuthenticated(true);
        passcodeRef.current = passcode;
      }
    } catch (err) {
      setError('Network error — check connection');
      setAuthenticated(false);
    }
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    if (!passcodeRef.current) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(LEADERBOARD_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'getAdminData', passcode: passcodeRef.current }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || 'Session expired');
        setAuthenticated(false);
      } else {
        setData({ candidates: json.candidates || [], rawData: json.rawData || [], socData: json.socData || [], integrityLogs: json.integrityLogs || [] });
      }
    } catch (err) {
      setError('Network error — check connection');
    }
    setLoading(false);
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setAuthenticated(false);
    setLoading(false);
    passcodeRef.current = null;
  }, []);

  const integrityLogs = data?.integrityLogs || [];
  return { data, loading, error, authenticated, fetchAdminData, refresh, reset, integrityLogs };
}
