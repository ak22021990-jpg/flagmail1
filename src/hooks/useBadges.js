import { useState, useCallback, useRef } from 'react';
import {
  ROUND_DURATION_SECONDS,
  LIGHTNING_READ_SECONDS,
  SNIPER_SECONDS,
  BEAT_THE_CLOCK_SECONDS,
} from '../config/game.js';

export const BADGES = {
  LIGHTNING_READ:   { id: 'LIGHTNING_READ',   name: 'Lightning Read',   icon: '\u26A1', rare: false, desc: 'Correct in under 10 seconds' },
  ON_FIRE:          { id: 'ON_FIRE',          name: 'On Fire',          icon: '\uD83D\uDD25', rare: false, desc: '5 correct L1 in a row' },
  ZONE_CLEAR:       { id: 'ZONE_CLEAR',       name: 'Zone Clear',       icon: '\u2705', rare: false, desc: 'Complete a zone with no wrong answers' },
  SNIPER:           { id: 'SNIPER',           name: 'Sniper',           icon: '\uD83C\uDFAF', rare: false, desc: 'First email: correct, no clues, under 15s' },
  BEAT_THE_CLOCK:   { id: 'BEAT_THE_CLOCK',   name: 'Beat the Clock',   icon: '\u23F1', rare: false, desc: 'Correct with under 5 seconds remaining' },
  EAGLE_EYE:        { id: 'EAGLE_EYE',        name: 'Eagle Eye',        icon: '\uD83E\uDD85', rare: false, desc: 'All 6 L1 categories identified correctly at least once' },
  GHOST_DETECTIVE:  { id: 'GHOST_DETECTIVE',  name: 'Ghost Detective',  icon: '\uD83D\uDC7B', rare: true,  desc: 'Full game - zero clues revealed' },
  ICE_COLD:         { id: 'ICE_COLD',         name: 'Ice Cold',         icon: '\uD83E\uDDCA', rare: true,  desc: 'All 5 hard emails correct, no clues' },
  PERFECT_EYE:      { id: 'PERFECT_EYE',      name: 'Perfect Eye',      icon: '\uD83D\uDD2E', rare: true,  desc: 'All 15 emails: L1 + L2 correct' },
  NO_HINTS_NEEDED:  { id: 'NO_HINTS_NEEDED',  name: 'No Hints Needed',  icon: '\uD83D\uDD75', rare: true,  desc: 'Complete a zone without revealing any clue' },
};

export function useBadges() {
  const [earned, setEarned] = useState([]);
  const [pendingToast, setPendingToast] = useState(null);
  const streakRef = useRef(0);
  const categoriesCorrect = useRef(new Set());
  const firstEmailRef = useRef(true);
  const earnedSetRef = useRef(new Set());

  const earnBadge = useCallback((badgeId) => {
    if (earnedSetRef.current.has(badgeId)) return false;
    earnedSetRef.current.add(badgeId);
    setPendingToast(BADGES[badgeId]);
    setEarned(prev => [...prev, badgeId]);
    return true;
  }, []);

  const dismissToast = useCallback(() => {
    setPendingToast(null);
  }, []);

  const checkAfterRound = useCallback(({ record, timeLeft, roundDuration = ROUND_DURATION_SECONDS }) => {
    const { l1Correct, l2Correct, cluesUsed } = record;
    let unlockedAny = false;

    if (l1Correct) {
      streakRef.current += 1;
      categoriesCorrect.current.add(record.correctL1);
    } else {
      streakRef.current = 0;
    }

    // Sniper: first email, correct, no clues, solved in <= 15 seconds.
    if (firstEmailRef.current) {
      firstEmailRef.current = false;
      if (l1Correct && l2Correct && cluesUsed === 0 && timeLeft > roundDuration - SNIPER_SECONDS) {
        unlockedAny = earnBadge('SNIPER') || unlockedAny;
      }
    }

    // Lightning Read: correct in <= 10 seconds.
    if (l1Correct && timeLeft > roundDuration - LIGHTNING_READ_SECONDS) {
      unlockedAny = earnBadge('LIGHTNING_READ') || unlockedAny;
    }

    // Beat the Clock: correct with <= 5s remaining.
    if (l1Correct && timeLeft > 0 && timeLeft <= BEAT_THE_CLOCK_SECONDS) {
      unlockedAny = earnBadge('BEAT_THE_CLOCK') || unlockedAny;
    }

    if (streakRef.current >= 5) {
      unlockedAny = earnBadge('ON_FIRE') || unlockedAny;
    }

    if (categoriesCorrect.current.size >= 6) {
      unlockedAny = earnBadge('EAGLE_EYE') || unlockedAny;
    }

    return { streak: streakRef.current, unlockedAny };
  }, [earnBadge]);

  const checkAfterZone = useCallback(({ zoneEmails, zoneCluesUsed }) => {
    if (!zoneEmails.length) return;

    const allCorrect = zoneEmails.every(r => r.l1Correct);
    if (allCorrect) earnBadge('ZONE_CLEAR');
    if (zoneCluesUsed === 0) earnBadge('NO_HINTS_NEEDED');
  }, [earnBadge]);

  const checkAfterGame = useCallback(({ perEmail, totalCluesUsed }) => {
    if (!perEmail.length) return;

    if (totalCluesUsed === 0) earnBadge('GHOST_DETECTIVE');

    const hardEmails = perEmail.filter(r => r.zone === 3);
    const iceCold = hardEmails.length === 5 &&
      hardEmails.every(r => r.l1Correct && r.l2Correct && r.cluesUsed === 0);
    if (iceCold) earnBadge('ICE_COLD');

    const perfectEye = perEmail.length === 15 && perEmail.every(r => r.l1Correct && r.l2Correct);
    if (perfectEye) earnBadge('PERFECT_EYE');
  }, [earnBadge]);

  const resetBadges = useCallback(() => {
    setEarned([]);
    setPendingToast(null);
    streakRef.current = 0;
    categoriesCorrect.current = new Set();
    firstEmailRef.current = true;
    earnedSetRef.current = new Set();
  }, []);

  return {
    earned,
    pendingToast,
    dismissToast,
    checkAfterRound,
    checkAfterZone,
    checkAfterGame,
    resetBadges,
  };
}
