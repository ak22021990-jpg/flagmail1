import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useProctoring — detect and count discrete tab/window departures during an active round.
 *
 * Detection is purely informational (browsers cannot block tab switching).
 * One departure = one violation regardless of how many events fire per hide.
 *
 * @param {object} options
 * @param {boolean} options.active - When false, listeners are removed (violations not reset).
 * @returns {{ violations: number, switchedAway: boolean, reset: function }}
 */
export function useProctoring({ active = false } = {}) {
  const [violations, setViolations] = useState(0);
  const [switchedAway, setSwitchedAway] = useState(false);

  // Guard against double-fire: visibilitychange + blur both fire on a single "away" action.
  // true = we have already counted the current departure.
  const lastHiddenRef = useRef(false);

  useEffect(() => {
    if (!active) {
      // Remove any stale "away" indicator when round ends; keep violation count.
      setSwitchedAway(false);
      return;
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        if (!lastHiddenRef.current) {
          lastHiddenRef.current = true;
          setViolations(v => v + 1);
          setSwitchedAway(true);
        }
      } else {
        // Returned to tab
        lastHiddenRef.current = false;
        setSwitchedAway(false);
      }
    }

    function handleWindowBlur() {
      if (!lastHiddenRef.current) {
        lastHiddenRef.current = true;
        setViolations(v => v + 1);
        setSwitchedAway(true);
      }
    }

    function handleWindowFocus() {
      lastHiddenRef.current = false;
      setSwitchedAway(false);
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [active]);

  const reset = useCallback(() => {
    setViolations(0);
    setSwitchedAway(false);
    lastHiddenRef.current = false;
  }, []);

  return { violations, switchedAway, reset };
}
