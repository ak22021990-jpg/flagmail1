import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useProctoring — detect and count discrete integrity violations during an active round.
 *
 * @param {object} options
 * @param {boolean} options.active - When false, listeners are removed (violations not reset).
 * @param {function} options.onViolation - Called with (logType, details) on each event.
 * @returns {{ violations: number, switchedAway: boolean, reset: function }}
 */
export function useProctoring({ active = false, onViolation = null } = {}) {
  const [violations, setViolations] = useState(0);
  const [switchedAway, setSwitchedAway] = useState(false);

  // Guard double-fire: visibilitychange + blur both fire on a single "away".
  const lastHiddenRef = useRef(false);
  const blurTimeRef = useRef(null);

  // DevTools detection: only fire once per open, reset when window resizes back.
  const devToolsOpenRef = useRef(false);

  const fire = useCallback((logType, details) => {
    setViolations(v => v + 1);
    if (onViolation) onViolation(logType, details);
  }, [onViolation]);

  useEffect(() => {
    if (!active) {
      setSwitchedAway(false);
      return;
    }

    // ── Tab switch ──────────────────────────────────────────────────────────
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        if (!lastHiddenRef.current) {
          lastHiddenRef.current = true;
          blurTimeRef.current = Date.now();
          setSwitchedAway(true);
        }
      } else {
        if (lastHiddenRef.current) {
          const durationMs = blurTimeRef.current ? Date.now() - blurTimeRef.current : 0;
          fire('tab_switch', { description: 'Tab switch detected', durationMs });
        }
        lastHiddenRef.current = false;
        blurTimeRef.current = null;
        setSwitchedAway(false);
      }
    }

    function handleWindowBlur() {
      if (!lastHiddenRef.current) {
        lastHiddenRef.current = true;
        blurTimeRef.current = Date.now();
        setSwitchedAway(true);
      }
    }

    function handleWindowFocus() {
      if (lastHiddenRef.current) {
        const durationMs = blurTimeRef.current ? Date.now() - blurTimeRef.current : 0;
        fire('tab_switch', { description: 'Tab switch detected', durationMs });
      }
      lastHiddenRef.current = false;
      blurTimeRef.current = null;
      setSwitchedAway(false);
    }

    // ── Fullscreen exit ─────────────────────────────────────────────────────
    function handleFullscreenChange() {
      if (!document.fullscreenElement) {
        fire('fullscreen_exit', { description: 'Exited fullscreen' });
      }
    }

    // ── Copy / Cut / Paste ──────────────────────────────────────────────────
    function handleCopyCutPaste(e) {
      e.preventDefault();
      fire('copy_paste', { eventType: e.type, description: `${e.type} blocked` });
    }

    // ── Right-click ─────────────────────────────────────────────────────────
    function handleContextMenu(e) {
      e.preventDefault();
      fire('contextmenu', { description: 'Right-click blocked' });
    }

    // ── DevTools heuristic ──────────────────────────────────────────────────
    function checkDevTools() {
      const isOpen =
        window.outerWidth - window.innerWidth > 160 ||
        window.outerHeight - window.innerHeight > 160;
      if (isOpen && !devToolsOpenRef.current) {
        devToolsOpenRef.current = true;
        fire('devtools_check', { description: 'DevTools may be open' });
      } else if (!isOpen) {
        devToolsOpenRef.current = false;
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('copy', handleCopyCutPaste);
    document.addEventListener('cut', handleCopyCutPaste);
    document.addEventListener('paste', handleCopyCutPaste);
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('resize', checkDevTools);

    const devToolsInterval = setInterval(checkDevTools, 4000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('copy', handleCopyCutPaste);
      document.removeEventListener('cut', handleCopyCutPaste);
      document.removeEventListener('paste', handleCopyCutPaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('resize', checkDevTools);
      clearInterval(devToolsInterval);
    };
  }, [active, fire]);

  const reset = useCallback(() => {
    setViolations(0);
    setSwitchedAway(false);
    lastHiddenRef.current = false;
    blurTimeRef.current = null;
    devToolsOpenRef.current = false;
  }, []);

  return { violations, switchedAway, reset };
}
